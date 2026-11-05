import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';
import {
  JWT_ALGORITHM,
  JWT_EXPIRES_IN,
  JWT_SECRET_MIN_LENGTH,
} from './auth.constants.js';

export function jwtModuleOptions(config: ConfigService): JwtModuleOptions {
  const secret = config.getOrThrow<string>('JWT_SECRET');
  if (secret.length < JWT_SECRET_MIN_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${JWT_SECRET_MIN_LENGTH} characters long.`,
    );
  }

  return {
    secret,
    signOptions: { algorithm: JWT_ALGORITHM, expiresIn: JWT_EXPIRES_IN },
    // Accept only the algorithm we sign with; never trust the token's alg header.
    verifyOptions: { algorithms: [JWT_ALGORITHM] },
  };
}
