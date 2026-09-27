import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import TaskList from '../components/TaskList.jsx'
import PageHeader from '../components/PageHeader.jsx'

export default function Completed() {
  const { openForm, savedStamp } = useOutletContext()
  const toast = useToast()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setTasks(await api.getTasks({ filter: 'completed' }))
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

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        icon="✅"
        title="Completed"
        subtitle="Everything you've finished — great work!"
        action={
          tasks.length > 0 && (
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30">
              {tasks.length} done 🎉
            </span>
          )
        }
      />
      <TaskList tasks={tasks} loading={loading} emptyMessage="No completed tasks yet. Finish something and check it off!"
        onToggle={onToggle} onEdit={openForm} onDelete={onDelete} />
    </div>
  )
}
