import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import TaskForm from './TaskForm.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

export default function Layout() {
  const { dark, toggle } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [savedStamp, setSavedStamp] = useState(0) // pages reload when this changes

  const openForm = (task = null) => {
    setEditingTask(task)
    setFormOpen(true)
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile / tablet drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 shadow-2xl">
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
            <button
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-2 lg:hidden">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">✓</div>
              <span className="font-bold">AI To-Do</span>
            </div>

            <div className="flex-1" />

            <button
              onClick={toggle}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Toggle dark mode"
            >
              {dark ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => openForm()}
              className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-md sm:inline-flex"
            >
              <span className="leading-none">＋</span> New Task
            </button>
          </div>
        </header>

        {/* Extra bottom padding on small screens so the floating + button never covers content */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 pb-24 sm:px-6 sm:pb-10">
          <Outlet context={{ openForm, savedStamp }} />
        </main>
      </div>

      {/* Floating action button (mobile only) */}
      <button
        onClick={() => openForm()}
        aria-label="Add task"
        className="fixed bottom-6 right-6 z-30 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-2xl text-white shadow-lg shadow-indigo-600/30 sm:hidden"
      >
        ＋
      </button>

      {formOpen && (
        <TaskForm
          task={editingTask}
          onClose={() => setFormOpen(false)}
          onSaved={() => setSavedStamp((s) => s + 1)}
        />
      )}
    </div>
  )
}
