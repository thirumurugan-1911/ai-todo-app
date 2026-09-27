import { useEffect, useState } from 'react'
import { api, ai } from '../api/client.js'
import { useTheme } from '../context/ThemeContext.jsx'
import PageHeader from '../components/PageHeader.jsx'

const card = 'rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6'

function SectionTitle({ icon, title, subtitle }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 ring-1 ring-slate-200/70 dark:bg-slate-800 dark:ring-slate-700">
        {icon}
      </div>
      <div>
        <h2 className="font-bold">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
    </div>
  )
}

export default function Settings() {
  const { dark, setDark } = useTheme()
  const [status, setStatus] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    ai.status().then(setStatus).catch(() => setStatus(null))
    api.getStats().then(setStats).catch(() => setStats(null))
  }, [])

  const themeBtn = (active) =>
    `flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
      active
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
    }`

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader icon="⚙️" title="Settings" subtitle="Customize how the app looks and works." />

      <section className={card}>
        <SectionTitle icon="🎨" title="Appearance" subtitle="Switch between light and dark mode" />
        <div className="flex gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
          <button onClick={() => setDark(false)} className={themeBtn(!dark)}>☀️ Light</button>
          <button onClick={() => setDark(true)} className={themeBtn(dark)}>🌙 Dark</button>
        </div>
      </section>

      <section className={card}>
        <SectionTitle icon="🤖" title="AI connection" subtitle="Powers suggestions, breakdowns, and planning" />
        {status ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${status.configured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {status.configured
                ? <span className="font-semibold text-emerald-600 dark:text-emerald-400">Connected</span>
                : <span className="font-semibold text-amber-600 dark:text-amber-400">Demo mode (no API key)</span>}
            </div>
            <p className="text-slate-500 dark:text-slate-400">Model: <span className="font-mono text-[13px]">{status.model}</span></p>
            {!status.configured && (
              <div className="mt-2 rounded-xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
                To enable real AI, add your key to <code className="font-mono font-semibold">server/.env</code>:<br />
                <code className="font-mono font-semibold">AI_API_KEY=your-key-here</code><br />
                then restart the server. The key stays on the backend and is never sent to the browser.
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Could not reach the server.</p>
        )}
      </section>

      <section className={card}>
        <SectionTitle icon="🗄️" title="Your data" subtitle="Stored locally in SQLite (server/todo.db)" />
        {stats && (
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Total', value: stats.total, color: 'text-indigo-600 dark:text-indigo-400' },
              { label: 'Pending', value: stats.pending, color: 'text-amber-600 dark:text-amber-400' },
              { label: 'Completed', value: stats.completed, color: 'text-emerald-600 dark:text-emerald-400' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/60 dark:bg-slate-800/60 dark:ring-slate-700/60">
                <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={card}>
        <SectionTitle icon="ℹ️" title="About" />
        <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          AI To-Do — a simple task manager with AI-powered priority suggestions, task breakdown, and daily planning.
          Built with React, Express, and SQLite.
        </p>
      </section>
    </div>
  )
}
