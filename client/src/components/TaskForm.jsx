import { useState } from 'react'
import { api, ai, PRIORITIES, CATEGORIES } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'

const EMPTY = { title: '', description: '', priority: 'Medium', category: 'Personal', due_date: '' }

const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-shadow focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-800 dark:focus:border-indigo-500'

const aiBtnCls =
  'rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1.5 text-[13px] font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-50 disabled:saturate-50'

export default function TaskForm({ task, onClose, onSaved }) {
  const toast = useToast()
  // TaskForm is only mounted while open, so initialize state directly from props.
  const [form, setForm] = useState(() =>
    task
      ? {
          title: task.title ?? '',
          description: task.description ?? '',
          priority: task.priority ?? 'Medium',
          category: task.category ?? 'Personal',
          due_date: task.due_date ?? '',
        }
      : EMPTY
  )
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(null) // 'suggest' | 'break'
  const [aiNote, setAiNote] = useState('')
  const [subtasks, setSubtasks] = useState(null)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  // ✨ AI: suggest priority + category based on the title/description
  async function handleSuggest() {
    if (!form.title.trim()) return toast.error('Enter a task title first, then ask AI.')
    setAiLoading('suggest')
    setAiNote('')
    try {
      const res = await ai.suggest(form.title, form.description)
      setForm((f) => ({ ...f, priority: res.priority, category: res.category }))
      setAiNote(`${res.aiPowered ? '🤖' : '💡'} ${res.reason}${res.aiPowered ? '' : ' (demo mode — add your AI_API_KEY for smarter suggestions)'}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAiLoading(null)
    }
  }

  // ✨ AI: break the task into smaller subtasks
  async function handleBreakDown() {
    if (!form.title.trim()) return toast.error('Enter a task title first, then ask AI.')
    setAiLoading('break')
    setSubtasks(null)
    try {
      const res = await ai.breakDown(form.title, form.description)
      setSubtasks(res.subtasks.map((title) => ({ title, checked: true })))
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAiLoading(null)
    }
  }

  async function addSelectedSubtasks() {
    const chosen = subtasks.filter((s) => s.checked)
    if (chosen.length === 0) return setSubtasks(null)
    setSaving(true)
    try {
      for (const s of chosen) {
        await api.createTask({ title: s.title, priority: form.priority, category: form.category, due_date: form.due_date || null })
      }
      toast.success(`Added ${chosen.length} subtask${chosen.length > 1 ? 's' : ''} ✨`)
      setSubtasks(null)
      onSaved()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, due_date: form.due_date || null }
      if (task) {
        await api.updateTask(task.id, payload)
        toast.success('Task updated ✅')
      } else {
        await api.createTask(payload)
        toast.success('Task created ✅')
      }
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        role="dialog"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200/60 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
              {task ? '✏️' : '＋'}
            </div>
            <h2 className="text-lg font-bold">{task ? 'Edit Task' : 'New Task'}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <label className="mb-3.5 block">
          <span className="mb-1.5 block text-[13px] font-semibold text-slate-600 dark:text-slate-300">Title *</span>
          <input className={inputCls} value={form.title} onChange={set('title')} maxLength={200} placeholder="e.g. Finish the history essay" required />
        </label>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-[13px] font-semibold text-slate-600 dark:text-slate-300">Description</span>
          <textarea className={inputCls} rows={3} value={form.description} onChange={set('description')} placeholder="Optional details…" />
        </label>

        {/* AI helper buttons */}
        <div className="mb-3.5 flex flex-wrap gap-2">
          <button type="button" onClick={handleSuggest} disabled={!!aiLoading} className={aiBtnCls}>
            {aiLoading === 'suggest' ? '⏳ Thinking…' : '✨ Suggest priority & category'}
          </button>
          <button type="button" onClick={handleBreakDown} disabled={!!aiLoading} className={aiBtnCls}>
            {aiLoading === 'break' ? '⏳ Thinking…' : '✨ Break into subtasks'}
          </button>
        </div>

        {aiNote && (
          <p className="mb-3.5 rounded-xl bg-violet-50 px-3.5 py-2.5 text-xs text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30">
            {aiNote}
          </p>
        )}

        {subtasks && (
          <div className="mb-3.5 rounded-xl border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-500/30 dark:bg-violet-500/5">
            <p className="mb-2 text-sm font-semibold">✨ Suggested subtasks</p>
            {subtasks.map((s, i) => (
              <label key={i} className="flex items-start gap-2.5 py-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={s.checked}
                  className="mt-0.5 h-4 w-4 accent-indigo-600"
                  onChange={() => setSubtasks((st) => st.map((x, j) => (j === i ? { ...x, checked: !x.checked } : x)))}
                />
                {s.title}
              </label>
            ))}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={addSelectedSubtasks}
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Add selected as tasks
              </button>
              <button
                type="button"
                onClick={() => setSubtasks(null)}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="mb-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-slate-600 dark:text-slate-300">Priority</span>
            <select className={inputCls} value={form.priority} onChange={set('priority')}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-slate-600 dark:text-slate-300">Category</span>
            <select className={inputCls} value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        </div>

        <label className="mb-6 block">
          <span className="mb-1.5 block text-[13px] font-semibold text-slate-600 dark:text-slate-300">Due date &amp; time</span>
          <input type="datetime-local" className={`${inputCls} dark:[color-scheme:dark]`} value={form.due_date} onChange={set('due_date')} />
        </label>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-md disabled:opacity-50"
          >
            {saving ? 'Saving…' : task ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </div>
  )
}
