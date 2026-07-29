import type { RequestHandler } from 'express';

import { UnauthorizedError } from '../errors/UnauthorizedError.js';
import { tokenService } from '../utils/token.js';

export const optionalAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const token = header.slice('Bearer '.length);
    const payload = tokenService.verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      role: payload.role,
      sessionId: payload.sessionId
    };
    next();
  } catch {
    next(new UnauthorizedError('Invalid access token', 'INVALID_TOKEN'));
  }
};

export const requireAuth: RequestHandler = (req, res, next) => {
  optionalAuth(req, res, (error?: unknown) => {
    if (error) {
      next(error);
      return;
    }

    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    next();
  });
};
