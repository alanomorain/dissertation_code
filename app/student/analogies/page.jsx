import Link from "next/link"
import { prisma } from "../../lib/db"

export default async function StudentAnalogiesPage() {
  // Query only "ready" analogies, newest first
  const analogies = await prisma.analogySet.findMany({
    where: {
      status: "ready",
    },
    orderBy: {
      createdAt: "desc",
    },
  })

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
                {analogies.map((analogy) => {
                  // Parse topicsJson if available
                  let topics = []
                  if (analogy.topicsJson && typeof analogy.topicsJson === "object") {
                    topics = analogy.topicsJson.topics || []
                  }
                  
                  return (
                    <Link
                      key={analogy.id}
                      href={`/student/analogies/${analogy.id}`}
                      className="block rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 hover:border-indigo-400 transition"
                    >
                      <p className="text-xs uppercase tracking-wide text-indigo-300 mb-1">
                        {analogy.title || "Untitled"}
                      </p>
                      <h3 className="text-sm font-semibold mb-1">
                        {analogy.source || "N/A"}
                      </h3>
                      <p className="text-xs text-slate-400 mb-2">
                        {topics.length} {topics.length === 1 ? "topic" : "topics"} • Created: {new Date(analogy.createdAt).toLocaleDateString()}
                      </p>
                      {topics.length > 0 && (
                        <p className="text-slate-200 text-sm line-clamp-2">
                          {topics[0].analogy || ""}
                        </p>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
