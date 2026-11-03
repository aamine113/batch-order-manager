import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AdminSeedError } from '../admin-seed/admin-seed.error.js';
import { AdminSeedModule } from '../admin-seed/admin-seed.module.js';
import { AdminSeeder } from '../admin-seed/admin-seeder.service.js';
import { User } from '../users/schemas/user.schema.js';

let app: INestApplicationContext | undefined;

try {
  app = await NestFactory.createApplicationContext(AdminSeedModule, {
    logger: ['error', 'warn'],
    abortOnError: false,
  });

  // autoIndex builds indexes in the background. Waiting for it guarantees the
  // unique indexes on email and on the admin role exist before the insert,
  // even on a fresh database.
  await app.get<Model<User>>(getModelToken(User.name)).init();

  const { status, email } = await app.get(AdminSeeder).run();
  console.log(
    status === 'created'
      ? `Admin ${email} created.`
      : `Admin ${email} already exists. Nothing changed.`,
  );
} catch (error: unknown) {
  if (error instanceof Error && error.name === 'ExitPromptError') {
    console.error('Cancelled.');
    process.exitCode = 130;
  } else {
    // Only the message is printed: an error object may carry the document that
    // was being written, including the password hash.
    console.error(
      error instanceof AdminSeedError
        ? error.message
        : `Seed failed: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
    process.exitCode = 1;
  }
} finally {
  await app?.close();
}
