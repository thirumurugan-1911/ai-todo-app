import { Router } from 'express';
import db from '../db.js';
import { aiStatus, suggestTaskMeta, breakDownTask, dailyPlan, askAI } from '../services/aiService.js';

const router = Router();

// ---- Simple in-memory rate limit for AI endpoints (protects your paid API key) ----
const AI_LIMIT = 30; // requests per minute per IP
const hits = new Map();

function aiRateLimit(req, res, next) {
  const now = Date.now();
  let rec = hits.get(req.ip);
  if (!rec || now > rec.reset) {
    rec = { count: 0, reset: now + 60_000 };
    hits.set(req.ip, rec);
  }
  rec.count += 1;
  if (rec.count > AI_LIMIT) {
    return res.status(429).json({ error: 'Too many AI requests. Please wait a minute.' });
  }
  next();
}

// ---- Input helpers ----
function readText(value, { field, maxLen, required = true }) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (required && !text) return { error: `${field} is required` };
  if (text.length > maxLen) return { error: `${field} must be at most ${maxLen} characters` };
  return { text };
}

// GET /api/ai/status — lets the frontend show whether the AI key is configured
router.get('/status', (req, res) => res.json(aiStatus()));

// POST /api/ai/suggest { title, description } -> { priority, category, reason, aiPowered }
router.post('/suggest', aiRateLimit, async (req, res, next) => {
  try {
    const { text: title, error } = readText(req.body?.title, { field: 'Title', maxLen: 200 });
    if (error) return res.status(400).json({ error });
    const { text: description } = readText(req.body?.description, { field: 'Description', maxLen: 2000, required: false });
    res.json(await suggestTaskMeta(title, description));
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/break-down { title, description } -> { subtasks: string[], aiPowered }
router.post('/break-down', aiRateLimit, async (req, res, next) => {
  try {
    const { text: title, error } = readText(req.body?.title, { field: 'Title', maxLen: 200 });
    if (error) return res.status(400).json({ error });
    const { text: description } = readText(req.body?.description, { field: 'Description', maxLen: 2000, required: false });
    res.json(await breakDownTask(title, description));
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/daily-plan -> { plan, aiPowered } (uses current pending tasks from DB)
router.post('/daily-plan', aiRateLimit, async (req, res, next) => {
  try {
    const tasks = db.prepare('SELECT * FROM tasks').all();
    res.json(await dailyPlan(tasks));
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/ask { question } -> { answer, aiPowered }
router.post('/ask', aiRateLimit, async (req, res, next) => {
  try {
    const { text: question, error } = readText(req.body?.question, { field: 'Question', maxLen: 1000 });
    if (error) return res.status(400).json({ error });
    const tasks = db.prepare('SELECT * FROM tasks').all();
    res.json(await askAI(question, tasks));
  } catch (err) {
    next(err);
  }
});

export default router;
