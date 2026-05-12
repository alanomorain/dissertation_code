import Link from "next/link"
import { prisma } from "../../../../../lib/db"
import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "../../../../../lib/currentUser"
import * as ui from "../../../../../styles/ui"
import MediaImagePanel from "../../../components/MediaImagePanel"

export default async function LecturerTopicDetailPage({ params }) {
  const { id, topicIndex } = await params
  const lecturerUser = await getCurrentUser("LECTURER", { id: true })

  if (!lecturerUser) {
    redirect("/lecturer/login")
  }

  const analogy = await prisma.analogySet.findFirst({
    where: { id, ownerId: lecturerUser.id },
    include: { lecture: { select: { title: true } } },
  })

  if (!analogy) {
    notFound()
  }

  let topics = []
  if (analogy.topicsJson && typeof analogy.topicsJson === "object") {
    topics = analogy.topicsJson.topics || []
  }

  const index = Number(topicIndex)
  if (Number.isNaN(index) || index < 0 || index >= topics.length) {
    notFound()
  }

  const topic = topics[index] || {}
  const displayTitle = analogy.lecture?.title || analogy.title || "Analogy"
  const prevIndex = index > 0 ? index - 1 : null
  const nextIndex = index < topics.length - 1 ? index + 1 : null

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <p className={ui.textLabel}>Lecturer · Topic</p>
            <h1 className="text-lg font-semibold">
              {displayTitle}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {prevIndex !== null && (
              <Link
                href={`/lecturer/analogies/${id}/topics/${prevIndex}`}
                className={ui.buttonSecondary}
              >
                ← Previous Topic
              </Link>
            )}
            <Link
              href={`/lecturer/analogies/${id}`}
              className={ui.buttonSecondary}
            >
              ← Back to Analogy
            </Link>
            <Link
              href="/lecturer/analogies"
              className={ui.buttonSecondary}
            >
              Analogy Dashboard
            </Link>
            {nextIndex !== null && (
              <Link
                href={`/lecturer/analogies/${id}/topics/${nextIndex}`}
                className={ui.buttonSecondary}
              >
                Next Topic →
              </Link>
            )}
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <h2 className="text-xl font-semibold mb-2">
              {topic.topic || "Unknown Topic"}
            </h2>
            <p className="text-sm text-stone-700">
              {topic.analogy || "No analogy provided"}
            </p>

            <MediaImagePanel
              topicTitle={topic.topic || ""}
              analogySetId={analogy.id}
              topicIndex={index}
              initialImageUrl={String(topic.imageUrl || "").trim()}
              initialVideoUrl={String(topic.videoUrl || "").trim()}
            />
          </div>
        </div>
      </section>
    </main>
  )
}
