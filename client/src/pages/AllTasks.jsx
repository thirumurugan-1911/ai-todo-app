import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api, PRIORITIES, CATEGORIES } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import TaskList from '../components/TaskList.jsx'
import PageHeader from '../components/PageHeader.jsx'

export default function AllTasks() {
  const { openForm, savedStamp } = useOutletContext()
  const toast = useToast()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ filter: 'all', category: '', priority: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { ...filters }
      if (search.trim()) params.search = search.trim()
      Object.keys(params).forEach((k) => !params[k] && delete params[k])
      setTasks(await api.getTasks(params))
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, filters]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load, savedStamp])

  const onToggle = async (task) => { try { await api.toggleComplete(task.id); load() } catch (e) { toast.error(e.message) } }
  const onDelete = async (task) => {
    if (!confirm(`Delete "${task.title}"?`)) return
    try { await api.deleteTask(task.id); toast.success('Task deleted'); load() } catch (e) { toast.error(e.message) }
  }

  const selectCls =
    'h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition-shadow focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-800'

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader icon="📝" title="All Tasks" subtitle="Search, filter, and manage everything in one place." />

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200/70 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative min-w-40 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">🔍</span>
          <input
            type="search"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition-shadow focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <select className={selectCls} value={filters.filter} onChange={(e) => setFilters((f) => ({ ...f, filter: e.target.value }))}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="today">Due today</option>
          <option value="overdue">Overdue</option>
          <option value="high">High priority</option>
        </select>
        <select className={selectCls} value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className={selectCls} value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>

      <TaskList tasks={tasks} loading={loading} emptyMessage="No tasks match your filters."
        onToggle={onToggle} onEdit={openForm} onDelete={onDelete} />
    </div>
  )
}
