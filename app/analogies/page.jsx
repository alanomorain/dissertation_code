import Link from "next/link"
import { prisma } from "../lib/db"

export default async function AnalogiesListPage() {
  // Query AnalogySet table, newest first
  const analogies = await prisma.analogySet.findMany({
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Analogies</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/"
              className="rounded-lg border border-slate-600 px-3 py-1.5 hover:border-indigo-400 hover:text-indigo-200 transition"
            >
              Home
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
              Browse all analogies from the database. Click on any item to view
              details.
            </p>
          </div>

          {/* Analogy list */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">
                All analogies ({analogies.length})
              </h2>
            </div>

            {analogies.length === 0 ? (
              <p className="text-sm text-slate-400">
                No analogies found in the database.
              </p>
            ) : (
              <div className="space-y-3 text-sm">
                {analogies.map((analogy) => (
                  <Link
                    key={analogy.id}
                    href={`/analogies/${analogy.id}`}
                    className="block rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 hover:border-indigo-400 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">
                            {analogy.title || "Untitled"}
                          </p>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              analogy.status === "ready"
                                ? "bg-green-900/50 text-green-200"
                                : analogy.status === "failed"
                                  ? "bg-red-900/50 text-red-200"
                                  : "bg-yellow-900/50 text-yellow-200"
                            }`}
                          >
                            {analogy.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Source: {analogy.source || "N/A"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Created:{" "}
                          {new Date(analogy.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-xs text-indigo-300">View →</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
