import type { CurrentUser } from '../../../entities/user';

export interface AuthState {
  accessToken: string | null;
  user: CurrentUser | null;
  bootstrapped: boolean;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends AuthCredentials {
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  user: CurrentUser;
}
