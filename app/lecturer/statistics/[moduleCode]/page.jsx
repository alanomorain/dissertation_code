import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { prisma } from "../../../lib/db"
import { getCurrentUser } from "../../../lib/currentUser"
import * as ui from "../../../styles/ui"

function parseRange(searchParams) {
  const range = String(searchParams?.range || "30d")
  const now = new Date()
  if (range === "7d") return { range, from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
  if (range === "90d") return { range, from: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) }
  if (range === "all") return { range, from: null }
  return { range: "30d", from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
}

function dateRangeLabel(range) {
  if (range === "7d") return "Last 7 days"
  if (range === "90d") return "Last 90 days"
  if (range === "all") return "All time"
  return "Last 30 days"
}

function scoreDeltaLabel(before, after) {
  if (before === null || after === null) return "Not enough data"
  const delta = after - before
  if (delta === 0) return "No change"
  return delta > 0 ? `+${delta}%` : `${delta}%`
}

export default async function LecturerModuleStatisticsPage({ params, searchParams }) {
  const { moduleCode } = await params
  const resolvedSearchParams = await searchParams
  const { range, from } = parseRange(resolvedSearchParams)

  const lecturerUser = await getCurrentUser("LECTURER", { id: true })
  if (!lecturerUser) redirect("/lecturer/login")

  const moduleRecord = await prisma.module.findFirst({
    where: { code: moduleCode, lecturerId: lecturerUser.id },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          user: {
            select: { id: true, email: true, studentNumber: true },
          },
        },
      },
      analogySets: {
        select: {
          id: true,
          title: true,
          interactions: {
            where: from ? { createdAt: { gte: from } } : {},
            select: { userId: true, createdAt: true },
          },
        },
      },
      quizzes: {
        include: {
          attempts: {
            where: {
              status: "SUBMITTED",
              ...(from ? { submittedAt: { gte: from } } : {}),
            },
            select: {
              id: true,
              score: true,
              studentId: true,
              submittedAt: true,
              quizId: true,
            },
          },
        },
      },
      lectures: {
        include: {
          analogySets: {
            select: {
              id: true,
              interactions: {
                where: from ? { createdAt: { gte: from } } : {},
                select: { userId: true, createdAt: true },
              },
            },
          },
          quizzes: {
            include: {
              attempts: {
                where: {
                  status: "SUBMITTED",
                  ...(from ? { submittedAt: { gte: from } } : {}),
                },
                select: {
                  id: true,
                  score: true,
                  studentId: true,
                  submittedAt: true,
                  quizId: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!moduleRecord) notFound()

  const activeStudentIds = new Set(moduleRecord.enrollments.map((enrollment) => enrollment.userId))
  const submittedAttempts = moduleRecord.quizzes.flatMap((quiz) => quiz.attempts)
  const participants = new Set(submittedAttempts.map((attempt) => attempt.studentId)).size
  const participationRate = activeStudentIds.size ? Math.round((participants / activeStudentIds.size) * 100) : 0
  const avgQuizScore = submittedAttempts.length
    ? Math.round(submittedAttempts.reduce((total, attempt) => total + (attempt.score || 0), 0) / submittedAttempts.length)
    : 0

  const quizRows = moduleRecord.quizzes.map((quiz) => {
    const attempts = quiz.attempts
    const completions = attempts.length
    const avgScore = completions
      ? Math.round(attempts.reduce((total, attempt) => total + (attempt.score || 0), 0) / completions)
      : 0
    const perStudentCount = attempts.reduce((acc, attempt) => {
      acc[attempt.studentId] = (acc[attempt.studentId] || 0) + 1
      return acc
    }, {})
    const revisits = Object.values(perStudentCount).reduce((total, count) => total + Math.max(0, count - 1), 0)

    return {
      id: quiz.id,
      title: quiz.title,
      lectureId: quiz.lectureId || "",
      completions,
      revisits,
      avgScore,
    }
  })

  const lectureRows = moduleRecord.lectures.map((lecture) => {
    const lectureAttempts = lecture.quizzes.flatMap((quiz) => quiz.attempts)
    const participants = new Set(lectureAttempts.map((attempt) => attempt.studentId)).size
    const avgScore = lectureAttempts.length
      ? Math.round(lectureAttempts.reduce((total, attempt) => total + (attempt.score || 0), 0) / lectureAttempts.length)
      : 0
    const revisits = lectureAttempts.reduce((acc, attempt) => {
      const key = `${attempt.quizId}:${attempt.studentId}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    const revisitCount = Object.values(revisits).reduce((total, count) => total + Math.max(0, count - 1), 0)
    const analogyViews = lecture.analogySets.reduce((total, set) => total + set.interactions.length, 0)

    return {
      id: lecture.id,
      title: lecture.title,
      quizCount: lecture.quizzes.length,
      analogySetCount: lecture.analogySets.length,
      analogyViews,
      completions: lectureAttempts.length,
      participants,
      avgScore,
      revisits: revisitCount,
    }
  })

  const analogyFirstViewByStudent = moduleRecord.analogySets.reduce((acc, set) => {
    set.interactions.forEach((interaction) => {
      const current = acc[interaction.userId]
      const createdAt = new Date(interaction.createdAt)
      if (!current || createdAt < current) {
        acc[interaction.userId] = createdAt
      }
    })
    return acc
  }, {})

  const attemptsByStudent = submittedAttempts.reduce((acc, attempt) => {
    if (!acc[attempt.studentId]) acc[attempt.studentId] = []
    acc[attempt.studentId].push(attempt)
    return acc
  }, {})

  const studentRows = moduleRecord.enrollments.map((enrollment) => {
    const student = enrollment.user
    const attempts = (attemptsByStudent[student.id] || []).sort(
      (a, b) => new Date(a.submittedAt || 0).getTime() - new Date(b.submittedAt || 0).getTime(),
    )
    const avgScore = attempts.length
      ? Math.round(attempts.reduce((total, attempt) => total + (attempt.score || 0), 0) / attempts.length)
      : 0
    const completedQuizzes = new Set(attempts.map((attempt) => attempt.quizId)).size
    const firstViewAt = analogyFirstViewByStudent[student.id] || null
    const beforeAttempts = firstViewAt
      ? attempts.filter((attempt) => new Date(attempt.submittedAt || 0) < firstViewAt)
      : []
    const afterAttempts = firstViewAt
      ? attempts.filter((attempt) => new Date(attempt.submittedAt || 0) >= firstViewAt)
      : []
    const beforeAvg = beforeAttempts.length
      ? Math.round(beforeAttempts.reduce((total, attempt) => total + (attempt.score || 0), 0) / beforeAttempts.length)
      : null
    const afterAvg = afterAttempts.length
      ? Math.round(afterAttempts.reduce((total, attempt) => total + (attempt.score || 0), 0) / afterAttempts.length)
      : null
    const analogyViews = moduleRecord.analogySets.reduce(
      (total, set) => total + set.interactions.filter((interaction) => interaction.userId === student.id).length,
      0,
    )

    return {
      id: student.id,
      label: student.studentNumber || student.email,
      avgScore,
      attempts: attempts.length,
      completedQuizzes,
      analogyViews,
      beforeAvg,
      afterAvg,
    }
  })

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <p className={ui.textLabel}>Lecturer · Module statistics</p>
            <h1 className="text-lg font-semibold">{moduleRecord.code} · {moduleRecord.name}</h1>
            <p className={ui.textSmall}>Range: {dateRangeLabel(range)}</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/lecturer/statistics?range=${range}`} className={ui.buttonSecondary}>Back to all modules</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className={ui.textLabel}>Date range: {dateRangeLabel(range)}</p>
              <div className="flex items-center gap-2 text-xs">
                <Link href={`/lecturer/statistics/${encodeURIComponent(moduleRecord.code)}?range=7d`} className={range === "7d" ? ui.buttonPrimary : ui.buttonSecondary}>7d</Link>
                <Link href={`/lecturer/statistics/${encodeURIComponent(moduleRecord.code)}?range=30d`} className={range === "30d" ? ui.buttonPrimary : ui.buttonSecondary}>30d</Link>
                <Link href={`/lecturer/statistics/${encodeURIComponent(moduleRecord.code)}?range=90d`} className={range === "90d" ? ui.buttonPrimary : ui.buttonSecondary}>90d</Link>
                <Link href={`/lecturer/statistics/${encodeURIComponent(moduleRecord.code)}?range=all`} className={range === "all" ? ui.buttonPrimary : ui.buttonSecondary}>All</Link>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-4 text-sm">
              <div className={`${ui.card} p-4`}><p className={ui.textLabel}>Students</p><p className="mt-1 text-2xl font-semibold">{activeStudentIds.size}</p></div>
              <div className={`${ui.card} p-4`}><p className={ui.textLabel}>Participation</p><p className="mt-1 text-2xl font-semibold">{participationRate}%</p></div>
              <div className={`${ui.card} p-4`}><p className={ui.textLabel}>Average quiz score</p><p className="mt-1 text-2xl font-semibold">{avgQuizScore}%</p></div>
              <div className={`${ui.card} p-4`}><p className={ui.textLabel}>Lectures</p><p className="mt-1 text-2xl font-semibold">{moduleRecord.lectures.length}</p></div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
            <div className={ui.cardFull}>
              <h2 className={ui.cardHeader}>Student participation and outcomes</h2>
              <div className="space-y-2 text-sm">
                {studentRows.map((student) => (
                  <div key={student.id} className={ui.cardInner}>
                    <p className="font-medium">{student.label}</p>
                    <p className="text-xs text-slate-400">
                      Avg score: {student.avgScore}% · Attempts: {student.attempts} · Completed quizzes: {student.completedQuizzes}
                    </p>
                    <p className="text-xs text-slate-400">
                      Analogy views: {student.analogyViews} · Before/After view change: {scoreDeltaLabel(student.beforeAvg, student.afterAvg)}
                    </p>
                  </div>
                ))}
                {studentRows.length === 0 ? <p className={ui.textSmall}>No active students enrolled.</p> : null}
              </div>
            </div>

            <div className={ui.cardFull}>
              <h2 className={ui.cardHeader}>Quiz engagement</h2>
              <div className="space-y-2 text-sm">
                {quizRows.map((quiz) => (
                  <div key={quiz.id} className={ui.cardInner}>
                    <p className="font-medium">{quiz.title}</p>
                    <p className="text-xs text-slate-400">
                      Completions (views): {quiz.completions} · Revisits: {quiz.revisits}
                    </p>
                    <p className="text-xs text-slate-400">Lecture linked: {quiz.lectureId ? "Yes" : "No"}</p>
                    <p className="text-xs text-slate-400">Average score: {quiz.avgScore}%</p>
                  </div>
                ))}
                {quizRows.length === 0 ? <p className={ui.textSmall}>No quizzes in this module yet.</p> : null}
              </div>
            </div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Lecture performance</h2>
            <div className="space-y-2 text-sm">
              {lectureRows.map((lecture) => (
                <div key={lecture.id} className={ui.cardInner}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{lecture.title}</p>
                    <Link href={`/lecturer/lectures/${lecture.id}`} className={ui.buttonSmall}>Open lecture</Link>
                  </div>
                  <p className="text-xs text-slate-400">
                    Quizzes: {lecture.quizCount} · Completions: {lecture.completions} · Participants: {lecture.participants} · Revisits: {lecture.revisits}
                  </p>
                  <p className="text-xs text-slate-400">
                    Avg quiz score: {lecture.avgScore}% · Analogy sets: {lecture.analogySetCount} · Analogy views: {lecture.analogyViews}
                  </p>
                </div>
              ))}
              {lectureRows.length === 0 ? <p className={ui.textSmall}>No lectures in this module yet.</p> : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
