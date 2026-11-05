import { ConfigService } from '@nestjs/config';
import {
  JWT_ALGORITHM,
  JWT_EXPIRES_IN,
  JWT_SECRET_MIN_LENGTH,
} from './auth.constants.js';
import { jwtModuleOptions } from './jwt-module-options.js';

const validSecret = 'x'.repeat(JWT_SECRET_MIN_LENGTH);

describe('jwtModuleOptions', () => {
  beforeEach(() => {
    // ConfigService reads process.env first: make sure it holds no secret.
    vi.stubEnv('JWT_SECRET', undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('throws when JWT_SECRET is missing', () => {
    expect(() => jwtModuleOptions(new ConfigService({}))).toThrow(
      /JWT_SECRET/,
    );
  });

  it('throws when JWT_SECRET is too short', () => {
    const config = new ConfigService({ JWT_SECRET: validSecret.slice(1) });

    expect(() => jwtModuleOptions(config)).toThrow(
      `JWT_SECRET must be at least ${JWT_SECRET_MIN_LENGTH} characters long.`,
    );
  });

  it('signs with HS256 for 1 hour and verifies HS256 only', () => {
    const config = new ConfigService({ JWT_SECRET: validSecret });

    expect(jwtModuleOptions(config)).toEqual({
      secret: validSecret,
      signOptions: { algorithm: JWT_ALGORITHM, expiresIn: JWT_EXPIRES_IN },
      verifyOptions: { algorithms: [JWT_ALGORITHM] },
    });
    expect(JWT_ALGORITHM).toBe('HS256');
    expect(JWT_EXPIRES_IN).toBe('1h');
  });
});
