const express = require('express');
const db = require('../db/database');

const router = express.Router();

function validateRecordBody(body, { partial = false } = {}) {
  const errors = [];
  const required = ['artist', 'title', 'genre', 'led_index'];

  for (const field of required) {
    if (!partial && (body[field] === undefined || body[field] === null || body[field] === '')) {
      errors.push(`${field} is required`);
    }
  }

  if (body.led_index !== undefined && !Number.isInteger(body.led_index)) {
    errors.push('led_index must be an integer');
  }

  return errors;
}

// Finds an existing record with the same artist + title (case/whitespace-insensitive),
// optionally excluding a given id (used when editing that record itself).
function findDuplicate(artist, title, excludeId) {
  return db.prepare(`
    SELECT * FROM records
    WHERE LOWER(TRIM(artist)) = LOWER(TRIM(?))
      AND LOWER(TRIM(title)) = LOWER(TRIM(?))
      AND id != ?
  `).get(artist, title, excludeId ?? -1);
}

// GET /catalog — return all records
router.get('/', (req, res) => {
  const records = db.prepare('SELECT * FROM records ORDER BY led_index ASC').all();
  res.json(records);
});

// POST /catalog — add a new record
router.post('/', (req, res) => {
  const { artist, title, genre, subgenres, label, release_year, led_index, shelf_position } = req.body;

  const errors = validateRecordBody(req.body);
  if (errors.length) {
    return res.status(400).json({ error: errors.join('; ') });
  }

  const duplicate = findDuplicate(artist, title);
  if (duplicate) {
    return res.status(409).json({ error: `"${artist} – ${title}" is already in the catalog (id ${duplicate.id})` });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO records (artist, title, genre, subgenres, label, release_year, led_index, shelf_position)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(artist, title, genre, subgenres ?? null, label ?? null, release_year ?? null, led_index, shelf_position ?? null);
    const created = db.prepare('SELECT * FROM records WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: `led_index ${led_index} is already in use` });
    }
    res.status(500).json({ error: 'Failed to create record' });
  }
});

// PUT /catalog/:id — edit an existing record
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM records WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Record not found' });
  }

  const errors = validateRecordBody(req.body, { partial: true });
  if (errors.length) {
    return res.status(400).json({ error: errors.join('; ') });
  }

  const merged = {
    artist: req.body.artist ?? existing.artist,
    title: req.body.title ?? existing.title,
    genre: req.body.genre ?? existing.genre,
    subgenres: req.body.subgenres ?? existing.subgenres,
    label: req.body.label ?? existing.label,
    release_year: req.body.release_year ?? existing.release_year,
    led_index: req.body.led_index ?? existing.led_index,
    shelf_position: req.body.shelf_position ?? existing.shelf_position,
  };

  const duplicate = findDuplicate(merged.artist, merged.title, existing.id);
  if (duplicate) {
    return res.status(409).json({ error: `"${merged.artist} – ${merged.title}" is already in the catalog (id ${duplicate.id})` });
  }

  try {
    db.prepare(`
      UPDATE records
      SET artist = ?, title = ?, genre = ?, subgenres = ?, label = ?, release_year = ?, led_index = ?, shelf_position = ?
      WHERE id = ?
    `).run(merged.artist, merged.title, merged.genre, merged.subgenres, merged.label, merged.release_year, merged.led_index, merged.shelf_position, id);
    const updated = db.prepare('SELECT * FROM records WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: `led_index ${merged.led_index} is already in use` });
    }
    res.status(500).json({ error: 'Failed to update record' });
  }
});

// DELETE /catalog/:id — remove a record
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM records WHERE id = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Record not found' });
  }
  res.status(204).send();
});

module.exports = router;
