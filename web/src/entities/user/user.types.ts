export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface PublicUser {
  id: string;
  name: string;
  role?: UserRole;
}

export interface CurrentUser extends PublicUser {
  email: string;
  emailVerified: boolean;
  status: UserStatus;
}
