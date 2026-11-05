import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { PASSWORD_MAX_LENGTH } from '../../password/password.constants.js';
import { normalizeEmail } from '../../users/normalize-email.js';
import { EMAIL_MAX_LENGTH } from '../../users/users.constants.js';

export class LoginDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? normalizeEmail(value) : value,
  )
  @IsEmail()
  @MaxLength(EMAIL_MAX_LENGTH)
  email!: string;

  // No minimum at login: the length rule applies when a password is set.
  // The cap only bounds the argon2 input. MaxLength counts UTF-16 units, and
  // PASSWORD_MAX_LENGTH code points take at most twice as many units.
  @IsString()
  @IsNotEmpty()
  @MaxLength(PASSWORD_MAX_LENGTH * 2)
  password!: string;
}
