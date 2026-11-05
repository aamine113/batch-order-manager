import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from '../password/password.service.js';
import { UsersService } from '../users/users.service.js';
import { INVALID_CREDENTIALS_MESSAGE } from './auth.constants.js';
import { JwtPayload } from './types/jwt-payload.js';
import { LoginResult } from './types/login-result.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.usersService.findByEmailWithPassword(email);

    if (!user || user.disabled) {
      await this.passwordService.verifyDummy(password);
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    // Deliberate 500: a malformed hash means corrupted data, not a bad login.
    const valid = await this.passwordService
      .verify(user.passwordHash, password)
      .catch((error: unknown) => {
        this.logger.error(
          `Password verification failed for user ${user._id.toString()}.`,
        );
        throw error;
      });

    if (!valid) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const payload: JwtPayload = {
      sub: user._id.toString(),
      role: user.role,
    };
    return { accessToken: await this.jwtService.signAsync(payload) };
  }
}
