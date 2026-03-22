import Link from "next/link"
import { redirect } from "next/navigation"
import SignOutButton from "../../../components/SignOutButton"
import { prisma } from "../../../lib/db"
import { getCurrentUser } from "../../../lib/currentUser"
import * as ui from "../../../styles/ui"

function approvedTopicCount(analogySet) {
  const topics = Array.isArray(analogySet?.topicsJson?.topics) ? analogySet.topicsJson.topics : []
  return topics.length
}

export default async function StudentLectureDetailPage({ params }) {
  const student = await getCurrentUser("STUDENT", { id: true, email: true })
  if (!student) redirect("/student/login")

  const { id } = await params

  const lecture = await prisma.lecture.findFirst({
    where: {
      id,
      module: {
        enrollments: {
          some: {
            userId: student.id,
            status: "ACTIVE",
          },
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
        select: {
          id: true,
          title: true,
          createdAt: true,
          topicsJson: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!lecture) redirect("/student/lectures")

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContentNarrow}>
          <div>
            <p className={ui.textLabel}>Student · Lecture</p>
            <h1 className="text-lg font-semibold">{lecture.title}</h1>
            <p className={ui.textSmall}>{lecture.module.code} · {lecture.module.name}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <SignOutButton />
            <Link href="/student/lectures" className={ui.buttonSecondary}>All lectures</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.containerNarrow} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Approved analogies for this lecture</h2>
            {lecture.analogySets.length === 0 ? (
              <p className={ui.textSmall}>No approved analogies are linked to this lecture yet.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {lecture.analogySets.map((analogy) => (
                  <Link key={analogy.id} href={`/student/analogies/${analogy.id}`} className={ui.linkCard}>
                    <p className="font-medium">{analogy.title || "Untitled"}</p>
                    <p className="text-xs text-slate-400">
                      {approvedTopicCount(analogy)} topics · {new Date(analogy.createdAt).toLocaleDateString()}
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
