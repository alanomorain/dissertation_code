import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "../../../lib/db"
import { getCurrentUser } from "../../../lib/currentUser"
import * as ui from "../../../styles/ui"

function extractTopicTitles(topicsJson) {
  const topics = Array.isArray(topicsJson?.topics) ? topicsJson.topics : []
  return topics
    .map((topic) => String(topic?.topic || "").trim())
    .filter(Boolean)
}

function clampPercent(value) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

export default async function LecturerModuleDetailPage({ params }) {
  const lecturer = await getCurrentUser("LECTURER", { id: true })
  if (!lecturer) redirect("/lecturer/login")

  const { moduleCode } = await params
  const code = decodeURIComponent(moduleCode || "").toUpperCase()

  const moduleRecord = await prisma.module.findFirst({
    where: { code, lecturerId: lecturer.id },
    include: {
      lectures: {
        include: {
          _count: { select: { analogySets: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      analogySets: {
        select: { id: true, title: true, topicsJson: true, createdAt: true, lecture: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      },
      quizzes: {
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          attempts: {
            where: { status: "SUBMITTED" },
            select: { score: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      },
      enrollments: {
        where: { status: "ACTIVE" },
        select: { id: true },
      },
      _count: {
        select: {
          lectures: true,
          analogySets: true,
          quizzes: true,
        },
      },
    },
  })

  if (!moduleRecord) redirect("/lecturer/modules")

  const allModuleTopics = await prisma.analogySet.findMany({
    where: { moduleId: moduleRecord.id, ownerId: lecturer.id },
    select: { topicsJson: true },
  })
  const analogyTopicCount = allModuleTopics.reduce((total, set) => {
    const topics = Array.isArray(set?.topicsJson?.topics) ? set.topicsJson.topics : []
    return total + topics.length
  }, 0)

  const quizPerformanceRows = moduleRecord.quizzes.map((quiz) => {
    const attemptCount = quiz.attempts.length
    const avgScore = attemptCount
      ? Math.round(quiz.attempts.reduce((total, attempt) => total + (attempt.score || 0), 0) / attemptCount)
      : 0
    return {
      id: quiz.id,
      title: quiz.title,
      avgScore: clampPercent(avgScore),
      attemptCount,
    }
  })

  const recentTopics = moduleRecord.analogySets
    .flatMap((analogy) =>
      extractTopicTitles(analogy.topicsJson).map((topicTitle, topicIndex) => ({
        analogyId: analogy.id,
        topicIndex,
        topicTitle,
        lectureTitle: analogy.lecture?.title || "No lecture",
        createdAt: analogy.createdAt,
      })),
    )
    .slice(0, 3)

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <p className={ui.textLabel}>Lecturer · Module</p>
            <h1 className="text-lg font-semibold">{moduleRecord.code} · {moduleRecord.name}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/lecturer/modules" className={ui.buttonSecondary}>All modules</Link>
            <Link href={`/lecturer/lectures?module=${encodeURIComponent(moduleRecord.code)}`} className={ui.buttonSecondary}>Lectures</Link>
            <Link href={`/lecturer/analogies/upload-slides?module=${encodeURIComponent(moduleRecord.code)}`} className={ui.buttonPrimary}>Upload lecture slides</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className="grid gap-4 md:grid-cols-4 text-sm">
            <div className={ui.cardFull}><p className={ui.textLabel}>Students</p><p className="mt-2 text-2xl font-semibold">{moduleRecord.enrollments.length}</p></div>
            <div className={ui.cardFull}><p className={ui.textLabel}>Lectures</p><p className="mt-2 text-2xl font-semibold">{moduleRecord._count.lectures}</p></div>
            <div className={ui.cardFull}><p className={ui.textLabel}>Analogies</p><p className="mt-2 text-2xl font-semibold">{analogyTopicCount}</p></div>
            <div className={ui.cardFull}><p className={ui.textLabel}>Quizzes</p><p className="mt-2 text-2xl font-semibold">{moduleRecord._count.quizzes}</p></div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className={ui.cardFull}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className={ui.cardHeader}>Lectures</h2>
                <Link href={`/lecturer/lectures?module=${encodeURIComponent(moduleRecord.code)}`} className={ui.buttonSmall}>View all</Link>
              </div>
              {moduleRecord.lectures.length === 0 ? (
                <p className={ui.textSmall}>No lectures yet. Upload lecture slides to create one.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {moduleRecord.lectures.slice(0, 8).map((lecture) => (
                    <Link key={lecture.id} href={`/lecturer/lectures/${lecture.id}`} className={ui.linkCard}>
                      <p className="font-medium">{lecture.title}</p>
                      <p className="text-xs text-slate-400">
                        {lecture._count.analogySets} analogy sets · {new Date(lecture.createdAt).toLocaleDateString()}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className={ui.cardFull}>
              <h2 className={ui.cardHeader}>Recent topics</h2>
              {recentTopics.length === 0 ? (
                <p className={ui.textSmall}>No topics in this module yet.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {recentTopics.map((topic) => {
                    return (
                      <div key={`${topic.analogyId}-${topic.topicIndex}`} className={ui.linkCard}>
                        <Link href={`/lecturer/analogies/${topic.analogyId}/topics/${topic.topicIndex}`} className="block min-w-0">
                          <p className="font-medium truncate">{topic.topicTitle || "Untitled topic"}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {topic.lectureTitle} · {new Date(topic.createdAt).toLocaleDateString()}
                          </p>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className={ui.cardFull}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className={ui.cardHeader}>Quizzes</h2>
                <Link href={`/lecturer/quizzes?module=${encodeURIComponent(moduleRecord.code)}`} className={ui.buttonSmall}>View all</Link>
              </div>
              {moduleRecord.quizzes.length === 0 ? (
                <p className={ui.textSmall}>No quizzes in this module yet.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {moduleRecord.quizzes.map((quiz) => (
                    <Link key={quiz.id} href={`/lecturer/quizzes/${quiz.id}`} className={ui.linkCard}>
                      <p className="font-medium">{quiz.title}</p>
                      <p className="text-xs text-slate-400">
                        {quiz.status} · {quiz.attempts.length} submitted {quiz.attempts.length === 1 ? "attempt" : "attempts"}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className={ui.cardFull}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className={ui.cardHeader}>Statistics snapshot</h2>
                <Link href={`/lecturer/statistics/${encodeURIComponent(moduleRecord.code)}`} className={ui.buttonSmall}>Open stats</Link>
              </div>
              {quizPerformanceRows.length === 0 ? (
                <p className={ui.textSmall}>No quiz data yet to chart.</p>
              ) : (
                <div className="space-y-3">
                  {quizPerformanceRows.slice(0, 5).map((quiz) => (
                    <div key={quiz.id}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-xs text-slate-300">
                        <span className="truncate">{quiz.title}</span>
                        <span>{quiz.avgScore}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800/70">
                        <div className="h-full rounded-full bg-indigo-400" style={{ width: `${quiz.avgScore}%` }} />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">{quiz.attemptCount} submitted attempts</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
