import { model } from 'mongoose';
import { User, UserSchema } from './user.schema.js';
import { UserRole } from '../enums/user-role.enum.js';

// A model with no connection: enough to run setters and cast queries.
const UserModel = model(User.name, UserSchema);

describe('UserSchema', () => {
  it('excludes passwordHash from queries by default', () => {
    expect(UserSchema.path('passwordHash').options.select).toBe(false);
  });

  it('trims and lowercases email on new documents', () => {
    const user = new UserModel({ email: '  Jane@Example.COM ' });

    expect(user.email).toBe('jane@example.com');
  });

  it('trims and lowercases email in query filters', () => {
    const query = UserModel.findOne({ email: '  Jane@Example.COM ' });
    query.cast(UserModel);

    expect(query.getFilter()).toEqual({ email: 'jane@example.com' });
  });

  it('defaults role to client', () => {
    const user = new UserModel({ email: 'jane@example.com' });

    expect(user.role).toBe(UserRole.Client);
  });

  it('declares a unique index on email', () => {
    expect(UserSchema.indexes()).toContainEqual([
      { email: 1 },
      expect.objectContaining({ unique: true }),
    ]);
  });

  it('declares a unique index on role limited to admins', () => {
    expect(UserSchema.indexes()).toContainEqual([
      { role: 1 },
      expect.objectContaining({
        unique: true,
        partialFilterExpression: { role: UserRole.Admin },
      }),
    ]);
  });
});
