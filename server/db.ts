import Database from 'better-sqlite3';
import pkg from 'pg';
const { Pool } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isPostgres = !!process.env.DATABASE_URL;

let pool: any;
let sqliteDb: any;

if (isPostgres) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  } catch (err) {
    console.error("Erreur initialisation pool PostgreSQL:", err);
  }
} else {
  try {
    sqliteDb = new Database(path.join(__dirname, 'omni.db'));
    sqliteDb.pragma('journal_mode = WAL');
  } catch (err) {
    console.warn("Échec ouverture SQLite dans dossier local, bascule vers /tmp/omni.db:", err);
    try {
      sqliteDb = new Database('/tmp/omni.db');
      sqliteDb.pragma('journal_mode = WAL');
    } catch (e2) {
      console.error("Échec ouverture SQLite dans /tmp:", e2);
    }
  }
}

export const initDb = async () => {
  try {
    if (isPostgres && pool) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY,
          username VARCHAR(255) DEFAULT '',
          email VARCHAR(255) DEFAULT '',
          biometrics INTEGER DEFAULT 0,
          "aiAnalysis" INTEGER DEFAULT 1,
          notifications INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS focus_sessions (
          id SERIAL PRIMARY KEY,
          duration INTEGER NOT NULL,
          completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS wallet_transactions (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          amount DECIMAL NOT NULL,
          category VARCHAR(255) NOT NULL,
          date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO settings (id, username, email, biometrics, "aiAnalysis", notifications)
        VALUES (1, '', '', 0, 1, 0)
        ON CONFLICT (id) DO NOTHING;
      `);
      console.log("✅ Connecté à PostgreSQL (Prêt pour la Production)");
    } else if (sqliteDb) {
      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          username TEXT DEFAULT '',
          email TEXT DEFAULT '',
          biometrics INTEGER DEFAULT 0,
          aiAnalysis INTEGER DEFAULT 1,
          notifications INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS focus_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          duration INTEGER NOT NULL,
          completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS wallet_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          date DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        INSERT OR IGNORE INTO settings (id, username, email, biometrics, aiAnalysis, notifications) 
        VALUES (1, '', '', 0, 1, 0);
      `);
      console.log("✅ Connecté à SQLite (Mode Local/Preview)");
    }
  } catch (err) {
    console.error("Erreur lors de l'exécution de initDb:", err);
  }
};

export const query = async (text: string, params: any[] = []) => {
  if (isPostgres) {
    if (!pool) return [];
    let pgText = text;
    let i = 1;
    pgText = pgText.replace(/\?/g, () => `$${i++}`);
    const result = await pool.query(pgText, params);
    return result.rows;
  } else {
    if (!sqliteDb) return [];
    const stmt = sqliteDb.prepare(text);
    if (text.trim().toUpperCase().startsWith('SELECT') || text.trim().toUpperCase().includes('RETURNING')) {
      return stmt.all(...params);
    } else {
      stmt.run(...params);
      return [];
    }
  }
};

export const queryOne = async (text: string, params: any[] = []) => {
  if (isPostgres) {
    if (!pool) return null;
    let pgText = text;
    let i = 1;
    pgText = pgText.replace(/\?/g, () => `$${i++}`);
    const result = await pool.query(pgText, params);
    return result.rows[0];
  } else {
    if (!sqliteDb) return null;
    const stmt = sqliteDb.prepare(text);
    return stmt.get(...params);
  }
};

