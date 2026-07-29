import type { Socket } from 'socket.io';

import { tokenService } from '../../shared/utils/token.js';

export interface SocketIdentity {
  userId: string;
  role: 'USER' | 'ADMIN';
  sessionId?: string;
}

export const resolveSocketIdentity = (socket: Socket): SocketIdentity | null => {
  const token = socket.handshake.auth?.token ?? socket.handshake.headers.authorization?.replace('Bearer ', '');

  if (!token || typeof token !== 'string') {
    return null;
  }

  const payload = tokenService.verifyAccessToken(token);

  return {
    userId: payload.sub,
    role: payload.role,
    sessionId: payload.sessionId
  };
};
