import Link from "next/link"
import { redirect } from "next/navigation"
import SignOutButton from "../../components/SignOutButton"
import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"
import * as ui from "../../styles/ui"

export default async function StudentModulesPage() {
  const student = await getCurrentUser("STUDENT", { id: true, email: true })
  if (!student) redirect("/student/login")

  const enrollments = await prisma.moduleEnrollment.findMany({
    where: { userId: student.id, status: "ACTIVE" },
    include: {
      module: {
        include: {
          _count: {
            select: {
              lectures: true,
              analogySets: true,
              quizzes: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContentNarrow}>
          <div>
            <p className={ui.textLabel}>Student · Modules</p>
            <h1 className="text-lg font-semibold">Your enrolled modules</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <SignOutButton />
            <Link href="/student" className={ui.buttonSecondary}>Back to dashboard</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.containerNarrow} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Modules</h2>
            {enrollments.length === 0 ? (
              <p className={ui.textSmall}>No active module enrollments yet.</p>
            ) : (
              <div className="space-y-3 text-sm">
                {enrollments.map((enrollment) => (
                  <div key={enrollment.id} className={ui.cardList}>
                    <p className="font-semibold text-slate-100">{enrollment.module.code} · {enrollment.module.name}</p>
                    <p className="text-xs text-slate-400">
                      {enrollment.module._count.lectures} lectures · {enrollment.module._count.quizzes} quizzes
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs">
                      <Link href={`/student/lectures?module=${encodeURIComponent(enrollment.module.code)}`} className="text-slate-300 hover:text-indigo-200 transition">Lectures</Link>
                      <Link href={`/student/quizzes?module=${encodeURIComponent(enrollment.module.code)}`} className="text-slate-300 hover:text-indigo-200 transition">Quizzes</Link>
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
