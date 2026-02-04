import Link from "next/link"
import { prisma } from "../../../../../lib/db"
import { notFound } from "next/navigation"
import * as ui from "../../../../../styles/ui"

export default async function LecturerTopicDetailPage({ params }) {
  const { id, topicIndex } = await params

  const analogy = await prisma.analogySet.findUnique({
    where: { id },
  })

  if (!analogy) {
    notFound()
  }

  let topics = []
  if (analogy.topicsJson && typeof analogy.topicsJson === "object") {
    topics = analogy.topicsJson.topics || []
  }

  const index = Number(topicIndex)
  if (Number.isNaN(index) || index < 0 || index >= topics.length) {
    notFound()
  }

  const topic = topics[index] || {}
  const prevIndex = index > 0 ? index - 1 : null
  const nextIndex = index < topics.length - 1 ? index + 1 : null

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <p className={ui.textLabel}>Lecturer · Topic</p>
            <h1 className="text-lg font-semibold">
              {analogy.title || "Analogy"}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {prevIndex !== null && (
              <Link
                href={`/lecturer/analogies/${id}/topics/${prevIndex}`}
                className={ui.buttonSecondary}
              >
                ← Previous topic
              </Link>
            )}
            <Link
              href={`/lecturer/analogies/${id}`}
              className={ui.buttonSecondary}
            >
              ← Back to analogy
            </Link>
            {nextIndex !== null && (
              <Link
                href={`/lecturer/analogies/${id}/topics/${nextIndex}`}
                className={ui.buttonSecondary}
              >
                Next topic →
              </Link>
            )}
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <h2 className="text-xl font-semibold mb-2">
              {topic.topic || "Unknown Topic"}
            </h2>
            <p className="text-sm text-slate-300">
              {topic.analogy || "No analogy provided"}
            </p>

            <div className="mt-6 rounded-lg border border-slate-800/70 bg-slate-900/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-400">
                  Media: <span className="text-slate-200">Not generated</span>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-xs rounded-lg border border-slate-600 px-3 py-1 hover:border-indigo-400 hover:text-indigo-200 transition"
                  >
                    Generate Image
                  </button>
                  <button
                    type="button"
                    className="text-xs rounded-lg border border-slate-600 px-3 py-1 hover:border-indigo-400 hover:text-indigo-200 transition"
                  >
                    Generate Video
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-md border border-slate-800 bg-slate-950/40 p-3">
                  <p className="text-xs text-slate-400">Image preview</p>
                  <div className="mt-2 h-32 rounded bg-slate-800/40"></div>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/40 p-3">
                  <p className="text-xs text-slate-400">Video preview</p>
                  <div className="mt-2 h-32 rounded bg-slate-800/40"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
