import Link from "next/link"
import { prisma } from "../../../lib/db"
import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "../../../lib/currentUser"
import * as ui from "../../../styles/ui"
import MediaImagePanel from "../components/MediaImagePanel"
import AnalogyDetailActions from "../components/AnalogyDetailActions"

export default async function LecturerAnalogyDetailPage({ params }) {
  const { id } = await params
  const lecturerUser = await getCurrentUser("LECTURER", { id: true })

  if (!lecturerUser) {
    redirect("/lecturer/login")
  }

  const analogy = await prisma.analogySet.findFirst({
    where: { id, ownerId: lecturerUser.id },
    include: {
      lecture: { select: { id: true, title: true } },
      owner: true,
    },
  })

  if (!analogy) {
    notFound()
  }

  // Parse topicsJson if available
  let topics = []
  if (analogy.topicsJson !== null && analogy.topicsJson !== undefined && typeof analogy.topicsJson === "object") {
    topics = analogy.topicsJson.topics || []
  }
  const displayTitle = analogy.lecture?.title || analogy.title || "Untitled"

  return (
    <main className={ui.page}>
      {/* Top bar */}
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <h1 className="text-lg font-semibold">Analogy Details</h1>
          </div>
          <AnalogyDetailActions
            analogyId={analogy.id}
            returnHref={analogy.lecture?.id ? `/lecturer/lectures/${analogy.lecture.id}` : "/lecturer/lectures"}
            reviewStatus={analogy.reviewStatus || "DRAFT"}
          />
        </div>
      </header>

      {/* Content */}
      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          {/* Header Info */}
          <div className={ui.cardFull}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  {displayTitle}
                </h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className={ui.getBadgeClass(analogy.status)}>
                    {analogy.status}
                  </span>
                  <span className={ui.getReviewBadgeClass(analogy.reviewStatus || "DRAFT")}>
                    {(analogy.reviewStatus || "DRAFT").toLowerCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className={ui.textMuted}>Created:</span>{" "}
                <span className="text-stone-800">
                  {new Date(analogy.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className={ui.textMuted}>Approved:</span>{" "}
                <span className="text-stone-800">
                  {analogy.approvedAt
                    ? new Date(analogy.approvedAt).toLocaleDateString()
                    : "Not approved"}
                </span>
              </div>
            </div>
          </div>

          {/* Error Message (if any) */}
          {analogy.errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
              <h3 className={`${ui.cardHeader} text-red-700`}>
                Error Message
              </h3>
              <p className="text-sm text-red-700">{analogy.errorMessage}</p>
            </div>
          )}

          {/* Topics and Analogies */}
          {topics.length > 0 && (
            <div className={ui.cardFull}>
              <h3 className={ui.cardHeader}>
                Topics & Analogies ({topics.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {topics.map((item, index) => (
                  <div
                    key={index}
                    className={ui.cardInner}
                  >
                    <Link
                      href={`/lecturer/analogies/${analogy.id}/topics/${index}`}
                      className="block rounded-md border border-transparent hover:border-teal-500/40 transition p-2 -m-2"
                    >
                      <h4 className="font-medium text-teal-700 mb-2">
                        {item.topic || "Unknown Topic"}
                      </h4>
                      <p className="text-sm text-stone-700">
                        {item.analogy || "No analogy provided"}
                      </p>
                    </Link>

                    <MediaImagePanel
                      topicTitle={item.topic || ""}
                      analogySetId={analogy.id}
                      topicIndex={index}
                      initialImageUrl={String(item.imageUrl || "").trim()}
                      initialVideoUrl={String(item.videoUrl || "").trim()}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No topics message - only show if no error and no topics */}
          {topics.length === 0 && !analogy.errorMessage && (
            <div className={ui.cardFull}>
              <p className={ui.textSmall}>
                No topics and analogies available yet.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
