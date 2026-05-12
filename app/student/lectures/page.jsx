import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"
import { getModuleDisplayName } from "../../lib/moduleDisplay"
import * as ui from "../../styles/ui"
import StudentPageHeader from "../components/StudentPageHeader"

export default async function StudentLecturesPage({ searchParams }) {
  const student = await getCurrentUser("STUDENT", { id: true, email: true })
  if (!student) redirect("/student/login")

  const resolvedSearchParams = await searchParams
  const moduleCode = String(resolvedSearchParams?.module || "").trim().toUpperCase()

  const activeEnrollments = await prisma.moduleEnrollment.findMany({
    where: { userId: student.id, status: "ACTIVE" },
    include: {
      module: {
        select: { id: true, code: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const moduleIds = activeEnrollments.map((enrollment) => enrollment.moduleId)
  const moduleLookup = new Map(activeEnrollments.map((enrollment) => [enrollment.module.code, enrollment.moduleId]))
  const selectedModuleId = moduleCode ? moduleLookup.get(moduleCode) : null

  const lectures = moduleIds.length
    ? await prisma.lecture.findMany({
        where: {
          moduleId: { in: moduleIds },
          ...(selectedModuleId ? { moduleId: selectedModuleId } : {}),
          analogySets: {
            some: {
              status: "ready",
              reviewStatus: "APPROVED",
            },
          },
        },
        include: {
          module: { select: { code: true, name: true } },
          analogySets: {
            where: {
              status: "ready",
              reviewStatus: "APPROVED",
            },
            select: { id: true },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : []

  return (
    <main className={ui.page}>
      <StudentPageHeader
        label="Student · Lectures"
        title="Lecture Dashboard"
        subtitle="Browse lecture material with approved analogies."
        actions={<Link href="/student" className={ui.buttonSecondary}>Student Dashboard</Link>}
      />

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Link href="/student/lectures" className={!moduleCode ? ui.buttonPrimary : ui.buttonSecondary}>All Modules</Link>
              {activeEnrollments.map((enrollment) => (
                <Link
                  key={enrollment.id}
                  href={`/student/lectures?module=${encodeURIComponent(enrollment.module.code)}`}
                  className={moduleCode === enrollment.module.code ? ui.buttonPrimary : ui.buttonSecondary}
                >
                  {getModuleDisplayName(enrollment.module)}
                </Link>
              ))}
            </div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Lectures with approved analogies</h2>
            {lectures.length === 0 ? (
              <p className={ui.textSmall}>No lecture content is available yet.</p>
            ) : (
              <div className="space-y-3 text-sm">
                {lectures.map((lecture) => (
                  <Link key={lecture.id} href={`/student/lectures/${lecture.id}`} className={`${ui.cardList} block hover:border-teal-500 transition`}>
                    <p className="font-semibold text-stone-950">{lecture.title}</p>
                    <p className="text-xs text-stone-600">
                      {getModuleDisplayName(lecture.module)} · {lecture.analogySets.length} analogy sets
                    </p>
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
