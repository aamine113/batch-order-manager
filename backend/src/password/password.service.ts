import { Injectable, OnModuleInit } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import { randomBytes } from 'node:crypto';
import { ARGON2_OPTIONS } from './password.constants.js';

@Injectable()
export class PasswordService implements OnModuleInit {
  private dummyHash?: string;

  async onModuleInit(): Promise<void> {
    this.dummyHash = await this.hash(randomBytes(32).toString('base64url'));
  }

  hash(plain: string): Promise<string> {
    return hash(plain, ARGON2_OPTIONS);
  }

  // Resolves to false on a wrong password. A malformed hash rejects.
  // The parameters are read from the hash string, so no options are passed.
  verify(passwordHash: string, plain: string): Promise<boolean> {
    return verify(passwordHash, plain);
  }

  // Unknown-email path: keeps login timing constant when no account exists.
  // The dummy hash is built at startup with the same options as real hashes,
  // so verifying against it costs the same as a real verify. The result is
  // always false.
  async verifyDummy(plain: string): Promise<false> {
    if (!this.dummyHash) {
      throw new Error('PasswordService used before module initialisation.');
    }
    await verify(this.dummyHash, plain);
    return false;
  }
}
