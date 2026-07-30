import { userRepository, type UserRepository } from './user.repository.js';
import type { UserRole } from '../../shared/constants/roles.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';

export interface CurrentUserDto {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export interface UserWithPasswordDto extends CurrentUserDto {
  passwordHash: string;
}

export class UserService {
  constructor(private readonly repository: UserRepository = userRepository) {}

  async getCurrentUser(userId: string): Promise<CurrentUserDto> {
    const user = await this.repository.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    return user;
  }
}

export const userService = new UserService();
