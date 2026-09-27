import TaskCard from './TaskCard.jsx'

export default function TaskList({ tasks, loading, emptyMessage, onToggle, onEdit, onDelete }) {
  if (loading) {
    // Skeleton placeholders while tasks load
    return (
      <div className="space-y-3" aria-label="Loading tasks">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-slate-200/70 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-3 h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-800" />
            <div className="mt-4 flex gap-2">
              <div className="h-5 w-14 rounded-md bg-slate-100 dark:bg-slate-800" />
              <div className="h-5 w-20 rounded-md bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    )
  }
  if (tasks.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-400 dark:border-slate-700">
        {emptyMessage}
      </p>
    )
  }
  return (
    <div className="space-y-3">
      {tasks.map((t) => (
        <TaskCard key={t.id} task={t} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  )
}
