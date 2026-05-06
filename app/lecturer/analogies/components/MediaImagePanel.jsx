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
  const [savedImageUrl, setSavedImageUrl] = useState(initialImageUrl)
  const [savedVideoUrl, setSavedVideoUrl] = useState(initialVideoUrl)
  const [uploadingKind, setUploadingKind] = useState("")
  const [saving, setSaving] = useState(false)
  const [clearingKind, setClearingKind] = useState("")
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")

  const imageInputRef = useRef(null)
  const videoInputRef = useRef(null)

  const canSaveToTopic = Boolean(analogySetId) && Number.isInteger(Number(topicIndex))
  const hasUnsavedChanges = imageUrl !== savedImageUrl || videoUrl !== savedVideoUrl

  const persistTopicMedia = async (nextImageUrl, nextVideoUrl) => {
    if (!canSaveToTopic) {
      setInfo("Media changes are only saved after this analogy topic exists.")
      return null
    }

    const res = await fetch("/api/media/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        analogySetId,
        topicIndex,
        imageUrl: nextImageUrl,
        videoUrl: nextVideoUrl,
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.error || "Failed to save media")
    }

    const savedTopic = data.topic || {}
    const nextSavedImage = String(savedTopic.imageUrl || "").trim()
    const nextSavedVideo = String(savedTopic.videoUrl || "").trim()

    setImageUrl(nextSavedImage)
    setVideoUrl(nextSavedVideo)
    setSavedImageUrl(nextSavedImage)
    setSavedVideoUrl(nextSavedVideo)

    return data
  }

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

      setInfo(`${kind === "image" ? "Image" : "Video"} uploaded. Save media to attach it to this topic.`)
    } catch (err) {
      setError(err.message || "Upload failed")
    } finally {
      setUploadingKind("")
      if (kind === "image" && imageInputRef.current) imageInputRef.current.value = ""
      if (kind === "video" && videoInputRef.current) videoInputRef.current.value = ""
    }
  }

  const saveToTopic = async () => {
    if (!canSaveToTopic) {
      setInfo("Media changes are only saved after this analogy topic exists.")
      return
    }

    setSaving(true)
    setError("")
    setInfo("")

    try {
      await persistTopicMedia(imageUrl, videoUrl)
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
    const savedUrl = kind === "image" ? savedImageUrl : savedVideoUrl

    setError("")
    setInfo("")
    setClearingKind(kind)

    try {
      if (currentUrl !== savedUrl) {
        if (kind === "image") setImageUrl(savedImageUrl)
        if (kind === "video") setVideoUrl(savedVideoUrl)
        setInfo(`${kind === "image" ? "Image" : "Video"} preview cleared. The saved topic media was not changed.`)
        return
      }

      const nextImageUrl = kind === "image" ? "" : imageUrl
      const nextVideoUrl = kind === "video" ? "" : videoUrl

      if (canSaveToTopic) {
        await persistTopicMedia(nextImageUrl, nextVideoUrl)
        setInfo(`${kind === "image" ? "Image" : "Video"} removed from this topic.`)
        return
      }

      if (kind === "image") setImageUrl("")
      if (kind === "video") setVideoUrl("")
      setInfo(`${kind === "image" ? "Image" : "Video"} cleared from this form.`)
    } catch (err) {
      setError(err.message || "Failed to clear media")
    } finally {
      setClearingKind("")
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-stone-200 bg-stone-100 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-stone-600">
          Media: <span className="text-stone-800">manual upload</span>
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
            className="text-xs rounded-lg border border-stone-300 px-3 py-1 hover:border-teal-500 hover:text-teal-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploadingKind === "image" ? "Uploading..." : "Upload image"}
          </button>
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={uploadingKind === "video"}
            className="text-xs rounded-lg border border-stone-300 px-3 py-1 hover:border-teal-500 hover:text-teal-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploadingKind === "video" ? "Uploading..." : "Upload video"}
          </button>
          <button
            type="button"
            onClick={saveToTopic}
            disabled={saving}
            className="text-xs rounded-lg border border-emerald-600 px-3 py-1 hover:border-emerald-400 hover:text-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save media"}
          </button>
        </div>
      </div>

      {topicTitle ? (
        <p className="mt-2 text-xs text-stone-600">Topic: <span className="text-stone-800">{topicTitle}</span></p>
      ) : null}

      {hasUnsavedChanges ? (
        <p className="mt-2 text-xs text-amber-700">Unsaved media changes. Save media before leaving this page.</p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      {info ? <p className="mt-2 text-xs text-emerald-700">{info}</p> : null}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-stone-200 bg-stone-50/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-stone-600">Image</p>
            {imageUrl ? (
              <button
                type="button"
                onClick={() => clearMedia("image")}
                disabled={clearingKind === "image"}
                className="text-[11px] text-stone-600 hover:text-red-700"
              >
                {clearingKind === "image" ? "Clearing..." : "Clear"}
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
            <div className="mt-2 h-32 rounded bg-stone-100/40" />
          )}
          <input
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://..."
            className="mt-2 w-full rounded border border-stone-300 bg-white px-2 py-1 text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="rounded-md border border-stone-200 bg-stone-50/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-stone-600">Video</p>
            {videoUrl ? (
              <button
                type="button"
                onClick={() => clearMedia("video")}
                disabled={clearingKind === "video"}
                className="text-[11px] text-stone-600 hover:text-red-700"
              >
                {clearingKind === "video" ? "Clearing..." : "Clear"}
              </button>
            ) : null}
          </div>
          {videoUrl ? (
            <video src={videoUrl} controls className="mt-2 h-32 w-full rounded bg-black object-cover" />
          ) : (
            <div className="mt-2 h-32 rounded bg-stone-100/40" />
          )}
          <input
            type="url"
            value={videoUrl}
            onChange={(event) => setVideoUrl(event.target.value)}
            placeholder="https://..."
            className="mt-2 w-full rounded border border-stone-300 bg-white px-2 py-1 text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>
    </div>
  )
}
