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
    led_index INTEGER NOT NULL UNIQUE,
    shelf_position TEXT
  );
`);

module.exports = db;
