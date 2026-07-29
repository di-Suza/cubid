import jwt, { type SignOptions } from 'jsonwebtoken';

import { env } from '../../config/env.js';
import type { UserRole } from '../constants/roles.js';

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  sessionId?: string;
}

export class TokenService {
  signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, env.jwtAccessSecret, {
      expiresIn: env.accessTokenTtl
    } as SignOptions);
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, env.jwtAccessSecret) as AccessTokenPayload;
  }
}

export const tokenService = new TokenService();
