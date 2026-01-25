import Link from "next/link"
import { prisma } from "../../lib/db"

export default async function AnalogiesDashboardPage() {
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
                Ready analogies
              </p>
              <p className="text-2xl font-semibold">
                {analogies.filter((a) => a.status === "ready").length}
              </p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-400 mb-1">
                Processing
              </p>
              <p className="text-2xl font-semibold">
                {analogies.filter((a) => a.status === "processing").length}
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
                        {analogy.title || "Untitled"}
                      </p>
                      <p className="font-medium">
                        {analogy.source || "N/A"}
                      </p>
                      <p className="text-xs text-slate-400">
                        Status: {analogy.status}
                      </p>
                      <p className="text-xs text-slate-500">
                        Created: {new Date(analogy.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 md:flex-col md:items-end">
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
                      <Link href={`/lecturer/analogies/${analogy.id}`}>
                        <button
                          type="button"
                          className="mt-1 text-xs rounded-lg border border-slate-600 px-3 py-1 hover:border-indigo-400 hover:text-indigo-200 transition"
                        >
                          View
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
