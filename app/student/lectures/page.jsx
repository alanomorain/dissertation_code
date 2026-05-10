import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"
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
          quizzes: {
            some: {
              status: "PUBLISHED",
              OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
            },
          },
        },
        include: {
          module: { select: { code: true, name: true } },
          quizzes: {
            where: {
              status: "PUBLISHED",
              OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
            },
            select: { id: true },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : []

  const selectedModule = moduleCode
    ? activeEnrollments.find((enrollment) => enrollment.module.code === moduleCode)?.module
    : null
  const publishedQuizTotal = lectures.reduce((total, lecture) => total + lecture.quizzes.length, 0)

  return (
    <main className={ui.page}>
      <StudentPageHeader
        label="Student · Lectures"
        title="Lecture Dashboard"
        subtitle="Browse lecture material with published quizzes."
        actions={<Link href="/student" className={ui.buttonSecondary}>Student Dashboard</Link>}
      />

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div className={ui.cardFull}><p className={ui.textLabel}>Lectures</p><p className="mt-2 text-2xl font-semibold">{lectures.length}</p></div>
            <div className={ui.cardFull}><p className={ui.textLabel}>Published quizzes</p><p className="mt-2 text-2xl font-semibold">{publishedQuizTotal}</p></div>
            <div className={ui.cardFull}>
              <p className={ui.textLabel}>Module scope</p>
              <p className="mt-2 text-2xl font-semibold">{selectedModule?.code || "All"}</p>
            </div>
          </div>

          <div className={ui.cardFull}>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Link href="/student/lectures" className={!moduleCode ? ui.buttonPrimary : ui.buttonSecondary}>All modules</Link>
              {activeEnrollments.map((enrollment) => (
                <Link
                  key={enrollment.id}
                  href={`/student/lectures?module=${encodeURIComponent(enrollment.module.code)}`}
                  className={moduleCode === enrollment.module.code ? ui.buttonPrimary : ui.buttonSecondary}
                >
                  {enrollment.module.code}
                </Link>
              ))}
            </div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Lectures with available quizzes</h2>
            {lectures.length === 0 ? (
              <p className={ui.textSmall}>No lecture content is available yet.</p>
            ) : (
              <div className="space-y-3 text-sm">
                {lectures.map((lecture) => (
                  <Link key={lecture.id} href={`/student/lectures/${lecture.id}`} className={`${ui.cardList} block hover:border-teal-500 transition`}>
                    <p className="font-semibold text-stone-950">{lecture.title}</p>
                    <p className="text-xs text-stone-600">
                      {lecture.module.code} · {lecture.quizzes.length} published quizzes
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
