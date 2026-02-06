"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import * as ui from "../../../styles/ui"
import MediaImagePanel from "../components/MediaImagePanel"

export default function UploadSlidesPage() {
  const router = useRouter()
  const [modules, setModules] = useState([])
  const [moduleCode, setModuleCode] = useState("")
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
  const [selectedAnalogies, setSelectedAnalogies] = useState([])
  // For regenerating single analogies
  const [regeneratingIndex, setRegeneratingIndex] = useState(null)
  // For persisting to DB
  const [persisting, setPersisting] = useState(false)

  // Module creation modal state
  const [showModuleModal, setShowModuleModal] = useState(false)
  const [newModuleCode, setNewModuleCode] = useState("")
  const [newModuleName, setNewModuleName] = useState("")
  const [newModuleDescription, setNewModuleDescription] = useState("")
  const [creatingModule, setCreatingModule] = useState(false)
  const [moduleError, setModuleError] = useState("")

  // Fetch modules on mount
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await fetch("/api/modules")
        if (res.ok) {
          const data = await res.json()
          setModules(data)
          if (data.length > 0) {
            setModuleCode(data[0].code)
          }
        }
      } catch (err) {
        console.error("Failed to fetch modules:", err)
      }
    }
    fetchModules()
  }, []) 

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
    setSelectedAnalogies([])

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
      const generated = data.analogies || data.points || []
      setAnalogies(generated)
      setSelectedAnalogies(generated.map((item) => item.analogies?.[0] || ""))

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

  const handleRegenerateTopic = async (idx) => {
  const topic = topics[idx]
  if (!topic) return

  setRegeneratingIndex(idx)
  setMessage(null)

  try {
    const res = await fetch("/api/generate-analogies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduleCode,
        topics: [topic], // only regenerate this one
        notes,
      }),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || "Analogy regeneration failed.")
    }

    const data = await res.json()
    const newSet = (data.analogies || data.points || [])[0]

    if (!newSet) {
      throw new Error("No analogies returned for this topic.")
    }

    // Replace only this topic's analogies in state
    setAnalogies((prev) => {
      const copy = [...prev]
      copy[idx] = newSet
      return copy
    })

    setSelectedAnalogies((prev) => {
      const next = [...prev]
      const current = prev[idx]
      const list = newSet.analogies || []
      next[idx] = list.includes(current) ? current : (list[0] || "")
      return next
    })

    setMessage({
      type: "success",
      text: `Analogies regenerated for "${topic}".`,
    })
  } catch (err) {
    console.error(err)
    setMessage({
      type: "error",
      text: err.message || "Something went wrong while regenerating analogies.",
    })
  } finally {
    setRegeneratingIndex(null)
  }
}

  const handlePersistAnalogies = async () => {
    if (topics.length === 0) {
      setMessage({
        type: "error",
        text: "No topics available to persist.",
      })
      return
    }

    setPersisting(true)
    setMessage(null)

    try {
      const selectedTopics = analogies.map((point, idx) => ({
        topic: point.original || topics[idx] || "",
        analogy: selectedAnalogies[idx] || point.analogies?.[0] || "",
      }))

      const res = await fetch("/api/generate-analogies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persist: true,
          topics,
          selectedAnalogies: selectedTopics,
          sourceText: extractedText,
          notes,
          title: `Slides: ${slidesFile?.name || "Untitled"}`,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to persist analogies.")
      }

      const data = await res.json()

      setMessage({
        type: "success",
        text: "Analogies saved! Redirecting...",
      })

      // Redirect to the detail page
      setTimeout(() => {
        router.push(`/lecturer/analogies/${data.id}`)
      }, 500)
    } catch (err) {
      console.error(err)
      setMessage({
        type: "error",
        text: err.message || "Something went wrong while saving analogies.",
      })
    } finally {
      setPersisting(false)
    }
  }

  const handleCreateModule = async () => {
    if (!newModuleCode.trim() || !newModuleName.trim()) {
      setModuleError("Module code and name are required")
      return
    }

    setCreatingModule(true)
    setModuleError("")

    try {
      const res = await fetch("/api/modules/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newModuleCode.trim(),
          name: newModuleName.trim(),
          description: newModuleDescription.trim(),
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create module")
      }

      const data = await res.json()

      // Add the new module to the modules list
      setModules((prev) => [...prev, data])

      // Select the newly created module
      setModuleCode(data.code)
      setShowModuleModal(false)
      setNewModuleCode("")
      setNewModuleName("")
      setNewModuleDescription("")

      setMessage({
        type: "success",
        text: `Module "${data.name}" created successfully!`,
      })
    } catch (err) {
      console.error(err)
      setModuleError(err.message || "Something went wrong")
    } finally {
      setCreatingModule(false)
    }
  }


  return (
    <main className={ui.page}>
      {/* Top bar */}
      <header className={ui.header}>
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">
              Upload Lecture Slides
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/lecturer/analogies"
              className={ui.buttonSecondary}
            >
              Back to Analogies
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className={ui.pageSection}>
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className={`${ui.card} p-6 md:p-8`}>
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
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === "new") {
                      setShowModuleModal(true)
                    } else {
                      setModuleCode(val)
                    }
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                >
                  {modules.map((module) => (
                    <option key={module.id} value={module.code}>
                      {module.code} · {module.name}
                    </option>
                  ))}
                  <option value="new" className="text-indigo-300">
                    ➕ Create new module...
                  </option>
                </select>
                <p className="text-xs text-slate-400">
                  Choose which module these slides belong to, or create a new one.
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
                  className={`${ui.buttonPrimary} px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed`}
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
                <h2 className={ui.cardHeader}>
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
                <h2 className={`${ui.cardHeader} mb-3`}>
                  Suggested topics for analogies
                </h2>
                <p className="text-xs text-slate-400 mb-3">
                  Remove anything that doesn&apos;t fit and add any extra topics you want analogies for.
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
                  className={`${ui.buttonPrimary} px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {generating ? "Generating analogies..." : "Generate analogies for selected topics"}
                </button>

                {analogies.length > 0 && (
                  <button
                    type="button"
                    onClick={handlePersistAnalogies}
                    disabled={persisting}
                    className={`ml-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {persisting ? "Saving..." : "Save to database & view"}
                  </button>
                )}
              </section>
            )}

            {/* Generated analogies */}
            {analogies.length > 0 && (
              <section className="mt-8 border-t border-slate-800 pt-4">
                <h2 className={`${ui.cardHeader} mb-3`}>
                  Generated analogies
                </h2>
                <p className="text-xs text-slate-400 mb-3">
                  You can regenerate the analogy for any topic without affecting the others.
                </p>

                <div className="space-y-3">
                  {analogies.map((point, idx) => (
                    <div
                      key={idx}
                      className={ui.cardInner}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-slate-100 mb-1">
                            Topic {idx + 1}
                          </p>
                          <p className="text-sm text-slate-200 mb-2">
                            {point.original}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRegenerateTopic(idx)}
                          disabled={regeneratingIndex === idx}
                          className="rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:border-indigo-400 hover:text-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {regeneratingIndex === idx ? "Regenerating…" : "Regenerate"}
                        </button>
                      </div>

                      <div className="mt-2 space-y-2">
                        {(point.analogies || []).map((a, i) => (
                          <label key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <input
                              type="radio"
                              name={`analogy-${idx}`}
                              checked={selectedAnalogies[idx] === a}
                              onChange={() =>
                                setSelectedAnalogies((prev) => {
                                  const next = [...prev]
                                  next[idx] = a
                                  return next
                                })
                              }
                            />
                            <span>{a}</span>
                          </label>
                        ))}
                      </div>

                      <MediaImagePanel
                        analogyText={selectedAnalogies[idx] || point.analogies?.[0] || ""}
                        topicTitle={point.original || ""}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </section>

      {/* Module creation modal */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`${ui.card} p-6 w-full max-w-md rounded-lg border border-slate-700`}>
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
              Create New Module
            </h2>

            <div className="space-y-3">
              {/* Module code input */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Module Code
                </label>
                <input
                  type="text"
                  value={newModuleCode}
                  onChange={(e) => setNewModuleCode(e.target.value.toUpperCase())}
                  placeholder="e.g., CSC7099"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Unique identifier (e.g., CSC7099, 3-10 characters)
                </p>
              </div>

              {/* Module name input */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Module Name
                </label>
                <input
                  type="text"
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                  placeholder="e.g., Advanced Cloud Computing"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Full name of the module
                </p>
              </div>

              {/* Optional description */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newModuleDescription}
                  onChange={(e) => setNewModuleDescription(e.target.value)}
                  placeholder="Brief description of the module..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              {/* Error message in modal */}
              {moduleError && (
                <div className="rounded-lg bg-red-900/40 border border-red-600 px-3 py-2 text-xs text-red-100">
                  {moduleError}
                </div>
              )}

              {/* Modal actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModuleModal(false)
                    setNewModuleCode("")
                    setNewModuleName("")
                    setNewModuleDescription("")
                    setModuleError("")
                  }}
                  className="flex-1 rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateModule}
                  disabled={creatingModule}
                  className={`flex-1 ${ui.buttonPrimary} py-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors`}
                >
                  {creatingModule ? "Creating..." : "Create Module"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}