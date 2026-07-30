import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AuthService } from '../../src/modules/auth/auth.service.js';
import type {
  AuthSessionRecord,
  AuthSessionRepositoryPort,
  AuthTokenServicePort,
  AuthUserRepositoryPort,
  PasswordServicePort
} from '../../src/modules/auth/auth.service.js';
import type { CurrentUserDto, UserWithPasswordDto } from '../../src/modules/users/user.service.js';
import { ConflictError } from '../../src/shared/errors/ConflictError.js';
import { UnauthorizedError } from '../../src/shared/errors/UnauthorizedError.js';

const baseNow = new Date('2026-07-30T10:00:00.000Z');

const createUser = (overrides: Partial<UserWithPasswordDto> = {}): UserWithPasswordDto => ({
  id: `user-${Math.random().toString(36).slice(2)}`,
  name: 'Nayan Mahato',
  email: 'nayan@example.com',
  emailVerified: false,
  role: 'USER',
  status: 'ACTIVE',
  passwordHash: 'hashed:password123',
  createdAt: baseNow.toISOString(),
  updatedAt: baseNow.toISOString(),
  ...overrides
});

class FakeUserRepository implements AuthUserRepositoryPort {
  readonly users = new Map<string, UserWithPasswordDto>();

  async findByEmail(email: string) {
    return [...this.users.values()].find((user) => user.email === email) ?? null;
  }

  async findByEmailWithPassword(email: string) {
    return this.findByEmail(email);
  }

  async findById(userId: string) {
    return [...this.users.values()].find((user) => user.id === userId) ?? null;
  }

  async createUser(input: { name: string; email: string; passwordHash: string }) {
    const user = createUser({
      id: `user-${this.users.size + 1}`,
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash
    });
    this.users.set(user.email, user);
    return user;
  }
}

class FakeSessionRepository implements AuthSessionRepositoryPort {
  readonly sessions = new Map<string, AuthSessionRecord>();

  async createSession(input: AuthSessionRecord) {
    this.sessions.set(input.id, input);
    return input;
  }

  async findSessionById(sessionId: string) {
    return this.sessions.get(sessionId) ?? null;
  }

  async revokeSession(sessionId: string, revokedAt: Date) {
    const session = this.sessions.get(sessionId);

    if (session) {
      this.sessions.set(sessionId, {
        ...session,
        revokedAt
      });
    }
  }
}

class FakePasswordService implements PasswordServicePort {
  async hashPassword(password: string) {
    return `hashed:${password}`;
  }

  async comparePassword(password: string, hash: string) {
    return hash === `hashed:${password}`;
  }
}

class FakeTokenService implements AuthTokenServicePort {
  readonly refreshPayloads = new Map<string, { sub: string; sessionId: string }>();

  signAccessToken(input: { sub: string; role: 'USER' | 'ADMIN'; sessionId?: string }) {
    return `access:${input.sub}:${input.sessionId ?? 'none'}:${input.role}`;
  }

  signRefreshToken(input: { sub: string; sessionId: string }) {
    const token = `refresh:${input.sub}:${input.sessionId}`;
    this.refreshPayloads.set(token, input);
    return token;
  }

  verifyRefreshToken(token: string) {
    const payload = this.refreshPayloads.get(token);

    if (!payload) {
      throw new Error('invalid token');
    }

    return payload;
  }

  hashToken(token: string) {
    return `hash:${token}`;
  }
}

const createHarness = () => {
  const users = new FakeUserRepository();
  const sessions = new FakeSessionRepository();
  const password = new FakePasswordService();
  const tokens = new FakeTokenService();
  const service = new AuthService({
    sessions,
    users,
    passwords: password,
    tokens,
    now: () => baseNow,
    createSessionId: () => `session-${sessions.sessions.size + 1}`
  });

  return {
    password,
    service,
    sessions,
    tokens,
    users
  };
};

describe('AuthService', () => {
  it('registers a normalized user, hashes the password, and creates a refresh session', async () => {
    const { service, sessions, users } = createHarness();

    const result = await service.register(
      {
        name: '  Nayan  ',
        email: '  NAYAN@EXAMPLE.COM ',
        password: 'password123'
      },
      {
        ipAddress: '127.0.0.1',
        userAgent: 'node-test'
      }
    );

    assert.equal(result.user.name, 'Nayan');
    assert.equal(result.user.email, 'nayan@example.com');
    assert.equal(result.accessToken, 'access:user-1:session-1:USER');
    assert.equal(result.refreshToken, 'refresh:user-1:session-1');
    assert.equal(users.users.get('nayan@example.com')?.passwordHash, 'hashed:password123');
    assert.equal(sessions.sessions.get('session-1')?.refreshTokenHash, 'hash:refresh:user-1:session-1');
  });

  it('rejects duplicate registration email addresses', async () => {
    const { service } = createHarness();

    await service.register({ name: 'Nayan', email: 'nayan@example.com', password: 'password123' });

    await assert.rejects(
      () => service.register({ name: 'Nayan Two', email: 'NAYAN@example.com', password: 'password456' }),
      ConflictError
    );
  });

  it('rejects invalid credentials before creating a session', async () => {
    const { service, sessions } = createHarness();

    await service.register({ name: 'Nayan', email: 'nayan@example.com', password: 'password123' });

    await assert.rejects(
      () => service.login({ email: 'nayan@example.com', password: 'wrong-password' }),
      UnauthorizedError
    );
    assert.equal(sessions.sessions.size, 1);
  });

  it('signs in with valid credentials', async () => {
    const { service } = createHarness();

    await service.register({ name: 'Nayan', email: 'nayan@example.com', password: 'password123' });
    const result = await service.login({ email: 'NAYAN@example.com', password: 'password123' });

    assert.equal(result.user.email, 'nayan@example.com');
    assert.equal(result.accessToken, 'access:user-1:session-2:USER');
  });

  it('restores the current user from a valid refresh session', async () => {
    const { service } = createHarness();

    const registered = await service.register({ name: 'Nayan', email: 'nayan@example.com', password: 'password123' });
    const restored = await service.refreshSession(registered.refreshToken);

    assert.equal(restored.user.email, 'nayan@example.com');
    assert.equal(restored.accessToken, 'access:user-1:session-1:USER');
  });

  it('revokes a refresh session during logout', async () => {
    const { service, sessions } = createHarness();

    const registered = await service.register({ name: 'Nayan', email: 'nayan@example.com', password: 'password123' });
    await service.logout(registered.refreshToken);

    assert.equal(sessions.sessions.get('session-1')?.revokedAt?.toISOString(), baseNow.toISOString());
  });
});
