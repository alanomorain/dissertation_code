import Link from "next/link"

export default function StudentAnalogiesPage() {
  // Mock data for now 
  const analogies = [
    {
      id: 1,
      moduleCode: "CSC7058",
      moduleName: "Individual Software Development Project",
      title: "Microservices as a fleet of food trucks",
      concept: "Microservices architecture",
      explanation:
        "Each microservice is like a separate food truck, specialising in one type of food. If one truck breaks, the others keep serving.",
    },
    {
      id: 2,
      moduleCode: "CSC7084",
      moduleName: "Web Development",
      title: "HTTP requests as sending letters",
      concept: "HTTP & REST",
      explanation:
        "An HTTP request is like sending a letter to an address (URL). You include details (headers/body) and wait for a reply (response).",
    },
    {
      id: 3,
      moduleCode: "CSC7072",
      moduleName: "Databases",
      title: "Indexes as a book index",
      concept: "Database indexing",
      explanation:
        "A database index is like the index at the back of a book: it lets you jump straight to the right page instead of scanning everything.",
    },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/50 animate-fade-in">
        <div className="mx-auto max-w-5xl px-4 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">
              Student · Analogies
            </p>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Analogy library</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/student"
              className="rounded-xl border-2 border-slate-600 px-4 py-2 hover:border-indigo-400 hover:bg-slate-800 hover:text-indigo-200 transition-all duration-200"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
          {/* Intro text */}
          <div className="glass border border-slate-700/50 rounded-3xl p-6 shadow-xl animate-scale-in">
            <p className="text-base text-slate-300 leading-relaxed">
              This page shows analogies for different modules.
            </p>
          </div>

          {/* Analogy list */}
          <div className="glass border border-slate-700/50 rounded-3xl p-6 shadow-xl animate-slide-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-slate-100">All analogies</h2>
            </div>

            {analogies.length === 0 ? (
              <p className="text-sm text-slate-400">
                No analogies are available yet. Your lecturer hasn't added
                any for your modules.
              </p>
            ) : (
              <div className="space-y-5">
                {analogies.map((analogy) => (
                  <article
                    key={analogy.id}
                    className="rounded-2xl border border-slate-700/50 bg-slate-800/50 px-6 py-5 card-hover"
                  >
                    <p className="text-xs uppercase tracking-wider text-indigo-300 mb-2 font-semibold">
                      {analogy.moduleCode} · {analogy.moduleName}
                    </p>
                    <h3 className="text-lg font-bold mb-2 text-slate-100">
                      {analogy.title}
                    </h3>
                    <p className="text-sm text-slate-400 mb-3">
                      Concept: {analogy.concept}
                    </p>
                    <p className="text-slate-200 leading-relaxed">{analogy.explanation}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
