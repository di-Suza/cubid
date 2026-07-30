import { UserModel, type UserDocument } from './user.model.js';
import type { CurrentUserDto, UserWithPasswordDto } from './user.service.js';

type LeanUser = Record<string, any>;

const toIsoString = (value: unknown): string =>
  (value instanceof Date ? value : new Date(String(value))).toISOString();

const toCurrentUser = (user: LeanUser): CurrentUserDto => ({
  id: String(user._id),
  name: String(user.name),
  email: String(user.email),
  emailVerified: Boolean(user.emailVerified),
  role: user.role,
  status: user.status,
  createdAt: toIsoString(user.createdAt),
  updatedAt: toIsoString(user.updatedAt)
});

const toUserWithPassword = (user: LeanUser): UserWithPasswordDto => ({
  ...toCurrentUser(user),
  passwordHash: String(user.passwordHash)
});

export class UserRepository {
  constructor(private readonly userModel = UserModel) {}

  get model(): typeof this.userModel {
    return this.userModel;
  }

  async findByEmail(email: string): Promise<CurrentUserDto | null> {
    const user = await this.userModel.findOne({ email }).lean();

    return user ? toCurrentUser(user as LeanUser) : null;
  }

  async findByEmailWithPassword(email: string): Promise<UserWithPasswordDto | null> {
    const user = await this.userModel.findOne({ email }).select('+passwordHash').lean();

    return user ? toUserWithPassword(user as LeanUser) : null;
  }

  async findById(userId: string): Promise<CurrentUserDto | null> {
    const user = await this.userModel.findById(userId).lean();

    return user ? toCurrentUser(user as LeanUser) : null;
  }

  async createUser(input: { name: string; email: string; passwordHash: string }): Promise<CurrentUserDto> {
    const user = await this.userModel.create({
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash
    });

    return toCurrentUser(user.toObject() as LeanUser);
  }
}

export const userRepository = new UserRepository();

export type { UserDocument };
