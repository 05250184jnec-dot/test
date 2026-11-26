/**
 * Runs seed.sql after replacing the {{PW_HASH}} placeholder with a real bcrypt hash of the demo
 * password (default Demo@1234; override with SEED_PASSWORD). Needs the DB admin user in .env to have INSERT rights.
 */
import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { config } from '../src/config/env.js';

const hash = bcrypt.hashSync(process.env.SEED_PASSWORD || 'Demo@1234', 12);
const sql = fs.readFileSync(new URL('../database/seed.sql', import.meta.url), 'utf8').replaceAll('{{PW_HASH}}', hash);
const conn = await mysql.createConnection({ host: config.DB_HOST, port: config.DB_PORT, user: config.DB_USER, password: config.DB_PASSWORD, database: config.DB_NAME, ssl: config.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined, multipleStatements: true });
await conn.query(sql);
await conn.end();
console.log('Seeded. Demo logins (password Demo@1234): admin@internhive.local, employer1@demo.com, student1@demo.com');
