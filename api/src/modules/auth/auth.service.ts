import { Types } from 'mongoose';

import { env } from '../../config/env.js';
import type { UserRole } from '../../shared/constants/roles.js';
import { ConflictError } from '../../shared/errors/ConflictError.js';
import { ForbiddenError } from '../../shared/errors/ForbiddenError.js';
import { UnauthorizedError } from '../../shared/errors/UnauthorizedError.js';
import { passwordService, type PasswordService } from '../../shared/utils/password.js';
import { tokenService, type RefreshTokenPayload, type TokenService } from '../../shared/utils/token.js';
import { userRepository, type UserRepository } from '../users/user.repository.js';
import type { CurrentUserDto, UserWithPasswordDto } from '../users/user.service.js';
import { authRepository, type AuthRepository } from './auth.repository.js';

export interface AuthSessionRecord {
  id: string;
  userId: string;
  refreshTokenHash: string;
  userAgent: string;
  ipAddress: string;
  revokedAt: Date | null;
  expiresAt: Date;
}

export interface AuthUserRepositoryPort {
  findByEmail(email: string): Promise<CurrentUserDto | null>;
  findByEmailWithPassword(email: string): Promise<UserWithPasswordDto | null>;
  findById(userId: string): Promise<CurrentUserDto | null>;
  createUser(input: { name: string; email: string; passwordHash: string }): Promise<CurrentUserDto>;
}

export interface AuthSessionRepositoryPort {
  createSession(input: AuthSessionRecord): Promise<AuthSessionRecord>;
  findSessionById(sessionId: string): Promise<AuthSessionRecord | null>;
  revokeSession(sessionId: string, revokedAt: Date): Promise<void>;
}

export interface PasswordServicePort {
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
}

export interface AuthTokenServicePort {
  signAccessToken(payload: { sub: string; role: UserRole; sessionId?: string }): string;
  signRefreshToken(payload: RefreshTokenPayload): string;
  verifyRefreshToken(token: string): RefreshTokenPayload;
  hashToken(token: string): string;
}

export interface AuthCredentialsInput {
  email: string;
  password: string;
}

export interface RegisterInput extends AuthCredentialsInput {
  name: string;
}

export interface AuthRequestContext {
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: CurrentUserDto;
}

interface AuthServiceDependencies {
  sessions?: AuthSessionRepositoryPort;
  users?: AuthUserRepositoryPort;
  passwords?: PasswordServicePort;
  tokens?: AuthTokenServicePort;
  now?: () => Date;
  createSessionId?: () => string;
}

export class AuthService {
  private readonly sessions: AuthSessionRepositoryPort;
  private readonly users: AuthUserRepositoryPort;
  private readonly passwords: PasswordServicePort;
  private readonly tokens: AuthTokenServicePort;
  private readonly now: () => Date;
  private readonly createSessionId: () => string;

  constructor(dependencies: AuthServiceDependencies = {}) {
    this.sessions = dependencies.sessions ?? authRepository;
    this.users = dependencies.users ?? userRepository;
    this.passwords = dependencies.passwords ?? passwordService;
    this.tokens = dependencies.tokens ?? tokenService;
    this.now = dependencies.now ?? (() => new Date());
    this.createSessionId = dependencies.createSessionId ?? (() => new Types.ObjectId().toString());
  }

  async register(input: RegisterInput, context: AuthRequestContext = {}): Promise<AuthResult> {
    const email = this.normalizeEmail(input.email);
    const name = input.name.trim();

    const existingUser = await this.users.findByEmail(email);

    if (existingUser) {
      throw new ConflictError('Email is already registered', 'EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await this.passwords.hashPassword(input.password);
    const user = await this.users.createUser({
      name,
      email,
      passwordHash
    });

    return this.createSessionForUser(user, context);
  }

  async login(input: AuthCredentialsInput, context: AuthRequestContext = {}): Promise<AuthResult> {
    const email = this.normalizeEmail(input.email);
    const user = await this.users.findByEmailWithPassword(email);

    if (!user || !(await this.passwords.comparePassword(input.password, user.passwordHash))) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('Account is suspended', 'ACCOUNT_SUSPENDED');
    }

    return this.createSessionForUser(user, context);
  }

  async refreshSession(refreshToken: string | undefined, context: AuthRequestContext = {}): Promise<AuthResult> {
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh session is required', 'REFRESH_REQUIRED');
    }

    const payload = this.verifyRefreshToken(refreshToken);
    const session = await this.sessions.findSessionById(payload.sessionId);
    const now = this.now();

    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt <= now ||
      session.refreshTokenHash !== this.tokens.hashToken(refreshToken)
    ) {
      throw new UnauthorizedError('Refresh session is invalid', 'INVALID_REFRESH_SESSION');
    }

    const user = await this.users.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedError('Refresh session user no longer exists', 'INVALID_REFRESH_SESSION');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('Account is suspended', 'ACCOUNT_SUSPENDED');
    }

    return {
      accessToken: this.tokens.signAccessToken({
        sub: user.id,
        role: user.role,
        sessionId: session.id
      }),
      refreshToken,
      user
    };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = this.tokens.verifyRefreshToken(refreshToken);
      await this.sessions.revokeSession(payload.sessionId, this.now());
    } catch {
      // Logout should clear the browser cookie even when the stored token is stale.
    }
  }

  async getCurrentUser(userId: string): Promise<CurrentUserDto> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new UnauthorizedError('Authenticated user no longer exists', 'INVALID_SESSION_USER');
    }

    return user;
  }

  private async createSessionForUser(user: CurrentUserDto, context: AuthRequestContext): Promise<AuthResult> {
    const sessionId = this.createSessionId();
    const refreshToken = this.tokens.signRefreshToken({
      sub: user.id,
      sessionId
    });
    const expiresAt = new Date(this.now().getTime() + env.refreshTokenTtlDays * 24 * 60 * 60 * 1000);

    await this.sessions.createSession({
      id: sessionId,
      userId: user.id,
      refreshTokenHash: this.tokens.hashToken(refreshToken),
      userAgent: context.userAgent ?? '',
      ipAddress: context.ipAddress ?? '',
      revokedAt: null,
      expiresAt
    });

    return {
      accessToken: this.tokens.signAccessToken({
        sub: user.id,
        role: user.role,
        sessionId
      }),
      refreshToken,
      user
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private verifyRefreshToken(refreshToken: string): RefreshTokenPayload {
    try {
      return this.tokens.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Refresh session is invalid', 'INVALID_REFRESH_TOKEN');
    }
  }
}

export const authService = new AuthService();
