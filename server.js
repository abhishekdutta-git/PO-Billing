const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'database.json');

const DEFAULT_DATA = {
    bills: [],
    customers: [],
    orders: [],
    inventory: { medical: [], optical: [] }
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// Ensure database.json exists
function ensureDB() {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2), 'utf8');
        console.log('✅ Created database.json');
    }
}

// GET — Read database
app.get('/api/data', (req, res) => {
    ensureDB();
    try {
        const raw = fs.readFileSync(DB_PATH, 'utf8');
        res.json(JSON.parse(raw));
    } catch (err) {
        console.error('Read error:', err.message);
        res.json(DEFAULT_DATA);
    }
});

// POST — Write database
app.post('/api/data', (req, res) => {
    try {
        const data = req.body;
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
        res.json({ success: true, timestamp: new Date().toISOString() });
    } catch (err) {
        console.error('Write error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Start
ensureDB();
app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════════╗
  ║   PANORAMA OPTICALS — Billing Server      ║
  ║   Running on http://localhost:${PORT}          ║
  ║   Database: database.json                  ║
  ╚═══════════════════════════════════════════╝
    `);
});
