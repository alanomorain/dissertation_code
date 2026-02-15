"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import * as ui from "../../../styles/ui"

const steps = [
  { id: 1, title: "Module & Scope" },
  { id: 2, title: "Quiz Settings" },
  { id: 3, title: "Generate & Preview" },
  { id: 4, title: "Publish" },
]

const sampleTopics = [
  "Database indexing",
  "Primary keys",
  "Query optimization",
  "Microservices architecture",
  "Docker containers",
]

const sampleQuestions = [
  {
    id: "q1",
    type: "MCQ",
    difficulty: "Medium",
    question: "Which statement best describes a database index?",
  },
  {
    id: "q2",
    type: "Short answer",
    difficulty: "Hard",
    question: "Explain how query optimization improves performance.",
  },
]

export default function LecturerQuizWizardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentStep = useMemo(() => {
    const parsed = Number(searchParams.get("step") || "1")
    if (Number.isNaN(parsed)) return 1
    if (parsed < 1 || parsed > steps.length) return 1
    return parsed
  }, [searchParams])
  const [moduleCode, setModuleCode] = useState("")
  const [scopeMode, setScopeMode] = useState("all")
  const [selectedTopics, setSelectedTopics] = useState([])
  const [objectives, setObjectives] = useState("")
  const [questionCount, setQuestionCount] = useState(12)
  const [questionTypes, setQuestionTypes] = useState({ mcq: true, short: true })
  const [difficultyMix, setDifficultyMix] = useState(50)
  const [generated, setGenerated] = useState(false)
  const [quizTitle, setQuizTitle] = useState("")
  const [visibility, setVisibility] = useState("enrolled")
  const [attempts, setAttempts] = useState("1")
  const [scheduleMode, setScheduleMode] = useState("now")
  const [scheduleAt, setScheduleAt] = useState("")

  const activeStep = useMemo(() => steps.find((s) => s.id === currentStep), [currentStep])

  const updateStep = (nextStep) => {
    const safeStep = Math.min(Math.max(nextStep, 1), steps.length)
    router.replace(`/lecturer/quizzes/new?step=${safeStep}`)
  }

  const canProceed = () => {
    if (currentStep === 1) {
      if (!moduleCode) return false
      if (scopeMode === "selected" && selectedTopics.length === 0) return false
    }
    if (currentStep === 2) {
      if (!questionTypes.mcq && !questionTypes.short) return false
    }
    if (currentStep === 3 && !generated) return false
    if (currentStep === 4 && !quizTitle.trim()) return false
    return true
  }

  const toggleTopic = (topic) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    )
  }

  const handleGenerate = () => {
    setGenerated(true)
  }

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <h1 className="text-lg font-semibold">New Quiz Wizard</h1>
            <p className={ui.textSmall}>Build, preview, and publish a quiz.</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/lecturer/quizzes" className={ui.buttonSecondary}>
              Back to quizzes
            </Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing} grid gap-6 lg:grid-cols-[260px,1fr,280px]`}>
          <aside className={`${ui.cardFull} h-fit`}>
            <h2 className={ui.cardHeader}>Steps</h2>
            <ol className="space-y-3 text-sm">
              {steps.map((step) => (
                <li key={step.id} className="flex items-center gap-3">
                  <span
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                      step.id === currentStep
                        ? "bg-indigo-500 text-white"
                        : "bg-slate-800 text-slate-200"
                    }`}
                  >
                    {step.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateStep(step.id)}
                    className={step.id === currentStep ? "text-slate-100" : "text-slate-400"}
                  >
                    {step.title}
                  </button>
                </li>
              ))}
            </ol>
          </aside>

          <div className="space-y-4">
            <div className={ui.cardFull}>
              <h2 className={ui.cardHeader}>{activeStep?.title}</h2>

              {currentStep === 1 && (
                <div className="space-y-4 text-sm">
                  <div className="space-y-2">
                    <label className="font-medium">Module</label>
                    <select
                      value={moduleCode}
                      onChange={(event) => setModuleCode(event.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
                    >
                      <option value="">Select a module</option>
                      <option value="CSC7058">CSC7058 · ISDP</option>
                      <option value="CSC7082">CSC7082 · Databases</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="font-medium">Topic scope</label>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setScopeMode("all")}
                        className={scopeMode === "all" ? ui.buttonPrimary : ui.buttonSecondary}
                      >
                        All topics
                      </button>
                      <button
                        type="button"
                        onClick={() => setScopeMode("selected")}
                        className={scopeMode === "selected" ? ui.buttonPrimary : ui.buttonSecondary}
                      >
                        Select topics
                      </button>
                    </div>
                  </div>

                  {scopeMode === "selected" && (
                    <div className="grid gap-2 md:grid-cols-2">
                      {sampleTopics.map((topic) => (
                        <label key={topic} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedTopics.includes(topic)}
                            onChange={() => toggleTopic(topic)}
                          />
                          <span>{topic}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="font-medium">Learning objectives (optional)</label>
                    <textarea
                      value={objectives}
                      onChange={(event) => setObjectives(event.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
                      placeholder="What should students be able to do after this quiz?"
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4 text-sm">
                  <div className="space-y-2">
                    <label className="font-medium">Difficulty mix</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={difficultyMix}
                      onChange={(event) => setDifficultyMix(Number(event.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-400">{difficultyMix}% medium, {100 - difficultyMix}% split between easy/hard</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="font-medium">Question count</label>
                      <input
                        type="number"
                        min="5"
                        max="30"
                        value={questionCount}
                        onChange={(event) => setQuestionCount(Number(event.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-medium">Question types</label>
                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={questionTypes.mcq}
                          onChange={(event) =>
                            setQuestionTypes((prev) => ({ ...prev, mcq: event.target.checked }))
                          }
                        />
                        MCQ
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={questionTypes.short}
                          onChange={(event) =>
                            setQuestionTypes((prev) => ({ ...prev, short: event.target.checked }))
                          }
                        />
                        Short answer
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 text-sm">
                  <button type="button" onClick={handleGenerate} className={ui.buttonPrimary}>
                    Generate quiz
                  </button>
                  {generated && (
                    <div className="space-y-3">
                      {sampleQuestions.map((q) => (
                        <div key={q.id} className={ui.cardInner}>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>{q.type}</span>
                            <span>•</span>
                            <span>{q.difficulty}</span>
                          </div>
                          <p className="text-sm text-slate-100 mt-2">{q.question}</p>
                          <div className="mt-3 flex gap-2">
                            <button type="button" className={ui.buttonSecondary}>Regenerate</button>
                            <button type="button" className={ui.buttonSecondary}>Edit</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4 text-sm">
                  <div className="space-y-2">
                    <label className="font-medium">Quiz title</label>
                    <input
                      value={quizTitle}
                      onChange={(event) => setQuizTitle(event.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
                      placeholder="Mid-term check-in"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-medium">Availability</label>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setScheduleMode("now")}
                        className={scheduleMode === "now" ? ui.buttonPrimary : ui.buttonSecondary}
                      >
                        Immediately
                      </button>
                      <button
                        type="button"
                        onClick={() => setScheduleMode("schedule")}
                        className={scheduleMode === "schedule" ? ui.buttonPrimary : ui.buttonSecondary}
                      >
                        Schedule
                      </button>
                    </div>
                    {scheduleMode === "schedule" && (
                      <input
                        type="datetime-local"
                        value={scheduleAt}
                        onChange={(event) => setScheduleAt(event.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="font-medium">Visibility</label>
                    <select
                      value={visibility}
                      onChange={(event) => setVisibility(event.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
                    >
                      <option value="enrolled">Enrolled students only</option>
                      <option value="all">All students</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="font-medium">Attempts</label>
                    <select
                      value={attempts}
                      onChange={(event) => setAttempts(event.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
                    >
                      <option value="1">Single attempt</option>
                      <option value="unlimited">Unlimited attempts</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => updateStep(currentStep - 1)}
                className={ui.buttonSecondary}
                disabled={currentStep === 1}
              >
                Back
              </button>
              <div className="flex items-center gap-3">
                <button type="button" className={ui.buttonSecondary}>Save draft</button>
                <button
                  type="button"
                  onClick={() => updateStep(currentStep + 1)}
                  className={ui.buttonPrimary}
                  disabled={!canProceed()}
                >
                  {currentStep === 4 ? "Publish" : "Next"}
                </button>
              </div>
            </div>
          </div>

          <aside className={`${ui.cardFull} h-fit`}>
            <h2 className={ui.cardHeader}>Summary</h2>
            <div className="space-y-2 text-sm">
              <p><span className={ui.textMuted}>Module:</span> {moduleCode || "Not selected"}</p>
              <p><span className={ui.textMuted}>Topics:</span> {scopeMode === "all" ? "All" : selectedTopics.length}</p>
              <p><span className={ui.textMuted}>Questions:</span> {questionCount}</p>
              <p><span className={ui.textMuted}>Types:</span> {questionTypes.mcq ? "MCQ" : ""}{questionTypes.mcq && questionTypes.short ? ", " : ""}{questionTypes.short ? "Short" : ""}</p>
              <p><span className={ui.textMuted}>Status:</span> {generated ? "Generated" : "Draft"}</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
