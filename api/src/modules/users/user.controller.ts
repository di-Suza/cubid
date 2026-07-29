import { userService, type UserService } from './user.service.js';

export class UserController {
  constructor(private readonly service: UserService = userService) {}
}

export const userController = new UserController();
