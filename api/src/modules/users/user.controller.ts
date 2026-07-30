import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { userService, type UserService } from './user.service.js';

export class UserController {
  constructor(private readonly service: UserService = userService) {}

  me = async (req: Request, res: Response): Promise<void> => {
    const user = await this.service.getCurrentUser(req.user?.id ?? '');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        user
      }
    });
  };
}

export const userController = new UserController();
