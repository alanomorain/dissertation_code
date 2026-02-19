import Link from "next/link"
import { redirect } from "next/navigation"
import StudentSwitcher from "../components/StudentSwitcher"
import { prisma } from "../lib/db"
import { getCurrentUser } from "../lib/currentUser"
import * as ui from "../styles/ui"

export default async function StudentDashboard() {
  const studentUser = await getCurrentUser("STUDENT", {
    id: true,
    email: true,
    studentNumber: true,
  })

  if (!studentUser) redirect("/student/login")

  const availableStudents = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: { id: true, email: true, studentNumber: true },
    orderBy: [{ studentNumber: "asc" }, { email: "asc" }],
  })

  const activeEnrollments = await prisma.moduleEnrollment.findMany({
    where: { userId: studentUser.id, status: "ACTIVE" },
    include: { module: true },
    orderBy: { createdAt: "desc" },
  })

  const moduleIds = activeEnrollments.map((enrollment) => enrollment.moduleId)

  const recentAnalogies = moduleIds.length
    ? await prisma.analogySet.findMany({
        where: {
          status: "ready",
          reviewStatus: "APPROVED",
          moduleId: { in: moduleIds },
        },
        include: { module: { select: { code: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 4,
      })
    : []

  const quizAttempts = await prisma.quizAttempt.findMany({
    where: { studentId: studentUser.id, status: "SUBMITTED" },
    select: { score: true },
  })

  const averageScore = quizAttempts.length
    ? Math.round(quizAttempts.reduce((total, attempt) => total + (attempt.score || 0), 0) / quizAttempts.length)
    : 0

  const upcomingQuizzes = await prisma.quiz.findMany({
    where: {
      status: "PUBLISHED",
      module: {
        enrollments: {
          some: { userId: studentUser.id, status: "ACTIVE" },
        },
      },
    },
    select: {
      id: true,
      title: true,
      dueAt: true,
      module: { select: { code: true } },
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    take: 4,
  })

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <h1 className="text-lg font-semibold">Student Dashboard</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <StudentSwitcher currentEmail={studentUser.email} students={availableStudents} />
            <span className="hidden sm:inline text-slate-300">
              <span className="font-medium">{studentUser.email}</span> · Student
            </span>
            <Link href="/student/login" className={ui.buttonSecondary}>Log out</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} py-6 space-y-5`}>
          <div className={ui.cardFull}>
            <h2 className="text-xl font-semibold mb-2">Welcome back 👋</h2>
            <p className="text-sm text-slate-300 mb-3">
              View approved analogies from your enrolled modules, complete published quizzes, and track your performance trends.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className={ui.cardInner}>
                <h3 className="text-base font-semibold mb-1">Analogies</h3>
                <p className="text-sm text-slate-300 mb-3">Browse module-specific analogies approved by your lecturer.</p>
                <Link href="/student/analogies" className={ui.buttonPrimary}>View analogies</Link>
              </div>
              <div className={ui.cardInner}>
                <h3 className="text-base font-semibold mb-1">Quizzes</h3>
                <p className="text-sm text-slate-300 mb-3">Take quizzes for your active modules and review feedback.</p>
                <Link href="/student/quizzes" className={ui.buttonPrimary}>Open quizzes</Link>
              </div>
              <div className={ui.cardInner}>
                <h3 className="text-base font-semibold mb-1">Statistics</h3>
                <p className="text-sm text-slate-300 mb-3">Monitor scores, attempts, and engagement across modules.</p>
                <Link href="/student/statistics" className={ui.buttonPrimary}>View statistics</Link>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr,1.5fr]">
            <div className={ui.cardFull}>
              <h3 className={ui.cardHeader}>Your active modules</h3>
              <div className="space-y-3 text-sm">
                {activeEnrollments.map((enrollment) => (
                  <div key={enrollment.id} className={ui.cardList}>
                    <p className="font-medium">{enrollment.module.code} · {enrollment.module.name}</p>
                    <p className="text-xs text-slate-400">Enrollment active</p>
                  </div>
                ))}
                {activeEnrollments.length === 0 ? <p className={ui.textSmall}>No active module enrollments yet.</p> : null}
              </div>
            </div>

            <div className="space-y-6">
              <div className={ui.cardFull}>
                <h3 className={ui.cardHeader}>Quick stats</h3>
                <ul className="space-y-1 text-sm text-slate-300">
                  <li>• {activeEnrollments.length} active modules</li>
                  <li>• {upcomingQuizzes.length} published quizzes</li>
                  <li>• {recentAnalogies.length} approved analogies</li>
                  <li>• {averageScore}% average quiz score</li>
                </ul>
              </div>

              <div className={ui.cardFull}>
                <h3 className={ui.cardHeader}>Upcoming quizzes</h3>
                <div className="space-y-2 text-sm">
                  {upcomingQuizzes.map((quiz) => (
                    <Link key={quiz.id} href={`/student/quizzes/${quiz.id}/start`} className={ui.linkCard}>
                      <p className="font-medium">{quiz.title}</p>
                      <p className="text-xs text-slate-400">{quiz.module.code} · Due {quiz.dueAt ? new Date(quiz.dueAt).toLocaleDateString() : "Any time"}</p>
                    </Link>
                  ))}
                  {upcomingQuizzes.length === 0 ? <p className={ui.textSmall}>No published quizzes available right now.</p> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
