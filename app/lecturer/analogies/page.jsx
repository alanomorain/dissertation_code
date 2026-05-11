import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"
import { getModuleDisplayName } from "../../lib/moduleDisplay"
import * as ui from "../../styles/ui"

function getTopics(topicsJson) {
  return Array.isArray(topicsJson?.topics) ? topicsJson.topics : []
}

export default async function AnalogiesDashboardPage({ searchParams }) {
  const lecturerUser = await getCurrentUser("LECTURER", {
    id: true,
    email: true,
  })

  if (!lecturerUser) {
    redirect("/lecturer/login")
  }

  const resolvedSearchParams = await searchParams
  const moduleCode = String(resolvedSearchParams?.module || "").trim().toUpperCase()

  const modules = await prisma.module.findMany({
    where: { lecturerId: lecturerUser.id },
    select: { id: true, code: true, name: true },
    orderBy: { code: "asc" },
  })

  const moduleFilter = moduleCode
    ? modules.find((module) => module.code === moduleCode)
    : null

  const analogySets = await prisma.analogySet.findMany({
    where: {
      ownerId: lecturerUser.id,
      ...(moduleFilter ? { moduleId: moduleFilter.id } : {}),
    },
    include: {
      module: { select: { code: true, name: true } },
      lecture: { select: { id: true, title: true } },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const setCountsByLecture = new Map()
  const setNumbersById = new Map()
  const analogySetsOldestFirst = [...analogySets].sort((a, b) => a.createdAt - b.createdAt)
  for (const set of analogySetsOldestFirst) {
    const lectureKey = set.lecture?.id || `no-lecture:${set.id}`
    const nextCount = (setCountsByLecture.get(lectureKey) || 0) + 1
    setCountsByLecture.set(lectureKey, nextCount)
    setNumbersById.set(set.id, nextCount)
  }

  const analogies = analogySets.flatMap((set) => {
    const moduleLabel = set.module ? getModuleDisplayName(set.module) : "No module"
    const lectureLabel = set.lecture?.title || "No lecture"
    const lectureKey = set.lecture?.id || `no-lecture:${set.id}`
    const showSetLabel = (setCountsByLecture.get(lectureKey) || 0) > 1
    const setLabel = showSetLabel ? `Set ${setNumbersById.get(set.id)}` : ""

    return getTopics(set.topicsJson).map((topic, topicIndex) => ({
      id: `${set.id}-${topicIndex}`,
      analogySetId: set.id,
      topicIndex,
      topicTitle: String(topic?.topic || "").trim() || "Untitled analogy",
      moduleLabel,
      lectureLabel,
      setLabel,
      status: set.status,
      reviewStatus: set.reviewStatus || "DRAFT",
      createdAt: set.createdAt,
    }))
  })

  return (
    <main className={ui.page}>
      {/* Top bar */}
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <p className={ui.textLabel}>Lecturer · Analogies</p>
            <h1 className="text-lg font-semibold">Analogy Dashboard</h1>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/lecturer"
              className={ui.buttonSecondary}
            >
              Lecturer Dashboard
            </Link>
            <Link
              href="/lecturer/lectures"
              className={ui.buttonPrimary}
            >
              Return to Lectures
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Link href="/lecturer/analogies" className={!moduleCode ? ui.buttonPrimary : ui.buttonSecondary}>
                All modules
              </Link>
              {modules.map((module) => (
                <Link
                  key={module.id}
                  href={`/lecturer/analogies?module=${encodeURIComponent(module.code)}`}
                  className={moduleCode === module.code ? ui.buttonPrimary : ui.buttonSecondary}
                >
                  {getModuleDisplayName(module)}
                </Link>
              ))}
            </div>
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
                {analogies.filter((analogy) => analogy.status === "ready").length}
              </p>
            </div>
            <div className={`${ui.card} p-4`}>
              <p className={`${ui.textLabel} mb-1`}>
                Processing
              </p>
              <p className="text-2xl font-semibold">
                {analogies.filter((analogy) => analogy.status === "processing").length}
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
                No individual analogies found for this selection.
              </p>
            ) : (
              <div className="space-y-3 text-sm">
                {analogies.map((analogy) => (
                  <div
                    key={analogy.id}
                    className={`${ui.cardList} flex flex-col gap-2 md:flex-row md:items-center md:justify-between hover:border-teal-500 transition`}
                  >
                    <div className="min-w-0">
                      <p className={ui.textHighlight}>
                        {analogy.moduleLabel}
                      </p>
                      <p className="font-semibold text-stone-950">
                        {analogy.topicTitle}
                      </p>
                      <p className="mt-2 text-xs text-stone-600">
                        Lecture: {analogy.lectureLabel}
                      </p>
                      {analogy.setLabel && (
                        <p className="text-xs text-stone-600">
                          {analogy.setLabel}
                        </p>
                      )}
                      <p className="text-xs text-stone-500">
                        Created: {new Date(analogy.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-end">
                      <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        <span className={ui.getBadgeClass(analogy.status)}>
                          {analogy.status}
                        </span>
                        <span className={ui.getReviewBadgeClass(analogy.reviewStatus)}>
                          {analogy.reviewStatus.toLowerCase()}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        <Link
                          href={`/lecturer/analogies/${analogy.analogySetId}/topics/${analogy.topicIndex}`}
                          className={ui.buttonPrimary}
                        >
                          Open analogy
                        </Link>
                        <Link
                          href={`/lecturer/analogies/${analogy.analogySetId}`}
                          className={ui.buttonSecondary}
                        >
                          Open set
                        </Link>
                      </div>
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
