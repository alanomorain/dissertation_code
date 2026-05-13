import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "../../../../lib/db"
import { getCurrentUser } from "../../../../lib/currentUser"
import * as ui from "../../../../styles/ui"
import QuizEditForm from "./QuizEditForm"

export default async function LecturerQuizEditPage({ params }) {
  const { id } = await params
  const lecturerUser = await getCurrentUser("LECTURER", { id: true })
  if (!lecturerUser) notFound()

  const quiz = await prisma.quiz.findFirst({
    where: { id, ownerId: lecturerUser.id },
    include: {
      module: { select: { code: true, name: true } },
      lecture: { select: { title: true } },
      questions: {
        orderBy: { orderIndex: "asc" },
        include: {
          options: { orderBy: { orderIndex: "asc" } },
        },
      },
      _count: { select: { attempts: true } },
    },
  })

  if (!quiz) notFound()

  const initialQuiz = {
    id: quiz.id,
    title: quiz.title,
    status: quiz.status,
    maxAttempts: quiz.maxAttempts,
    dueAt: quiz.dueAt ? quiz.dueAt.toISOString() : null,
    publishedAt: quiz.publishedAt ? quiz.publishedAt.toISOString() : null,
    lectureId: quiz.lectureId,
    module: quiz.module,
    lecture: quiz.lecture,
    questions: quiz.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      difficulty: question.difficulty,
      analogySetId: question.analogySetId,
      analogyTopicIndex: question.analogyTopicIndex,
      options: question.options.map((option) => ({
        id: option.id,
        text: option.text,
        isCorrect: option.isCorrect,
      })),
    })),
  }

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <h1 className="text-lg font-semibold">Edit Quiz</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href={`/lecturer/quizzes/${id}`} className={ui.buttonSecondary}>Back to Overview</Link>
          </div>
        </div>
      </header>
      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <QuizEditForm quiz={initialQuiz} canEditQuestions={quiz._count.attempts === 0} />
        </div>
      </section>
    </main>
  )
}
