"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import QuizStatusBadge from "../../../components/QuizStatusBadge"
import * as ui from "../../../styles/ui"

export default function ModuleQuizCard({ moduleGroup }) {
  const [expanded, setExpanded] = useState(false)

  const visibleQuizzes = useMemo(() => {
    if (expanded) return moduleGroup.quizzes
    return moduleGroup.quizzes.slice(0, 3)
  }, [expanded, moduleGroup.quizzes])

  const hiddenCount = Math.max(0, moduleGroup.quizzes.length - 3)

  return (
    <div className={`${ui.card} p-6 md:p-7`}>
      <div className="mb-4">
        <p className={ui.textHighlight}>{moduleGroup.moduleCode}</p>
        <h2 className="text-lg font-semibold text-slate-100">{moduleGroup.moduleName}</h2>
      </div>

      <div className="space-y-3">
        {visibleQuizzes.map((quiz) => (
          <Link
            key={quiz.id}
            href={`/lecturer/quizzes/${quiz.id}`}
            className={`${ui.cardList} block hover:border-indigo-400 transition`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-100">{quiz.title}</p>
                <p className="text-xs text-slate-400">
                  {quiz.questionCount} questions · {quiz.attemptCount} attempts
                </p>
                <p className="text-xs text-slate-500">
                  Release: {quiz.releaseText} · Due: {quiz.dueText}
                </p>
              </div>
              <QuizStatusBadge status={quiz.badgeStatus} />
            </div>
          </Link>
        ))}
      </div>

      {hiddenCount > 0 ? (
        <div className="mt-4 pt-2 border-t border-slate-800/60">
          <button type="button" className={ui.buttonSecondary} onClick={() => setExpanded((prev) => !prev)}>
            {expanded ? "Show less" : `Show more (${hiddenCount})`}
          </button>
        </div>
      ) : null}
    </div>
  )
}
