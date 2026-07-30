import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { authCookieService } from '../../shared/utils/authCookie.js';
import { authService, type AuthService } from './auth.service.js';

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.register(req.body, this.requestContext(req));
    this.setRefreshCookie(res, result.refreshToken);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user
      }
    });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.login(req.body, this.requestContext(req));
    this.setRefreshCookie(res, result.refreshToken);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user
      }
    });
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.refreshSession(this.getRefreshCookie(req), this.requestContext(req));
    this.setRefreshCookie(res, result.refreshToken);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user
      }
    });
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    await this.service.logout(this.getRefreshCookie(req));
    authCookieService.clearRefreshCookie(res);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const user = await this.service.getCurrentUser(req.user?.id ?? '');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        user
      }
    });
  };

  private setRefreshCookie(res: Response, token: string): void {
    authCookieService.setRefreshCookie(res, token);
  }

  private getRefreshCookie(req: Request): string | undefined {
    return req.cookies?.[authCookieService.refreshCookieName];
  }

  private requestContext(req: Request) {
    return {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? ''
    };
  }
}

export const authController = new AuthController();
