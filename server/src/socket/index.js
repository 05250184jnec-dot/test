/**
 * socket/index.js - Socket.IO server. JWT-authenticated handshake; each user joins a private room
 * `user:<id>` and a role room `role:<role>`, so events only reach the right people.
 * Client sends the token in socket.handshake.auth.token (never in the URL).
 */
import { Server } from 'socket.io';
import { config } from '../config/env.js';
import { loadUserFromToken } from '../middleware/auth.js';

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: config.origins, credentials: true } });
  io.use(async (socket, next) => {
    try {
      socket.data.user = await loadUserFromToken(String(socket.handshake.auth?.token || ''));
      next();
    } catch { next(new Error('unauthorized')); }
  });
  io.on('connection', (socket) => {
    const { id, role } = socket.data.user;
    socket.join(`user:${id}`);
    socket.join(`role:${role}`);
  });
  return io;
}
/** Emit helpers are no-ops if the socket server isn't running (e.g. scripts/tests). */
export const emitToUser = (userId, event, payload = {}) => io?.to(`user:${userId}`).emit(event, payload);
/** Tell the given users' browsers that their applications list changed (they refetch it). */
export const pingApplications = (...userIds) => userIds.forEach((id) => emitToUser(id, 'applications:changed'));
export const emitToRole = (role, event, payload = {}) => io?.to(`role:${role}`).emit(event, payload);
