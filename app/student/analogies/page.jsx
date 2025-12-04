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
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Student · Analogies
            </p>
            <h1 className="text-lg font-semibold">Analogy library</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/student"
              className="rounded-lg border border-slate-600 px-3 py-1.5 hover:border-indigo-400 hover:text-indigo-200 transition"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
          {/* Intro text */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 text-sm">
            <p className="text-slate-300 mb-2">
              This page shows analogies for different modules.
            </p>
          </div>

          {/* Analogy list */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">All analogies</h2>
            </div>

            {analogies.length === 0 ? (
              <p className="text-sm text-slate-400">
                No analogies are available yet. Your lecturer hasn't added
                any for your modules.
              </p>
            ) : (
              <div className="space-y-4 text-sm">
                {analogies.map((analogy) => (
                  <article
                    key={analogy.id}
                    className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3"
                  >
                    <p className="text-xs uppercase tracking-wide text-indigo-300 mb-1">
                      {analogy.moduleCode} · {analogy.moduleName}
                    </p>
                    <h3 className="text-sm font-semibold mb-1">
                      {analogy.title}
                    </h3>
                    <p className="text-xs text-slate-400 mb-2">
                      Concept: {analogy.concept}
                    </p>
                    <p className="text-slate-200">{analogy.explanation}</p>
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
