import Link from "next/link"
import * as ui from "../../styles/ui"

const overviewStats = [
  { label: "Total analogies", value: "48", change: "+6 this semester" },
  { label: "Avg quiz score", value: "74%", change: "+4% vs last semester" },
  { label: "Completion + accuracy", value: "68%", change: "Stable" },
  { label: "Avg revisits / analogy", value: "2.3", change: "+0.5 this semester" },
]

const topAnalogies = [
  { title: "Database Indexing Explained", type: "Written", views: 142, revisits: 58, uplift: "+11%" },
  { title: "Microservices Traffic Analogy", type: "Image", views: 121, revisits: 47, uplift: "+9%" },
  { title: "Docker Kitchen Workflow", type: "Video", views: 97, revisits: 32, uplift: "+7%" },
]

const leaderboard = [
  { name: "Aisling Murphy", score: 92, consistency: "High" },
  { name: "Conor Walsh", score: 88, consistency: "High" },
  { name: "Niamh O'Brien", score: 86, consistency: "Medium" },
]

const atRisk = [
  { name: "Liam Byrne", tier: "High", reason: "Low completion + low accuracy" },
  { name: "Emma Doyle", tier: "Medium", reason: "Low interaction consistency" },
  { name: "Sean Kelly", tier: "Medium", reason: "Declining quiz performance" },
]

const interactionCorrelation = [
  { x: 20, y: 38 },
  { x: 28, y: 44 },
  { x: 40, y: 57 },
  { x: 52, y: 65 },
  { x: 60, y: 73 },
  { x: 74, y: 81 },
  { x: 82, y: 88 },
]

export default function LecturerStatisticsPage() {
  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <h1 className="text-lg font-semibold">Statistics Dashboard</h1>
            <p className={ui.textSmall}>Track analogy performance and student engagement trends.</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/lecturer" className={ui.buttonSecondary}>
              Back to dashboard
            </Link>
            <button type="button" className={ui.buttonPrimary}>
              Export CSV
            </button>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className={`${ui.cardFull} grid gap-3 md:grid-cols-2 lg:grid-cols-4`}>
            <div className="space-y-1 text-sm">
              <label className="text-xs uppercase tracking-wide text-slate-400">Academic year</label>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
                <option>2025/26</option>
                <option>2024/25</option>
              </select>
            </div>
            <div className="space-y-1 text-sm">
              <label className="text-xs uppercase tracking-wide text-slate-400">Semester</label>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
                <option>Semester 2 (Current)</option>
                <option>Semester 1</option>
              </select>
            </div>
            <div className="space-y-1 text-sm">
              <label className="text-xs uppercase tracking-wide text-slate-400">Module</label>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
                <option>All modules</option>
                <option>CSC7058</option>
                <option>CSC7082</option>
              </select>
            </div>
            <div className="space-y-1 text-sm">
              <label className="text-xs uppercase tracking-wide text-slate-400">Analogy type</label>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
                <option>All types</option>
                <option>Written</option>
                <option>Image</option>
                <option>Video</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 text-sm">
            {overviewStats.map((stat) => (
              <div key={stat.label} className={`${ui.card} p-4`}>
                <p className={`${ui.textLabel} mb-1`}>{stat.label}</p>
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.change}</p>
                <div className="mt-3 h-1.5 rounded-full bg-slate-800">
                  <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: "65%" }} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className={ui.cardFull}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={ui.cardHeader}>Analogy insights</h2>
                <button type="button" className={ui.buttonSmall}>Export CSV</button>
              </div>
              <div className="space-y-3">
                {topAnalogies.map((item, index) => (
                  <div key={item.title} className={ui.cardInner}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-slate-400">
                          {item.type} · Views: {item.views} · Revisits: {item.revisits}
                        </p>
                      </div>
                      <span className="text-xs rounded-full bg-emerald-900/50 text-emerald-200 px-2 py-1">
                        {item.uplift}
                      </span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-800">
                      <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${82 - index * 12}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={ui.cardFull}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={ui.cardHeader}>Analogy type performance</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className={ui.cardInner}>
                  <p className="text-xs text-slate-400 mb-2">Written</p>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div className="h-2 rounded-full bg-indigo-500" style={{ width: "76%" }} />
                  </div>
                </div>
                <div className={ui.cardInner}>
                  <p className="text-xs text-slate-400 mb-2">Image</p>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div className="h-2 rounded-full bg-indigo-400" style={{ width: "68%" }} />
                  </div>
                </div>
                <div className={ui.cardInner}>
                  <p className="text-xs text-slate-400 mb-2">Video</p>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div className="h-2 rounded-full bg-indigo-300" style={{ width: "61%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className={ui.cardFull}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={ui.cardHeader}>Student insights</h2>
                <button type="button" className={ui.buttonSmall}>Export CSV</button>
              </div>

              <h3 className="text-sm font-semibold mb-2 text-slate-100">Top performers (completion + accuracy)</h3>
              <div className="space-y-2 mb-5">
                {leaderboard.map((student, index) => (
                  <div key={student.name} className={`${ui.cardInner} flex items-center justify-between`}>
                    <div>
                      <p className="font-medium">#{index + 1} {student.name}</p>
                      <p className="text-xs text-slate-400">Consistency: {student.consistency}</p>
                    </div>
                    <span className="text-sm font-semibold">{student.score}%</span>
                  </div>
                ))}
              </div>

              <h3 className="text-sm font-semibold mb-2 text-slate-100">At-risk indicators</h3>
              <div className="space-y-2">
                {atRisk.map((student) => (
                  <div key={student.name} className={`${ui.cardInner} flex items-center justify-between gap-3`}>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-xs text-slate-400">{student.reason}</p>
                    </div>
                    <span className={`text-xs rounded-full px-2 py-1 ${
                      student.tier === "High"
                        ? "bg-red-900/50 text-red-200"
                        : "bg-amber-900/50 text-amber-200"
                    }`}>
                      {student.tier}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className={ui.cardFull}>
              <h2 className={ui.cardHeader}>Correlation: interaction vs quiz performance</h2>
              <p className="text-xs text-slate-400 mb-3">
                Mock scatter preview. X-axis = interaction score, Y-axis = quiz performance.
              </p>
              <div className="relative h-72 rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden">
                <div className="absolute inset-0">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-slate-800" />
                  <div className="absolute inset-x-0 top-1/2 h-px bg-slate-800" />
                </div>
                {interactionCorrelation.map((point, index) => (
                  <span
                    key={`${point.x}-${point.y}-${index}`}
                    className="absolute h-3 w-3 rounded-full bg-indigo-400 ring-2 ring-indigo-900/70"
                    style={{ left: `${point.x}%`, bottom: `${point.y}%` }}
                  />
                ))}
              </div>
              <div className="mt-3 text-xs text-slate-400">
                Exam-result correlation is disabled for now and will be added later.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
