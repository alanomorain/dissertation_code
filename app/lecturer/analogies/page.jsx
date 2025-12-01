import Link from "next/link"

export default function AnalogiesDashboardPage() {
  // Mock data for now 
  const analogies = [
    {
      id: 1,
      moduleCode: "CSC7058",
      moduleName: "Individual Software Development Project",
      title: "Microservices as a fleet of food trucks",
      concept: "Microservices architecture",
      createdAt: "2025-11-20",
      hasImage: true,
    },
    {
      id: 2,
      moduleCode: "CSC7084",
      moduleName: "Web Development",
      title: "HTTP requests as sending letters",
      concept: "HTTP & REST",
      createdAt: "2025-11-18",
      hasImage: false,
    },
    {
      id: 3,
      moduleCode: "CSC7072",
      moduleName: "Databases",
      title: "Indexes as a book index",
      concept: "Database indexing",
      createdAt: "2025-11-15",
      hasImage: true,
    },
  ]

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">
              Manage Analogies
            </h1>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/lecturer"
              className="rounded-lg border border-slate-600 px-3 py-1.5 hover:border-indigo-400 hover:text-indigo-200 transition"
            >
              Back to dashboard
            </Link>
            <Link
              href="/lecturer/analogies/upload-slides"
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm hover:border-indigo-400 hover:text-indigo-200 transition"
            >
              Upload slides
            </Link>
            <Link
              href="/lecturer/analogies/new"
              className="rounded-lg bg-indigo-500 px-3 py-1.5 font-medium text-white hover:bg-indigo-400 transition"
            >
              + New analogy
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
          {/* Intro */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 text-sm">
            <p className="text-slate-300 mb-2">
              Here are all the analogies you have created for your modules. You can edit,add or delete analogies from this dashboard.
            </p>
          </div>

          {/* Summary blocks */}
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-400 mb-1">Total analogies</p>
              <p className="text-2xl font-semibold">
                {analogies.length}
              </p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-400 mb-1">
                Modules represented
              </p>
              <p className="text-2xl font-semibold">
                {new Set(analogies.map((a) => a.moduleCode)).size}
              </p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-400 mb-1">
                With supporting image
              </p>
              <p className="text-2xl font-semibold">
                {analogies.filter((a) => a.hasImage).length}
              </p>
            </div>
          </div>

          {/* Analogy list */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">All analogies</h2>
            </div>

            {analogies.length === 0 ? (
              <p className="text-sm text-slate-400">
                You haven&apos;t created any analogies yet. Click{" "}
                <span className="font-medium text-indigo-300">
                  &quot;New analogy&quot;
                </span>{" "}
                to add your first one.
              </p>
            ) : (
              <div className="space-y-3 text-sm">
                {analogies.map((analogy) => (
                  <div
                    key={analogy.id}
                    className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-xs uppercase tracking-wide text-indigo-300">
                        {analogy.moduleCode} · {analogy.moduleName}
                      </p>
                      <p className="font-medium">
                        {analogy.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        Concept: {analogy.concept}
                      </p>
                      <p className="text-xs text-slate-500">
                        Created: {analogy.createdAt}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 md:flex-col md:items-end">
                      {analogy.hasImage && (
                        <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-200">
                          Has image
                        </span>
                      )}
                      <Link href={`/lecturer/analogies/${analogy.id}/edit`}>
                        <button
                          type="button"
                          className="mt-1 text-xs rounded-lg border border-slate-600 px-3 py-1 hover:border-indigo-400 hover:text-indigo-200 transition"
                        >
                          Edit
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
