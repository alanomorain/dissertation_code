import Link from "next/link"
import { redirect } from "next/navigation"
import SignOutButton from "../../components/SignOutButton"
import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"
import * as ui from "../../styles/ui"

export default async function StudentAnalogiesPage({ searchParams }) {
  const studentUser = await getCurrentUser("STUDENT", {
    id: true,
    email: true,
    studentNumber: true,
  })

  if (!studentUser) redirect("/student/login")

  const activeEnrollments = await prisma.moduleEnrollment.findMany({
    where: { userId: studentUser.id, status: "ACTIVE" },
    include: { module: { select: { code: true } } },
  })
  const resolvedSearchParams = await searchParams
  const moduleCodeFilter = String(resolvedSearchParams?.module || "").trim().toUpperCase()

  const moduleIds = activeEnrollments
    .filter((enrollment) => !moduleCodeFilter || enrollment.module.code === moduleCodeFilter)
    .map((enrollment) => enrollment.moduleId)

  const analogies = moduleIds.length
    ? await prisma.analogySet.findMany({
        where: {
          status: "ready",
          reviewStatus: "APPROVED",
          moduleId: { in: moduleIds },
        },
        include: { module: { select: { code: true } } },
        orderBy: {
          createdAt: "desc",
        },
      })
    : []

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContentNarrow}>
          <div>
            <p className={ui.textLabel}>Student · Analogies</p>
            <h1 className="text-lg font-semibold">Analogy library</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <SignOutButton />
            <Link href="/student" className={ui.buttonSecondary}>Back to dashboard</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.containerNarrow} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <p className="text-slate-300 mb-2 text-sm">
              You can only access analogies from modules where your enrollment is active.
            </p>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Approved analogies</h2>

            {analogies.length === 0 ? (
              <p className={ui.textSmall}>No approved analogies are available yet for your enrolled modules.</p>
            ) : (
              <div className="space-y-4 text-sm">
                {analogies.map((analogy) => {
                  const topics =
                    analogy.topicsJson !== null &&
                    analogy.topicsJson !== undefined &&
                    typeof analogy.topicsJson === "object"
                      ? analogy.topicsJson.topics || []
                      : []

                  return (
                    <Link key={analogy.id} href={`/student/analogies/${analogy.id}`} className={ui.linkCard}>
                      <p className={`${ui.textHighlight} mb-1`}>{analogy.module?.code || "Module"}</p>
                      <h3 className="text-sm font-semibold mb-1">{analogy.title || "Untitled"}</h3>
                      <p className="text-xs text-slate-400 mb-2">
                        {topics.length} {topics.length === 1 ? "topic" : "topics"} · Created {new Date(analogy.createdAt).toLocaleDateString()}
                      </p>
                      {topics.length > 0 ? (
                        <p className="text-slate-200 text-sm line-clamp-2">{topics[0].analogy || ""}</p>
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
