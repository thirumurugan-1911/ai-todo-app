const PRIORITY = {
  High: {
    bar: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-600 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/30',
  },
  Medium: {
    bar: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-600 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30',
  },
  Low: {
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-600 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30',
  },
}

const CATEGORY_ICON = { Study: '📚', Work: '💼', Personal: '🏠', Health: '❤️', Other: '📌' }

function formatDue(due) {
  const d = new Date(due)
  if (Number.isNaN(d.getTime())) return due
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const overdue = task.due_date && !task.completed && new Date(task.due_date) < new Date()
  const p = PRIORITY[task.priority] ?? PRIORITY.Medium

  return (
    <div
      className={`group relative flex items-start gap-3 overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-slate-900 sm:gap-4 sm:p-5 ${
        overdue ? 'border-rose-300 dark:border-rose-500/40' : 'border-slate-200/70 dark:border-slate-800'
      } ${task.completed ? 'opacity-60' : ''}`}
    >
      {/* Priority accent strip */}
      <span className={`absolute inset-y-0 left-0 w-1 ${p.bar}`} />

      {/* Checkbox with larger hit area */}
      <label className="-m-1 mt-0.5 grid h-7 w-7 shrink-0 cursor-pointer place-items-center">
        <input
          type="checkbox"
          checked={!!task.completed}
          onChange={() => onToggle(task)}
          className="h-5 w-5 cursor-pointer accent-indigo-600"
          aria-label="Toggle complete"
        />
      </label>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className={`text-[15px] font-semibold leading-snug ${task.completed ? 'line-through' : ''}`}>{task.title}</p>
        {task.description && (
          <p className="mt-1 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{task.description}</p>
        )}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
          <span className={`rounded-md px-2 py-0.5 font-medium ring-1 ${p.badge}`}>{task.priority}</span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
            {CATEGORY_ICON[task.category] ?? '📌'} {task.category}
          </span>
          {task.due_date && (
            <span
              className={`rounded-md px-2 py-0.5 font-medium ring-1 ${
                overdue
                  ? 'bg-rose-50 text-rose-600 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/30'
                  : 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700'
              }`}
            >
              {overdue ? '⚠ Overdue · ' : '📅 '}
              {formatDue(task.due_date)}
            </span>
          )}
        </div>
      </div>

      {/* Actions — always visible on touch, hover-reveal on desktop */}
      <div className="flex shrink-0 gap-1 opacity-100 transition-opacity lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
        <button
          onClick={() => onEdit(task)}
          className="grid h-8 w-8 place-items-center rounded-lg text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Edit task"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(task)}
          className="grid h-8 w-8 place-items-center rounded-lg text-sm text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
          aria-label="Delete task"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
