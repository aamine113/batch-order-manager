import { PasswordService } from './password.service.js';

describe('PasswordService', () => {
  const service = new PasswordService();
  let passwordHash: string;

  // One shared hash: each argon2 hash costs 19 MiB and two passes.
  beforeAll(async () => {
    await service.onModuleInit();
    passwordHash = await service.hash('correct horse battery');
  });

  it('verifies a password against its own hash', async () => {
    await expect(
      service.verify(passwordHash, 'correct horse battery'),
    ).resolves.toBe(true);
  });

  it('returns false for a wrong password', async () => {
    await expect(service.verify(passwordHash, 'wrong password')).resolves.toBe(
      false,
    );
  });

  it('produces an argon2id hash', () => {
    expect(passwordHash.startsWith('$argon2id$')).toBe(true);
  });

  it('rejects a malformed hash instead of returning false', async () => {
    await expect(
      service.verify('not-a-hash', 'correct horse battery'),
    ).rejects.toThrow();
  });

  it('verifyDummy resolves to false', async () => {
    await expect(service.verifyDummy('any password')).resolves.toBe(false);
  });

  it('verifyDummy throws when called before module initialisation', async () => {
    await expect(new PasswordService().verifyDummy('any')).rejects.toThrow(
      'before module initialisation',
    );
  });
});
