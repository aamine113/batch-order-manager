import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { PasswordService } from '../password/password.service.js';
import { UserRole } from '../users/enums/user-role.enum.js';
import { UserRecordWithPassword } from '../users/types/user-record.js';
import { UsersService } from '../users/users.service.js';
import { INVALID_CREDENTIALS_MESSAGE } from './auth.constants.js';
import { AuthService } from './auth.service.js';

const userId = '64b7f0c2a1b2c3d4e5f60718';
const email = 'jane@example.com';
const password = 'a long enough password';

const user: UserRecordWithPassword = {
  _id: new Types.ObjectId(userId),
  email,
  name: 'Jane Doe',
  role: UserRole.Client,
  disabled: false,
  passwordHash: '$argon2id$fake-hash',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('AuthService', () => {
  let service: AuthService;

  const usersService = { findByEmailWithPassword: vi.fn() };
  const passwordService = { verify: vi.fn(), verifyDummy: vi.fn() };
  const jwtService = { signAsync: vi.fn() };

  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    passwordService.verifyDummy.mockResolvedValue(false);
    jwtService.signAsync.mockResolvedValue('signed-token');

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: PasswordService, useValue: passwordService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  async function expectInvalidCredentials(): Promise<void> {
    const attempt = service.login(email, password);
    await expect(attempt).rejects.toThrow(UnauthorizedException);
    await expect(attempt).rejects.toThrow(INVALID_CREDENTIALS_MESSAGE);
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  }

  it('signs { sub, role } and returns the access token on valid credentials', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(user);
    passwordService.verify.mockResolvedValue(true);

    await expect(service.login(email, password)).resolves.toEqual({
      accessToken: 'signed-token',
    });
    expect(passwordService.verify).toHaveBeenCalledWith(
      user.passwordHash,
      password,
    );
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: userId,
      role: UserRole.Client,
    });
  });

  it('runs the dummy verify and rejects an unknown email', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(null);

    await expectInvalidCredentials();
    expect(passwordService.verifyDummy).toHaveBeenCalledWith(password);
    expect(passwordService.verify).not.toHaveBeenCalled();
  });

  it('runs the dummy verify and rejects a disabled user', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue({
      ...user,
      disabled: true,
    });

    await expectInvalidCredentials();
    expect(passwordService.verifyDummy).toHaveBeenCalledWith(password);
    expect(passwordService.verify).not.toHaveBeenCalled();
  });

  it('rejects a wrong password', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(user);
    passwordService.verify.mockResolvedValue(false);

    await expectInvalidCredentials();
  });

  it('rethrows the original error and logs the user id when verify rejects', async () => {
    const logError = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const failure = new Error('Invalid hash');
    usersService.findByEmailWithPassword.mockResolvedValue(user);
    passwordService.verify.mockRejectedValue(failure);

    await expect(service.login(email, password)).rejects.toBe(failure);
    expect(jwtService.signAsync).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalledOnce();
    const logged = JSON.stringify(logError.mock.calls);
    expect(logged).toContain(userId);
    expect(logged).not.toContain(email);
    expect(logged).not.toContain(password);
  });
});
