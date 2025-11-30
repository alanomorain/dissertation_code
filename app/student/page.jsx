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
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">
              Student Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-slate-300">
              Signed in as <span className="font-medium">Student User</span>
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
          {/* Greeting  */}
          <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
              <h2 className="text-xl font-semibold mb-2">
                Welcome back, Student 👋
              </h2>
              <p className="text-sm text-slate-300 mb-3">
                Continue exploring analogies for your modules, review recent
                explanations, and take short quizzes to check your understanding.
              </p>
            </div>

            {/* Stats  */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 text-sm">
              <h3 className="text-base font-semibold">Quick Stats</h3>
              <ul className="space-y-1 text-slate-300">
                <li>• 3 active modules</li>
                <li>• 2 upcoming quizzes</li>
                <li>• 5 new analogies added this week</li>
              </ul>
            </div>
          </div>

          {/* Modules & analogies */}
          <div className="grid gap-6 lg:grid-cols-[2fr,1.5fr]">
            {/* Modules list */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">Your modules</h3>
              </div>
              <div className="space-y-3 text-sm">
                {modules.map((module) => (
                  <div
                    key={module.code}
                    className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <p className="font-medium">
                          {module.code} · {module.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          Progress: {module.progress}%
                        </p>
                      </div>
                      <button className="text-xs rounded-lg bg-indigo-500 px-3 py-1 font-medium hover:bg-indigo-400 transition">
                        View analogies
                      </button>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-slate-800">
                      <div
                        className="h-1.5 rounded-full bg-indigo-500"
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
