import { userRepository, type UserRepository } from './user.repository.js';

export class UserService {
  constructor(private readonly repository: UserRepository = userRepository) {}
}

export const userService = new UserService();
