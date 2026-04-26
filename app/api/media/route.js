import { getCurrentUser } from "../../lib/currentUser"
import { enforceRateLimit } from "../../lib/rateLimit"
import { enforceCsrf } from "../../lib/security"
import { attachMediaToTopic } from "../../lib/mediaProvider"

export const runtime = "nodejs"

export async function DELETE(req) {
  try {
    const csrfResponse = enforceCsrf(req)
    if (csrfResponse) return csrfResponse

    const rateLimitResponse = await enforceRateLimit(req, {
      scope: "media-delete",
      limit: 40,
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
    const kind = String(body.kind || "").trim().toLowerCase()

    if (!analogySetId || topicIndex < 0 || !["image", "video"].includes(kind)) {
      return Response.json(
        { error: "analogySetId, topicIndex, and kind are required" },
        { status: 400 },
      )
    }

    const result = await attachMediaToTopic({
      lecturerId: lecturer.id,
      analogySetId,
      topicIndex,
      ...(kind === "image" ? { imageUrl: "" } : {}),
      ...(kind === "video" ? { videoUrl: "" } : {}),
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

    console.error("Error deleting media:", error)
    return Response.json({ error: "Unable to delete media" }, { status: 500 })
  }
}
