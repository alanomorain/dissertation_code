"use client"

import { useState } from "react"
import Image from "next/image"

export default function MediaImagePanel({ analogyText, topicTitle }) {
  const [imageUrl, setImageUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleGenerateImage = async () => {
    if (!analogyText) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analogyText,
          topic: topicTitle,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to generate image")
      }

      const data = await res.json()
      setImageUrl(data.dataUrl || "")
    } catch (err) {
      console.error(err)
      setError(err.message || "Image generation failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-slate-800/70 bg-slate-900/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          Media:{" "}
          <span className="text-slate-200">
            {loading ? "Generating image…" : imageUrl ? "Image ready" : "Not generated"}
          </span>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleGenerateImage}
            disabled={loading || !analogyText}
            className="text-xs rounded-lg border border-slate-600 px-3 py-1 hover:border-indigo-400 hover:text-indigo-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Generating…" : "Generate Image"}
          </button>
          <button
            type="button"
            disabled
            className="text-xs rounded-lg border border-slate-600 px-3 py-1 opacity-60 cursor-not-allowed"
          >
            Generate Video
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-300">
          {error}
        </p>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-slate-800 bg-slate-950/40 p-3">
          <p className="text-xs text-slate-400">Image preview</p>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={topicTitle ? `${topicTitle} illustration` : "Generated illustration"}
              width={512}
              height={256}
              unoptimized
              className="mt-2 h-32 w-full rounded object-cover"
            />
          ) : (
            <div className="mt-2 h-32 rounded bg-slate-800/40"></div>
          )}
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/40 p-3">
          <p className="text-xs text-slate-400">Video preview</p>
          <div className="mt-2 h-32 rounded bg-slate-800/40"></div>
        </div>
      </div>
    </div>
  )
}
