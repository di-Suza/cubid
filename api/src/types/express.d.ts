import type { UserRole } from '../shared/constants/roles.js';

declare global {
  namespace Express {
    interface AuthenticatedUser {
      id: string;
      role: UserRole;
      sessionId?: string;
    }

    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
