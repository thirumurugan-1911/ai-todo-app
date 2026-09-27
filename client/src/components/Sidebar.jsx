import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', icon: '📊', label: 'Dashboard' },
  { to: '/tasks', icon: '📝', label: 'All Tasks' },
  { to: '/today', icon: '📅', label: 'Today' },
  { to: '/completed', icon: '✅', label: 'Completed' },
  { to: '/planner', icon: '✨', label: 'AI Planner' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
]

export default function Sidebar({ onNavigate }) {
  return (
    <aside className="fixed inset-y-0 left-0 flex h-full w-64 flex-col border-r border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 pb-8 pt-6">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white shadow-lg shadow-indigo-500/30">
          ✓
        </div>
        <div>
          <p className="font-bold leading-tight">AI To-Do</p>
          <p className="text-xs text-slate-400">Smart task manager</p>
        </div>
      </div>

      {/* Navigation */}
      <p className="px-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Menu</p>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="text-base">{l.icon}</span>
                <span className="flex-1">{l.label}</span>
                {isActive && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* AI promo card */}
      <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-4 text-white shadow-lg shadow-indigo-600/20">
        <p className="text-sm font-semibold">✨ AI Planner</p>
        <p className="mt-1 text-xs text-indigo-100">Get a smart plan for your day.</p>
        <NavLink
          to="/planner"
          onClick={onNavigate}
          className="mt-3 inline-block rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/25"
        >
          Open planner →
        </NavLink>
      </div>
    </aside>
  )
}
