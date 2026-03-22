"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import * as ui from "../../../styles/ui"

const makeTopicState = (topic, candidates = []) => ({
  topic,
  candidates,
  analogy: candidates[0] || "",
  feedback: "",
  isEditing: false,
  editingCandidateIndex: null,
  preEditAnalogy: "",
  imageUrl: "",
  imageStyle: "",
  videoUrl: "",
  videoNotes: "",
})

function UploadSlidesPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [modules, setModules] = useState([])
  const [moduleCode, setModuleCode] = useState("")
  const [slidesFile, setSlidesFile] = useState(null)
  const [lectureTitle, setLectureTitle] = useState("")
  const [notes, setNotes] = useState("")

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const [topics, setTopics] = useState([])
  const [newTopic, setNewTopic] = useState("")
  const [extractedText, setExtractedText] = useState("")

  const [generating, setGenerating] = useState(false)
  const [topicStates, setTopicStates] = useState([])
  const [regeneratingIndex, setRegeneratingIndex] = useState(null)

  const [approving, setApproving] = useState(false)
  const [analogySetId, setAnalogySetId] = useState("")

  const [activeStep, setActiveStep] = useState("analogies")
  const [imageLoadingIndex, setImageLoadingIndex] = useState(null)
  const [savingSummary, setSavingSummary] = useState(false)

  const [showModuleModal, setShowModuleModal] = useState(false)
  const [newModuleCode, setNewModuleCode] = useState("")
  const [newModuleName, setNewModuleName] = useState("")
  const [newModuleDescription, setNewModuleDescription] = useState("")
  const [creatingModule, setCreatingModule] = useState(false)
  const [moduleError, setModuleError] = useState("")

  const moduleFromUrl = searchParams.get("module") || ""

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await fetch("/api/modules")
        if (!res.ok) return
        const data = await res.json()
        setModules(data)
      } catch (err) {
        console.error("Failed to fetch modules:", err)
      }
    }
    fetchModules()
  }, [])

  useEffect(() => {
    if (!modules.length) return

    if (moduleFromUrl) {
      const match = modules.find((m) => m.code === moduleFromUrl)
      if (match && match.code !== moduleCode) {
        setModuleCode(match.code)
        return
      }
    }

    if (!moduleCode) {
      setModuleCode(modules[0].code)
    }
  }, [modules, moduleFromUrl, moduleCode])

  const canApproveAnalogies = useMemo(
    () => topicStates.length > 0 && topicStates.every((item) => item.analogy.trim()),
    [topicStates],
  )

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    setSlidesFile(file || null)

    if (file && !lectureTitle.trim()) {
      const baseName = file.name.replace(/\.[^/.]+$/, "")
      setLectureTitle(baseName.slice(0, 200))
    }
  }

  const updateTopicState = (index, patch) => {
    setTopicStates((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
    )
  }

  const startEditingSelectedAnalogy = (topicIndex) => {
    setTopicStates((prev) =>
      prev.map((item, idx) => {
        if (idx !== topicIndex) return item
        const selectedIndex = item.candidates.findIndex((candidate) => candidate === item.analogy)
        return {
          ...item,
          isEditing: true,
          editingCandidateIndex: selectedIndex >= 0 ? selectedIndex : 0,
          preEditAnalogy: item.analogy,
        }
      }),
    )
  }

  const handleSelectedAnalogyEdit = (topicIndex, value) => {
    setTopicStates((prev) =>
      prev.map((item, idx) => {
        if (idx !== topicIndex) return item
        const candidateIndex = item.editingCandidateIndex
        if (candidateIndex === null || candidateIndex < 0 || candidateIndex >= item.candidates.length) {
          return { ...item, analogy: value }
        }

        const nextCandidates = item.candidates.map((candidate, index) =>
          index === candidateIndex ? value : candidate,
        )

        return {
          ...item,
          analogy: value,
          candidates: nextCandidates,
        }
      }),
    )
  }

  const finishEditingSelectedAnalogy = (topicIndex) => {
    setTopicStates((prev) =>
      prev.map((item, idx) => {
        if (idx !== topicIndex) return item

        const finalized = item.analogy.trim() || item.preEditAnalogy || item.candidates[0] || ""
        const candidateIndex = item.editingCandidateIndex
        const nextCandidates =
          candidateIndex !== null &&
          candidateIndex >= 0 &&
          candidateIndex < item.candidates.length
            ? item.candidates.map((candidate, index) =>
                index === candidateIndex ? finalized : candidate,
              )
            : item.candidates

        return {
          ...item,
          analogy: finalized,
          candidates: nextCandidates,
          isEditing: false,
          editingCandidateIndex: null,
          preEditAnalogy: "",
        }
      }),
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    setTopics([])
    setExtractedText("")
    setTopicStates([])
    setAnalogySetId("")
    setActiveStep("analogies")

    if (!slidesFile) {
      setMessage({ type: "error", text: "Please select a slides file to upload." })
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
      setMessage({ type: "success", text: "Slides processed. Suggested topics are shown below." })
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
      setMessage({ type: "error", text: "Please keep at least one topic before generating analogies." })
      return
    }

    setGenerating(true)
    setMessage(null)
    setTopicStates([])

    try {
      const res = await fetch("/api/generate-analogies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleCode, topics, notes }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Analogy generation failed.")
      }

      const data = await res.json()
      const generated = data.analogies || data.points || []
      const nextTopicStates = generated.map((item, idx) =>
        makeTopicState(item.original || topics[idx] || "", item.analogies || []),
      )

      setTopicStates(nextTopicStates)
      setMessage({ type: "success", text: "Analogies generated. Pick your favourite for each topic." })
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

  const buildRegenerationNotes = (topicItem) => {
    const parts = []
    if (topicItem.analogy.trim()) {
      parts.push(`Current selected analogy to improve:\n${topicItem.analogy.trim()}`)
    }
    if (notes.trim()) {
      parts.push(`Global lecturer notes:\n${notes.trim()}`)
    }
    if (topicItem.feedback.trim()) {
      parts.push(`Topic-specific feedback to apply:\n${topicItem.feedback.trim()}`)
    }
    return parts.join("\n\n")
  }

  const handleRegenerateTopic = async (idx) => {
    const item = topicStates[idx]
    if (!item?.topic) return
    if (!item.analogy?.trim()) {
      setMessage({
        type: "error",
        text: "Please select a favourite analogy before regenerating.",
      })
      return
    }

    setRegeneratingIndex(idx)
    setMessage(null)

    try {
      const res = await fetch("/api/generate-analogies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleCode,
          concept: item.topic,
          notes: buildRegenerationNotes(item),
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Analogy regeneration failed.")
      }

      const data = await res.json()
      const regeneratedText = String(data?.analogy?.analogy || "").trim()
      if (!regeneratedText) throw new Error("No regenerated analogy returned for this topic.")

      setTopicStates((prev) =>
        prev.map((entry, entryIndex) => {
          if (entryIndex !== idx) return entry
          return {
            ...entry,
            candidates: [regeneratedText],
            analogy: regeneratedText,
            feedback: "",
            isEditing: false,
            editingCandidateIndex: null,
            preEditAnalogy: "",
          }
        }),
      )

      setMessage({
        type: "success",
        text: `Regenerated your selected analogy for "${item.topic}". Other options were removed.`,
      })
    } catch (err) {
      console.error(err)
      setMessage({
        type: "error",
        text: err.message || "Something went wrong while regenerating this topic.",
      })
    } finally {
      setRegeneratingIndex(null)
    }
  }

  const handleApproveAnalogies = async () => {
    if (!canApproveAnalogies) {
      setMessage({ type: "error", text: "Please select one analogy for every topic before approving." })
      return
    }

    setApproving(true)
    setMessage(null)

    try {
      let savedId = analogySetId

      if (!savedId) {
        const selectedTopics = topicStates.map((item) => ({
          topic: item.topic,
          analogy: item.analogy,
          feedback: item.feedback,
          imageUrl: item.imageUrl,
          imageStyle: item.imageStyle,
          videoUrl: item.videoUrl,
          videoNotes: item.videoNotes,
        }))

        const saveRes = await fetch("/api/generate-analogies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            persist: true,
            moduleCode,
            lectureTitle: lectureTitle.trim() || `Lecture from ${slidesFile?.name || "slides"}`,
            lectureSourceType: "slides",
            sourceFilename: slidesFile?.name || "",
            topics: topicStates.map((item) => item.topic),
            selectedAnalogies: selectedTopics,
            sourceText: extractedText,
            notes,
            title: `Slides: ${slidesFile?.name || "Untitled"}`,
          }),
        })

        if (!saveRes.ok) {
          const errorData = await saveRes.json().catch(() => ({}))
          throw new Error(errorData.error || "Failed to save approved analogies.")
        }

        const saveData = await saveRes.json()
        savedId = saveData.id
        setAnalogySetId(savedId)
      }

      const approveRes = await fetch("/api/generate-analogies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: savedId, action: "approve" }),
      })

      if (!approveRes.ok) {
        const errorData = await approveRes.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to approve analogy set.")
      }

      setActiveStep("images")
      setMessage({
        type: "success",
        text: "Analogies approved. Next step: optional images.",
      })
    } catch (err) {
      console.error(err)
      setMessage({
        type: "error",
        text: err.message || "Could not approve analogies.",
      })
    } finally {
      setApproving(false)
    }
  }

  const handleGenerateImage = async (index) => {
    const item = topicStates[index]
    if (!item?.analogy) return

    setImageLoadingIndex(index)
    setMessage(null)

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analogyText: item.analogy,
          topic: item.topic,
          style: item.imageStyle,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Image generation failed.")
      }

      const data = await res.json()
      updateTopicState(index, { imageUrl: data.dataUrl || "" })
      setMessage({ type: "success", text: `Image generated for "${item.topic}".` })
    } catch (err) {
      console.error(err)
      setMessage({ type: "error", text: err.message || "Image generation failed." })
    } finally {
      setImageLoadingIndex(null)
    }
  }

  const persistSummary = async () => {
    if (!analogySetId) {
      throw new Error("No saved analogy set found. Please approve analogies first.")
    }

    const payloadTopics = topicStates.map((item) => ({
      topic: item.topic,
      analogy: item.analogy,
      feedback: item.feedback,
      imageUrl: item.imageUrl,
      imageStyle: item.imageStyle,
      videoUrl: item.videoUrl,
      videoNotes: item.videoNotes,
    }))

    const res = await fetch("/api/generate-analogies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: analogySetId,
        action: "updateFeedback",
        topics: payloadTopics,
      }),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || "Failed to save summary details.")
    }
  }

  const handleFinish = async () => {
    setSavingSummary(true)
    setMessage(null)

    try {
      await persistSummary()
      setMessage({ type: "success", text: "Final summary saved. Opening the saved analogy set." })
      router.push(`/lecturer/analogies/${analogySetId}`)
    } catch (err) {
      console.error(err)
      setMessage({ type: "error", text: err.message || "Could not save final summary." })
    } finally {
      setSavingSummary(false)
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
      setModules((prev) => [...prev, data])
      setModuleCode(data.code)
      setShowModuleModal(false)
      setNewModuleCode("")
      setNewModuleName("")
      setNewModuleDescription("")
      setMessage({ type: "success", text: `Module "${data.name}" created successfully.` })
    } catch (err) {
      console.error(err)
      setModuleError(err.message || "Something went wrong")
    } finally {
      setCreatingModule(false)
    }
  }

  const stepPill = (step, label) => (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium border ${
        activeStep === step
          ? "border-indigo-400 bg-indigo-500/20 text-indigo-100"
          : "border-slate-700 bg-slate-900 text-slate-300"
      }`}
    >
      {label}
    </span>
  )

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Upload Lecture Slides</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              {stepPill("analogies", "1. Analogies")}
              {stepPill("images", "2. Images (optional)")}
              {stepPill("videos", "3. Videos (optional)")}
              {stepPill("summary", "4. Final summary")}
            </div>
          </div>
          <Link href="/lecturer/analogies" className={ui.buttonSecondary}>
            Back to Analogies
          </Link>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className={`${ui.card} p-6 md:p-8`}>
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

            {activeStep === "analogies" && (
              <>
                <p className="text-sm text-slate-300 mb-4">
                  Upload slides, confirm topics, choose one analogy per topic, optionally add feedback, and regenerate per topic if needed.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                  <div className="space-y-1">
                    <label htmlFor="module" className="block text-sm font-medium text-slate-200">
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
                        Create new module...
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="lectureTitle" className="block text-sm font-medium text-slate-200">
                      Lecture title
                    </label>
                    <input
                      id="lectureTitle"
                      type="text"
                      value={lectureTitle}
                      onChange={(e) => setLectureTitle(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                      placeholder="e.g., Week 3 - Distributed Systems Fundamentals"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="slides" className="block text-sm font-medium text-slate-200">
                      Slide deck file
                    </label>
                    <input
                      id="slides"
                      type="file"
                      accept=".pdf,.ppt,.pptx,.key,.odp"
                      onChange={handleFileChange}
                      className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-indigo-400"
                    />
                    {slidesFile && (
                      <p className="text-xs text-slate-300 mt-1">
                        Selected file: <span className="font-medium">{slidesFile.name}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="notes" className="block text-sm font-medium text-slate-200">
                      Notes for the generator (optional)
                    </label>
                    <textarea
                      id="notes"
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                      placeholder="Add teaching context, tone preferences, or constraints"
                    />
                  </div>

                  <div className="pt-3 flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className={`${ui.buttonPrimary} px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {saving ? "Processing..." : "Upload & suggest topics"}
                    </button>
                  </div>
                </form>

                {extractedText && (
                  <section className="mt-8 border-t border-slate-800 pt-4">
                    <h2 className={ui.cardHeader}>Extracted text (preview)</h2>
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-200 whitespace-pre-wrap">
                      {extractedText.slice(0, 1500)}
                      {extractedText.length > 1500 && "..."}
                    </div>
                  </section>
                )}

                {topics.length > 0 && (
                  <section className="mt-8 border-t border-slate-800 pt-4">
                    <h2 className={`${ui.cardHeader} mb-3`}>Suggested topics for analogies</h2>
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
                            x
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        placeholder="Add a new topic"
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
                  </section>
                )}

                {topicStates.length > 0 && (
                  <section className="mt-8 border-t border-slate-800 pt-4">
                    <h2 className={`${ui.cardHeader} mb-3`}>Select your favourite analogy for each topic</h2>
                    <p className="text-xs text-slate-400 mb-4">
                      Selected options are highlighted. Double-click the selected analogy to edit wording, then add feedback and regenerate that topic if needed.
                    </p>

                    <div className="space-y-4">
                      {topicStates.map((item, idx) => (
                        <div key={`${item.topic}-${idx}`} className={`${ui.cardInner} border border-slate-700`}>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <p className="text-xs font-semibold text-slate-100 mb-1">Topic {idx + 1}</p>
                              <p className="text-sm text-slate-200">{item.topic || "Untitled topic"}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRegenerateTopic(idx)}
                              disabled={regeneratingIndex === idx}
                              className="rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:border-indigo-400 hover:text-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {regeneratingIndex === idx ? "Regenerating..." : "Regenerate"}
                            </button>
                          </div>

                          <div className="space-y-2">
                            {(item.candidates || []).map((candidate, candidateIndex) => {
                              const selected = item.analogy === candidate
                              return (
                                <label
                                  key={`${idx}-${candidateIndex}`}
                                  className={`block rounded-lg border p-3 text-sm cursor-pointer transition ${
                                    selected
                                      ? "border-emerald-500 bg-emerald-900/20 text-emerald-100"
                                      : "border-slate-700 bg-slate-900/40 text-slate-300 hover:border-indigo-400/70"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`analogy-${idx}`}
                                    checked={selected}
                                    onChange={() =>
                                      updateTopicState(idx, {
                                        analogy: candidate,
                                        isEditing: false,
                                        editingCandidateIndex: null,
                                        preEditAnalogy: "",
                                      })
                                    }
                                    className="mr-2"
                                  />
                                  {selected && item.isEditing ? (
                                    <textarea
                                      value={item.analogy}
                                      onChange={(event) =>
                                        handleSelectedAnalogyEdit(idx, event.target.value)
                                      }
                                      onBlur={() => finishEditingSelectedAnalogy(idx)}
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter" && !event.shiftKey) {
                                          event.preventDefault()
                                          finishEditingSelectedAnalogy(idx)
                                        }
                                      }}
                                      rows={3}
                                      autoFocus
                                      className="mt-2 w-full rounded-lg border border-emerald-500/60 bg-slate-950/60 px-3 py-2 text-sm text-emerald-100 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                                    />
                                  ) : (
                                    <span
                                      onDoubleClick={() => {
                                        if (selected) startEditingSelectedAnalogy(idx)
                                      }}
                                      title={selected ? "Double-click to edit selected wording" : ""}
                                    >
                                      {candidate}
                                    </span>
                                  )}
                                </label>
                              )
                            })}
                          </div>

                          <div className="mt-3">
                            <label className="text-xs uppercase tracking-wide text-slate-400">
                              Feedback for this selected analogy
                            </label>
                            <textarea
                              value={item.feedback}
                              onChange={(event) => updateTopicState(idx, { feedback: event.target.value })}
                              rows={3}
                              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                              placeholder="Explain what to improve, what tone to use, or what to avoid"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={handleApproveAnalogies}
                        disabled={!canApproveAnalogies || approving}
                        className={`${ui.buttonPrimary} px-5 py-2 disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        {approving ? "Approving..." : "Approve analogies and continue"}
                      </button>
                    </div>
                  </section>
                )}
              </>
            )}

            {activeStep === "images" && (
              <>
                <h2 className={ui.cardHeader}>Optional image generation</h2>
                <p className="text-sm text-slate-300 mb-4">Generate supporting images for any topic, or skip.</p>

                <div className="space-y-4">
                  {topicStates.map((item, idx) => (
                    <div key={`${item.topic}-image-${idx}`} className={ui.cardInner}>
                      <h3 className="text-sm font-semibold text-indigo-300 mb-1">{item.topic}</h3>
                      <p className="text-xs text-slate-300 mb-3">{item.analogy}</p>

                      <label className="text-xs uppercase tracking-wide text-slate-400">Image style (optional)</label>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={item.imageStyle}
                          onChange={(event) => updateTopicState(idx, { imageStyle: event.target.value })}
                          placeholder="e.g., minimal flat illustration"
                          className="min-w-[220px] flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleGenerateImage(idx)}
                          disabled={imageLoadingIndex === idx}
                          className={ui.buttonSecondary}
                        >
                          {imageLoadingIndex === idx ? "Generating..." : "Generate image"}
                        </button>
                      </div>

                      {item.imageUrl && (
                        <div className="mt-3">
                          <Image
                            src={item.imageUrl}
                            alt={`${item.topic} generated image`}
                            width={768}
                            height={384}
                            unoptimized
                            className="h-44 w-full rounded-lg object-cover border border-slate-700"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveStep("analogies")}
                    className={ui.buttonSecondary}
                  >
                    Back to analogies
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep("videos")}
                    className={ui.buttonPrimary}
                  >
                    Continue to videos
                  </button>
                </div>
              </>
            )}

            {activeStep === "videos" && (
              <>
                <h2 className={ui.cardHeader}>Optional video details</h2>
                <p className="text-sm text-slate-300 mb-4">Add a video link and notes for any topic, or leave blank.</p>

                <div className="space-y-4">
                  {topicStates.map((item, idx) => (
                    <div key={`${item.topic}-video-${idx}`} className={ui.cardInner}>
                      <h3 className="text-sm font-semibold text-indigo-300 mb-2">{item.topic}</h3>

                      <label className="text-xs uppercase tracking-wide text-slate-400">Video URL (optional)</label>
                      <input
                        type="url"
                        value={item.videoUrl}
                        onChange={(event) => updateTopicState(idx, { videoUrl: event.target.value })}
                        placeholder="https://..."
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                      />

                      <label className="mt-3 block text-xs uppercase tracking-wide text-slate-400">Video notes (optional)</label>
                      <textarea
                        value={item.videoNotes}
                        onChange={(event) => updateTopicState(idx, { videoNotes: event.target.value })}
                        rows={3}
                        placeholder="Describe what video should cover"
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveStep("images")}
                    className={ui.buttonSecondary}
                  >
                    Back to images
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep("summary")}
                    className={ui.buttonPrimary}
                  >
                    Continue to final summary
                  </button>
                </div>
              </>
            )}

            {activeStep === "summary" && (
              <>
                <h2 className={ui.cardHeader}>Final summary</h2>
                <p className="text-sm text-slate-300 mb-4">Review written analogies, images, and videos together before finishing.</p>

                <div className="space-y-4">
                  {topicStates.map((item, idx) => (
                    <div key={`${item.topic}-summary-${idx}`} className={ui.cardInner}>
                      <h3 className="text-sm font-semibold text-indigo-300 mb-2">{item.topic}</h3>
                      <p className="text-sm text-slate-200 mb-2">{item.analogy}</p>

                      {item.feedback && (
                        <p className="text-xs text-slate-300 mb-3">
                          <span className="text-slate-400">Feedback:</span> {item.feedback}
                        </p>
                      )}

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                          <p className="text-xs text-slate-400 mb-2">Image</p>
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={`${item.topic} summary image`}
                              width={640}
                              height={320}
                              unoptimized
                              className="h-32 w-full rounded object-cover"
                            />
                          ) : (
                            <p className="text-xs text-slate-500">No image added.</p>
                          )}
                        </div>

                        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                          <p className="text-xs text-slate-400 mb-2">Video</p>
                          {item.videoUrl || item.videoNotes ? (
                            <div className="space-y-2 text-xs text-slate-300">
                              {item.videoUrl && <p>URL: {item.videoUrl}</p>}
                              {item.videoNotes && <p>Notes: {item.videoNotes}</p>}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500">No video details added.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveStep("videos")}
                    className={ui.buttonSecondary}
                  >
                    Back to videos
                  </button>
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={savingSummary}
                    className={`${ui.buttonPrimary} disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {savingSummary ? "Saving..." : "Finish and open saved set"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {showModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`${ui.card} p-6 w-full max-w-md rounded-lg border border-slate-700`}>
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Create New Module</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Module Code</label>
                <input
                  type="text"
                  value={newModuleCode}
                  onChange={(e) => setNewModuleCode(e.target.value.toUpperCase())}
                  placeholder="e.g., CSC7099"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Module Name</label>
                <input
                  type="text"
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                  placeholder="e.g., Advanced Cloud Computing"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Description (optional)</label>
                <textarea
                  value={newModuleDescription}
                  onChange={(e) => setNewModuleDescription(e.target.value)}
                  placeholder="Brief description of the module..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              {moduleError && (
                <div className="rounded-lg bg-red-900/40 border border-red-600 px-3 py-2 text-xs text-red-100">
                  {moduleError}
                </div>
              )}

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

export default function UploadSlidesPage() {
  return (
    <Suspense
      fallback={(
        <main className={ui.page}>
          <section className={ui.pageSection}>
            <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-300">Loading...</div>
          </section>
        </main>
      )}
    >
      <UploadSlidesPageInner />
    </Suspense>
  )
}
