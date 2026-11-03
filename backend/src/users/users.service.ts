import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, isObjectIdOrHexString, Model } from 'mongoose';
import { User } from './schemas/user.schema.js';
import { UserRole } from './enums/user-role.enum.js';
import { CreateUserInput } from './types/create-user-input.js';
import { UserRecord, UserRecordWithPassword } from './types/user-record.js';
import { normalizeEmail } from './normalize-email.js';
import { isDuplicateKeyError } from '../common/mongo/is-duplicate-key-error.js';
import { duplicateKeyFields } from '../common/mongo/duplicate-key-fields.js';

// TODO: map users to a response DTO before returning them over HTTP. Lean and
// toObject() results skip the schema's toJSON transform, so they carry `_id`
// instead of `id`.
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(
    input: CreateUserInput,
    session?: ClientSession,
  ): Promise<UserRecord> {
    try {
      // The array form is the one that accepts a session.
      const [created] = await this.userModel.create(
        [{ ...input, email: normalizeEmail(input.email) }],
        { session },
      );
      // select: false only applies to queries, so the created document still
      // carries the hash and it is removed here.
      const { passwordHash: _passwordHash, ...user } =
        created.toObject<UserRecordWithPassword>();
      return user;
    } catch (error: unknown) {
      if (duplicateKeyFields(error).includes('role')) {
        throw new ConflictException('An admin already exists.');
      }
      if (isDuplicateKeyError(error)) {
        throw new ConflictException('A user with this email already exists.');
      }
      throw error;
    }
  }

  async findAdmin(): Promise<UserRecord | null> {
    return this.userModel
      .findOne({ role: UserRole.Admin })
      .lean<UserRecord>()
      .exec();
  }

  // HTTP callers will validate the id with a param DTO first. This check
  // covers internal callers, such as an id taken from a token payload, which
  // no pipe validates: they get null instead of a cast error.
  async findById(id: string): Promise<UserRecord | null> {
    if (!isObjectIdOrHexString(id)) {
      return null;
    }
    return this.userModel.findById(id).lean<UserRecord>().exec();
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.userModel
      .findOne({ email: normalizeEmail(email) })
      .lean<UserRecord>()
      .exec();
  }

  // For login only: the one method that returns the password hash.
  async findByEmailWithPassword(
    email: string,
  ): Promise<UserRecordWithPassword | null> {
    return this.userModel
      .findOne({ email: normalizeEmail(email) })
      .select('+passwordHash')
      .lean<UserRecordWithPassword>()
      .exec();
  }
}
