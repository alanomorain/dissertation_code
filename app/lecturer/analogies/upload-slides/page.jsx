"use client"

import { useState } from "react"
import Link from "next/link"

export default function UploadSlidesPage() {
  const [moduleCode, setModuleCode] = useState("CSC7058")
  const [slidesFile, setSlidesFile] = useState(null)
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)          // for upload+topics
  const [message, setMessage] = useState(null)

  // topics + extracted text
  const [topics, setTopics] = useState([])
  const [newTopic, setNewTopic] = useState("")
  const [extractedText, setExtractedText] = useState("")

  // NEW: analogy generation state
  const [generating, setGenerating] = useState(false)
  const [analogies, setAnalogies] = useState([])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    setSlidesFile(file || null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    setTopics([])
    setExtractedText("")
    setAnalogies([])

    if (!slidesFile) {
      setMessage({
        type: "error",
        text: "Please select a slides file to upload.",
      })
      setSaving(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append("file", slidesFile)
      formData.append("moduleCode", moduleCode)
      formData.append("notes", notes)

      const res = await fetch("/api/upload-slides", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Upload or analysis failed.")
      }

      const data = await res.json()

      setTopics(data.topics || [])
      setExtractedText(data.extractedText || "")

      setMessage({
        type: "success",
        text: "Slides processed. Suggested topics are shown below.",
      })
    } catch (err) {
      console.error(err)
      setMessage({
        type: "error",
        text: err.message || "Something went wrong while processing your slides.",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveTopic = (topicToRemove) => {
    setTopics((prev) => prev.filter((t) => t !== topicToRemove))
  }

  const handleAddTopic = () => {
    if (!newTopic.trim()) return
    setTopics((prev) => [...prev, newTopic.trim()])
    setNewTopic("")
  }

  const handleGenerateAnalogies = async () => {
    if (topics.length === 0) {
      setMessage({
        type: "error",
        text: "Please keep at least one topic before generating analogies.",
      })
      return
    }

    setGenerating(true)
    setMessage(null)
    setAnalogies([])

    try {
      const res = await fetch("/api/generate-analogies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleCode,
          topics,
          notes,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Analogy generation failed.")
      }

      const data = await res.json()
      setAnalogies(data.analogies || data.points || [])

      setMessage({
        type: "success",
        text: "Analogies generated :)",
      })
    } catch (err) {
      console.error(err)
      setMessage({
        type: "error",
        text: err.message || "Something went wrong while generating analogies.",
      })
    } finally {
      setGenerating(false)
    }
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
              Back to Analogies
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

            {/* Upload + topic suggestion form */}
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
                  These notes are passed to the LLM as extra context for suggesting topics
                  and generating analogies.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {saving ? "Processing..." : "Upload & suggest topics"}
                </button>
                <Link
                  href="/lecturer/analogies"
                  className="text-sm text-slate-300 hover:text-indigo-200"
                >
                  Cancel
                </Link>
              </div>
            </form>

            {/* Extracted text preview */}
            {extractedText && (
              <section className="mt-8 border-t border-slate-800 pt-4">
                <h2 className="text-base font-semibold mb-2">
                  Extracted text (preview)
                </h2>
                <p className="text-xs text-slate-400 mb-2">
                  This is a shortened preview of the text extracted from your slides.
                </p>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-200 whitespace-pre-wrap">
                  {extractedText.slice(0, 1500)}
                  {extractedText.length > 1500 && "…"}
                </div>
              </section>
            )}

            {/* Suggested topics */}
            {topics.length > 0 && (
              <section className="mt-8 border-t border-slate-800 pt-4">
                <h2 className="text-base font-semibold mb-3">
                  Suggested topics for analogies
                </h2>
                <p className="text-xs text-slate-400 mb-3">
                  Remove anything that doesn't fit and add any extra topics you want analogies for.
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {topics.map((topic) => (
                    <span
                      key={topic}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs"
                    >
                      {topic}
                      <button
                        type="button"
                        className="text-slate-400 hover:text-red-300"
                        onClick={() => handleRemoveTopic(topic)}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="Add a new topic…"
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  />
                <button
                    type="button"
                    onClick={handleAddTopic}
                    className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium hover:bg-slate-600"
                  >
                    Add
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAnalogies}
                  disabled={topics.length === 0 || generating}
                  className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {generating ? "Generating analogies..." : "Generate analogies for selected topics"}
                </button>
              </section>
            )}

            {/* Generated analogies */}
            {analogies.length > 0 && (
              <section className="mt-8 border-t border-slate-800 pt-4">
                <h2 className="text-base font-semibold mb-3">
                  Generated analogies
                </h2>
                <p className="text-xs text-slate-400 mb-3">
                  These analogies were generated based on the topics you selected.
                </p>

                <div className="space-y-3">
                  {analogies.map((point, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"
                    >
                      <p className="text-xs font-semibold text-slate-100 mb-1">
                        Topic {idx + 1}
                      </p>
                      <p className="text-sm text-slate-200 mb-2">
                        {point.original}
                      </p>
                      <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                        {point.analogies?.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}