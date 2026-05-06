import { readFile, stat } from "node:fs/promises"
import path from "node:path"

export const runtime = "nodejs"

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads")

const CONTENT_TYPES = {
  ".avi": "video/x-msvideo",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webm": "video/webm",
  ".webp": "image/webp",
}

function resolveUploadPath(segments = []) {
  const relativePath = segments.map((segment) => String(segment || "")).join(path.sep)
  const resolvedPath = path.resolve(UPLOAD_ROOT, relativePath)
  const resolvedRoot = path.resolve(UPLOAD_ROOT)

  if (resolvedPath !== resolvedRoot && resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)) {
    return resolvedPath
  }

  return null
}

export async function GET(_req, { params }) {
  const { path: uploadPath = [] } = await params
  const filePath = resolveUploadPath(uploadPath)

  if (!filePath) {
    return new Response("Not found", { status: 404 })
  }

  try {
    const fileStat = await stat(filePath)
    if (!fileStat.isFile()) {
      return new Response("Not found", { status: 404 })
    }

    const file = await readFile(filePath)
    const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream"

    return new Response(file, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(file.length),
        "Content-Type": contentType,
      },
    })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
