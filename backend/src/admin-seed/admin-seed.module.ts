import { Module } from '@nestjs/common';
import { AppModule } from '../app.module.js';
import { PasswordModule } from '../password/password.module.js';
import { UsersModule } from '../users/users.module.js';
import { AdminSeeder } from './admin-seeder.service.js';
import { PasswordPrompt } from './password-prompt.service.js';

// Root module of the seed script only. It imports AppModule, so the script runs
// with the same configuration and database connection as the server, while
// the HTTP app never loads the seeder.
@Module({
  imports: [AppModule, UsersModule, PasswordModule],
  providers: [AdminSeeder, PasswordPrompt],
})
export class AdminSeedModule {}
