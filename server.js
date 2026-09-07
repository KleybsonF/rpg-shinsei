import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage: storage });

const dbPath = path.join(__dirname, 'database.json');
const txtPath = path.join(__dirname, 'Shinsei.txt');

function getDatabase() {
  const data = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(data);
}

function saveDatabase(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function updateShinseiTxt(db) {
  let content = '';
  db.bounties.forEach(b => {
    const name = b.shinseiName || b.name || b.alias || '';
    content += `${name}\n`;
    content += `- Poder: ${b.power || ''}\n`;
    content += `- Aparencia: ${b.aparencia || ''}\n`;
    content += `- Personalidade: ${b.personalidade || ''}\n\n`;
  });
  fs.writeFileSync(txtPath, content.trim() + '\n', 'utf-8');
}

// API Routes
app.get('/api/data', (req, res) => {
  res.json(getDatabase());
});

app.post('/api/planets/:id', (req, res) => {
  const db = getDatabase();
  const id = parseInt(req.params.id);
  const index = db.planets.findIndex(p => p.id === id);
  if (index !== -1) {
    db.planets[index] = { ...db.planets[index], ...req.body };
    saveDatabase(db);
    res.json({ success: true, planet: db.planets[index] });
  } else {
    res.status(404).json({ error: 'Planet not found' });
  }
});

app.post('/api/bounties/:id', (req, res) => {
  const db = getDatabase();
  const id = parseInt(req.params.id);
  const index = db.bounties.findIndex(b => b.id === id);
  if (index !== -1) {
    db.bounties[index] = { ...db.bounties[index], ...req.body };
    saveDatabase(db);
    // updateShinseiTxt(db);
    res.json({ success: true, bounty: db.bounties[index] });
  } else {
    res.status(404).json({ error: 'Bounty not found' });
  }
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (req.file) {
    res.json({ success: true, url: `/uploads/${req.file.filename}` });
  } else {
    res.status(400).json({ error: 'No file uploaded' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
