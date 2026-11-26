/**
 * server.js - ENTRY POINT. Run with `npm start`. Starts everything in order:
 * check MySQL -> create the admin (first run) -> mail worker -> HTTP server + Socket.IO (live updates).
 * The Express app itself is built in src/app.js.
 */
import http from 'node:http';
import bcrypt from 'bcryptjs';
import { config } from './src/config/env.js';
import { pool, one } from './src/config/db.js';
import { app } from './src/app.js';
import { initSocket } from './src/socket/index.js';
import { verifyMailer, startMailWorker } from './src/services/mailer.js';
import { userModel } from './src/models/userModel.js';
import { BCRYPT_COST } from './src/utils/constants.js';

/** The admin is NOT self-registered: created from .env (ADMIN_EMAIL / ADMIN_PASSWORD) on first start. */
async function ensureAdmin() {
  if ((await userModel.countAdmins()).n > 0 || !config.ADMIN_EMAIL || !config.ADMIN_PASSWORD) return;
  const passwordHash = await bcrypt.hash(config.ADMIN_PASSWORD, BCRYPT_COST);
  await userModel.create({ role: 'admin', name: config.ADMIN_NAME, email: config.ADMIN_EMAIL.toLowerCase(), passwordHash, status: 'approved' });
  console.log(`Admin account created: ${config.ADMIN_EMAIL}`);
}

await one('SELECT 1');
console.log('MySQL connected');
await ensureAdmin();
await verifyMailer();
await startMailWorker();
const server = http.createServer(app);
initSocket(server);
server.listen(config.PORT, () => console.log(`InternHive API on http://localhost:${config.PORT}`));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => server.close(() => pool.end().then(() => process.exit(0))));
