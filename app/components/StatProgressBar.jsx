export default function StatProgressBar({ label, value, total, hint, colorClass = "bg-indigo-500" }) {
  const safeTotal = Math.max(total || 0, 0)
  const safeValue = Math.max(value || 0, 0)
  const percent = safeTotal > 0 ? Math.round((safeValue / safeTotal) * 100) : 0

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/80 px-3 py-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-300">{label}</p>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-100">{safeValue}</p>
          <p className="text-[11px] text-slate-400">{percent}%</p>
        </div>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-800/90">
        <div className={`h-full rounded-full transition-all ${colorClass}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-400">{hint || `${percent}% of total`}</p>
    </div>
  )
}
