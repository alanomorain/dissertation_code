import Link from "next/link"
import { prisma } from "../../../lib/db"
import { notFound } from "next/navigation"
import * as ui from "../../../styles/ui"

export default async function StudentAnalogyDetailPage({ params }) {
  const { id } = await params

  // Query single AnalogySet by ID
  const analogy = await prisma.analogySet.findUnique({
    where: { id },
  })

  // Return 404 if not found or not ready/approved
  if (!analogy || analogy.status !== "ready" || analogy.reviewStatus !== "APPROVED") {
    notFound()
  }

  // Parse topicsJson if available
  let topics = []
  if (analogy.topicsJson !== null && analogy.topicsJson !== undefined && typeof analogy.topicsJson === "object") {
    topics = analogy.topicsJson.topics || []
  }

  return (
    <main className={ui.page}>
      {/* Top bar */}
      <header className={ui.header}>
        <div className={ui.headerContentNarrow}>
          <div>
            <p className={ui.textLabel}>
              Student · Analogy
            </p>
            <h1 className="text-lg font-semibold">
              {analogy.title || "Untitled"}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/student/analogies"
              className={ui.buttonSecondary}
            >
              ← Back to library
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className={ui.pageSection}>
        <div className={`${ui.containerNarrow} ${ui.pageSpacing}`}>
          {/* Header Info */}
          <div className={ui.cardFull}>
            <div className="space-y-2 text-sm">
              <div>
                <span className={ui.textMuted}>Source:</span>{" "}
                <span className="text-slate-200">
                  {analogy.source || "N/A"}
                </span>
              </div>
              <div>
                <span className={ui.textMuted}>Created:</span>{" "}
                <span className="text-slate-200">
                  {new Date(analogy.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Topics and Analogies */}
          {topics.length > 0 ? (
            <div className={ui.cardFull}>
              <h3 className={ui.cardHeader}>
                Topics & Analogies
              </h3>
              <div className="space-y-4">
                {topics.map((item, index) => (
                  <div
                    key={index}
                    className={ui.cardInner}
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
            <div className={ui.cardFull}>
              <p className={ui.textSmall}>
                No topics and analogies available.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
