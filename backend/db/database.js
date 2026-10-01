const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'vinyl.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist TEXT NOT NULL,
    title TEXT NOT NULL,
    genre TEXT NOT NULL,
    subgenres TEXT,
    label TEXT,
    led_index INTEGER NOT NULL UNIQUE,
    shelf_position TEXT
  );
`);

// Add columns to existing databases that predate these fields
const cols = db.prepare("PRAGMA table_info(records)").all().map((c) => c.name);
if (!cols.includes('label')) {
  db.exec('ALTER TABLE records ADD COLUMN label TEXT');
}
if (!cols.includes('release_year')) {
  db.exec('ALTER TABLE records ADD COLUMN release_year INTEGER');
}

module.exports = db;
