/**
 * config/db.js - MySQL connection pool + tiny query helpers.
 *
 * SQL-INJECTION PREVENTION (why this file matters)
 * ------------------------------------------------
 * BAD  (never do this):   pool.query(`SELECT * FROM users WHERE email='${email}'`)
 *      email = "' OR 1=1 --"  turns the query into  ... WHERE email='' OR 1=1 --'  => returns every user.
 * GOOD (always do this):  pool.query('SELECT * FROM users WHERE email = ?', [email])
 *      The driver sends/escapes the value as DATA, so "' OR 1=1 --" is just a weird e-mail string
 *      that matches nothing. User input can never change the *structure* of the SQL.
 * For dynamic ORDER BY / LIMIT we use ALLOW-LISTS (utils/query.js), never raw input.
 * We use pool.query(sql, params) (mysql2 escapes each `?`) because mysql2's server-side
 * prepared statements reject numeric LIMIT/OFFSET placeholders on MySQL >= 8.0.22.
 */
import mysql from 'mysql2/promise';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const pool = mysql.createPool({
  host: config.DB_HOST,
  port: Number(config.DB_PORT),
  user: config.DB_USER,        // least-privilege user (see schema.sql)
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  ssl: {
    minVersion: 'TLSv1.2',
    // TiDB Cloud requires TLS. The CA file lets the driver verify the server's identity.
    ca: fs.readFileSync(path.join(__dirname, '..', '..', 'certs', 'ca.pem')),
    rejectUnauthorized: true,
  },
  waitForConnections: true,
  connectionLimit: 20,
  charset: 'utf8mb4',
  timezone: 'Z',               // store/read DATETIME as UTC
  dateStrings: ['DATE'],       // DATE columns -> 'YYYY-MM-DD' strings (no timezone shifting)
  decimalNumbers: true,        // DECIMAL/AVG -> JS numbers
  multipleStatements: false,   // WHY: stacked queries ("; DROP TABLE") are impossible
});

// Make every connection use UTC. Without this, CURRENT_TIMESTAMP defaults use the database server's
// LOCAL time zone (e.g. India, UTC+5:30) while the code compares against UTC_TIMESTAMP(), so queued
// e-mails would look "5.5 hours in the future" and never be sent.
pool.pool.on('connection', (conn) => conn.query("SET time_zone = '+00:00'"));

/** Run a SELECT-style query, return rows. `conn` lets callers join a transaction. */
export async function q(sql, params = [], conn = pool) {
  const [rows] = await conn.query(sql, params);
  return rows;
}

/** Run INSERT/UPDATE/DELETE, return ResultSetHeader (insertId, affectedRows). */
export async function run(sql, params = [], conn = pool) {
  const [res] = await conn.query(sql, params);
  return res;
}

/** First row or null. */
export async function one(sql, params = [], conn = pool) {
  const rows = await q(sql, params, conn);
  return rows[0] || null;
}

/**
 * Run `fn(conn)` inside a transaction. Commits on success, rolls back on any error.
 * WHY: when 2+ tables change together (complete work + certificate) they succeed or fail as one.
 */
export async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}