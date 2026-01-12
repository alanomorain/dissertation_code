import Link from "next/link"

export default function StudentDashboard() {
  // Temporary mock data 
  const modules = [
    { code: "CSC7058", name: "Software Development Project", progress: 60 },
    { code: "CSC7084", name: "Web Development", progress: 80 },
    { code: "CSC7082", name: "Databases", progress: 45 },
  ]

  const upcomingQuizzes = [
    { id: 1, title: "OOP Concepts via Analogies", due: "2025-12-05" },
    { id: 2, title: "HTTP & REST Analogy Quiz", due: "2025-12-12" },
  ]

  const recentAnalogies = [
    {
      id: 1,
      concept: "Client–Server Architecture",
      analogy: "Restaurant waiter taking orders to the kitchen",
    },
    {
      id: 2,
      concept: "Queues in Data Structures",
      analogy: "People lining up at a bus stop, first in first out",
    },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/50 animate-fade-in">
        <div className="mx-auto max-w-6xl px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Student Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-slate-300">
              Signed in as <span className="font-semibold text-indigo-300">Student User</span>
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
          {/* Greeting  */}
          <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
            <div className="glass border border-slate-700/50 rounded-3xl p-6 shadow-xl animate-scale-in">
              <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Welcome back, Student 👋
              </h2>
              <p className="text-base text-slate-300 leading-relaxed">
                Continue exploring analogies for your modules, review recent
                explanations, and take short quizzes to check your understanding.
              </p>
            </div>

            {/* Stats  */}
            <div className="glass border border-slate-700/50 rounded-3xl p-6 shadow-xl animate-scale-in animate-delay-100">
              <h3 className="text-lg font-bold mb-3 text-indigo-300">Quick Stats</h3>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-indigo-400">●</span> 3 active modules
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">●</span> 2 upcoming quizzes
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-pink-400">●</span> 5 new analogies this week
                </li>
              </ul>
            </div>
          </div>

          {/* Modules & analogies */}
          <div className="grid gap-8 lg:grid-cols-[2fr,1.5fr]">
            {/* Modules list */}
            <div className="glass border border-slate-700/50 rounded-3xl p-6 shadow-xl animate-slide-in">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-slate-100">Your modules</h3>
              </div>
              <div className="space-y-4">
                {modules.map((module) => (
                  <div
                    key={module.code}
                    className="rounded-2xl border border-slate-700/50 bg-slate-800/50 px-5 py-4 card-hover"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-slate-100 mb-1">
                          {module.code} · {module.name}
                        </p>
                        <p className="text-sm text-slate-400">
                          Progress: {module.progress}%
                        </p>
                      </div>
                      <Link href="/student/analogies">
                        <button
                          type="button"
                          className="text-sm rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-105 transition-all duration-200"
                        >
                          View analogies
                        </button>
                      </Link>
                    </div>
                    <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${module.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent analogies */}
            <div className="space-y-6">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-base font-semibold mb-3">
                  Recent analogies
                </h3>
                <div className="space-y-3 text-sm">
                  {recentAnalogies.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-3"
                    >
                      <p className="text-xs uppercase tracking-wide text-indigo-300 mb-1">
                        {item.concept}
                      </p>
                      <p className="text-slate-200">{item.analogy}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming quizzes */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-base font-semibold mb-3">
                  Upcoming quizzes
                </h3>
                {upcomingQuizzes.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    No quizzes scheduled. Your lecturer hasn’t created any yet.
                  </p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {upcomingQuizzes.map((quiz) => (
                      <li
                        key={quiz.id}
                        className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2"
                      >
                        <div>
                          <p className="font-medium">{quiz.title}</p>
                          <p className="text-xs text-slate-400">
                            Due: {quiz.due}
                          </p>
                        </div>
                        <button className="text-xs rounded-lg border border-indigo-400 px-3 py-1 hover:bg-indigo-500 hover:text-white transition">
                          Start
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
