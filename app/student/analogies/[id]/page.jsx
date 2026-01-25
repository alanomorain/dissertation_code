import Link from "next/link"
import { prisma } from "../../../lib/db"
import { notFound } from "next/navigation"

export default async function StudentAnalogyDetailPage({ params }) {
  const { id } = await params

  // Query single AnalogySet by ID
  const analogy = await prisma.analogySet.findUnique({
    where: { id },
  })

  // Return 404 if not found or not ready
  if (!analogy || analogy.status !== "ready") {
    notFound()
  }

  // Parse topicsJson if available
  let topics = []
  if (analogy.topicsJson !== null && analogy.topicsJson !== undefined && typeof analogy.topicsJson === "object") {
    topics = analogy.topicsJson.topics || []
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Student · Analogy
            </p>
            <h1 className="text-lg font-semibold">
              {analogy.title || "Untitled"}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/student/analogies"
              className="rounded-lg border border-slate-600 px-3 py-1.5 hover:border-indigo-400 hover:text-indigo-200 transition"
            >
              ← Back to library
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
          {/* Header Info */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-400">Source:</span>{" "}
                <span className="text-slate-200">
                  {analogy.source || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Created:</span>{" "}
                <span className="text-slate-200">
                  {new Date(analogy.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Topics and Analogies */}
          {topics.length > 0 ? (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-base font-semibold mb-3">
                Topics & Analogies
              </h3>
              <div className="space-y-4">
                {topics.map((item, index) => (
                  <div
                    key={index}
                    className="bg-slate-900/70 border border-slate-800 rounded-xl p-4"
                  >
                    <h4 className="font-medium text-indigo-300 mb-2">
                      {item.topic || "Unknown Topic"}
                    </h4>
                    <p className="text-sm text-slate-300">
                      {item.analogy || "No analogy provided"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
              <p className="text-sm text-slate-400">
                No topics and analogies available.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
