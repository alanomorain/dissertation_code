import Link from "next/link"
import { redirect } from "next/navigation"
import StudentSwitcher from "../../components/StudentSwitcher"
import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"
import * as ui from "../../styles/ui"

export default async function StudentStatisticsPage() {
  const studentUser = await getCurrentUser("STUDENT", { id: true, email: true })
  if (!studentUser) redirect("/student/login")

  const availableStudents = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: { id: true, email: true, studentNumber: true },
    orderBy: [{ studentNumber: "asc" }, { email: "asc" }],
  })

  const attempts = await prisma.quizAttempt.findMany({
    where: { studentId: studentUser.id, status: "SUBMITTED" },
    include: {
      quiz: {
        include: { module: { select: { code: true } } },
      },
    },
    orderBy: { submittedAt: "desc" },
  })

  const analogyViews = await prisma.analogyInteraction.count({
    where: { userId: studentUser.id },
  })

  const averageScore = attempts.length
    ? Math.round(attempts.reduce((total, attempt) => total + (attempt.score || 0), 0) / attempts.length)
    : 0

  const modulePerformance = Object.values(
    attempts.reduce((acc, attempt) => {
      const code = attempt.quiz.module.code
      if (!acc[code]) {
        acc[code] = { code, attempts: 0, totalScore: 0 }
      }
      acc[code].attempts += 1
      acc[code].totalScore += attempt.score || 0
      return acc
    }, {}),
  )

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContentNarrow}>
          <div>
            <p className={ui.textLabel}>Student · Statistics</p>
            <h1 className="text-lg font-semibold">Performance overview</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <StudentSwitcher currentEmail={studentUser.email} students={availableStudents} />
            <Link href="/student" className={ui.buttonSecondary}>Back to dashboard</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.containerNarrow} ${ui.pageSpacing}`}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className={ui.cardFull}><p className={ui.textLabel}>Quiz attempts</p><p className="mt-2 text-2xl font-semibold">{attempts.length}</p></div>
            <div className={ui.cardFull}><p className={ui.textLabel}>Average score</p><p className="mt-2 text-2xl font-semibold">{averageScore}%</p></div>
            <div className={ui.cardFull}><p className={ui.textLabel}>Analogy views</p><p className="mt-2 text-2xl font-semibold">{analogyViews}</p></div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Module performance</h2>
            <div className="space-y-3 text-sm">
              {modulePerformance.map((item) => (
                <div key={item.code} className={ui.cardList}>
                  <p className="font-medium">{item.code}</p>
                  <p className="text-xs text-slate-400">
                    Attempts: {item.attempts} · Average score: {Math.round(item.totalScore / item.attempts)}%
                  </p>
                </div>
              ))}
              {modulePerformance.length === 0 ? <p className={ui.textSmall}>No quiz attempts submitted yet.</p> : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
