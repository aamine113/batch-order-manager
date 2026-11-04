import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { PasswordService } from '../password/password.service.js';
import { UserRole } from '../users/enums/user-role.enum.js';
import { CreateUserInput } from '../users/types/create-user-input.js';
import { UserRecord } from '../users/types/user-record.js';
import { UsersService } from '../users/users.service.js';
import { AdminSeedError } from './admin-seed.error.js';
import { AdminSeeder } from './admin-seeder.service.js';
import { PasswordPrompt } from './password-prompt.service.js';

const email = 'admin@example.com';
const password = 'a long enough password';

function userRecord(overrides: Partial<UserRecord>): UserRecord {
  return {
    _id: new Types.ObjectId(),
    email,
    name: 'Admin',
    role: UserRole.Admin,
    disabled: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('AdminSeeder', () => {
  let seeder: AdminSeeder;
  let env: Record<string, string | undefined>;

  const passwordService = new PasswordService();
  const usersService = {
    findAdmin: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
  };
  const passwordPrompt = {
    isInteractive: vi.fn(),
    ask: vi.fn(),
  };
  const config = { get: (key: string) => env[key] };

  // The input passed to UsersService.create by the last run.
  function createdInput(): CreateUserInput {
    return usersService.create.mock.lastCall?.[0] as CreateUserInput;
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    env = { ADMIN_EMAIL: email, ADMIN_PASSWORD: password };
    usersService.findAdmin.mockResolvedValue(null);
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockImplementation((input: CreateUserInput) =>
      Promise.resolve(userRecord(input)),
    );
    passwordPrompt.isInteractive.mockReturnValue(true);

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminSeeder,
        { provide: ConfigService, useValue: config },
        { provide: UsersService, useValue: usersService },
        { provide: PasswordService, useValue: passwordService },
        { provide: PasswordPrompt, useValue: passwordPrompt },
      ],
    }).compile();

    seeder = moduleRef.get(AdminSeeder);
  });

  describe('creating the admin', () => {
    it('creates an admin with an argon2id hash of the password', async () => {
      await expect(seeder.run()).resolves.toEqual({
        status: 'created',
        email,
      });

      const input = createdInput();
      expect(input.role).toBe(UserRole.Admin);
      expect(input.email).toBe(email);
      expect(input.passwordHash.startsWith('$argon2id$')).toBe(true);
      await expect(
        passwordService.verify(input.passwordHash, password),
      ).resolves.toBe(true);
    });

    it('stores the email trimmed and lowercased', async () => {
      env.ADMIN_EMAIL = '  Admin@Example.COM ';

      await seeder.run();

      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(createdInput().email).toBe(email);
    });

    it('names the admin "Admin" when ADMIN_NAME is not set', async () => {
      await seeder.run();

      expect(createdInput().name).toBe('Admin');
    });

    it('names the admin "Admin" when ADMIN_NAME is blank', async () => {
      env.ADMIN_NAME = '   ';

      await seeder.run();

      expect(createdInput().name).toBe('Admin');
    });

    it('uses ADMIN_NAME trimmed when it is set', async () => {
      env.ADMIN_NAME = '  Jane Doe ';

      await seeder.run();

      expect(createdInput().name).toBe('Jane Doe');
    });

    it('does not prompt when ADMIN_PASSWORD is set', async () => {
      await seeder.run();

      expect(passwordPrompt.ask).not.toHaveBeenCalled();
    });

    it('turns a conflict from a concurrent seed into an AdminSeedError', async () => {
      usersService.create.mockRejectedValue(
        new ConflictException('An admin already exists.'),
      );

      await expect(seeder.run()).rejects.toThrow(
        new AdminSeedError('An admin already exists.'),
      );
    });

    it('rethrows any other error unchanged', async () => {
      const error = new Error('connection lost');
      usersService.create.mockRejectedValue(error);

      await expect(seeder.run()).rejects.toBe(error);
    });
  });

  describe('existing users', () => {
    it('returns "exists" for an existing admin and changes nothing', async () => {
      usersService.findAdmin.mockResolvedValue(userRecord({}));

      await expect(seeder.run()).resolves.toEqual({ status: 'exists', email });
      expect(usersService.create).not.toHaveBeenCalled();
      expect(passwordPrompt.ask).not.toHaveBeenCalled();
    });

    it('refuses when another admin exists', async () => {
      usersService.findAdmin.mockResolvedValue(
        userRecord({ email: 'other-admin@example.com' }),
      );

      await expect(seeder.run()).rejects.toThrow(/Only one admin/);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('refuses when the email belongs to a client', async () => {
      usersService.findByEmail.mockResolvedValue(
        userRecord({ role: UserRole.Client }),
      );

      await expect(seeder.run()).rejects.toThrow(/client account/);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('runs the checks before asking for a password', async () => {
      delete env.ADMIN_PASSWORD;
      usersService.findByEmail.mockResolvedValue(
        userRecord({ role: UserRole.Client }),
      );

      await expect(seeder.run()).rejects.toBeInstanceOf(AdminSeedError);
      expect(passwordPrompt.ask).not.toHaveBeenCalled();
    });
  });

  describe('ADMIN_EMAIL', () => {
    it('fails when it is missing', async () => {
      delete env.ADMIN_EMAIL;

      await expect(seeder.run()).rejects.toThrow(
        new AdminSeedError('ADMIN_EMAIL is required.'),
      );
    });

    it('fails when it is blank', async () => {
      env.ADMIN_EMAIL = '   ';

      await expect(seeder.run()).rejects.toThrow(
        new AdminSeedError('ADMIN_EMAIL is required.'),
      );
    });

    it('fails when it is not a valid email', async () => {
      env.ADMIN_EMAIL = 'not-an-email';

      await expect(seeder.run()).rejects.toThrow(
        new AdminSeedError('ADMIN_EMAIL is not a valid email address.'),
      );
      expect(usersService.findAdmin).not.toHaveBeenCalled();
    });
  });

  describe('password', () => {
    it('fails when ADMIN_PASSWORD is shorter than 12 characters', async () => {
      env.ADMIN_PASSWORD = 'elevenchars';

      await expect(seeder.run()).rejects.toThrow(/12 to 128 characters/);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('fails when ADMIN_PASSWORD is longer than 128 characters', async () => {
      env.ADMIN_PASSWORD = 'a'.repeat(129);

      await expect(seeder.run()).rejects.toThrow(/12 to 128 characters/);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('prompts twice and uses the password when ADMIN_PASSWORD is not set', async () => {
      delete env.ADMIN_PASSWORD;
      passwordPrompt.ask.mockResolvedValue(password);

      await seeder.run();

      expect(passwordPrompt.ask).toHaveBeenCalledTimes(2);
      await expect(
        passwordService.verify(createdInput().passwordHash, password),
      ).resolves.toBe(true);
    });

    it('prompts when ADMIN_PASSWORD is empty', async () => {
      env.ADMIN_PASSWORD = '';
      passwordPrompt.ask.mockResolvedValue(password);

      await seeder.run();

      expect(passwordPrompt.ask).toHaveBeenCalledTimes(2);
    });

    it('fails when the prompted password is too short, before confirmation', async () => {
      delete env.ADMIN_PASSWORD;
      passwordPrompt.ask.mockResolvedValue('short');

      await expect(seeder.run()).rejects.toThrow(/12 to 128 characters/);
      expect(passwordPrompt.ask).toHaveBeenCalledTimes(1);
    });

    it('fails when the confirmation does not match', async () => {
      delete env.ADMIN_PASSWORD;
      passwordPrompt.ask
        .mockResolvedValueOnce(password)
        .mockResolvedValueOnce(`${password} typo`);

      await expect(seeder.run()).rejects.toThrow(
        new AdminSeedError('The passwords do not match.'),
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('fails without prompting when there is no terminal and no ADMIN_PASSWORD', async () => {
      delete env.ADMIN_PASSWORD;
      passwordPrompt.isInteractive.mockReturnValue(false);

      await expect(seeder.run()).rejects.toThrow(/no terminal/);
      expect(passwordPrompt.ask).not.toHaveBeenCalled();
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });
});
