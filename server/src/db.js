// Database setup — uses SQLite built into Node.js (node:sqlite), no extra install needed.
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(path.join(__dirname, '..', 'todo.db'));

db.exec(`
CREATE TABLE IF NOT EXISTS tasks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority    TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High')),
  category    TEXT NOT NULL DEFAULT 'Personal',
  due_date    TEXT,                          -- local datetime string "YYYY-MM-DDTHH:mm"
  completed   INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// Seed a few sample tasks on first run so the app is not empty for beginners.
const { c } = db.prepare('SELECT COUNT(*) AS c FROM tasks').get();
if (c === 0) {
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const now = new Date();
  const todayEvening = fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0));
  const sample = [
    ['Finish math homework', 'Chapter 5 exercises 1-20', 'High', 'Study', todayEvening],
    ['Buy groceries', 'Milk, eggs, bread, vegetables', 'Medium', 'Personal', null],
    ['Prepare presentation slides', 'Draft outline for Monday team meeting', 'High', 'Work', null],
  ];
  const insert = db.prepare(
    'INSERT INTO tasks (title, description, priority, category, due_date) VALUES (?, ?, ?, ?, ?)'
  );
  for (const row of sample) insert.run(...row);
}

export default db;
