import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import StatsCard from '../components/StatsCard.jsx'
import TaskList from '../components/TaskList.jsx'
import PageHeader from '../components/PageHeader.jsx'

export default function Dashboard() {
  const { openForm, savedStamp } = useOutletContext()
  const toast = useToast()
  const [stats, setStats] = useState(null)
  const [todayTasks, setTodayTasks] = useState([])
  const [highTasks, setHighTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [s, today, high] = await Promise.all([
        api.getStats(),
        api.getTasks({ filter: 'today' }),
        api.getTasks({ filter: 'high' }),
      ])
      setStats(s)
      setTodayTasks(today)
      setHighTasks(high)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load, savedStamp])

  const onToggle = async (task) => { try { await api.toggleComplete(task.id); load() } catch (e) { toast.error(e.message) } }
  const onDelete = async (task) => {
    if (!confirm(`Delete "${task.title}"?`)) return
    try { await api.deleteTask(task.id); toast.success('Task deleted'); load() } catch (e) { toast.error(e.message) }
  }

  const pct = stats && stats.total ? Math.round((stats.completed / stats.total) * 100) : 0
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader icon="📊" title="Dashboard" subtitle={`${todayLabel} — here's your day at a glance.`} />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatsCard icon="📅" label="Due today" value={stats?.dueToday ?? '–'} color="indigo" />
        <StatsCard icon="⏳" label="Pending" value={stats?.pending ?? '–'} color="amber" />
        <StatsCard icon="✅" label="Completed" value={stats?.completed ?? '–'} color="emerald" />
        <StatsCard icon="🔥" label="High priority" value={stats?.highPending ?? '–'} color="red" />
      </div>

      {/* Overall progress */}
      {stats && (
        <div className="mb-8 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Overall completion</p>
            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{pct}%</p>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          {stats.overdue > 0 && (
            <p className="mt-2.5 text-xs font-medium text-rose-600 dark:text-rose-400">
              ⚠ {stats.overdue} task{stats.overdue > 1 ? 's are' : ' is'} overdue — check the Today page.
            </p>
          )}
        </div>
      )}

      <section className="mb-8">
        <h2 className="mb-3.5 flex items-center gap-2 text-lg font-bold">
          Today's tasks
          {todayTasks.length > 0 && (
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              {todayTasks.length}
            </span>
          )}
        </h2>
        <TaskList tasks={todayTasks} loading={loading} emptyMessage="Nothing due today — enjoy! 🎉"
          onToggle={onToggle} onEdit={openForm} onDelete={onDelete} />
      </section>

      <section>
        <h2 className="mb-3.5 flex items-center gap-2 text-lg font-bold">
          High priority
          {highTasks.length > 0 && (
            <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              {highTasks.length}
            </span>
          )}
        </h2>
        <TaskList tasks={highTasks} loading={loading} emptyMessage="No high-priority tasks pending. Nice!"
          onToggle={onToggle} onEdit={openForm} onDelete={onDelete} />
      </section>
    </div>
  )
}
