import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { PasswordModule } from '../password/password.module.js';
import { UsersModule } from '../users/users.module.js';
import { LOGIN_THROTTLE } from './auth.constants.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { jwtModuleOptions } from './jwt-module-options.js';

@Module({
  imports: [
    UsersModule,
    PasswordModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: jwtModuleOptions,
    }),
    ThrottlerModule.forRoot([LOGIN_THROTTLE]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
