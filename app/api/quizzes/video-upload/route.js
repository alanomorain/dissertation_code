import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { getCurrentUser } from "../../../lib/currentUser"
import { enforceRateLimit } from "../../../lib/rateLimit"
import { enforceCsrf } from "../../../lib/security"

export const runtime = "nodejs"

const MAX_UPLOAD_BYTES = 30 * 1024 * 1024
const ALLOWED_FILE_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
])

function sanitizeFilename(filename) {
  return String(filename || "video")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 80)
}

function getExtension(file) {
  if (file.type === "video/webm") return ".webm"
  if (file.type === "video/quicktime") return ".mov"
  if (file.type === "video/mp4") return ".mp4"

  const original = String(file.name || "")
  const ext = path.extname(original).toLowerCase()
  if ([".mp4", ".webm", ".mov"].includes(ext)) return ext
  return ".mp4"
}

export async function POST(req) {
  try {
    const csrfResponse = enforceCsrf(req)
    if (csrfResponse) {
      return csrfResponse
    }

    const rateLimitResponse = await enforceRateLimit(req, {
      scope: "quiz-video-upload",
      limit: 40,
      windowMs: 60 * 1000,
    })
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const lecturer = await getCurrentUser("LECTURER", { id: true })
    if (!lecturer) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file")

    if (!file || typeof file === "string") {
      return Response.json({ error: "No video file uploaded" }, { status: 400 })
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return Response.json(
        { error: "Video is too large. Maximum size is 30MB." },
        { status: 413 },
      )
    }

    if (file.type && !ALLOWED_FILE_TYPES.has(file.type)) {
      return Response.json(
        { error: "Unsupported video format. Upload MP4, WebM, or MOV." },
        { status: 415 },
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), "public", "uploads", "quiz-videos")
    await mkdir(uploadDir, { recursive: true })

    const cleanName = sanitizeFilename(path.basename(file.name || "video"))
    const extension = getExtension(file)
    const filename = `${Date.now()}-${randomUUID()}-${cleanName}${extension}`
    const targetPath = path.join(uploadDir, filename)

    await writeFile(targetPath, buffer)

    return Response.json({
      url: `/uploads/quiz-videos/${filename}`,
      filename,
      size: file.size,
    })
  } catch (error) {
    console.error("Error uploading quiz video:", error)
    return Response.json({ error: "Unable to upload video" }, { status: 500 })
  }
}
