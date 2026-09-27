import { Router } from 'express';
import db from '../db.js';

const router = Router();

const PRIORITIES = ['Low', 'Medium', 'High'];
const CATEGORIES = ['Study', 'Work', 'Personal', 'Health', 'Other'];

// ---- Input validation -------------------------------------------------
function parseTask(body) {
  const errors = [];
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) errors.push('Title is required');
  else if (title.length > 200) errors.push('Title must be at most 200 characters');

  const description = typeof body.description === 'string' ? body.description.trim() : '';
  if (description.length > 2000) errors.push('Description must be at most 2000 characters');

  const priority = body.priority ?? 'Medium';
  if (!PRIORITIES.includes(priority)) errors.push('Priority must be Low, Medium, or High');

  const category = body.category ?? 'Personal';
  if (!CATEGORIES.includes(category)) errors.push(`Category must be one of: ${CATEGORIES.join(', ')}`);

  let due_date = body.due_date ? String(body.due_date).trim() : null;
  const DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/;
  if (due_date && (!DATE_RE.test(due_date) || Number.isNaN(Date.parse(due_date)))) {
    errors.push('Invalid due date (expected YYYY-MM-DD or YYYY-MM-DDTHH:mm)');
  }

  return { errors, values: { title, description, priority, category, due_date } };
}

function parseId(id) {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// ---- Filtering + sorting (kept simple, done in JS) --------------------
const pad = (n) => String(n).padStart(2, '0');
function nowLocal() {
  const d = new Date();
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    dateTime: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function applyFilters(rows, query) {
  const { filter = 'all', category, priority, search } = query;
  const { date, dateTime } = nowLocal();
  let tasks = rows;

  switch (filter) {
    case 'pending':
      tasks = tasks.filter((t) => !t.completed);
      break;
    case 'completed':
      tasks = tasks.filter((t) => t.completed);
      break;
    case 'today':
      tasks = tasks.filter((t) => !t.completed && t.due_date && t.due_date.slice(0, 10) === date);
      break;
    case 'overdue':
      tasks = tasks.filter((t) => !t.completed && t.due_date && t.due_date < dateTime);
      break;
    case 'high':
      tasks = tasks.filter((t) => !t.completed && t.priority === 'High');
      break;
    default:
      break; // 'all'
  }

  if (category && CATEGORIES.includes(category)) tasks = tasks.filter((t) => t.category === category);
  if (priority && PRIORITIES.includes(priority)) tasks = tasks.filter((t) => t.priority === priority);
  if (search && typeof search === 'string') {
    const q = search.trim().toLowerCase();
    if (q) tasks = tasks.filter((t) => (t.title + ' ' + t.description).toLowerCase().includes(q));
  }
  return tasks;
}

function sortTasks(tasks, filter) {
  if (filter === 'completed') {
    return tasks.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  }
  const rank = { High: 0, Medium: 1, Low: 2 };
  return tasks.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed - b.completed;
    if (!!a.due_date !== !!b.due_date) return a.due_date ? -1 : 1;
    if (a.due_date && b.due_date && a.due_date !== b.due_date) return a.due_date < b.due_date ? -1 : 1;
    return rank[a.priority] - rank[b.priority];
  });
}

// ---- Routes -----------------------------------------------------------

// GET /api/tasks?filter=&category=&priority=&search=
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM tasks').all();
  res.json(sortTasks(applyFilters(rows, req.query), req.query.filter));
});

// GET /api/tasks/stats
router.get('/stats', (req, res) => {
  const rows = db.prepare('SELECT * FROM tasks').all();
  const { date, dateTime } = nowLocal();
  res.json({
    total: rows.length,
    completed: rows.filter((t) => t.completed).length,
    pending: rows.filter((t) => !t.completed).length,
    dueToday: rows.filter((t) => !t.completed && t.due_date && t.due_date.slice(0, 10) === date).length,
    overdue: rows.filter((t) => !t.completed && t.due_date && t.due_date < dateTime).length,
    highPending: rows.filter((t) => !t.completed && t.priority === 'High').length,
  });
});

// POST /api/tasks
router.post('/', (req, res) => {
  const { errors, values } = parseTask(req.body ?? {});
  if (errors.length) return res.status(400).json({ error: errors.join('. ') });

  const stmt = db.prepare(
    'INSERT INTO tasks (title, description, priority, category, due_date) VALUES (?, ?, ?, ?, ?)'
  );
  const info = stmt.run(values.title, values.description, values.priority, values.category, values.due_date);
  const created = db.prepare('SELECT * FROM tasks WHERE id = ?').get(Number(info.lastInsertRowid));
  res.status(201).json(created);
});

// PUT /api/tasks/:id  — full update
router.put('/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid task id' });
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Task not found' });

  const { errors, values } = parseTask(req.body ?? {});
  if (errors.length) return res.status(400).json({ error: errors.join('. ') });

  db.prepare(
    `UPDATE tasks SET title = ?, description = ?, priority = ?, category = ?, due_date = ?,
     updated_at = datetime('now') WHERE id = ?`
  ).run(values.title, values.description, values.priority, values.category, values.due_date, id);
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id));
});

// PATCH /api/tasks/:id/complete — toggle completed
router.patch('/:id/complete', (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid task id' });
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Task not found' });

  db.prepare(`UPDATE tasks SET completed = ?, updated_at = datetime('now') WHERE id = ?`).run(
    existing.completed ? 0 : 1,
    id
  );
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id));
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid task id' });
  const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  if (!info.changes) return res.status(404).json({ error: 'Task not found' });
  res.json({ deleted: true });
});

export default router;
