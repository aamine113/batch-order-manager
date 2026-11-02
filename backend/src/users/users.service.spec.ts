import { ConflictException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { ClientSession, Types } from 'mongoose';
import { User } from './schemas/user.schema.js';
import { UserRole } from './enums/user-role.enum.js';
import { CreateUserInput } from './types/create-user-input.js';
import { UserRecord, UserRecordWithPassword } from './types/user-record.js';
import { UsersService } from './users.service.js';

const userId = '64b7f0c2a1b2c3d4e5f60718';

const input: CreateUserInput = {
  email: '  Jane@Example.COM ',
  name: 'Jane Doe',
  passwordHash: '$argon2id$fake-hash',
  role: UserRole.Client,
};

const userRecord: UserRecord = {
  _id: new Types.ObjectId(userId),
  email: 'jane@example.com',
  name: 'Jane Doe',
  role: UserRole.Client,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

const userWithPassword: UserRecordWithPassword = {
  ...userRecord,
  passwordHash: '$argon2id$fake-hash',
};

const duplicateKeyError = { code: 11000 };

// A chainable query whose select() and lean() return the query itself.
function query<T>(value: T) {
  const chain = {
    select: vi.fn(),
    lean: vi.fn(),
    exec: vi.fn().mockResolvedValue(value),
  };
  chain.select.mockReturnValue(chain);
  chain.lean.mockReturnValue(chain);
  return chain;
}

describe('UsersService', () => {
  let service: UsersService;

  const userModel = {
    create: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  describe('create', () => {
    beforeEach(() => {
      userModel.create.mockResolvedValue([
        { toObject: () => ({ ...userWithPassword }) },
      ]);
    });

    it('stores the email trimmed and lowercased', async () => {
      await service.create(input);

      expect(userModel.create).toHaveBeenCalledWith(
        [{ ...input, email: 'jane@example.com' }],
        { session: undefined },
      );
    });

    it('passes the session to the model', async () => {
      const session = {} as ClientSession;

      await service.create(input, session);

      expect(userModel.create).toHaveBeenCalledWith(expect.any(Array), {
        session,
      });
    });

    it('returns the user without the password hash', async () => {
      const user = await service.create(input);

      expect(user).toEqual(userRecord);
      expect(user).not.toHaveProperty('passwordHash');
    });

    it('throws ConflictException on a duplicate key error', async () => {
      userModel.create.mockRejectedValue(duplicateKeyError);

      await expect(service.create(input)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rethrows any other error unchanged', async () => {
      const error = new Error('connection lost');
      userModel.create.mockRejectedValue(error);

      await expect(service.create(input)).rejects.toBe(error);
    });
  });

  describe('findById', () => {
    it('returns the user without selecting the password hash', async () => {
      const findQuery = query(userRecord);
      userModel.findById.mockReturnValue(findQuery);

      const user = await service.findById(userId);

      expect(userModel.findById).toHaveBeenCalledWith(userId);
      expect(findQuery.select).not.toHaveBeenCalled();
      expect(user).toEqual(userRecord);
    });

    it('returns null when the user does not exist', async () => {
      userModel.findById.mockReturnValue(query(null));

      await expect(service.findById(userId)).resolves.toBeNull();
    });

    it('returns null for an invalid id without querying', async () => {
      await expect(service.findById('not-an-id')).resolves.toBeNull();
      expect(userModel.findById).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('looks the user up by the normalised email', async () => {
      userModel.findOne.mockReturnValue(query(userRecord));

      await service.findByEmail('  Jane@Example.COM ');

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: 'jane@example.com',
      });
    });

    it('returns the user without selecting the password hash', async () => {
      const findQuery = query(userRecord);
      userModel.findOne.mockReturnValue(findQuery);

      const user = await service.findByEmail('jane@example.com');

      expect(findQuery.select).not.toHaveBeenCalled();
      expect(user).toEqual(userRecord);
    });
  });

  describe('findByEmailWithPassword', () => {
    it('looks the user up by the normalised email', async () => {
      userModel.findOne.mockReturnValue(query(userWithPassword));

      await service.findByEmailWithPassword('  Jane@Example.COM ');

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: 'jane@example.com',
      });
    });

    it('selects and returns the password hash', async () => {
      const findQuery = query(userWithPassword);
      userModel.findOne.mockReturnValue(findQuery);

      const user = await service.findByEmailWithPassword('jane@example.com');

      expect(findQuery.select).toHaveBeenCalledWith('+passwordHash');
      expect(user?.passwordHash).toBe('$argon2id$fake-hash');
    });

    it('returns null when the user does not exist', async () => {
      userModel.findOne.mockReturnValue(query(null));

      await expect(
        service.findByEmailWithPassword('nobody@example.com'),
      ).resolves.toBeNull();
    });
  });
});
