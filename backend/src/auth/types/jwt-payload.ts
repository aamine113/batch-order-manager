import { UserRole } from '../../users/enums/user-role.enum.js';

export interface JwtPayload {
  sub: string;
  role: UserRole;
}
