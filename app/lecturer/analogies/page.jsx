import Link from "next/link"
import { prisma } from "../../lib/db"
import * as ui from "../../styles/ui"

export default async function AnalogiesDashboardPage() {
  // Query AnalogySet table, newest first
  const analogies = await prisma.analogySet.findMany({
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <main className={ui.page}>
      {/* Top bar */}
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <h1 className="text-lg font-semibold">
              Manage Analogies
            </h1>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/lecturer"
              className={ui.buttonSecondary}
            >
              Back to dashboard
            </Link>
            <Link
              href="/lecturer/analogies/upload-slides"
              className={ui.buttonSecondary}
            >
              Upload slides
            </Link>
            <Link
              href="/lecturer/analogies/new"
              className={ui.buttonPrimary}
            >
              + New analogy
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          {/* Intro */}
          <div className={ui.cardFull}>
            <p className="text-slate-300 mb-2 text-sm">
              Here are all the analogies you have created for your modules. You can edit,add or delete analogies from this dashboard.
            </p>
          </div>

          {/* Summary blocks */}
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div className={`${ui.card} p-4`}>
              <p className={`${ui.textLabel} mb-1`}>Total analogies</p>
              <p className="text-2xl font-semibold">
                {analogies.length}
              </p>
            </div>
            <div className={`${ui.card} p-4`}>
              <p className={`${ui.textLabel} mb-1`}>
                Ready analogies
              </p>
              <p className="text-2xl font-semibold">
                {analogies.filter((a) => a.status === "ready").length}
              </p>
            </div>
            <div className={`${ui.card} p-4`}>
              <p className={`${ui.textLabel} mb-1`}>
                Processing
              </p>
              <p className="text-2xl font-semibold">
                {analogies.filter((a) => a.status === "processing").length}
              </p>
            </div>
          </div>

          {/* Analogy list */}
          <div className={ui.cardFull}>
            <div className="flex items-center justify-between mb-3">
              <h2 className={ui.cardHeader}>All analogies</h2>
            </div>

            {analogies.length === 0 ? (
              <p className={ui.textSmall}>
                You haven&apos;t created any analogies yet. Click{" "}
                <span className="font-medium text-indigo-300">
                  &quot;New analogy&quot;
                </span>{" "}
                to add your first one.
              </p>
            ) : (
              <div className="space-y-3 text-sm">
                {analogies.map((analogy) => (
                  <Link
                    key={analogy.id}
                    href={`/lecturer/analogies/${analogy.id}`}
                    className={`${ui.cardList} flex flex-col gap-2 md:flex-row md:items-center md:justify-between hover:border-indigo-400 transition`}
                  >
                    <div>
                      <p className={ui.textHighlight}>
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
                        className={ui.getBadgeClass(analogy.status)}
                      >
                        {analogy.status}
                      </span>
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
