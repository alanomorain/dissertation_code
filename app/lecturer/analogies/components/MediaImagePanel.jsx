"use client"

import { useRef, useState } from "react"
import Image from "next/image"

export default function MediaImagePanel({
  topicTitle,
  analogySetId,
  topicIndex,
  initialImageUrl = "",
  initialVideoUrl = "",
}) {
  const [imageUrl, setImageUrl] = useState(initialImageUrl)
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl)
  const [uploadingKind, setUploadingKind] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")

  const imageInputRef = useRef(null)
  const videoInputRef = useRef(null)

  const canSaveToTopic = Boolean(analogySetId) && Number.isInteger(Number(topicIndex))

  const upload = async (kind, file) => {
    if (!file) return

    setUploadingKind(kind)
    setError("")
    setInfo("")

    try {
      const formData = new FormData()
      formData.append("kind", kind)
      formData.append("file", file)

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error || "Upload failed")
      }

      if (kind === "image") {
        setImageUrl(String(data.url || ""))
      } else {
        setVideoUrl(String(data.url || ""))
      }

      setInfo(`${kind === "image" ? "Image" : "Video"} uploaded.`)
    } catch (err) {
      setError(err.message || "Upload failed")
    } finally {
      setUploadingKind("")
    }
  }

  const saveToTopic = async () => {
    if (!canSaveToTopic) {
      setInfo("Saved locally for this session.")
      return
    }

    setSaving(true)
    setError("")
    setInfo("")

    try {
      const res = await fetch("/api/media/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analogySetId,
          topicIndex,
          imageUrl,
          videoUrl,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Failed to save media")
      }

      setInfo("Media saved to this topic.")
    } catch (err) {
      setError(err.message || "Failed to save media")
    } finally {
      setSaving(false)
    }
  }

  const clearMedia = async (kind) => {
    const currentUrl = kind === "image" ? imageUrl : videoUrl
    if (!currentUrl) return

    setError("")
    setInfo("")

    try {
      await fetch("/api/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: currentUrl }),
      }).catch(() => null)

      if (kind === "image") {
        setImageUrl("")
      } else {
        setVideoUrl("")
      }

      setInfo(`${kind === "image" ? "Image" : "Video"} removed.`)
    } catch (err) {
      setError(err.message || "Failed to clear media")
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-slate-800/70 bg-slate-900/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          Media: <span className="text-slate-200">manual upload</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className="hidden"
            onChange={(event) => upload("image", event.target.files?.[0])}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
            className="hidden"
            onChange={(event) => upload("video", event.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploadingKind === "image"}
            className="text-xs rounded-lg border border-slate-600 px-3 py-1 hover:border-indigo-400 hover:text-indigo-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploadingKind === "image" ? "Uploading..." : "Upload image"}
          </button>
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={uploadingKind === "video"}
            className="text-xs rounded-lg border border-slate-600 px-3 py-1 hover:border-indigo-400 hover:text-indigo-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploadingKind === "video" ? "Uploading..." : "Upload video"}
          </button>
          <button
            type="button"
            onClick={saveToTopic}
            disabled={saving}
            className="text-xs rounded-lg border border-emerald-600 px-3 py-1 hover:border-emerald-400 hover:text-emerald-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save media"}
          </button>
        </div>
      </div>

      {topicTitle ? (
        <p className="mt-2 text-xs text-slate-400">Topic: <span className="text-slate-200">{topicTitle}</span></p>
      ) : null}

      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
      {info ? <p className="mt-2 text-xs text-emerald-300">{info}</p> : null}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-slate-800 bg-slate-950/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-400">Image</p>
            {imageUrl ? (
              <button
                type="button"
                onClick={() => clearMedia("image")}
                className="text-[11px] text-slate-400 hover:text-red-300"
              >
                Clear
              </button>
            ) : null}
          </div>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={topicTitle ? `${topicTitle} illustration` : "Topic illustration"}
              width={512}
              height={256}
              unoptimized
              className="mt-2 h-32 w-full rounded object-cover"
            />
          ) : (
            <div className="mt-2 h-32 rounded bg-slate-800/40" />
          )}
          <input
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://..."
            className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
          />
        </div>

        <div className="rounded-md border border-slate-800 bg-slate-950/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-400">Video</p>
            {videoUrl ? (
              <button
                type="button"
                onClick={() => clearMedia("video")}
                className="text-[11px] text-slate-400 hover:text-red-300"
              >
                Clear
              </button>
            ) : null}
          </div>
          {videoUrl ? (
            <video src={videoUrl} controls className="mt-2 h-32 w-full rounded bg-black object-cover" />
          ) : (
            <div className="mt-2 h-32 rounded bg-slate-800/40" />
          )}
          <input
            type="url"
            value={videoUrl}
            onChange={(event) => setVideoUrl(event.target.value)}
            placeholder="https://..."
            className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
          />
        </div>
      </div>
    </div>
  )
}
