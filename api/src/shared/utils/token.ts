import jwt, { type SignOptions } from 'jsonwebtoken';
import { createHash } from 'node:crypto';

import { env } from '../../config/env.js';
import type { UserRole } from '../constants/roles.js';

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  sessionId?: string;
}

export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
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

  signRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, env.jwtRefreshSecret, {
      expiresIn: `${env.refreshTokenTtlDays}d`
    } as SignOptions);
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, env.jwtRefreshSecret) as RefreshTokenPayload;
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

export const tokenService = new TokenService();
