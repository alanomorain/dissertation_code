"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import * as ui from "../../../styles/ui"

function LecturerQuizWizardPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const moduleFromUrl = useMemo(() => searchParams.get("module") || "", [searchParams])

  const [modules, setModules] = useState([])
  const [selectedModule, setSelectedModule] = useState("")
  const [quizTitle, setQuizTitle] = useState("")
  const [dueAt, setDueAt] = useState("")
  const [maxAttempts, setMaxAttempts] = useState(1)
  const [status, setStatus] = useState("DRAFT")
  const [questionText, setQuestionText] = useState("")
  const [creating, setCreating] = useState(false)
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

  const handleCreate = async () => {
    if (!quizTitle.trim() || !selectedModule || !questionText.trim()) {
      setMessage("Title, module and first question are required.")
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
          status,
          dueAt: dueAt || null,
          maxAttempts: Number(maxAttempts) || 1,
          questions: [
            {
              prompt: questionText,
              type: "MCQ",
              difficulty: "MEDIUM",
              options: [
                { text: "Option A", isCorrect: true },
                { text: "Option B", isCorrect: false },
                { text: "Option C", isCorrect: false },
              ],
            },
          ],
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
                <span className="font-medium">Max attempts</span>
                <input type="number" min={1} max={5} value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2" />
              </label>
            </div>

            <label className="mt-4 block space-y-1 text-sm">
              <span className="font-medium">First question</span>
              <textarea rows={3} value={questionText} onChange={(e) => setQuestionText(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2" />
            </label>

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
