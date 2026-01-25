import Link from "next/link"
import { prisma } from "../../../lib/db"
import { notFound } from "next/navigation"

export default async function LecturerAnalogyDetailPage({ params }) {
  const { id } = await params

  // Query single AnalogySet by ID
  const analogy = await prisma.analogySet.findUnique({
    where: { id },
  })

  if (!analogy) {
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
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Analogy Details</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/lecturer/analogies"
              className="rounded-lg border border-slate-600 px-3 py-1.5 hover:border-indigo-400 hover:text-indigo-200 transition"
            >
              ← Back to list
            </Link>
            <Link
              href={`/lecturer/analogies/${analogy.id}/edit`}
              className="rounded-lg bg-indigo-500 px-3 py-1.5 font-medium text-white hover:bg-indigo-400 transition"
            >
              Edit
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
          {/* Header Info */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  {analogy.title || "Untitled"}
                </h2>
                <div className="flex items-center gap-2 text-sm">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
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
              </div>
            </div>

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
              <div>
                <span className="text-slate-400">Owner Role:</span>{" "}
                <span className="text-slate-200">{analogy.ownerRole}</span>
              </div>
            </div>
          </div>

          {/* Error Message (if any) */}
          {analogy.errorMessage && (
            <div className="bg-red-950/30 border border-red-800 rounded-2xl p-5">
              <h3 className="text-base font-semibold mb-2 text-red-200">
                Error Message
              </h3>
              <p className="text-sm text-red-300">{analogy.errorMessage}</p>
            </div>
          )}

          {/* Source Text */}
          {analogy.sourceText && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-base font-semibold mb-3">Source Text</h3>
              <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 text-sm text-slate-300 whitespace-pre-wrap">
                {analogy.sourceText}
              </div>
            </div>
          )}

          {/* Topics and Analogies */}
          {topics.length > 0 && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-base font-semibold mb-3">
                Topics & Analogies ({topics.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
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
          )}

          {/* No topics message - only show if no error and no topics */}
          {topics.length === 0 && !analogy.errorMessage && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
              <p className="text-sm text-slate-400">
                No topics and analogies available yet.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
