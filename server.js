require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const fs        = require('fs');
const { v4: uuidv4 } = require('uuid');
const low       = require('lowdb');
const FileSync  = require('lowdb/adapters/FileSync');

// ── auto-create db directory and file ───────
const dbDir  = path.join(__dirname, 'db');
const dbFile = path.join(dbDir, 'gardens.json');
if (!fs.existsSync(dbDir))  fs.mkdirSync(dbDir, { recursive: true });
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify({ gardens: [] }));

// ── simple JSON file DB ─────────────────────
const adapter = new FileSync(dbFile);
const db      = low(adapter);
db.defaults({ gardens: [] }).write();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── routes ──────────────────────────────────
app.use('/api/garden', require('./routes/garden')(db));
app.use('/admin',      require('./routes/admin')(db));

// ── SPA fallback ────────────────────────────
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌸 Bloom running on http://localhost:${PORT}`));
