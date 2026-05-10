import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"
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
          module: { select: { code: true, name: true } },
          lecture: { select: { title: true } },
        },
        orderBy: [{ module: { code: "asc" } }, { createdAt: "desc" }],
      })
    : []

  const topicTotal = analogySets.reduce((total, set) => total + getTopics(set.topicsJson).length, 0)

  return (
    <main className={ui.page}>
      <StudentPageHeader
        label="Student · Analogies"
        title="Analogy Library"
        subtitle="Approved analogy sets from your active modules."
        actions={<Link href="/student" className={ui.buttonSecondary}>Student Dashboard</Link>}
      />

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className="grid gap-4 text-sm md:grid-cols-3">
            <div className={ui.cardFull}>
              <p className={ui.textLabel}>Analogy sets</p>
              <p className="mt-2 text-2xl font-semibold">{analogySets.length}</p>
            </div>
            <div className={ui.cardFull}>
              <p className={ui.textLabel}>Topics</p>
              <p className="mt-2 text-2xl font-semibold">{topicTotal}</p>
            </div>
            <div className={ui.cardFull}>
              <p className={ui.textLabel}>Module scope</p>
              <p className="mt-2 text-2xl font-semibold">{selectedEnrollment?.module.code || "All"}</p>
            </div>
          </div>

          <div className={ui.cardFull}>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Link href="/student/analogies" className={!selectedEnrollment ? ui.buttonPrimary : ui.buttonSecondary}>
                All modules
              </Link>
              {activeEnrollments.map((enrollment) => (
                <Link
                  key={enrollment.id}
                  href={`/student/analogies?module=${encodeURIComponent(enrollment.module.code)}`}
                  className={selectedEnrollment?.module.code === enrollment.module.code ? ui.buttonPrimary : ui.buttonSecondary}
                >
                  {enrollment.module.code}
                </Link>
              ))}
            </div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Analogy sets</h2>
            {analogySets.length === 0 ? (
              <p className={ui.textSmall}>No approved analogies are available for this view yet.</p>
            ) : (
              <div className="grid gap-3 text-sm md:grid-cols-2">
                {analogySets.map((set) => {
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
                        {set.module?.code || "Module"} · {topics.length} topics
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
