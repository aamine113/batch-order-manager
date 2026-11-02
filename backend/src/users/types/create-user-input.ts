import { UserRole } from '../enums/user-role.enum.js';

export interface CreateUserInput {
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
}
