import Link from "next/link"

export default function LecturerDashboard() {
  // Mock data for now 
  const taughtModules = [
    {
      code: "CSC7058",
      name: "Software Development Project",
      students: 24,
      analogies: 12,
    },
    {
      code: "CSC7084",
      name: "Web Development",
      students: 32,
      analogies: 18,
    },
  ]

  const recentUploads = [
    {
      id: 1,
      module: "CSC7058",
      title: "Microservices vs Monolith",
      createdAt: "2025-11-24",
    },
    {
      id: 2,
      module: "CSC7084",
      title: "HTTP Requests as Sending Letters",
      createdAt: "2025-11-22",
    },
  ]

  const pendingQuizzes = [
    {
      id: 1,
      module: "CSC7084",
      title: "CSS Layout Analogies",
      status: "Draft",
    },
    {
      id: 2,
      module: "CSC7058",
      title: "Docker & Containers",
      status: "Needs questions",
    },
  ]

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">
              Lecturer Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-slate-300">
              Signed in as <span className="font-medium">Lecturer User</span>
            </span>
            <Link
              href="/"
              className="rounded-lg border border-slate-600 px-3 py-1.5 hover:border-indigo-400 hover:text-indigo-200 transition"
            >
              Log out
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <section className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          {/* Intro cards */}
          <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
              <h2 className="text-xl font-semibold mb-2">
                Welcome back, Lecturer 👋
              </h2>
              <p className="text-sm text-slate-300 mb-3">
                Create and manage analogies for your modules, set quizzes, and
                review how students are engaging with the material.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 text-sm">
              <h3 className="text-base font-semibold">Quick Overview</h3>
              <ul className="space-y-1 text-slate-300">
                <li>• You teach {taughtModules.length} modules</li>
                <li>• {recentUploads.length} recent analogy uploads</li>
                <li>• {pendingQuizzes.length} quizzes in progress</li>
              </ul>
            </div>
          </div>

          {/* Main grid: modules + side panels */}
          <div className="grid gap-6 lg:grid-cols-[2fr,1.5fr]">
            {/* Modules you teach */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">Modules you teach</h3>
              </div>

              <div className="space-y-3 text-sm">
                {taughtModules.map((mod) => (
                  <div
                    key={mod.code}
                    className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <p className="font-medium">
                          {mod.code} · {mod.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {mod.students} students · {mod.analogies} analogies
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link href="/lecturer/analogies">
                            <button
                                type="button"
                                className="text-xs rounded-lg bg-indigo-500 px-3 py-1 font-medium hover:bg-indigo-400 transition"
                            >
                                Manage Analogies
                            </button>
                        </Link>
                        <button className="text-xs rounded-lg border border-indigo-400 px-3 py-1 hover:bg-indigo-500 hover:text-white transition">
                          Create quiz
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column: uploads + quizzes */}
            <div className="space-y-6">
              {/* Recent analogy uploads */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-base font-semibold mb-3">
                  Recent analogy uploads
                </h3>
                {recentUploads.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    You haven&apos;t created any analogies yet.
                  </p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {recentUploads.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2"
                      >
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-slate-400">
                          Module: {item.module} · Created: {item.createdAt}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Quizzes in progress */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-base font-semibold mb-3">
                  Quizzes in progress
                </h3>
                {pendingQuizzes.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    No quizzes in draft state.
                  </p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {pendingQuizzes.map((quiz) => (
                      <li
                        key={quiz.id}
                        className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2"
                      >
                        <div>
                          <p className="font-medium">{quiz.title}</p>
                          <p className="text-xs text-slate-400">
                            Module: {quiz.module} · Status: {quiz.status}
                          </p>
                        </div>
                        <button className="text-xs rounded-lg border border-slate-600 px-3 py-1 hover:border-indigo-400 hover:text-indigo-200 transition">
                          Continue
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
