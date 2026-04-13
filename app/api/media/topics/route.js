import { getCurrentUser } from "../../../lib/currentUser"
import { enforceRateLimit } from "../../../lib/rateLimit"
import { enforceCsrf } from "../../../lib/security"
import { attachMediaToTopic } from "../../../lib/mediaProvider"

export const runtime = "nodejs"

export async function POST(req) {
  try {
    const csrfResponse = enforceCsrf(req)
    if (csrfResponse) return csrfResponse

    const rateLimitResponse = await enforceRateLimit(req, {
      scope: "media-topic-attach",
      limit: 50,
      windowMs: 60 * 1000,
    })
    if (rateLimitResponse) return rateLimitResponse

    const lecturer = await getCurrentUser("LECTURER", { id: true })
    if (!lecturer) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const analogySetId = String(body.analogySetId || "").trim()
    const parsedIndex = Number(body.topicIndex)
    const topicIndex = Number.isInteger(parsedIndex) ? parsedIndex : -1

    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : undefined
    const videoUrl = typeof body.videoUrl === "string" ? body.videoUrl : undefined

    const result = await attachMediaToTopic({
      lecturerId: lecturer.id,
      analogySetId,
      topicIndex,
      imageUrl,
      videoUrl,
    })

    return Response.json({ ok: true, ...result })
  } catch (error) {
    const message = String(error?.message || "")
    if (message.includes("not found")) {
      return Response.json({ error: message }, { status: 404 })
    }
    if (message.includes("Invalid topic target")) {
      return Response.json({ error: message }, { status: 400 })
    }

    console.error("Error attaching media to topic:", error)
    return Response.json({ error: "Unable to attach media to topic" }, { status: 500 })
  }
}
