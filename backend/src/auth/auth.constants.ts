export const JWT_ALGORITHM = 'HS256';
export const JWT_EXPIRES_IN = '1h';
export const JWT_SECRET_MIN_LENGTH = 32;
export const LOGIN_THROTTLE = { ttl: 60_000, limit: 5 };
export const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password.';
