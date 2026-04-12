"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import * as ui from "../../../styles/ui"

function createEmptyQuestion() {
  return {
    prompt: "",
    type: "MCQ",
    difficulty: "MEDIUM",
    analogySetId: "",
    analogyTopicIndex: "",
    videoUrl: "",
    options: [
      { text: "Option A", isCorrect: true },
      { text: "Option B", isCorrect: false },
      { text: "Option C", isCorrect: false },
      { text: "Option D", isCorrect: false },
    ],
  }
}

function normalizeQuestionsForSave(questions) {
  return questions
    .map((question) => {
      const options = Array.isArray(question.options)
        ? question.options
            .map((option) => ({
              text: String(option.text || "").trim(),
              isCorrect: !!option.isCorrect,
            }))
            .filter((option) => option.text.length > 0)
        : []

      if (options.length > 0 && !options.some((option) => option.isCorrect)) {
        options[0].isCorrect = true
      }

      return {
        prompt: String(question.prompt || "").trim(),
        type: "MCQ",
        difficulty: ["EASY", "MEDIUM", "HARD"].includes(question.difficulty) ? question.difficulty : "MEDIUM",
        analogySetId: String(question.analogySetId || "").trim() || null,
        analogyTopicIndex: question.analogyTopicIndex === "" || question.analogyTopicIndex === null
          ? null
          : Number(question.analogyTopicIndex),
        videoUrl: String(question.videoUrl || "").trim() || null,
        options,
      }
    })
    .filter((question) => question.prompt.length > 0)
}

function LecturerQuizWizardPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const moduleFromUrl = useMemo(() => searchParams.get("module") || "", [searchParams])

  const [modules, setModules] = useState([])
  const [lectures, setLectures] = useState([])
  const [selectedModule, setSelectedModule] = useState("")
  const [selectedLectureId, setSelectedLectureId] = useState("")
  const [quizTitle, setQuizTitle] = useState("")
  const [dueAt, setDueAt] = useState("")
  const [publishedAt, setPublishedAt] = useState("")
  const [maxAttempts, setMaxAttempts] = useState(1)
  const [status, setStatus] = useState("DRAFT")
  const [questions, setQuestions] = useState([])
  const [analogyTopics, setAnalogyTopics] = useState([])
  const [uploadingVideoByQuestion, setUploadingVideoByQuestion] = useState({})
  const [generationFeedback, setGenerationFeedback] = useState("")
  const [generationContext, setGenerationContext] = useState(null)
  const [creating, setCreating] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetch("/api/modules")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const next = Array.isArray(data) ? data : []
        setModules(next)
        if (moduleFromUrl && next.some((m) => m.code === moduleFromUrl)) {
          setSelectedModule(moduleFromUrl)
        } else if (next[0]) {
          setSelectedModule(next[0].code)
        }
      })
      .catch(() => setModules([]))
  }, [moduleFromUrl])

  useEffect(() => {
    if (!selectedModule) {
      setLectures([])
      setSelectedLectureId("")
      return
    }

    fetch(`/api/lectures?moduleCode=${encodeURIComponent(selectedModule)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const next = Array.isArray(data) ? data : []
        setLectures(next)
        setSelectedLectureId((current) => (
          next.some((lecture) => lecture.id === current) ? current : (next[0]?.id || "")
        ))
      })
      .catch(() => {
        setLectures([])
        setSelectedLectureId("")
      })
  }, [selectedModule])

  useEffect(() => {
    if (!selectedLectureId) {
      setAnalogyTopics([])
      return
    }

    let cancelled = false

    fetch(`/api/lectures/${selectedLectureId}/topics`)
      .then((r) => (r.ok ? r.json() : { topics: [] }))
      .then((data) => {
        if (cancelled) return
        const nextTopics = Array.isArray(data?.topics) ? data.topics : []
        setAnalogyTopics(nextTopics)
      })
      .catch(() => {
        if (!cancelled) setAnalogyTopics([])
      })

    return () => {
      cancelled = true
    }
  }, [selectedLectureId])

  const handleVideoUpload = async (questionIndex, file) => {
    if (!file) return
    setUploadingVideoByQuestion((prev) => ({ ...prev, [questionIndex]: true }))
    setMessage("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/quizzes/video-upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Video upload failed")

      setQuestions((prev) =>
        prev.map((item, idx) => (idx === questionIndex ? { ...item, videoUrl: data.url || "" } : item)),
      )
      setMessage("Video uploaded.")
    } catch (err) {
      setMessage(err.message || "Unable to upload video")
    } finally {
      setUploadingVideoByQuestion((prev) => ({ ...prev, [questionIndex]: false }))
    }
  }

  const handleGenerate = async () => {
    if (!selectedModule || !selectedLectureId) {
      setMessage("Select a module and lecture first.")
      return
    }

    setGenerating(true)
    setMessage("")
    try {
      const res = await fetch("/api/quizzes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lectureId: selectedLectureId,
          feedback: generationFeedback || undefined,
          questionCount: 5,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to generate questions")

      setQuestions(Array.isArray(data.questions) ? data.questions : [])
      setGenerationContext({
        ...(data.context || {}),
        lectureTitle: data.lecture?.title || "",
      })
      setMessage("Questions generated. You can now review and edit before saving.")
    } catch (err) {
      setQuestions([])
      setGenerationContext(null)
      setMessage(err.message || "Unable to generate questions")
    } finally {
      setGenerating(false)
    }
  }

  const handleCreate = async () => {
    const normalizedQuestions = normalizeQuestionsForSave(questions)

    if (!quizTitle.trim() || !selectedModule || !selectedLectureId) {
      setMessage("Title, module, and lecture are required.")
      return
    }

    if (normalizedQuestions.length === 0) {
      setMessage("Generate at least one question, then review/edit before creating.")
      return
    }

    setCreating(true)
    setMessage("")
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quizTitle,
          moduleCode: selectedModule,
          lectureId: selectedLectureId,
          status,
          dueAt: dueAt || null,
          publishedAt: status === "PUBLISHED" ? (publishedAt || null) : null,
          maxAttempts: Number(maxAttempts) || 1,
          questions: normalizedQuestions,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to create quiz")

      router.push(`/lecturer/quizzes/${data.id}`)
    } catch (err) {
      setMessage(err.message || "Unable to create quiz")
      setCreating(false)
    }
  }

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <h1 className="text-lg font-semibold">Create Quiz</h1>
            <p className={ui.textSmall}>Persist directly to the database.</p>
          </div>
          <Link href="/lecturer/quizzes" className={ui.buttonSecondary}>Back to quizzes</Link>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <label className="space-y-1">
                <span className="font-medium">Quiz title</span>
                <input value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2" />
              </label>
              <label className="space-y-1">
                <span className="font-medium">Module</span>
                <select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
                  {modules.map((m) => <option key={m.id} value={m.code}>{m.code} · {m.name}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="font-medium">Lecture</span>
                <select
                  value={selectedLectureId}
                  onChange={(e) => setSelectedLectureId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
                >
                  {lectures.length === 0 ? <option value="">No lectures available for this module</option> : null}
                  {lectures.map((lecture) => <option key={lecture.id} value={lecture.id}>{lecture.title}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="font-medium">Status</span>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="font-medium">Due at (optional)</span>
                <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2" />
              </label>
              <label className="space-y-1">
                <span className="font-medium">Schedule release (optional)</span>
                <input type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2" />
                <span className="block text-xs text-slate-400">If status is published, this controls when students can first access the quiz.</span>
              </label>
              <label className="space-y-1">
                <span className="font-medium">Max attempts</span>
                <input type="number" min={1} max={5} value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2" />
              </label>
            </div>

            <div className="mt-4 space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-100">AI Question Generation</h2>
                <button type="button" onClick={handleGenerate} disabled={generating || !selectedModule} className={ui.buttonSecondary}>
                  {generating ? "Generating..." : "Generate from module analogies"}
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Generation is only available when the selected lecture has at least one ready analogy saved by this lecturer.
              </p>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Feedback for regeneration (optional)</span>
                <textarea
                  rows={3}
                  value={generationFeedback}
                  onChange={(e) => setGenerationFeedback(e.target.value)}
                  placeholder="Example: Make questions harder and include more scenario-based wording."
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
                />
              </label>
              {generationContext ? (
                <p className="text-xs text-slate-400">
                  Using {generationContext.topicCount} topic(s) from {generationContext.analogySetCount} analogy set(s) in lecture {generationContext.lectureTitle || "selected lecture"}.
                </p>
              ) : null}
              <p className="text-xs text-slate-400">
                {analogyTopics.length} approved lecture topic(s) are available for question-level analogy/video linking.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className={ui.cardHeader}>Review and Edit Questions</h2>
                <button
                  type="button"
                  onClick={() => setQuestions((prev) => [...prev, createEmptyQuestion()])}
                  className={ui.buttonSecondary}
                >
                  + Add question
                </button>
              </div>

              {questions.length === 0 ? (
                <p className={ui.textSmall}>No questions yet. Generate from analogies, then edit here before saving.</p>
              ) : (
                <div className="space-y-3">
                  {questions.map((question, questionIndex) => (
                    <div key={questionIndex} className={ui.cardInner}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-wide text-indigo-300">Question {questionIndex + 1}</p>
                        <button
                          type="button"
                          className={ui.buttonSmall}
                          onClick={() => setQuestions((prev) => prev.filter((_, idx) => idx !== questionIndex))}
                        >
                          Remove
                        </button>
                      </div>

                      <label className="mt-2 block space-y-1 text-sm">
                        <span className="font-medium">Prompt</span>
                        <textarea
                          rows={3}
                          value={question.prompt}
                          onChange={(e) =>
                            setQuestions((prev) =>
                              prev.map((item, idx) =>
                                idx === questionIndex ? { ...item, prompt: e.target.value } : item,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
                        />
                      </label>

                      <label className="mt-2 block space-y-1 text-sm">
                        <span className="font-medium">Difficulty</span>
                        <select
                          value={question.difficulty}
                          onChange={(e) =>
                            setQuestions((prev) =>
                              prev.map((item, idx) =>
                                idx === questionIndex ? { ...item, difficulty: e.target.value } : item,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
                        >
                          <option value="EASY">Easy</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HARD">Hard</option>
                        </select>
                      </label>

                      <label className="mt-2 block space-y-1 text-sm">
                        <span className="font-medium">Linked analogy topic</span>
                        <select
                          value={
                            question.analogySetId && question.analogyTopicIndex !== ""
                              ? `${question.analogySetId}::${question.analogyTopicIndex}`
                              : ""
                          }
                          onChange={(e) => {
                            const value = e.target.value
                            const [analogySetId, topicIndexText] = value ? value.split("::") : ["", ""]
                            const matchingTopic = analogyTopics.find(
                              (topic) => `${topic.analogySetId}::${topic.topicIndex}` === value,
                            )
                            setQuestions((prev) =>
                              prev.map((item, idx) =>
                                idx === questionIndex
                                  ? {
                                      ...item,
                                      analogySetId: analogySetId || "",
                                      analogyTopicIndex: topicIndexText || "",
                                      videoUrl: item.videoUrl || matchingTopic?.topicVideoUrl || "",
                                    }
                                  : item,
                              ),
                            )
                          }}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
                        >
                          <option value="">No linked analogy topic</option>
                          {analogyTopics.map((topic) => (
                            <option
                              key={`${topic.analogySetId}-${topic.topicIndex}`}
                              value={`${topic.analogySetId}::${topic.topicIndex}`}
                            >
                              {topic.analogySetTitle} · Topic {topic.topicIndex + 1}: {topic.topic}
                            </option>
                          ))}
                        </select>
                        <span className="block text-xs text-slate-400">
                          This controls what appears in the student popup when they click View analogy/video.
                        </span>
                      </label>

                      <label className="mt-2 block space-y-1 text-sm">
                        <span className="font-medium">Video URL (optional)</span>
                        <input
                          value={question.videoUrl || ""}
                          onChange={(e) =>
                            setQuestions((prev) =>
                              prev.map((item, idx) =>
                                idx === questionIndex ? { ...item, videoUrl: e.target.value } : item,
                              ),
                            )
                          }
                          placeholder="/uploads/quiz-videos/example.mp4 or https://..."
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
                        />
                      </label>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                        <label className={ui.buttonSecondary}>
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime"
                            className="hidden"
                            onChange={(e) => handleVideoUpload(questionIndex, e.target.files?.[0])}
                          />
                          {uploadingVideoByQuestion[questionIndex] ? "Uploading..." : "Upload video"}
                        </label>
                        {question.videoUrl ? (
                          <a
                            href={question.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-indigo-300 hover:text-indigo-200"
                          >
                            Preview video
                          </a>
                        ) : null}
                      </div>

                      <div className="mt-3 space-y-2 text-sm">
                        <p className="font-medium">Options (select one correct answer)</p>
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`q-${questionIndex}-correct`}
                              checked={option.isCorrect}
                              onChange={() =>
                                setQuestions((prev) =>
                                  prev.map((item, idx) =>
                                    idx === questionIndex
                                      ? {
                                          ...item,
                                          options: item.options.map((opt, optIdx) => ({
                                            ...opt,
                                            isCorrect: optIdx === optionIndex,
                                          })),
                                        }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <input
                              value={option.text}
                              onChange={(e) =>
                                setQuestions((prev) =>
                                  prev.map((item, idx) =>
                                    idx === questionIndex
                                      ? {
                                          ...item,
                                          options: item.options.map((opt, optIdx) =>
                                            optIdx === optionIndex ? { ...opt, text: e.target.value } : opt,
                                          ),
                                        }
                                      : item,
                                  ),
                                )
                              }
                              className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
                            />
                            <button
                              type="button"
                              className={ui.buttonSmall}
                              onClick={() =>
                                setQuestions((prev) =>
                                  prev.map((item, idx) =>
                                    idx === questionIndex
                                      ? {
                                          ...item,
                                          options: item.options.filter((_, optIdx) => optIdx !== optionIndex),
                                        }
                                      : item,
                                  ),
                                )
                              }
                              disabled={question.options.length <= 2}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className={ui.buttonSmall}
                          onClick={() =>
                            setQuestions((prev) =>
                              prev.map((item, idx) =>
                                idx === questionIndex
                                  ? { ...item, options: [...item.options, { text: "New option", isCorrect: false }] }
                                  : item,
                              ),
                            )
                          }
                        >
                          + Add option
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {message ? <p className="mt-3 text-sm text-amber-300">{message}</p> : null}

            <div className="mt-4 flex gap-2">
              <button type="button" disabled={creating} onClick={handleCreate} className={ui.buttonPrimary}>
                {creating ? "Creating..." : "Create quiz"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}


export default function LecturerQuizWizardPage() {
  return (
    <Suspense fallback={<main className={ui.page}><section className={ui.pageSection}><div className={`${ui.container} ${ui.pageSpacing} text-sm text-slate-300`}>Loading…</div></section></main>}>
      <LecturerQuizWizardPageInner />
    </Suspense>
  )
}
