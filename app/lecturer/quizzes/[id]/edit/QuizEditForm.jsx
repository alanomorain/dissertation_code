"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  dateInputToEndOfDayIso,
  dateInputToStartOfDayIso,
  toDateInputValue,
} from "../../../../lib/dateFormat"
import { getModuleDisplayName } from "../../../../lib/moduleDisplay"
import * as ui from "../../../../styles/ui"

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

function toEditableQuestion(question) {
  return {
    id: question.id,
    prompt: question.prompt || "",
    type: "MCQ",
    difficulty: question.difficulty || "MEDIUM",
    analogySetId: question.analogySetId || "",
    analogyTopicIndex: Number.isInteger(question.analogyTopicIndex) ? String(question.analogyTopicIndex) : "",
    videoUrl: question.videoUrl || "",
    options: Array.isArray(question.options) && question.options.length > 0
      ? question.options.map((option) => ({
          id: option.id,
          text: option.text || "",
          isCorrect: !!option.isCorrect,
        }))
      : createEmptyQuestion().options,
  }
}

export default function QuizEditForm({ quiz, canEditQuestions }) {
  const router = useRouter()
  const [title, setTitle] = useState(quiz.title || "")
  const [status, setStatus] = useState(quiz.status || "DRAFT")
  const [dueAt, setDueAt] = useState(toDateInputValue(quiz.dueAt))
  const [publishedAt, setPublishedAt] = useState(toDateInputValue(quiz.publishedAt))
  const [maxAttempts, setMaxAttempts] = useState(quiz.maxAttempts || 1)
  const [questions, setQuestions] = useState((quiz.questions || []).map(toEditableQuestion))
  const [analogyTopics, setAnalogyTopics] = useState([])
  const [uploadingVideoByQuestion, setUploadingVideoByQuestion] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!quiz.lectureId) {
      setAnalogyTopics([])
      return
    }

    let cancelled = false
    fetch(`/api/lectures/${quiz.lectureId}/topics`)
      .then((r) => (r.ok ? r.json() : { topics: [] }))
      .then((data) => {
        if (cancelled) return
        setAnalogyTopics(Array.isArray(data?.topics) ? data.topics : [])
      })
      .catch(() => {
        if (!cancelled) setAnalogyTopics([])
      })

    return () => {
      cancelled = true
    }
  }, [quiz.lectureId])

  const handleVideoUpload = async (questionIndex, file) => {
    if (!file || !canEditQuestions) return
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

  const handleSave = async () => {
    const normalizedQuestions = normalizeQuestionsForSave(questions)

    if (!title.trim()) {
      setMessage("Title is required.")
      return
    }

    if (canEditQuestions && normalizedQuestions.length === 0) {
      setMessage("Add at least one question before saving.")
      return
    }

    setSaving(true)
    setMessage("")
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          status,
          dueAt: dateInputToEndOfDayIso(dueAt),
          publishedAt: status === "PUBLISHED" ? dateInputToStartOfDayIso(publishedAt) : null,
          maxAttempts: Number(maxAttempts) || 1,
          ...(canEditQuestions ? { questions: normalizedQuestions } : {}),
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to update quiz")

      router.push(`/lecturer/quizzes/${quiz.id}`)
      router.refresh()
    } catch (err) {
      setMessage(err.message || "Unable to update quiz")
      setSaving(false)
    }
  }

  return (
    <div className={ui.cardFull}>
      <div className="grid gap-4 md:grid-cols-2 text-sm">
        <label className="space-y-1">
          <span className="font-medium">Quiz title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2" />
        </label>
        <div className="space-y-1">
          <span className="font-medium">Module</span>
          <p className="rounded-lg border border-stone-200 bg-stone-100 px-3 py-2 text-stone-700">
            {getModuleDisplayName(quiz.module)}
          </p>
        </div>
        <div className="space-y-1">
          <span className="font-medium">Lecture</span>
          <p className="rounded-lg border border-stone-200 bg-stone-100 px-3 py-2 text-stone-700">
            {quiz.lecture?.title || "No lecture linked"}
          </p>
        </div>
        <label className="space-y-1">
          <span className="font-medium">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2">
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
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
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={ui.cardHeader}>Questions</h2>
            {!canEditQuestions ? (
              <p className={ui.textSmall}>Question editing is locked because this quiz has student attempts.</p>
            ) : (
              <p className={ui.textSmall}>{analogyTopics.length} approved lecture topic(s) are available for analogy/video linking.</p>
            )}
          </div>
          {canEditQuestions ? (
            <button
              type="button"
              onClick={() => setQuestions((prev) => [...prev, createEmptyQuestion()])}
              className={ui.buttonSecondary}
            >
              + Add question
            </button>
          ) : null}
        </div>

        <div className="space-y-3">
          {questions.map((question, questionIndex) => (
            <div key={question.id || questionIndex} className={ui.cardInner}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-wide text-teal-700">Question {questionIndex + 1}</p>
                {canEditQuestions ? (
                  <button
                    type="button"
                    className={ui.buttonSmall}
                    onClick={() => setQuestions((prev) => prev.filter((_, idx) => idx !== questionIndex))}
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              <label className="mt-2 block space-y-1 text-sm">
                <span className="font-medium">Prompt</span>
                <textarea
                  rows={3}
                  value={question.prompt}
                  disabled={!canEditQuestions}
                  onChange={(e) =>
                    setQuestions((prev) =>
                      prev.map((item, idx) => (idx === questionIndex ? { ...item, prompt: e.target.value } : item)),
                    )
                  }
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 disabled:opacity-70"
                />
              </label>

              <label className="mt-2 block space-y-1 text-sm">
                <span className="font-medium">Difficulty</span>
                <select
                  value={question.difficulty}
                  disabled={!canEditQuestions}
                  onChange={(e) =>
                    setQuestions((prev) =>
                      prev.map((item, idx) => (idx === questionIndex ? { ...item, difficulty: e.target.value } : item)),
                    )
                  }
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 disabled:opacity-70"
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
                  disabled={!canEditQuestions}
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
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 disabled:opacity-70"
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
              </label>

              <label className="mt-2 block space-y-1 text-sm">
                <span className="font-medium">Video URL (optional)</span>
                <input
                  value={question.videoUrl || ""}
                  disabled={!canEditQuestions}
                  onChange={(e) =>
                    setQuestions((prev) =>
                      prev.map((item, idx) => (idx === questionIndex ? { ...item, videoUrl: e.target.value } : item)),
                    )
                  }
                  placeholder="https://your-media-url/video.mp4"
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 disabled:opacity-70"
                />
              </label>

              {canEditQuestions ? (
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
                    <a href={question.videoUrl} target="_blank" rel="noreferrer" className="text-xs text-teal-700 hover:text-teal-700">
                      Preview video
                    </a>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-3 space-y-2 text-sm">
                <p className="font-medium">Options (select one correct answer)</p>
                {question.options.map((option, optionIndex) => (
                  <div key={option.id || optionIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`q-${questionIndex}-correct`}
                      checked={option.isCorrect}
                      disabled={!canEditQuestions}
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
                      disabled={!canEditQuestions}
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
                      className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 disabled:opacity-70"
                    />
                    {canEditQuestions ? (
                      <button
                        type="button"
                        className={ui.buttonSmall}
                        onClick={() =>
                          setQuestions((prev) =>
                            prev.map((item, idx) =>
                              idx === questionIndex
                                ? { ...item, options: item.options.filter((_, optIdx) => optIdx !== optionIndex) }
                                : item,
                            ),
                          )
                        }
                        disabled={question.options.length <= 2}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                ))}
                {canEditQuestions ? (
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
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {message ? <p className="mt-3 text-sm text-amber-700">{message}</p> : null}

      <div className="mt-4 flex gap-2">
        <button type="button" disabled={saving} onClick={handleSave} className={ui.buttonPrimary}>
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  )
}
