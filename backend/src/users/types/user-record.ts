import { Types } from 'mongoose';
import { User } from '../schemas/user.schema.js';

export interface UserRecord extends Omit<User, 'passwordHash'> {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRecordWithPassword
  extends UserRecord, Pick<User, 'passwordHash'> {}
