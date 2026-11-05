import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
  let controller: AuthController;

  const authService = { login: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(AuthController);
  });

  it('delegates login to AuthService', async () => {
    authService.login.mockResolvedValue({ accessToken: 'signed-token' });

    await expect(
      controller.login({ email: 'jane@example.com', password: 'secret' }),
    ).resolves.toEqual({ accessToken: 'signed-token' });
    expect(authService.login).toHaveBeenCalledWith(
      'jane@example.com',
      'secret',
    );
  });

  it('applies the throttler guard to the whole controller', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, AuthController)).toContain(
      ThrottlerGuard,
    );
  });
});
