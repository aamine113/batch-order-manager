import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isEmail } from 'class-validator';
import { PASSWORD_LENGTH_MESSAGE } from '../password/password.constants.js';
import { isValidPasswordLength } from '../password/password-length.js';
import { PasswordService } from '../password/password.service.js';
import { UserRole } from '../users/enums/user-role.enum.js';
import { normalizeEmail } from '../users/normalize-email.js';
import { UsersService } from '../users/users.service.js';
import { AdminSeedError } from './admin-seed.error.js';
import { PasswordPrompt } from './password-prompt.service.js';
import { AdminSeedResult } from './types/admin-seed-result.js';

// Creates the single admin account. Never updates an existing user, so
// running it again cannot reset the admin password.
@Injectable()
export class AdminSeeder {
  constructor(
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly passwordPrompt: PasswordPrompt,
  ) {}

  async run(): Promise<AdminSeedResult> {
    const email = this.readEmail();
    const name = this.config.get<string>('ADMIN_NAME')?.trim() || 'Admin';

    // These checks run before the prompt, so nobody types a password for a
    // seed that cannot succeed. The unique indexes on email and on the admin
    // role still decide if another seed wins the race.
    const admin = await this.usersService.findAdmin();
    if (admin) {
      if (admin.email === email) {
        return { status: 'exists', email };
      }
      throw new AdminSeedError(
        'An admin already exists with another email. Only one admin is allowed.',
      );
    }
    if (await this.usersService.findByEmail(email)) {
      throw new AdminSeedError(
        `${email} belongs to a client account. Use another ADMIN_EMAIL.`,
      );
    }

    const passwordHash = await this.passwordService.hash(
      await this.readPassword(),
    );

    try {
      await this.usersService.create({
        email,
        name,
        passwordHash,
        role: UserRole.Admin,
      });
    } catch (error: unknown) {
      if (error instanceof ConflictException) {
        throw new AdminSeedError(error.message);
      }
      throw error;
    }
    return { status: 'created', email };
  }

  private readEmail(): string {
    const email = normalizeEmail(this.config.get<string>('ADMIN_EMAIL') ?? '');
    if (!email) {
      throw new AdminSeedError('ADMIN_EMAIL is required.');
    }
    if (!isEmail(email)) {
      throw new AdminSeedError('ADMIN_EMAIL is not a valid email address.');
    }
    return email;
  }

  // An empty ADMIN_PASSWORD counts as unset and falls back to the prompt.
  private async readPassword(): Promise<string> {
    const fromEnv = this.config.get<string>('ADMIN_PASSWORD');
    if (fromEnv) {
      if (!isValidPasswordLength(fromEnv)) {
        throw new AdminSeedError(PASSWORD_LENGTH_MESSAGE);
      }
      return fromEnv;
    }

    if (!this.passwordPrompt.isInteractive()) {
      throw new AdminSeedError(
        'ADMIN_PASSWORD is not set and there is no terminal to prompt for it.',
      );
    }
    const password = await this.passwordPrompt.ask('Admin password:');
    if (!isValidPasswordLength(password)) {
      throw new AdminSeedError(PASSWORD_LENGTH_MESSAGE);
    }
    const confirmation = await this.passwordPrompt.ask('Confirm password:');
    if (password !== confirmation) {
      throw new AdminSeedError('The passwords do not match.');
    }
    return password;
  }
}
