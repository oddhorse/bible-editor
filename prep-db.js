/**
 * prep-db.js
 * by john trinh
 * single use script that adds edit table and latest-version view to KJV.db
 */

import Database from 'better-sqlite3'

const db = new Database('data/KJV.db')

db.exec(`
  CREATE TABLE verse_edits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    verse_id INTEGER NOT NULL,
    new_text TEXT NOT NULL,
    edited_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    client_ip TEXT,
    FOREIGN KEY (verse_id) REFERENCES KJV_verses(id)
  );
`)

db.exec(`
  CREATE VIEW KJV_verses_live AS
  SELECT
    v.id,
    v.book_id,
    v.chapter,
    v.verse,
    COALESCE(e.new_text, v.text) AS text,
    v.paragraph,
    CASE WHEN e.id IS NULL THEN 0 ELSE 1 END AS is_edited,
    e.edited_at AS last_edited_at
  FROM KJV_verses v
  LEFT JOIN verse_edits e ON e.id = (
    SELECT id
    FROM verse_edits
    WHERE verse_id = v.id
    ORDER BY id DESC
    LIMIT 1
  );
`)

db.close()

console.log('added all the stuff to data/KJV.db')
