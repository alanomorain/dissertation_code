import { getCurrentUser } from "../../../lib/currentUser"
import { enforceRateLimit } from "../../../lib/rateLimit"
import { enforceCsrf } from "../../../lib/security"
import { uploadImage, uploadVideo } from "../../../lib/mediaProvider"

export const runtime = "nodejs"

export async function POST(req) {
  try {
    const csrfResponse = enforceCsrf(req)
    if (csrfResponse) return csrfResponse

    const rateLimitResponse = await enforceRateLimit(req, {
      scope: "media-upload",
      limit: 40,
      windowMs: 60 * 1000,
    })
    if (rateLimitResponse) return rateLimitResponse

    const lecturer = await getCurrentUser("LECTURER", { id: true })
    if (!lecturer) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file")
    const kind = String(formData.get("kind") || "").trim().toLowerCase()

    if (kind !== "image" && kind !== "video") {
      return Response.json({ error: "Invalid media kind" }, { status: 400 })
    }

    const upload = kind === "image"
      ? await uploadImage(file, { lecturerId: lecturer.id })
      : await uploadVideo(file, { lecturerId: lecturer.id })

    return Response.json({
      url: upload.url,
      media: upload,
    })
  } catch (error) {
    const message = String(error?.message || "")

    if (message.includes("No file uploaded")) {
      return Response.json({ error: "No file uploaded" }, { status: 400 })
    }

    if (message.includes("too large")) {
      return Response.json({ error: message }, { status: 413 })
    }

    if (message.includes("Unsupported")) {
      return Response.json({ error: message }, { status: 415 })
    }

    console.error("Error uploading media:", error)
    return Response.json({ error: "Unable to upload media" }, { status: 500 })
  }
}
