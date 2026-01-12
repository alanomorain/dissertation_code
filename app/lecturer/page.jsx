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
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/50 animate-fade-in">
        <div className="mx-auto max-w-6xl px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Lecturer Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-slate-300">
              Signed in as <span className="font-semibold text-indigo-300">Lecturer User</span>
            </span>
            <Link
              href="/"
              className="rounded-xl border-2 border-slate-600 px-4 py-2 hover:border-indigo-400 hover:bg-slate-800 hover:text-indigo-200 transition-all duration-200"
            >
              Log out
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <section className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
          {/* Intro cards */}
          <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
            <div className="glass border border-slate-700/50 rounded-3xl p-6 shadow-xl animate-scale-in">
              <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Welcome back, Lecturer 👋
              </h2>
              <p className="text-base text-slate-300 leading-relaxed">
                Create and manage analogies for your modules, set quizzes, and
                review how students are engaging with the material.
              </p>
            </div>

            <div className="glass border border-slate-700/50 rounded-3xl p-6 shadow-xl animate-scale-in animate-delay-100">
              <h3 className="text-lg font-bold mb-3 text-indigo-300">Quick Overview</h3>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-indigo-400">●</span> You teach {taughtModules.length} modules
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">●</span> {recentUploads.length} recent analogy uploads
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-pink-400">●</span> {pendingQuizzes.length} quizzes in progress
                </li>
              </ul>
            </div>
          </div>

          {/* Main grid: modules + side panels */}
          <div className="grid gap-8 lg:grid-cols-[2fr,1.5fr]">
            {/* Modules you teach */}
            <div className="glass border border-slate-700/50 rounded-3xl p-6 shadow-xl animate-slide-in">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-slate-100">Modules you teach</h3>
              </div>

              <div className="space-y-4">
                {taughtModules.map((mod) => (
                  <div
                    key={mod.code}
                    className="rounded-2xl border border-slate-700/50 bg-slate-800/50 px-5 py-4 card-hover"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-100 mb-1">
                          {mod.code} · {mod.name}
                        </p>
                        <p className="text-sm text-slate-400">
                          {mod.students} students · {mod.analogies} analogies
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link href="/lecturer/analogies">
                            <button
                                type="button"
                                className="text-sm rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-105 transition-all duration-200"
                            >
                                Manage Analogies
                            </button>
                        </Link>
                        <button className="text-sm rounded-xl border-2 border-indigo-400 px-4 py-2 hover:bg-indigo-500 hover:text-white hover:scale-105 transition-all duration-200 font-semibold">
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
              <div className="glass border border-slate-700/50 rounded-3xl p-6 shadow-xl animate-slide-in animate-delay-100">
                <h3 className="text-xl font-bold mb-4 text-slate-100">
                  Recent analogy uploads
                </h3>
                {recentUploads.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    You haven&apos;t created any analogies yet.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {recentUploads.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-2xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 card-hover"
                      >
                        <p className="font-semibold text-slate-100">{item.title}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Module: {item.module} · Created: {item.createdAt}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Quizzes in progress */}
              <div className="glass border border-slate-700/50 rounded-3xl p-6 shadow-xl animate-slide-in animate-delay-200">
                <h3 className="text-xl font-bold mb-4 text-slate-100">
                  Quizzes in progress
                </h3>
                {pendingQuizzes.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    No quizzes in draft state.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {pendingQuizzes.map((quiz) => (
                      <li
                        key={quiz.id}
                        className="flex items-center justify-between rounded-2xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 card-hover"
                      >
                        <div>
                          <p className="font-semibold text-slate-100">{quiz.title}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Module: {quiz.module} · Status: {quiz.status}
                          </p>
                        </div>
                        <button className="text-sm rounded-xl border-2 border-slate-600 px-4 py-2 hover:border-indigo-400 hover:bg-slate-800 hover:text-indigo-200 transition-all duration-200 font-semibold">
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
