import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import TaskList from '../components/TaskList.jsx'
import PageHeader from '../components/PageHeader.jsx'

export default function Today() {
  const { openForm, savedStamp } = useOutletContext()
  const toast = useToast()
  const [today, setToday] = useState([])
  const [overdue, setOverdue] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [t, o] = await Promise.all([api.getTasks({ filter: 'today' }), api.getTasks({ filter: 'overdue' })])
      setToday(t)
      setOverdue(o)
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

  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader icon="📅" title="Today" subtitle={todayLabel} />

      {overdue.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3.5 flex items-center gap-2 text-lg font-bold text-rose-600 dark:text-rose-400">
            ⚠ Overdue
            <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold ring-1 ring-rose-200 dark:bg-rose-500/10 dark:ring-rose-500/30">
              {overdue.length}
            </span>
          </h2>
          <TaskList tasks={overdue} loading={loading} emptyMessage="" onToggle={onToggle} onEdit={openForm} onDelete={onDelete} />
        </section>
      )}

      <section>
        <h2 className="mb-3.5 flex items-center gap-2 text-lg font-bold">
          Due today
          {today.length > 0 && (
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              {today.length}
            </span>
          )}
        </h2>
        <TaskList tasks={today} loading={loading} emptyMessage="Nothing due today. Add a task with today's due date!"
          onToggle={onToggle} onEdit={openForm} onDelete={onDelete} />
      </section>
    </div>
  )
}
