import Link from "next/link"
import { redirect } from "next/navigation"
import QuizStatusBadge from "../../components/QuizStatusBadge"
import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"
import * as ui from "../../styles/ui"
import ModuleQuizCard from "./components/ModuleQuizCard"

function timingStatus(quiz, nowTs) {
  const publishedTs = quiz.publishedAt ? new Date(quiz.publishedAt).getTime() : null
  const dueTs = quiz.dueAt ? new Date(quiz.dueAt).getTime() : null

  if (quiz.status === "PUBLISHED" && publishedTs && publishedTs > nowTs) return "SCHEDULED"
  if (quiz.status === "PUBLISHED" && dueTs && dueTs < nowTs) return "PAST"
  if (quiz.status === "PUBLISHED") return "ACTIVE"
  if (quiz.status === "ARCHIVED") return "ARCHIVED"
  return "DRAFT"
}

function groupByModule(quizzes) {
  return quizzes.reduce((acc, quiz) => {
    const code = quiz.module.code
    if (!acc[code]) {
      acc[code] = {
        moduleCode: code,
        moduleName: quiz.module.name,
        quizzes: [],
      }
    }
    acc[code].quizzes.push(quiz)
    return acc
  }, {})
}

function badgeLabelForQuiz(quiz, nowTs) {
  const status = timingStatus(quiz, nowTs)
  if (status === "SCHEDULED") return "Upcoming"
  if (status === "PAST") return "Closed"
  if (status === "ACTIVE") return "Published"
  if (status === "ARCHIVED") return "Archived"
  return "Draft"
}

function toQuizView(quiz, nowTs) {
  return {
    id: quiz.id,
    title: quiz.title,
    moduleCode: quiz.module.code,
    questionCount: quiz._count.questions,
    attemptCount: quiz._count.attempts,
    releaseText: quiz.publishedAt ? new Date(quiz.publishedAt).toLocaleString() : "Not scheduled",
    dueText: quiz.dueAt ? new Date(quiz.dueAt).toLocaleString() : "No due date",
    badgeStatus: badgeLabelForQuiz(quiz, nowTs),
  }
}

function SidebarSection({ title, helperText, quizzes, nowTs }) {
  if (quizzes.length === 0) {
    return (
      <div className={ui.cardFull}>
        <h2 className={ui.cardHeader}>{title}</h2>
        <p className={ui.textSmall}>{helperText}</p>
      </div>
    )
  }

  return (
    <div className={ui.cardFull}>
      <h2 className={ui.cardHeader}>{title}</h2>
      <div className="space-y-2 text-sm">
        {quizzes.map((quiz) => (
          <Link
            key={quiz.id}
            href={`/lecturer/quizzes/${quiz.id}`}
            className={`${ui.cardList} block hover:border-indigo-400 transition`}
          >
            <p className="font-medium text-slate-100">{quiz.title}</p>
            <p className="text-xs text-slate-400">{quiz.module.code}</p>
                <div className="mt-2">
                  <QuizStatusBadge status={badgeLabelForQuiz(quiz, nowTs)} />
                </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default async function LecturerQuizzesPage({ searchParams }) {
  const lecturerUser = await getCurrentUser("LECTURER", { id: true })
  if (!lecturerUser) redirect("/lecturer/login")
  const resolvedSearchParams = await searchParams
  const moduleCodeFilter = String(resolvedSearchParams?.module || "").trim().toUpperCase()

  const nowTs = new Date().getTime()
  const quizzes = await prisma.quiz.findMany({
    where: {
      ownerId: lecturerUser.id,
      ...(moduleCodeFilter ? { module: { code: moduleCodeFilter } } : {}),
    },
    include: {
      module: { select: { code: true, name: true } },
      _count: { select: { questions: true, attempts: true } },
    },
    orderBy: [{ module: { code: "asc" } }, { createdAt: "desc" }],
  })

  const drafts = quizzes.filter((quiz) => timingStatus(quiz, nowTs) === "DRAFT")
  const scheduled = quizzes.filter((quiz) => timingStatus(quiz, nowTs) === "SCHEDULED")
  const moduleQuizzes = quizzes.filter((quiz) => {
    const status = timingStatus(quiz, nowTs)
    return status !== "DRAFT" && status !== "SCHEDULED"
  })

  const moduleGroups = Object.values(groupByModule(moduleQuizzes))
    .map((group) => ({
      moduleCode: group.moduleCode,
      moduleName: group.moduleName,
      quizzes: group.quizzes.map((quiz) => toQuizView(quiz, nowTs)),
    }))

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <h1 className="text-lg font-semibold">Quizzes</h1>
            <p className={ui.textSmall}>Organised by module with draft, scheduled, active, and past views.</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/lecturer" className={ui.buttonSecondary}>
              Back to dashboard
            </Link>
            <Link href="/lecturer/quizzes/new" className={ui.buttonPrimary}>
              + New quiz
            </Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className="mx-auto grid w-full max-w-[1260px] gap-6 lg:grid-cols-[minmax(0,860px)_minmax(260px,320px)] lg:justify-center">
            <div className="space-y-6">
              {moduleGroups.length === 0 ? (
                <div className={ui.cardFull}>
                  <h2 className={ui.cardHeader}>Modules</h2>
                  <p className={ui.textSmall}>No published or archived quizzes yet. Create a quiz to populate module cards.</p>
                </div>
              ) : (
                moduleGroups.map((group) => <ModuleQuizCard key={group.moduleCode} moduleGroup={group} />)
              )}
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24 h-fit self-start">
              <SidebarSection
                title="Scheduled"
                helperText="No scheduled quizzes. Add a release date when publishing."
                quizzes={scheduled}
                nowTs={nowTs}
              />
              <SidebarSection
                title="Drafts"
                helperText="No draft quizzes right now."
                quizzes={drafts}
                nowTs={nowTs}
              />
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}
