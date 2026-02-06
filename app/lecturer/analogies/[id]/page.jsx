import Link from "next/link"
import { prisma } from "../../../lib/db"
import { notFound } from "next/navigation"
import * as ui from "../../../styles/ui"
import MediaImagePanel from "../components/MediaImagePanel"

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
    <main className={ui.page}>
      {/* Top bar */}
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <h1 className="text-lg font-semibold">Analogy Details</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/lecturer/analogies"
              className={ui.buttonSecondary}
            >
              ← Back to list
            </Link>
            <Link
              href={`/lecturer/analogies/${analogy.id}/edit`}
              className={ui.buttonPrimary}
            >
              Edit
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          {/* Header Info */}
          <div className={ui.cardFull}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  {analogy.title || "Untitled"}
                </h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className={ui.getBadgeClass(analogy.status)}>
                    {analogy.status}
                  </span>
                </div>
              </div>
            </div>

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
              <div>
                <span className={ui.textMuted}>Owner Role:</span>{" "}
                <span className="text-slate-200">{analogy.ownerRole}</span>
              </div>
            </div>
          </div>

          {/* Error Message (if any) */}
          {analogy.errorMessage && (
            <div className="bg-red-950/30 border border-red-800 rounded-2xl p-5">
              <h3 className={`${ui.cardHeader} text-red-200`}>
                Error Message
              </h3>
              <p className="text-sm text-red-300">{analogy.errorMessage}</p>
            </div>
          )}

          {/* Source Text */}
          {analogy.sourceText && (
            <div className={ui.cardFull}>
              <h3 className={ui.cardHeader}>Source Text</h3>
              <div className={`${ui.cardInner} text-sm text-slate-300 whitespace-pre-wrap`}>
                {analogy.sourceText}
              </div>
            </div>
          )}

          {/* Topics and Analogies */}
          {topics.length > 0 && (
            <div className={ui.cardFull}>
              <h3 className={ui.cardHeader}>
                Topics & Analogies ({topics.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {topics.map((item, index) => (
                  <div
                    key={index}
                    className={ui.cardInner}
                  >
                    <Link
                      href={`/lecturer/analogies/${analogy.id}/topics/${index}`}
                      className="block rounded-md border border-transparent hover:border-indigo-400/40 transition p-2 -m-2"
                    >
                      <h4 className="font-medium text-indigo-300 mb-2">
                        {item.topic || "Unknown Topic"}
                      </h4>
                      <p className="text-sm text-slate-300">
                        {item.analogy || "No analogy provided"}
                      </p>
                    </Link>

                    <MediaImagePanel
                      analogyText={item.analogy || ""}
                      topicTitle={item.topic || ""}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No topics message - only show if no error and no topics */}
          {topics.length === 0 && !analogy.errorMessage && (
            <div className={ui.cardFull}>
              <p className={ui.textSmall}>
                No topics and analogies available yet.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
