import type { CookieOptions, Response } from 'express';

import { env } from '../../config/env.js';

const REFRESH_COOKIE_NAME = 'cubid_refresh';

export class AuthCookieService {
  get refreshCookieName(): string {
    return REFRESH_COOKIE_NAME;
  }

  buildRefreshCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: env.isProduction ? 'none' : 'lax',
      path: '/api/auth',
      maxAge: env.refreshTokenTtlDays * 24 * 60 * 60 * 1000
    };
  }

  setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE_NAME, token, this.buildRefreshCookieOptions());
  }

  clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE_NAME, this.buildRefreshCookieOptions());
  }
}

export const authCookieService = new AuthCookieService();
