/**
 * src/app.js - builds the Express app (no listen here, so it is testable). server.js starts it.
 * Request path:  helmet/cors/json -> rate limit -> routes/index.js -> routes file -> controller -> model -> MySQL.
 * Hardening: helmet headers, strict CORS allow-list, 10kb body cap, hpp (param pollution),
 * global rate limit, no x-powered-by, centralized error handler.
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import { config } from './config/env.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

export const app = express();
app.disable('x-powered-by');
app.set('trust proxy', config.trustProxy); // WHY: behind nginx/Heroku req.ip is the real client, otherwise rate limits would see only the proxy
app.use(helmet());
app.use(cors({
  origin: (origin, cb) => (!origin || config.origins.includes(origin) ? cb(null, true) : cb(new Error('CORS_BLOCKED'))),
  credentials: true,
}));
app.use(express.json({ limit: '10kb' })); // WHY: tiny body cap blocks payload-flooding
app.use(hpp());
app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api', globalLimiter, routes);
app.use(notFoundHandler);
app.use(errorHandler);
