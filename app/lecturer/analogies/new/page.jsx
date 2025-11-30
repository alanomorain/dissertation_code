"use client"

import { useState } from "react"
import Link from "next/link"

export default function NewAnalogyPage() {
  const [title, setTitle] = useState("")
  const [concept, setConcept] = useState("")
  const [moduleCode, setModuleCode] = useState("CSC7058")
  const [analogyText, setAnalogyText] = useState("")
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  // Later this will POST to an API route and store in DB
  const handleSubmit = (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    // Basic client-side validation
    if (!title || !concept || !analogyText) {
      setMessage({
        type: "error",
        text: "Please fill in the title, concept and analogy text.",
      })
      setSaving(false)
      return
    }

    // this is where I'll call an API route later
    console.log("New analogy data:", {
      title,
      concept,
      moduleCode,
      analogyText,
      imageFile,
    })

    setTimeout(() => {
      setSaving(false)
      setMessage({
        type: "success",
        text: "Analogy saved! (Later this will save to the DB)",
      })

    //   clear the form
      setTitle("")
      setConcept("")
      setAnalogyText("")
      setImageFile(null)
    }, 800)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    setImageFile(file || null)
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* top bar */}
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">
              New Analogy
            </h1>
          </div>
          <Link
            href="/lecturer"
            className="text-sm rounded-lg border border-slate-600 px-3 py-1.5 hover:border-indigo-400 hover:text-indigo-200 transition"
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      {/* Content */}
      <section className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 md:p-8">
            <p className="text-sm text-slate-300 mb-4">
              Here you can submit a new analogy to add to your selected module
            </p>

            {/* onSubmit message box */}
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
              {/* Module */}
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
                  {/* Later this list will come from the db */}
                  <option value="CSC7058">
                    CSC7058 · Individual Software Development Project
                  </option>
                  <option value="CSC7084">
                    CSC7084 · Web Development
                  </option>
                  <option value="CSC7072">
                    CSC7072 · Databases
                  </option>
                </select>
                <p className="text-xs text-slate-400">
                  Choose the module this analogy belongs to.
                </p>
              </div>

              {/* Concept title */}
              <div className="space-y-1">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-slate-200"
                >
                  Analogy title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
                <p className="text-xs text-slate-400">
                  A short, descriptive title for the analogy.
                </p>
              </div>

              {/* Concept being explained */}
              <div className="space-y-1">
                <label
                  htmlFor="concept"
                  className="block text-sm font-medium text-slate-200"
                >
                  Concept being explained
                </label>
                <input
                  id="concept"
                  type="text"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
                <p className="text-xs text-slate-400">
                  The actual concept students should understand.
                </p>
              </div>

              {/* Analogy text */}
              <div className="space-y-1">
                <label
                  htmlFor="analogyText"
                  className="block text-sm font-medium text-slate-200"
                >
                  Analogy text
                </label>
                <textarea
                  id="analogyText"
                  value={analogyText}
                  onChange={(e) => setAnalogyText(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
                <p className="text-xs text-slate-400">
                  This is what students will see.
                </p>
              </div>

              {/* Image upload */}
              <div className="space-y-1">
                <label
                  htmlFor="image"
                  className="block text-sm font-medium text-slate-200"
                >
                  Supporting image 
                </label>
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-indigo-400"
                />
                <p className="text-xs text-slate-400">
                  Upload a diagram, sketch, or visual that reinforces the
                  analogy.
                </p>
                {imageFile && (
                  <p className="text-xs text-slate-300 mt-1">
                    Selected file: <span className="font-medium">{imageFile.name}</span>
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {saving ? "Saving..." : "Save analogy "}
                </button>
                <Link
                  href="/lecturer"
                  className="text-sm text-slate-300 hover:text-indigo-200"
                >
                  Cancel and return to dashboard
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}