import { mkdir, unlink, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { prisma } from "./db"

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"])
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"])

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_VIDEO_BYTES = 30 * 1024 * 1024

const LOCAL_UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads")

const providerState = globalThis.__mediaProviderState || {
  s3Client: null,
}

if (!globalThis.__mediaProviderState) {
  globalThis.__mediaProviderState = providerState
}

function getMediaProvider() {
  const explicit = String(process.env.MEDIA_PROVIDER || "").trim().toLowerCase()
  if (explicit) return explicit

  if (process.env.AWS_S3_BUCKET && process.env.AWS_REGION) {
    return "s3"
  }

  return "local"
}

function sanitizeFilename(filename) {
  return String(filename || "asset")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 80)
}

function inferExtension(file, kind) {
  const type = String(file?.type || "").toLowerCase()
  const originalExt = path.extname(String(file?.name || "")).toLowerCase()

  if (kind === "image") {
    if (type === "image/png") return ".png"
    if (type === "image/jpeg") return ".jpg"
    if (type === "image/webp") return ".webp"
    if (type === "image/gif") return ".gif"
    if (type === "image/svg+xml") return ".svg"
    if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(originalExt)) return originalExt
    return ".png"
  }

  if (type === "video/webm") return ".webm"
  if (type === "video/quicktime") return ".mov"
  if (type === "video/x-msvideo") return ".avi"
  if (type === "video/mp4") return ".mp4"
  if ([".mp4", ".webm", ".mov", ".avi"].includes(originalExt)) return originalExt
  return ".mp4"
}

function assertKind(kind) {
  if (kind !== "image" && kind !== "video") {
    throw new Error("Invalid media kind")
  }
}

function assertFile(file, kind) {
  if (!file || typeof file === "string") {
    throw new Error("No file uploaded")
  }

  const size = Number(file.size) || 0
  const type = String(file.type || "")

  if (kind === "image") {
    if (size > MAX_IMAGE_BYTES) {
      throw new Error("Image is too large. Maximum size is 10MB.")
    }
    if (type && !IMAGE_TYPES.has(type)) {
      throw new Error("Unsupported image format. Upload PNG, JPG, WebP, GIF, or SVG.")
    }
  }

  if (kind === "video") {
    if (size > MAX_VIDEO_BYTES) {
      throw new Error("Video is too large. Maximum size is 30MB.")
    }
    if (type && !VIDEO_TYPES.has(type)) {
      throw new Error("Unsupported video format. Upload MP4, WebM, MOV, or AVI.")
    }
  }
}

function buildObjectKey({ kind, file }) {
  const prefix = String(process.env.AWS_S3_PREFIX || "lecturer-media").replace(/^\/+|\/+$/g, "")
  const now = new Date()
  const yyyy = String(now.getUTCFullYear())
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0")
  const cleanName = sanitizeFilename(path.basename(file.name || "asset"))
  const ext = inferExtension(file, kind)
  const filename = `${Date.now()}-${randomUUID()}-${cleanName}${ext}`

  return `${prefix}/${kind}/${yyyy}/${mm}/${filename}`
}

function getS3Client() {
  if (providerState.s3Client) return providerState.s3Client

  const region = process.env.AWS_REGION
  if (!region) {
    throw new Error("AWS_REGION is not configured")
  }

  providerState.s3Client = new S3Client({ region })
  return providerState.s3Client
}

function buildS3PublicUrl(bucket, key) {
  const base = String(process.env.AWS_S3_PUBLIC_BASE_URL || "").trim()
  if (base) {
    return `${base.replace(/\/$/, "")}/${key}`
  }

  const region = process.env.AWS_REGION
  if (!region) {
    throw new Error("AWS_REGION is not configured")
  }

  if (region === "us-east-1") {
    return `https://${bucket}.s3.amazonaws.com/${key}`
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
}

function parseManagedS3Object(url) {
  const bucket = String(process.env.AWS_S3_BUCKET || "").trim()
  if (!bucket || !url) return null

  try {
    const parsed = new URL(url)
    const key = decodeURIComponent(parsed.pathname.replace(/^\//, ""))
    if (!key) return null

    const base = String(process.env.AWS_S3_PUBLIC_BASE_URL || "").trim()
    if (base) {
      const baseUrl = new URL(base)
      if (baseUrl.origin === parsed.origin && parsed.pathname.startsWith(baseUrl.pathname.replace(/\/$/, "") + "/")) {
        const stripped = decodeURIComponent(parsed.pathname.replace(baseUrl.pathname.replace(/\/$/, "") + "/", ""))
        return { bucket, key: stripped }
      }
    }

    if (parsed.hostname === `${bucket}.s3.amazonaws.com` || parsed.hostname === `${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com`) {
      return { bucket, key }
    }

    return null
  } catch {
    return null
  }
}

function parseManagedLocalPath(url) {
  const value = String(url || "").trim()
  if (!value.startsWith("/uploads/")) return null
  const relativePath = value.replace(/^\/uploads\//, "")
  const localPath = path.resolve(LOCAL_UPLOAD_ROOT, relativePath)
  const uploadRoot = path.resolve(LOCAL_UPLOAD_ROOT)

  if (localPath !== uploadRoot && !localPath.startsWith(`${uploadRoot}${path.sep}`)) {
    return null
  }

  return localPath
}

async function uploadLocal({ kind, file }) {
  const folder = kind === "image" ? "images" : "quiz-videos"
  const dir = path.join(LOCAL_UPLOAD_ROOT, folder)
  await mkdir(dir, { recursive: true })

  const cleanName = sanitizeFilename(path.basename(file.name || kind))
  const extension = inferExtension(file, kind)
  const filename = `${Date.now()}-${randomUUID()}-${cleanName}${extension}`
  const targetPath = path.join(dir, filename)

  const bytes = await file.arrayBuffer()
  await writeFile(targetPath, Buffer.from(bytes))

  return {
    url: `/uploads/${folder}/${filename}`,
    provider: "local",
    key: `${folder}/${filename}`,
    size: Number(file.size) || 0,
    contentType: String(file.type || "") || null,
  }
}

async function uploadS3({ kind, file }) {
  const bucket = String(process.env.AWS_S3_BUCKET || "").trim()
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET is not configured")
  }

  const key = buildObjectKey({ kind, file })
  const client = getS3Client()
  const bytes = await file.arrayBuffer()

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: Buffer.from(bytes),
    ContentType: String(file.type || "application/octet-stream"),
  }))

  return {
    url: buildS3PublicUrl(bucket, key),
    provider: "s3",
    bucket,
    key,
    size: Number(file.size) || 0,
    contentType: String(file.type || "") || null,
  }
}

export async function uploadMedia(file, kind, metadata = {}) {
  assertKind(kind)
  assertFile(file, kind)

  const provider = getMediaProvider()
  if (provider === "s3") {
    return uploadS3({ kind, file, metadata })
  }

  return uploadLocal({ kind, file, metadata })
}

export async function uploadImage(file, metadata = {}) {
  return uploadMedia(file, "image", metadata)
}

export async function uploadVideo(file, metadata = {}) {
  return uploadMedia(file, "video", metadata)
}

export async function deleteMedia(url) {
  const provider = getMediaProvider()

  if (provider === "s3") {
    const target = parseManagedS3Object(url)
    if (!target) return { deleted: false, reason: "unmanaged-url" }

    const client = getS3Client()
    await client.send(new DeleteObjectCommand({
      Bucket: target.bucket,
      Key: target.key,
    }))

    return { deleted: true, provider: "s3" }
  }

  const localPath = parseManagedLocalPath(url)
  if (!localPath) return { deleted: false, reason: "unmanaged-url" }

  try {
    await unlink(localPath)
    return { deleted: true, provider: "local" }
  } catch {
    return { deleted: false, reason: "missing-file" }
  }
}

export async function attachMediaToTopic({
  lecturerId,
  analogySetId,
  topicIndex,
  imageUrl,
  videoUrl,
}) {
  const index = Number(topicIndex)
  if (!lecturerId || !analogySetId || !Number.isInteger(index) || index < 0) {
    throw new Error("Invalid topic target")
  }

  const analogySet = await prisma.analogySet.findFirst({
    where: { id: analogySetId, ownerId: lecturerId },
    select: { id: true, topicsJson: true },
  })

  if (!analogySet) {
    throw new Error("Analogy set not found")
  }

  const topics = Array.isArray(analogySet?.topicsJson?.topics)
    ? analogySet.topicsJson.topics
    : []

  if (index >= topics.length) {
    throw new Error("Topic not found")
  }

  const previous = topics[index] || {}
  const nextImageUrl = typeof imageUrl === "string" ? imageUrl.trim() : String(previous?.imageUrl || "")
  const nextVideoUrl = typeof videoUrl === "string" ? videoUrl.trim() : String(previous?.videoUrl || "")

  const nextTopics = topics.map((topic, topicIdx) => {
    if (topicIdx !== index) return topic
    return {
      ...topic,
      imageUrl: nextImageUrl,
      videoUrl: nextVideoUrl,
    }
  })

  const updated = await prisma.analogySet.update({
    where: { id: analogySetId },
    data: { topicsJson: { topics: nextTopics } },
    select: { id: true },
  })

  const oldImageUrl = String(previous?.imageUrl || "").trim()
  const oldVideoUrl = String(previous?.videoUrl || "").trim()

  if (oldImageUrl && oldImageUrl !== nextImageUrl) {
    await deleteMedia(oldImageUrl).catch(() => null)
  }
  if (oldVideoUrl && oldVideoUrl !== nextVideoUrl) {
    await deleteMedia(oldVideoUrl).catch(() => null)
  }

  return {
    id: updated.id,
    topicIndex: index,
    topic: nextTopics[index],
  }
}

export async function generateMediaFromPrompt() {
  throw new Error("AI media generation is disabled")
}
