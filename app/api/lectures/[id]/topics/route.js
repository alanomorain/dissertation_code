import { prisma } from "../../../../lib/db"
import { getCurrentUser } from "../../../../lib/currentUser"

export const runtime = "nodejs"

export async function GET(_req, { params }) {
  try {
    const lecturer = await getCurrentUser("LECTURER", { id: true })
    if (!lecturer) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const lecture = await prisma.lecture.findFirst({
      where: {
        id,
        ownerId: lecturer.id,
      },
      select: { id: true },
    })

    if (!lecture) {
      return Response.json({ error: "Lecture not found" }, { status: 404 })
    }

    const analogySets = await prisma.analogySet.findMany({
      where: {
        ownerId: lecturer.id,
        lectureId: id,
        status: "ready",
        reviewStatus: "APPROVED",
      },
      select: {
        id: true,
        title: true,
        topicsJson: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const items = analogySets.flatMap((set) => {
      const topics = Array.isArray(set?.topicsJson?.topics) ? set.topicsJson.topics : []
      return topics
        .map((topic, index) => ({
          analogySetId: set.id,
          analogySetTitle: set.title || "Untitled analogy",
          topicIndex: index,
          topic: String(topic?.topic || "").trim(),
          analogy: String(topic?.analogy || "").trim(),
          imageUrl: String(topic?.imageUrl || "").trim(),
          topicVideoUrl: String(topic?.videoUrl || "").trim(),
        }))
        .filter((topic) => topic.topic && topic.analogy)
    })

    return Response.json({ topics: items })
  } catch (error) {
    console.error("Error fetching lecture topics:", error)
    return Response.json({ error: "Unable to load lecture topics" }, { status: 500 })
  }
}
