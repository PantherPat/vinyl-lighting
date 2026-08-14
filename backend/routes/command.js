const express = require('express');
const db = require('../db/database');
const { sendToLightController } = require('../hardware');

const router = express.Router();

// POST /command — match a spoken genre query against the catalog
router.post('/', (req, res) => {
  const { query } = req.body;

  if (typeof query !== 'string' || query.trim() === '') {
    return res.status(400).json({ error: 'query is required' });
  }

  const normalized = query.trim().toLowerCase();
  const allRecords = db.prepare('SELECT * FROM records').all();

  const matched = allRecords.filter((record) => {
    const genreNorm = record.genre.toLowerCase();
    const genreMatch =
      genreNorm === normalized ||
      genreNorm.includes(normalized) ||
      normalized.includes(genreNorm);
    const subgenreMatch = (record.subgenres || '').toLowerCase().includes(normalized);
    const artistNorm = record.artist.toLowerCase();
    const artistMatch =
      artistNorm === normalized ||
      artistNorm.includes(normalized) ||
      normalized.includes(artistNorm);
    return genreMatch || subgenreMatch || artistMatch;
  });

  const ledIndices = matched.map((r) => r.led_index);

  sendToLightController(ledIndices);

  res.json({ matched_records: matched, led_indices: ledIndices });
});

module.exports = router;
