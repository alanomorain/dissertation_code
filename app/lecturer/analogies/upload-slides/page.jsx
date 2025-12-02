"use client"

import { useState } from "react"
import Link from "next/link"

export default function UploadSlidesPage() {
  const [moduleCode, setModuleCode] = useState("CSC7058")
  const [slidesFile, setSlidesFile] = useState(null)
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    setSlidesFile(file || null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    if (!slidesFile) {
      setMessage({
        type: "error",
        text: "Please select a slides file to upload.",
      })
      setSaving(false)
      return
    }

    // For now, just log – this is where you'll later call an API
    console.log("Slides upload: ", {
      moduleCode,
      slidesFile,
      notes,
    })

    setTimeout(() => {
      setSaving(false)
      setMessage({
        type: "success",
        text:
          "Slides uploaded (mock). In the final system this will trigger analysis and analogy generation.",
      })
    }, 800)
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">
              Upload Lecture Slides
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/lecturer/analogies"
              className="rounded-lg border border-slate-600 px-3 py-1.5 hover:border-indigo-400 hover:text-indigo-200 transition"
            >
              Back to analogies
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 md:p-8">
            <p className="text-sm text-slate-300 mb-4">
              This page represents the first step in the LLM pipeline.
            </p>

            {message && (
              <div
                className={`mb-4 rounded-lg px-3 py-2 text-sm ${
                  message.type === "error"
                    ? "bg-red-900/40 border border-red-600 text-red-100"
                    : "bg-emerald-900/40 border border-emerald-500 text-emerald-100"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              {/* Module selection */}
              <div className="space-y-1">
                <label
                  htmlFor="module"
                  className="block text-sm font-medium text-slate-200"
                >
                  Module
                </label>
                <select
                  id="module"
                  value={moduleCode}
                  onChange={(e) => setModuleCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                >
                  <option value="CSC7058">
                    CSC7058 · Individual Software Development Project
                  </option>
                  <option value="CSC7084">CSC7084 · Web Development</option>
                  <option value="CSC7072">CSC7072 · Databases</option>
                </select>
                <p className="text-xs text-slate-400">
                  Choose which module these slides belong to.
                </p>
              </div>

              {/* Slides file */}
              <div className="space-y-1">
                <label
                  htmlFor="slides"
                  className="block text-sm font-medium text-slate-200"
                >
                  Slide deck file
                </label>
                <input
                  id="slides"
                  type="file"
                  accept=".pdf,.ppt,.pptx,.key,.odp"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-indigo-400"
                />
                <p className="text-xs text-slate-400">
                  Upload your lecture slides (PDF, PowerPoint, etc.).
                </p>
                {slidesFile && (
                  <p className="text-xs text-slate-300 mt-1">
                    Selected file:{" "}
                    <span className="font-medium">{slidesFile.name}</span>
                  </p>
                )}
              </div>

              {/* Optional notes */}
              <div className="space-y-1">
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-slate-200"
                >
                  Notes for the generator (optional)
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  placeholder="E.g. focus on explaining microservices vs monolith, avoid going too deep into deployment details..."
                />
                <p className="text-xs text-slate-400">
                  These notes are passed to the LLM as extra context
                  or constraints when generating analogies.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {saving ? "Uploading..." : "Upload slides"}
                </button>
                <Link
                  href="/lecturer/analogies"
                  className="text-sm text-slate-300 hover:text-indigo-200"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
