"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import QuizStatusBadge from "../../../components/QuizStatusBadge"
import * as ui from "../../../styles/ui"

function QuizItem({ quiz }) {
  const content = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="font-semibold text-slate-100">{quiz.title}</p>
        <p className="text-xs text-slate-400">
          Attempts: {quiz.submittedAttempts}/{quiz.maxAttempts}
          {quiz.bestScore === null ? "" : ` · Best score: ${quiz.bestScore}%`}
        </p>
        <p className="text-xs text-slate-500">
          Release: {quiz.releaseText} · Due: {quiz.dueText}
        </p>
      </div>
      <QuizStatusBadge status={quiz.badgeStatus} />
    </div>
  )

  if (quiz.state === "UPCOMING") {
    return <div className={ui.cardList}>{content}</div>
  }

  return (
    <Link href={`/student/quizzes/${quiz.id}/start`} className={`${ui.cardList} block hover:border-indigo-400 transition`}>
      {content}
    </Link>
  )
}

export default function StudentModuleQuizCard({ moduleGroup }) {
  const [expanded, setExpanded] = useState(false)
  const visibleQuizzes = useMemo(
    () => (expanded ? moduleGroup.quizzes : moduleGroup.quizzes.slice(0, 3)),
    [expanded, moduleGroup.quizzes],
  )
  const hiddenCount = Math.max(0, moduleGroup.quizzes.length - 3)

  return (
    <div className={`${ui.card} p-6 md:p-7`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={ui.textHighlight}>{moduleGroup.moduleCode}</p>
          <h2 className="text-lg font-semibold text-slate-100">{moduleGroup.moduleName}</h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className={ui.badgeDraft}>To do: {moduleGroup.counts.TO_DO}</span>
          <span className={ui.badgeProcessing}>In progress: {moduleGroup.counts.IN_PROGRESS}</span>
          <span className={ui.badgeApproved}>Completed: {moduleGroup.counts.COMPLETED}</span>
          <span className={ui.badgeProcessing}>Upcoming: {moduleGroup.counts.UPCOMING}</span>
        </div>
      </div>

      <div className="space-y-3">
        {visibleQuizzes.map((quiz) => (
          <QuizItem key={quiz.id} quiz={quiz} />
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
