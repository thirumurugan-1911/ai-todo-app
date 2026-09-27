export default function StatsCard({ icon, label, value, color = 'indigo' }) {
  const gradients = {
    indigo: 'from-indigo-500 to-violet-500 shadow-indigo-500/25',
    amber: 'from-amber-500 to-orange-500 shadow-amber-500/25',
    emerald: 'from-emerald-500 to-teal-500 shadow-emerald-500/25',
    red: 'from-rose-500 to-red-500 shadow-rose-500/25',
  }
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:gap-4 sm:p-5">
      <div
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-xl text-white shadow-lg sm:h-12 sm:w-12 ${gradients[color]}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xl font-extrabold leading-none tracking-tight sm:text-2xl">{value}</p>
        <p className="mt-1.5 truncate text-[13px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  )
}
