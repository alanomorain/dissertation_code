import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"
import { getModuleDisplayName } from "../../lib/moduleDisplay"
import { isLectureRevisionUnlocked } from "../../lib/studentRevisionAccess"
import * as ui from "../../styles/ui"
import StudentPageHeader from "../components/StudentPageHeader"

function getTopics(topicsJson) {
  return Array.isArray(topicsJson?.topics) ? topicsJson.topics : []
}

export default async function StudentAnalogiesPage({ searchParams }) {
  const student = await getCurrentUser("STUDENT", { id: true, email: true })
  if (!student) redirect("/student/login")

  const resolvedSearchParams = await searchParams
  const moduleCode = String(resolvedSearchParams?.module || "").trim().toUpperCase()

  const activeEnrollments = await prisma.moduleEnrollment.findMany({
    where: { userId: student.id, status: "ACTIVE" },
    include: {
      module: { select: { id: true, code: true, name: true } },
    },
    orderBy: { module: { code: "asc" } },
  })

  const moduleIds = activeEnrollments.map((enrollment) => enrollment.moduleId)
  const selectedEnrollment = moduleCode
    ? activeEnrollments.find((enrollment) => enrollment.module.code === moduleCode)
    : null
  const scopedModuleIds = selectedEnrollment ? [selectedEnrollment.moduleId] : moduleIds

  const analogySets = scopedModuleIds.length
    ? await prisma.analogySet.findMany({
        where: {
          status: "ready",
          reviewStatus: "APPROVED",
          moduleId: { in: scopedModuleIds },
        },
        include: {
          module: {
            select: {
              code: true,
              name: true,
              quizzes: {
                where: {
                  status: "PUBLISHED",
                  OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
                },
                select: {
                  dueAt: true,
                  maxAttempts: true,
                  attempts: {
                    where: { studentId: student.id },
                    select: { status: true, score: true },
                  },
                },
              },
            },
          },
          lecture: {
            select: {
              title: true,
              quizzes: {
                where: {
                  status: "PUBLISHED",
                  OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
                },
                select: {
                  dueAt: true,
                  maxAttempts: true,
                  attempts: {
                    where: { studentId: student.id },
                    select: { status: true, score: true },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ module: { code: "asc" } }, { createdAt: "desc" }],
      })
    : []

  const revisionAnalogySets = analogySets.filter((set) =>
    isLectureRevisionUnlocked({
      ...set.lecture,
      module: { quizzes: set.module?.quizzes || [] },
    }),
  )

  return (
    <main className={ui.page}>
      <StudentPageHeader
        label="Student · Analogies"
        title="Analogy Dashboard"
        subtitle="Revision analogy sets unlocked after quiz completion or close."
        actions={<Link href="/student" className={ui.buttonSecondary}>Student Dashboard</Link>}
      />

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Link href="/student/analogies" className={!selectedEnrollment ? ui.buttonPrimary : ui.buttonSecondary}>
                All Modules
              </Link>
              {activeEnrollments.map((enrollment) => (
                <Link
                  key={enrollment.id}
                  href={`/student/analogies?module=${encodeURIComponent(enrollment.module.code)}`}
                  className={selectedEnrollment?.module.code === enrollment.module.code ? ui.buttonPrimary : ui.buttonSecondary}
                >
                  {getModuleDisplayName(enrollment.module)}
                </Link>
              ))}
            </div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Analogy sets</h2>
            {revisionAnalogySets.length === 0 ? (
              <p className={ui.textSmall}>No revision analogy sets are unlocked for this view yet.</p>
            ) : (
              <div className="grid gap-3 text-sm md:grid-cols-2">
                {revisionAnalogySets.map((set) => {
                  const topics = getTopics(set.topicsJson)
                  return (
                    <Link
                      key={set.id}
                      href={`/student/analogies/${set.id}`}
                      className={`${ui.cardList} block transition hover:border-teal-500`}
                    >
                      <p className="font-semibold text-stone-950">
                        {set.lecture?.title || set.title || "Analogy set"}
                      </p>
                      <p className="text-xs text-stone-600">
                        {set.module ? getModuleDisplayName(set.module) : "Module"} · {topics.length} topics
                      </p>
                      {topics[0]?.topic ? (
                        <p className="mt-2 text-xs text-stone-500">First topic: {topics[0].topic}</p>
                      ) : null}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
