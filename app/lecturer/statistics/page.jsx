import Link from "next/link"
import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"
import * as ui from "../../styles/ui"

export default async function LecturerStatisticsPage() {
  const lecturerUser = await getCurrentUser("LECTURER", { id: true })

  const quizzes = lecturerUser
    ? await prisma.quiz.findMany({
        where: { ownerId: lecturerUser.id },
        include: { attempts: { where: { status: "SUBMITTED" } } },
      })
    : []

  const analogySets = lecturerUser
    ? await prisma.analogySet.findMany({
        where: { ownerId: lecturerUser.id },
        include: { interactions: true },
      })
    : []

  const allAttempts = quizzes.flatMap((quiz) => quiz.attempts)
  const avgQuizScore = allAttempts.length
    ? Math.round(allAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / allAttempts.length)
    : 0

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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 text-sm">
            <div className={`${ui.card} p-4`}><p className={`${ui.textLabel} mb-1`}>Total analogies</p><p className="text-2xl font-semibold">{analogySets.length}</p></div>
            <div className={`${ui.card} p-4`}><p className={`${ui.textLabel} mb-1`}>Avg quiz score</p><p className="text-2xl font-semibold">{avgQuizScore}%</p></div>
            <div className={`${ui.card} p-4`}><p className={`${ui.textLabel} mb-1`}>Analogy views</p><p className="text-2xl font-semibold">{totalViews}</p></div>
            <div className={`${ui.card} p-4`}><p className={`${ui.textLabel} mb-1`}>Analogy revisits</p><p className="text-2xl font-semibold">{totalRevisits}</p></div>
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
                  return (
                    <div key={quiz.id} className={ui.cardInner}>
                      <p className="font-medium">{quiz.title}</p>
                      <p className="text-xs text-slate-400">Attempts: {attempts.length} · Avg score: {avg}%</p>
                    </div>
                  )
                })}
                {quizzes.length === 0 ? <p className={ui.textSmall}>No quiz data yet.</p> : null}
              </div>
            </div>

            <div className={ui.cardFull}>
              <h2 className={ui.cardHeader}>Analogy performance</h2>
              <div className="space-y-3 text-sm mt-3">
                {analogySets.slice(0, 5).map((item) => (
                  <div key={item.id} className={ui.cardInner}>
                    <p className="font-medium">{item.title || "Untitled"}</p>
                    <p className="text-xs text-slate-400">Views: {item.interactions.filter((i) => i.type === "VIEW").length} · Revisits: {item.interactions.filter((i) => i.type === "REVISIT").length}</p>
                  </div>
                ))}
                {analogySets.length === 0 ? <p className={ui.textSmall}>No analogy interaction data yet.</p> : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
