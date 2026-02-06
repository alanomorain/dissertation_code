import Link from "next/link"
import { prisma } from "../../lib/db"
import * as ui from "../../styles/ui"

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
    <main className={ui.page}>
      {/* Top bar */}
      <header className={ui.header}>
        <div className={ui.headerContentNarrow}>
          <div>
            <p className={ui.textLabel}>
              Student · Analogies
            </p>
            <h1 className="text-lg font-semibold">Analogy library</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/student"
              className={ui.buttonSecondary}
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className={ui.pageSection}>
        <div className={`${ui.containerNarrow} ${ui.pageSpacing}`}>
          {/* Intro text */}
          <div className={ui.cardFull}>
            <p className="text-slate-300 mb-2 text-sm">
              This page shows analogies for different modules.
            </p>
          </div>

          {/* Analogy list */}
          <div className={ui.cardFull}>
            <div className="flex items-center justify-between mb-3">
              <h2 className={ui.cardHeader}>All analogies</h2>
            </div>

            {analogies.length === 0 ? (
              <p className={ui.textSmall}>
                No analogies are available yet. Your lecturer hasn&apos;t added
                any for your modules.
              </p>
            ) : (
              <div className="space-y-4 text-sm">
                {analogies.map((analogy) => {
                  // Parse topicsJson if available
                  let topics = []
                  if (analogy.topicsJson !== null && analogy.topicsJson !== undefined && typeof analogy.topicsJson === "object") {
                    topics = analogy.topicsJson.topics || []
                  }
                  
                  return (
                    <Link
                      key={analogy.id}
                      href={`/student/analogies/${analogy.id}`}
                      className={ui.linkCard}
                    >
                      <p className={`${ui.textHighlight} mb-1`}>
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
