import { UserModel, type UserDocument } from './user.model.js';

export class UserRepository {
  constructor(private readonly userModel = UserModel) {}

  get model(): typeof this.userModel {
    return this.userModel;
  }
}

export const userRepository = new UserRepository();

export type { UserDocument };
