import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PASSWORD_MAX_LENGTH } from '../../password/password.constants.js';
import { LoginDto } from './login.dto.js';

function toDto(plain: Record<string, unknown>): LoginDto {
  return plainToInstance(LoginDto, plain);
}

async function failedProperties(dto: LoginDto): Promise<string[]> {
  const errors = await validate(dto);
  return errors.map((error) => error.property);
}

const valid = { email: 'jane@example.com', password: 'secret' };

describe('LoginDto', () => {
  it('trims and lowercases the email', async () => {
    const dto = toDto({ ...valid, email: '  Jane@Example.COM ' });

    expect(dto.email).toBe('jane@example.com');
    expect(await failedProperties(dto)).toEqual([]);
  });

  it('rejects an invalid email', async () => {
    expect(
      await failedProperties(toDto({ ...valid, email: 'not-an-email' })),
    ).toEqual(['email']);
  });

  it('rejects an empty password', async () => {
    expect(await failedProperties(toDto({ ...valid, password: '' }))).toEqual([
      'password',
    ]);
  });

  it('accepts a 1-character password', async () => {
    expect(await failedProperties(toDto({ ...valid, password: 'a' }))).toEqual(
      [],
    );
  });

  it('accepts a password at the cap', async () => {
    const password = 'a'.repeat(PASSWORD_MAX_LENGTH * 2);

    expect(await failedProperties(toDto({ ...valid, password }))).toEqual([]);
  });

  it('rejects a password over the cap', async () => {
    const password = 'a'.repeat(PASSWORD_MAX_LENGTH * 2 + 1);

    expect(await failedProperties(toDto({ ...valid, password }))).toEqual([
      'password',
    ]);
  });
});
