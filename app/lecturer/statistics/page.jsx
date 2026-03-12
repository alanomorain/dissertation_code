import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"
import { getQuizTimingState } from "../../lib/quizState"
import * as ui from "../../styles/ui"

export default async function LecturerStatisticsPage() {
  const lecturerUser = await getCurrentUser("LECTURER", { id: true })
  if (!lecturerUser) redirect("/lecturer/login")

  const nowTs = new Date().getTime()
  const quizzes = await prisma.quiz.findMany({
    where: { ownerId: lecturerUser.id },
    include: {
      module: { select: { code: true, name: true } },
      attempts: { where: { status: "SUBMITTED" }, select: { score: true } },
      _count: { select: { questions: true } },
    },
    orderBy: [{ module: { code: "asc" } }, { createdAt: "desc" }],
  })

  const analogySets = await prisma.analogySet.findMany({
    where: { ownerId: lecturerUser.id },
    include: { interactions: true },
  })

  const allAttempts = quizzes.flatMap((quiz) => quiz.attempts)
  const avgQuizScore = allAttempts.length
    ? Math.round(allAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / allAttempts.length)
    : 0

  const quizStateTotals = quizzes.reduce(
    (acc, quiz) => {
      const state = getQuizTimingState(quiz, nowTs)
      acc[state] += 1
      return acc
    },
    { ACTIVE: 0, SCHEDULED: 0, PAST: 0, DRAFT: 0, ARCHIVED: 0 },
  )

  const moduleQuizSummary = Object.values(
    quizzes.reduce((acc, quiz) => {
      const code = quiz.module.code
      if (!acc[code]) {
        acc[code] = {
          code,
          name: quiz.module.name,
          total: 0,
          active: 0,
          scheduled: 0,
          past: 0,
          draft: 0,
        }
      }
      const timingState = getQuizTimingState(quiz, nowTs)
      acc[code].total += 1
      if (timingState === "ACTIVE") acc[code].active += 1
      if (timingState === "SCHEDULED") acc[code].scheduled += 1
      if (timingState === "PAST") acc[code].past += 1
      if (timingState === "DRAFT") acc[code].draft += 1
      return acc
    }, {}),
  )
    .sort((a, b) => a.code.localeCompare(b.code))

  const totalViews = analogySets.reduce((acc, item) => acc + item.interactions.filter((i) => i.type === "VIEW").length, 0)
  const totalRevisits = analogySets.reduce((acc, item) => acc + item.interactions.filter((i) => i.type === "REVISIT").length, 0)

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <h1 className="text-lg font-semibold">Statistics Dashboard</h1>
            <p className={ui.textSmall}>Track analogy performance and student engagement trends.</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/lecturer" className={ui.buttonSecondary}>Back to dashboard</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 text-sm">
            <div className={`${ui.card} p-4`}><p className={`${ui.textLabel} mb-1`}>Total analogies</p><p className="text-2xl font-semibold">{analogySets.length}</p></div>
            <div className={`${ui.card} p-4`}><p className={`${ui.textLabel} mb-1`}>Avg quiz score</p><p className="text-2xl font-semibold">{avgQuizScore}%</p></div>
            <div className={`${ui.card} p-4`}><p className={`${ui.textLabel} mb-1`}>Active quizzes</p><p className="text-2xl font-semibold">{quizStateTotals.ACTIVE}</p></div>
            <div className={`${ui.card} p-4`}><p className={`${ui.textLabel} mb-1`}>Scheduled quizzes</p><p className="text-2xl font-semibold">{quizStateTotals.SCHEDULED}</p></div>
            <div className={`${ui.card} p-4`}><p className={`${ui.textLabel} mb-1`}>Past quizzes</p><p className="text-2xl font-semibold">{quizStateTotals.PAST}</p></div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className={ui.cardFull}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={ui.cardHeader}>Quiz insights</h2>
              </div>
              <div className="space-y-3 text-sm">
                {quizzes.map((quiz) => {
                  const attempts = quiz.attempts
                  const avg = attempts.length ? Math.round(attempts.reduce((a, b) => a + (b.score || 0), 0) / attempts.length) : 0
                  const timingState = getQuizTimingState(quiz, nowTs)
                  const timingLabel = timingState.charAt(0) + timingState.slice(1).toLowerCase()
                  return (
                    <div key={quiz.id} className={ui.cardInner}>
                      <p className="font-medium">{quiz.title}</p>
                      <p className="text-xs text-slate-400">
                        {quiz.module.code} · {timingLabel} · {quiz._count.questions} questions
                      </p>
                      <p className="text-xs text-slate-400">Attempts: {attempts.length} · Avg score: {avg}%</p>
                    </div>
                  )
                })}
                {quizzes.length === 0 ? <p className={ui.textSmall}>No quiz data yet.</p> : null}
              </div>
            </div>

            <div className="space-y-6">
              <div className={ui.cardFull}>
                <h2 className={ui.cardHeader}>Quiz state by module</h2>
                <div className="space-y-2 text-sm mt-3">
                  {moduleQuizSummary.map((item) => (
                    <div key={item.code} className={ui.cardInner}>
                      <p className="font-medium">{item.code}</p>
                      <p className="text-xs text-slate-400">
                        Active: {item.active} · Scheduled: {item.scheduled} · Past: {item.past} · Draft: {item.draft}
                      </p>
                    </div>
                  ))}
                  {moduleQuizSummary.length === 0 ? <p className={ui.textSmall}>No module quiz data yet.</p> : null}
                </div>
              </div>

              <div className={ui.cardFull}>
                <h2 className={ui.cardHeader}>Analogy engagement</h2>
                <div className="space-y-3 text-sm mt-3">
                  <div className={ui.cardInner}>
                    <p className="font-medium">Total interactions</p>
                    <p className="text-xs text-slate-400">
                      Views: {totalViews} · Revisits: {totalRevisits}
                    </p>
                  </div>
                  {analogySets.slice(0, 4).map((item) => (
                    <div key={item.id} className={ui.cardInner}>
                      <p className="font-medium">{item.title || "Untitled"}</p>
                      <p className="text-xs text-slate-400">
                        Views: {item.interactions.filter((i) => i.type === "VIEW").length} · Revisits: {item.interactions.filter((i) => i.type === "REVISIT").length}
                      </p>
                    </div>
                  ))}
                  {analogySets.length === 0 ? <p className={ui.textSmall}>No analogy interaction data yet.</p> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
