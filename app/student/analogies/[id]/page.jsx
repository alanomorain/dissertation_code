import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { prisma } from "../../../lib/db"
import { getCurrentUser } from "../../../lib/currentUser"
import * as ui from "../../../styles/ui"
import StudentPageHeader from "../../components/StudentPageHeader"

function getTopics(topicsJson) {
  return Array.isArray(topicsJson?.topics) ? topicsJson.topics : []
}

export default async function StudentAnalogyDetailPage({ params }) {
  const { id } = await params
  const student = await getCurrentUser("STUDENT", { id: true, email: true })
  if (!student) redirect("/student/login")

  const analogy = await prisma.analogySet.findFirst({
    where: {
      id,
      status: "ready",
      reviewStatus: "APPROVED",
      module: {
        enrollments: {
          some: { userId: student.id, status: "ACTIVE" },
        },
      },
    },
    include: {
      module: { select: { code: true, name: true } },
      lecture: { select: { id: true, title: true } },
    },
  })

  if (!analogy) notFound()

  const topics = getTopics(analogy.topicsJson)

  return (
    <main className={ui.page}>
      <StudentPageHeader
        label="Student · Analogies"
        title={analogy.lecture?.title || analogy.title || "Analogy set"}
        subtitle={`${analogy.module?.code || "Module"} · ${topics.length} topics`}
        actions={<Link href="/student/analogies" className={ui.buttonSecondary}>Back to analogies</Link>}
      />

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className={ui.textLabel}>{analogy.module?.code} · {analogy.module?.name}</p>
                <h2 className="mt-1 text-xl font-semibold text-stone-950">
                  {analogy.lecture?.title || analogy.title || "Analogy set"}
                </h2>
              </div>
              {analogy.lecture?.id ? (
                <Link href={`/student/lectures/${analogy.lecture.id}`} className={ui.buttonSecondary}>
                  View lecture
                </Link>
              ) : null}
            </div>
          </div>

          {topics.length === 0 ? (
            <div className={ui.cardFull}>
              <p className={ui.textSmall}>No topics are available in this analogy set yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {topics.map((topic, index) => (
                <article key={`${topic.topic || "topic"}-${index}`} className={ui.cardFull}>
                  <p className={ui.textHighlight}>Topic {index + 1}</p>
                  <h3 className="mt-1 text-lg font-semibold text-stone-950">
                    {topic.topic || "Untitled topic"}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-stone-700">
                    {topic.analogy || "No analogy text provided."}
                  </p>
                  {topic.imageUrl ? (
                    <div
                      className="mt-4 aspect-video w-full rounded-xl border border-stone-200 bg-cover bg-center"
                      style={{ backgroundImage: `url(${topic.imageUrl})` }}
                    />
                  ) : null}
                  {topic.feedback ? (
                    <p className="mt-3 text-xs text-stone-500">{topic.feedback}</p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
