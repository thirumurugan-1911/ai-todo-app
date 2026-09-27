// AI service — the ONLY place the AI API key is used. Never import this from the frontend.
// If no key is configured, every function falls back to simple local heuristics
// so the app keeps working (demo mode).

const API_KEY = process.env.AI_API_KEY;
const BASE_URL = (process.env.AI_API_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

export const isAIConfigured = () => Boolean(API_KEY);
export const aiStatus = () => ({ configured: isAIConfigured(), model: MODEL, baseUrl: BASE_URL });

// ---- Low-level call to an OpenAI-compatible chat completions endpoint ----
async function callLLM(systemPrompt, userPrompt) {
  const doFetch = (useJsonFormat) =>
    fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        // Some OpenAI-compatible providers don't support JSON mode — we retry without it below.
        ...(useJsonFormat ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: AbortSignal.timeout(30000), // never hang forever on a slow provider
    });

  let res = await doFetch(true);
  if (!res.ok) res = await doFetch(false); // fallback for providers without json_object support
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI API error ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');
  return content;
}

// ---- Helpers -----------------------------------------------------------
function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        /* fall through */
      }
    }
    return null;
  }
}

const HIGH_KW = ['urgent', 'asap', 'deadline', 'important', 'exam', 'today', 'tomorrow', 'critical', 'submit', 'interview', 'final', 'due'];
const LOW_KW = ['maybe', 'someday', 'when free', 'eventually', 'optional'];
const CATEGORY_KW = {
  Study: ['study', 'exam', 'homework', 'assignment', 'course', 'learn', 'read book', 'lecture', 'class', 'revision', 'math'],
  Work: ['work', 'meeting', 'client', 'report', 'email', 'project', 'presentation', 'deadline', 'boss', 'office'],
  Health: ['gym', 'workout', 'doctor', 'health', 'exercise', 'run', 'medicine', 'dentist'],
};

// ---- 1) Suggest priority + category ------------------------------------
export async function suggestTaskMeta(title, description = '') {
  const text = `${title} ${description}`.toLowerCase();

  if (isAIConfigured()) {
    try {
      const content = await callLLM(
        'You are a task management assistant. Reply with ONLY valid JSON.',
        `Analyze this task and suggest a priority and category.
Task title: "${title}"
Task description: "${description}"
Respond as JSON: {"priority": "Low|Medium|High", "category": "Study|Work|Personal|Health|Other", "reason": "one short sentence"}`
      );
      const parsed = safeJson(content);
      if (parsed && ['Low', 'Medium', 'High'].includes(parsed.priority)) {
        return {
          priority: parsed.priority,
          category: ['Study', 'Work', 'Personal', 'Health', 'Other'].includes(parsed.category) ? parsed.category : 'Personal',
          reason: typeof parsed.reason === 'string' ? parsed.reason : 'Suggested by AI.',
          aiPowered: true,
        };
      }
    } catch (err) {
      console.error('AI suggest failed, using fallback:', err.message);
    }
  }

  // Fallback heuristics
  let priority = 'Medium';
  let reason = 'Looks like a normal task, so Medium priority.';
  if (HIGH_KW.some((k) => text.includes(k))) {
    priority = 'High';
    reason = 'Contains urgent/deadline-related words, so High priority.';
  } else if (LOW_KW.some((k) => text.includes(k))) {
    priority = 'Low';
    reason = 'Does not look time-sensitive, so Low priority.';
  }
  let category = 'Personal';
  for (const [cat, words] of Object.entries(CATEGORY_KW)) {
    if (words.some((k) => text.includes(k))) {
      category = cat;
      reason = `Looks like a ${cat} task. ${reason}`;
      break;
    }
  }
  return { priority, category, reason, aiPowered: false };
}

// ---- 2) Break a big task into subtasks ---------------------------------
export async function breakDownTask(title, description = '') {
  if (isAIConfigured()) {
    try {
      const content = await callLLM(
        'You are a task management assistant. Reply with ONLY valid JSON.',
        `Break this task into 4-7 small, actionable subtasks.
Task title: "${title}"
Task description: "${description}"
Respond as JSON: {"subtasks": ["step 1", "step 2", ...]}. Each subtask must be a short imperative sentence.`
      );
      const parsed = safeJson(content);
      if (parsed && Array.isArray(parsed.subtasks) && parsed.subtasks.length > 0) {
        return { subtasks: parsed.subtasks.map(String).slice(0, 8), aiPowered: true };
      }
    } catch (err) {
      console.error('AI breakdown failed, using fallback:', err.message);
    }
  }
  return {
    subtasks: [
      `Define the goal and requirements for "${title}"`,
      'Gather the resources, information, or materials needed',
      'Complete the first rough version or first part',
      'Review what is done and improve it',
      'Finalize, verify, and wrap up',
    ],
    aiPowered: false,
  };
}

// ---- 3) Generate a daily plan from pending tasks -----------------------
export async function dailyPlan(tasks) {
  const pending = tasks.filter((t) => !t.completed);
  if (pending.length === 0) {
    return { plan: '🎉 You have no pending tasks. Enjoy your free time!', aiPowered: isAIConfigured() };
  }
  const list = pending
    .map((t) => `- [${t.priority}] ${t.title} (${t.category}${t.due_date ? `, due ${t.due_date.replace('T', ' ')}` : ''})`)
    .join('\n');

  if (isAIConfigured()) {
    try {
      const content = await callLLM(
        'You are a friendly productivity coach. Reply with ONLY valid JSON.',
        `Here are my pending tasks:\n${list}\n\nCreate a simple daily plan: order the tasks sensibly (urgent/due-today first), group short tasks together, and keep it realistic. Respond as JSON: {"plan": "..."} where "plan" is markdown text with a short intro and a numbered schedule using rough time blocks.`
      );
      const parsed = safeJson(content);
      if (parsed && typeof parsed.plan === 'string') return { plan: parsed.plan, aiPowered: true };
    } catch (err) {
      console.error('AI daily plan failed, using fallback:', err.message);
    }
  }
  // Fallback: order High → Medium → Low, due-today first
  const today = new Date().toISOString().slice(0, 10);
  const rank = { High: 0, Medium: 1, Low: 2 };
  const ordered = [...pending].sort(
    (a, b) => (b.due_date?.slice(0, 10) === today) - (a.due_date?.slice(0, 10) === today) || rank[a.priority] - rank[b.priority]
  );
  const plan = `Here is a simple plan for today based on your ${pending.length} pending task(s):\n\n${ordered
    .map((t, i) => `${i + 1}. ${t.title} — ${t.priority} priority, ${t.category}${t.due_date ? `, due ${t.due_date.replace('T', ' ')}` : ''}`)
    .join('\n')}\n\nTip: start with the High-priority items first.`;
  return { plan, aiPowered: false };
}

// ---- 4) Ask AI assistant ------------------------------------------------
export async function askAI(question, tasks) {
  const q = question.toLowerCase();
  const pending = tasks.filter((t) => !t.completed);
  const context = tasks
    .map((t) => `- [${t.completed ? 'done' : 'pending'}] [${t.priority}] ${t.title} (${t.category}${t.due_date ? `, due ${t.due_date.replace('T', ' ')}` : ''})`)
    .join('\n');

  if (isAIConfigured()) {
    try {
      const content = await callLLM(
        'You are a helpful task management assistant inside a to-do app. Answer concisely and practically. Reply with ONLY valid JSON.',
        `My current tasks:\n${context || '(no tasks yet)'}\n\nMy question: "${question}"\n\nRespond as JSON: {"answer": "..."}. Reference my actual tasks when relevant. Keep it under 120 words.`
      );
      const parsed = safeJson(content);
      if (parsed && typeof parsed.answer === 'string') return { answer: parsed.answer, aiPowered: true };
    } catch (err) {
      console.error('AI ask failed, using fallback:', err.message);
    }
  }

  // Fallback heuristics
  let answer;
  if (pending.length === 0) {
    answer = 'You have no pending tasks right now. Add a task and I can help you plan around it!';
  } else if (q.includes('first') || q.includes('priority') || q.includes('work on')) {
    const top = dailyPlanOrder(pending)[0];
    answer = `Start with "${top.title}" — it is ${top.priority} priority${top.due_date ? ` and due ${top.due_date.replace('T', ' ')}` : ''}. Then move on to "${dailyPlanOrder(pending)[1]?.title ?? 'your next task'}".`;
  } else if (q.includes('today') || q.includes('plan')) {
    const { plan } = await dailyPlan(tasks);
    answer = plan;
  } else if (q.includes('break')) {
    answer = 'Open a task in the edit form and click "✨ Break into subtasks" — I will split it into small actionable steps for you.';
  } else {
    answer = `You have ${pending.length} pending task(s). ${pending.filter((t) => t.priority === 'High').length} of them are High priority. Ask me things like "What should I work on first?" or "Plan my tasks for today".`;
  }
  return { answer, aiPowered: false };

  function dailyPlanOrder(list) {
    const today = new Date().toISOString().slice(0, 10);
    const rank = { High: 0, Medium: 1, Low: 2 };
    return [...list].sort(
      (a, b) => (b.due_date?.slice(0, 10) === today) - (a.due_date?.slice(0, 10) === today) || rank[a.priority] - rank[b.priority]
    );
  }
}
