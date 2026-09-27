import { useEffect, useState } from 'react'
import { ai } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import PageHeader from '../components/PageHeader.jsx'

const SUGGESTIONS = ['Plan my tasks for today', 'What should I work on first?', 'How should I organize my work?']

const card = 'rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6'

export default function AIPlanner() {
  const toast = useToast()
  const [status, setStatus] = useState(null)

  const [plan, setPlan] = useState('')
  const [planLoading, setPlanLoading] = useState(false)

  const [question, setQuestion] = useState('')
  const [chat, setChat] = useState([])
  const [askLoading, setAskLoading] = useState(false)

  useEffect(() => {
    ai.status().then(setStatus).catch(() => setStatus(null))
  }, [])

  async function generatePlan() {
    setPlanLoading(true)
    try {
      const res = await ai.dailyPlan()
      setPlan(res.plan)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPlanLoading(false)
    }
  }

  async function ask(q = question) {
    if (!q.trim()) return
    setAskLoading(true)
    setChat((c) => [...c, { q, a: null }])
    setQuestion('')
    try {
      const res = await ai.ask(q)
      setChat((c) => c.map((m, i) => (i === c.length - 1 ? { ...m, a: res.answer } : m)))
    } catch (err) {
      toast.error(err.message)
      setChat((c) => c.slice(0, -1))
    } finally {
      setAskLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        icon="✨"
        title="AI Planner"
        subtitle="Your smart assistant for planning and prioritizing."
        action={
          status && (
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                status.configured
                  ? 'bg-emerald-50 text-emerald-600 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30'
                  : 'bg-amber-50 text-amber-600 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30'
              }`}
            >
              {status.configured ? `🤖 AI connected · ${status.model}` : '💡 Demo mode — set AI_API_KEY for real AI'}
            </span>
          )
        }
      />

      {/* Daily plan */}
      <section className={card}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg text-white shadow-lg shadow-indigo-500/25">
              🗓️
            </div>
            <div>
              <h2 className="font-bold">Daily plan</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">A realistic schedule from your pending tasks</p>
            </div>
          </div>
          <button
            onClick={generatePlan}
            disabled={planLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-md disabled:opacity-50"
          >
            {planLoading ? '⏳ Generating…' : '✨ Generate my plan'}
          </button>
        </div>
        {plan ? (
          <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 font-sans text-sm leading-relaxed ring-1 ring-slate-200/70 dark:bg-slate-800/60 dark:ring-slate-700/60">
            {plan}
          </pre>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400 dark:border-slate-700">
            I'll order urgent and due-today tasks first, then group the rest sensibly.
          </p>
        )}
      </section>

      {/* Ask AI */}
      <section className={card}>
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-lg text-white shadow-lg shadow-violet-500/25">
            💬
          </div>
          <div>
            <h2 className="font-bold">Ask AI</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Chat about your tasks in plain language</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              disabled={askLoading}
              className="rounded-full border border-slate-300 px-3.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mb-4 space-y-3">
          {chat.map((m, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-md bg-indigo-600 px-4 py-2.5 text-sm text-white shadow-sm">
                  {m.q}
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xs text-white">✨</div>
                <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-md bg-slate-100 px-4 py-2.5 text-sm leading-relaxed ring-1 ring-slate-200/60 dark:bg-slate-800 dark:ring-slate-700/60">
                  {m.a ?? (
                    <span className="inline-flex items-center gap-2 text-slate-400">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
                      Thinking…
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
          {chat.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400 dark:border-slate-700">
              Try: "Plan my tasks for today" · "What should I work on first?" · "Break this project into smaller tasks."
            </p>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); ask() }} className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about your tasks…"
            className="h-11 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition-shadow focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-800"
          />
          <button
            type="submit"
            disabled={askLoading}
            className="h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-md disabled:opacity-50"
          >
            {askLoading ? '⏳' : 'Ask'}
          </button>
        </form>
      </section>
    </div>
  )
}
