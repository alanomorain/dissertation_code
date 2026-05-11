import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"
import * as ui from "../../styles/ui"
import StudentPageHeader from "../components/StudentPageHeader"

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
      <StudentPageHeader
        label="Student · Modules"
        title="Module Dashboard"
        subtitle="Your enrolled modules and available learning activity."
        actions={<Link href="/student" className={ui.buttonSecondary}>Student Dashboard</Link>}
      />

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Modules</h2>
            {enrollments.length === 0 ? (
              <p className={ui.textSmall}>No active module enrollments yet.</p>
            ) : (
              <div className="space-y-3 text-sm">
                {enrollments.map((enrollment) => (
                  <div key={enrollment.id} className={`${ui.cardList} flex flex-col gap-3 md:flex-row md:items-center md:justify-between`}>
                    <Link href={`/student/lectures?module=${encodeURIComponent(enrollment.module.code)}`} className="min-w-0 hover:text-teal-700 transition">
                      <p className="font-semibold text-stone-950">{enrollment.module.code} · {enrollment.module.name}</p>
                      <p className="text-xs text-stone-600">
                        {enrollment.module._count.lectures} lectures · {enrollment.module._count.analogySets} analogy sets · {enrollment.module._count.quizzes} quizzes
                      </p>
                    </Link>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Link href={`/student/lectures?module=${encodeURIComponent(enrollment.module.code)}`} className={ui.buttonSecondary}>Lectures</Link>
                      <Link href={`/student/quizzes?module=${encodeURIComponent(enrollment.module.code)}`} className={ui.buttonPrimary}>Quizzes</Link>
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
