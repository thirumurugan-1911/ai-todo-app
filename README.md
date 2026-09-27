# ✅ AI To-Do — Smart Task Manager

A modern, AI-powered to-do list web app. Create and manage tasks, and let AI suggest priorities, assign categories, break big tasks into subtasks, generate a daily plan, and answer questions about your workload.

![Tech](https://img.shields.io/badge/React-Vite-61dafb) ![Tech](https://img.shields.io/badge/Express-Node.js-green) ![Tech](https://img.shields.io/badge/SQLite-node:sqlite-blue)

---

## ✨ Features

- **Dashboard** — due today, pending, completed, high-priority stats + overall completion progress
- **Task management** — create / edit / delete / complete tasks with due dates, priorities (Low·Medium·High), and categories (Study, Work, Personal, Health, Other)
- **Search & filters** — full-text search, status, category, and priority filters
- **AI assistant**
  - ✨ Suggests priority & category for a task
  - ✨ Breaks a big task into subtasks (add them in one click)
  - 🗓️ Generates a daily plan from your pending tasks
  - 💬 "Ask AI" — *"Plan my tasks for today"*, *"What should I work on first?"*
- **UI/UX** — SaaS-style dashboard, light/dark mode, fully responsive (desktop/tablet/mobile), toasts, skeleton loaders, mobile floating action button

> **Demo mode:** no AI key? Every AI feature still works using built-in local heuristics — the app never breaks.

---

## 📁 Project structure

```
ai-todo-app/
├── server/                  # Backend — Node.js + Express + SQLite
│   ├── src/
│   │   ├── index.js         # Express entry point (routes, error handling)
│   │   ├── db.js            # SQLite setup (node:sqlite, zero native deps)
│   │   ├── routes/
│   │   │   ├── tasks.js     # Task CRUD + stats, validation, filtering
│   │   │   └── ai.js        # AI endpoints + rate limiting
│   │   └── services/
│   │       └── aiService.js # ONLY file that uses the AI API key
│   ├── .env.example
│   └── package.json
├── client/                  # Frontend — React + Vite + Tailwind CSS
│   └── src/
│       ├── api/client.js    # Fetch wrappers (tasks + AI)
│       ├── components/      # Layout, Sidebar, TaskCard, TaskForm, TaskList, StatsCard, PageHeader
│       ├── context/         # Theme (dark mode), Toasts
│       └── pages/           # Dashboard, AllTasks, Today, Completed, AIPlanner, Settings
└── README.md
```

---

## 🚀 Getting started

### Prerequisites
- **Node.js 24+** (uses the built-in `node:sqlite` module) — check with `node -v`
- npm

### 1. Backend

```bash
cd server
cp .env.example .env      # Windows: copy .env.example .env
npm install
npm run dev               # runs on http://localhost:5000
```

### 2. Frontend (new terminal)

```bash
cd client
npm install
npm run dev               # runs on http://localhost:5173
```

Open **http://localhost:5173** in your browser. 🎉

The Vite dev server proxies `/api/*` → `http://localhost:5000` automatically (override with `VITE_API_URL` in `client/.env` if needed).

---

## 🔑 AI configuration

The AI key **only ever lives on the backend** — it is never exposed to the browser.

Edit `server/.env` (create it from `.env.example`):

```env
PORT=5000

# any OpenAI-compatible API: OpenAI, Groq, OpenRouter, Mistral, Together, ...
AI_API_KEY=your-api-key-here
AI_API_BASE_URL=https://api.openai.com/v1   # change to your provider if needed
AI_MODEL=gpt-4o-mini                        # change to your model
```

Restart the backend after editing. The **AI Planner** and **Settings** pages show `🤖 AI connected` when the key is detected.

---

## 🌐 API reference

Base URL: `http://localhost:5000/api`

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/tasks` | List tasks. Query: `filter=all\|pending\|completed\|today\|overdue\|high`, `category`, `priority`, `search` |
| `GET` | `/tasks/stats` | Counts: total, pending, completed, dueToday, overdue, highPending |
| `POST` | `/tasks` | Create task `{ title*, description, priority, category, due_date }` |
| `PUT` | `/tasks/:id` | Full update |
| `PATCH` | `/tasks/:id/complete` | Toggle completed |
| `DELETE` | `/tasks/:id` | Delete task |

### AI (rate-limited: 30 requests/min per IP)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/ai/status` | `{ configured, model, baseUrl }` |
| `POST` | `/ai/suggest` | `{ title }` → suggested priority + category + reason |
| `POST` | `/ai/break-down` | `{ title }` → list of subtasks |
| `POST` | `/ai/daily-plan` | Plan generated from your pending tasks |
| `POST` | `/ai/ask` | `{ question }` → assistant answer using your tasks as context |

---

## 🔒 Security notes

- The AI API key is read from `process.env` on the server only and never sent to the client
- `.env` is git-ignored; only `.env.example` is committed
- All task/AI inputs are validated and length-capped on the server
- AI endpoints are rate-limited (30 req/min) to protect your key quota
- SQLite uses parameterized queries (no string interpolation → no SQL injection)
- Dates are strictly validated as `YYYY-MM-DD` / `YYYY-MM-DDTHH:mm`

---

## 🛠️ Useful commands

| Where | Command | What it does |
|---|---|---|
| `server/` | `npm run dev` | Start backend with auto-reload (`node --watch`) |
| `server/` | `npm start` | Start backend |
| `client/` | `npm run dev` | Start Vite dev server |
| `client/` | `npm run build` | Production build into `client/dist` |
| `client/` | `npm run lint` | ESLint check |

Your data lives in `server/todo.db` (SQLite file). Delete it to reset the app to the sample data.
