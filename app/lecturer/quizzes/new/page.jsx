"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { dateInputToEndOfDayIso, dateInputToStartOfDayIso } from "../../../lib/dateFormat"
import * as ui from "../../../styles/ui"

function createEmptyQuestion() {
  return {
    prompt: "",
    type: "MCQ",
    difficulty: "MEDIUM",
    analogySetId: "",
    analogyTopicIndex: "",
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
  const [selectedAnalogySetId, setSelectedAnalogySetId] = useState("")
  const [quizTitle, setQuizTitle] = useState("")
  const [dueAt, setDueAt] = useState("")
  const [publishedAt, setPublishedAt] = useState("")
  const [maxAttempts, setMaxAttempts] = useState(1)
  const [status, setStatus] = useState("DRAFT")
  const [questions, setQuestions] = useState([])
  const [analogyTopics, setAnalogyTopics] = useState([])
  const [generationFeedback, setGenerationFeedback] = useState("")
  const [generationContext, setGenerationContext] = useState(null)
  const [creating, setCreating] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState("")

  const analogySets = useMemo(() => {
    const setsById = new Map()
    analogyTopics.forEach((topic) => {
      if (!topic.analogySetId) return
      const current = setsById.get(topic.analogySetId)
      setsById.set(topic.analogySetId, {
        id: topic.analogySetId,
        createdAt: topic.analogySetCreatedAt || "",
        topicCount: (current?.topicCount || 0) + 1,
      })
    })
    return Array.from(setsById.values())
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((set, index) => ({
        ...set,
        title: `Set ${index + 1}`,
      }))
  }, [analogyTopics])

  const selectedAnalogySetTopics = useMemo(
    () => analogyTopics.filter((topic) => topic.analogySetId === selectedAnalogySetId),
    [analogyTopics, selectedAnalogySetId],
  )

  const selectedAnalogySet = useMemo(
    () => analogySets.find((set) => set.id === selectedAnalogySetId) || null,
    [analogySets, selectedAnalogySetId],
  )

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
      setSelectedAnalogySetId("")
      setQuestions([])
      setGenerationContext(null)
      return
    }

    let cancelled = false
    setAnalogyTopics([])
    setSelectedAnalogySetId("")
    setQuestions([])
    setGenerationContext(null)

    fetch(`/api/lectures/${selectedLectureId}/topics`)
      .then((r) => (r.ok ? r.json() : { topics: [] }))
      .then((data) => {
        if (cancelled) return
        const nextTopics = Array.isArray(data?.topics) ? data.topics : []
        setAnalogyTopics(nextTopics)
        const nextSets = Array.from(
          nextTopics.reduce((setsById, topic) => {
            if (!topic.analogySetId) return setsById
            if (!setsById.has(topic.analogySetId)) {
              setsById.set(topic.analogySetId, {
                id: topic.analogySetId,
                createdAt: topic.analogySetCreatedAt || "",
              })
            }
            return setsById
          }, new Map()).values(),
        ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        const nextSetIds = new Set(nextSets.map((set) => set.id))
        setSelectedAnalogySetId((current) => (
          current && nextSetIds.has(current) ? current : (nextSets[0]?.id || "")
        ))
      })
      .catch(() => {
        if (!cancelled) setAnalogyTopics([])
      })

    return () => {
      cancelled = true
    }
  }, [selectedLectureId])

  const createQuestionForNextTopic = () => {
    const question = createEmptyQuestion()
    const usedTopicIndexes = new Set(
      questions
        .filter((item) => item.analogySetId === selectedAnalogySetId)
        .map((item) => Number(item.analogyTopicIndex))
        .filter(Number.isInteger),
    )
    const nextTopic = selectedAnalogySetTopics.find((topic) => !usedTopicIndexes.has(topic.topicIndex))
      || selectedAnalogySetTopics[0]

    if (!nextTopic) return question

    return {
      ...question,
      analogySetId: nextTopic.analogySetId,
      analogyTopicIndex: String(nextTopic.topicIndex),
    }
  }

  const handleGenerate = async () => {
    if (!selectedModule || !selectedLectureId) {
      setMessage("Select a module and lecture first.")
      return
    }

    if (!selectedAnalogySetId) {
      setMessage("Select an analogy set first.")
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
          analogySetId: selectedAnalogySetId,
          feedback: generationFeedback || undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to generate questions")

      setQuestions(Array.isArray(data.questions) ? data.questions : [])
      setGenerationContext({
        ...(data.context || {}),
        lectureTitle: data.lecture?.title || "",
        analogySetTitle: selectedAnalogySet?.title || data.analogySet?.title || "",
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

    if (!selectedAnalogySetId) {
      setMessage("Select an analogy set before creating the quiz.")
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
          analogySetId: selectedAnalogySetId,
          status,
          dueAt: dateInputToEndOfDayIso(dueAt),
          publishedAt: status === "PUBLISHED" ? dateInputToStartOfDayIso(publishedAt) : null,
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
          </div>
          <Link href="/lecturer/quizzes" className={ui.buttonSecondary}>Back to Quizzes</Link>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <label className="space-y-1">
                <span className="font-medium">Quiz title</span>
                <input value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2" />
              </label>
              <label className="space-y-1">
                <span className="font-medium">Module</span>
                <select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)} className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2">
                  {modules.map((m) => <option key={m.id} value={m.code}>{m.code} · {m.name}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="font-medium">Lecture</span>
                <select
                  value={selectedLectureId}
                  onChange={(e) => setSelectedLectureId(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
                >
                  {lectures.length === 0 ? <option value="">No lectures available for this module</option> : null}
                  {lectures.map((lecture) => <option key={lecture.id} value={lecture.id}>{lecture.title}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="font-medium">Analogy Set</span>
                <select
                  value={selectedAnalogySetId}
                  onChange={(e) => {
                    setSelectedAnalogySetId(e.target.value)
                    setQuestions([])
                    setGenerationContext(null)
                    setMessage("")
                  }}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
                >
                  {analogySets.length === 0 ? <option value="">No approved analogy sets for this lecture</option> : null}
                  {analogySets.map((set) => (
                    <option key={set.id} value={set.id}>
                      {set.title} · {set.topicCount} topic{set.topicCount === 1 ? "" : "s"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="font-medium">Due date (optional)</span>
                <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2" />
                <span className="block text-xs text-stone-600">Students can see this deadline. Attempts are blocked after it passes.</span>
              </label>
              <label className="space-y-1">
                <span className="font-medium">Schedule release (optional)</span>
                <input type="date" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2" />
                <span className="block text-xs text-stone-600">If status is published, this controls when students can first access the quiz.</span>
              </label>
              <label className="space-y-1">
                <span className="font-medium">Max attempts</span>
                <input type="number" min={1} max={5} value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2" />
              </label>
              <label className="space-y-1">
                <span className="font-medium">Status</span>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2">
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </label>
            </div>

            <div className="mt-4 space-y-3 rounded-xl border border-stone-200 bg-stone-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-stone-950">AI Question Generation</h2>
                <button type="button" onClick={handleGenerate} disabled={generating || !selectedLectureId || !selectedAnalogySetId} className={ui.buttonSecondary}>
                  {generating ? "Generating..." : "Generate from Analogy Set"}
                </button>
              </div>
              <p className="text-xs text-stone-600">
                Generation creates one question for each topic in the selected analogy set.
              </p>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Feedback for regeneration (optional)</span>
                <textarea
                  rows={3}
                  value={generationFeedback}
                  onChange={(e) => setGenerationFeedback(e.target.value)}
                  placeholder="Example: Make questions harder and include more scenario-based wording."
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
                />
              </label>
              {generationContext ? (
                <p className="text-xs text-stone-600">
                  Generated {generationContext.topicCount} question(s) from {generationContext.analogySetTitle || "the selected analogy set"} in lecture {generationContext.lectureTitle || "selected lecture"}.
                </p>
              ) : null}
              <p className="text-xs text-stone-600">
                {selectedAnalogySetTopics.length} topic(s) are available in {selectedAnalogySet?.title || "the selected analogy set"}.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className={ui.cardHeader}>Review and Edit Questions</h2>
                <button
                  type="button"
                  onClick={() => setQuestions((prev) => [...prev, createQuestionForNextTopic()])}
                  className={ui.buttonSecondary}
                >
                  + Add Question
                </button>
              </div>

              {questions.length === 0 ? (
                <p className={ui.textSmall}>No questions yet. Generate from the selected analogy set, then edit here before saving.</p>
              ) : (
                <div className="space-y-3">
                  {questions.map((question, questionIndex) => (
                    <div key={questionIndex} className={ui.cardInner}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-wide text-teal-700">Question {questionIndex + 1}</p>
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
                          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
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
                          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
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
                            setQuestions((prev) =>
                              prev.map((item, idx) =>
                                idx === questionIndex
                                  ? {
                                      ...item,
                                      analogySetId: analogySetId || "",
                                      analogyTopicIndex: topicIndexText || "",
                                    }
                                  : item,
                              ),
                            )
                          }}
                          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
                        >
                          <option value="">No linked analogy topic</option>
                          {selectedAnalogySetTopics.map((topic) => (
                            <option
                              key={`${topic.analogySetId}-${topic.topicIndex}`}
                              value={`${topic.analogySetId}::${topic.topicIndex}`}
                            >
                              {topic.topic}
                            </option>
                          ))}
                        </select>
                        <span className="block text-xs text-stone-600">
                          This controls what appears in the student popup when they click View analogy/video.
                        </span>
                      </label>

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
                              className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2"
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
                          + Add Option
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {message ? <p className="mt-3 text-sm text-amber-700">{message}</p> : null}

            <div className="mt-4 flex gap-2">
              <button type="button" disabled={creating || !selectedLectureId || !selectedAnalogySetId} onClick={handleCreate} className={ui.buttonPrimary}>
                {creating ? "Creating..." : "Create Quiz"}
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
    <Suspense fallback={<main className={ui.page}><section className={ui.pageSection}><div className={`${ui.container} ${ui.pageSpacing} text-sm text-stone-700`}>Loading…</div></section></main>}>
      <LecturerQuizWizardPageInner />
    </Suspense>
  )
}
