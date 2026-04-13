import { getCurrentUser } from "../../lib/currentUser"
import { enforceRateLimit } from "../../lib/rateLimit"
import { enforceCsrf } from "../../lib/security"
import { deleteMedia } from "../../lib/mediaProvider"

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
    const url = String(body.url || "").trim()

    if (!url) {
      return Response.json({ error: "Media URL is required" }, { status: 400 })
    }

    const result = await deleteMedia(url)
    return Response.json({ ok: true, ...result })
  } catch (error) {
    console.error("Error deleting media:", error)
    return Response.json({ error: "Unable to delete media" }, { status: 500 })
  }
}
