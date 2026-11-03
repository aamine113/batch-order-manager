import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { baseSchemaOptions } from '../../common/schema/base-schema-options.js';
import { UserRole } from '../enums/user-role.enum.js';

@Schema(baseSchemaOptions)
export class User {
  @Prop({ required: true, trim: true, lowercase: true })
  email!: string;

  // Left out of every query unless explicitly selected with +passwordHash.
  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({
    type: String,
    enum: Object.values(UserRole),
    required: true,
    default: UserRole.Client,
  })
  role!: UserRole;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 }, { unique: true });
// Only admin documents enter this index, so at most one admin can exist.
UserSchema.index(
  { role: 1 },
  { unique: true, partialFilterExpression: { role: UserRole.Admin } },
);
