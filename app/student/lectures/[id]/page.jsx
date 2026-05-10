import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "../../../lib/db"
import { getCurrentUser } from "../../../lib/currentUser"
import * as ui from "../../../styles/ui"
import StudentPageHeader from "../../components/StudentPageHeader"

export default async function StudentLectureDetailPage({ params }) {
  const student = await getCurrentUser("STUDENT", { id: true, email: true })
  if (!student) redirect("/student/login")

  const { id } = await params

  const lecture = await prisma.lecture.findFirst({
    where: {
      id,
      module: {
        enrollments: {
          some: {
            userId: student.id,
            status: "ACTIVE",
          },
        },
      },
    },
    include: {
      module: { select: { code: true, name: true } },
      quizzes: {
        where: {
          status: "PUBLISHED",
          OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
        },
        select: {
          id: true,
          title: true,
          dueAt: true,
          maxAttempts: true,
        },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      },
    },
  })

  if (!lecture) redirect("/student/lectures")
  const nextQuiz = lecture.quizzes[0] || null

  return (
    <main className={ui.page}>
      <StudentPageHeader
        label="Student · Lecture"
        title={lecture.title}
        subtitle={`${lecture.module.code} · ${lecture.module.name}`}
        actions={<Link href="/student/lectures" className={ui.buttonSecondary}>All lectures</Link>}
      />

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div className={ui.cardFull}><p className={ui.textLabel}>Module</p><p className="mt-2 text-2xl font-semibold">{lecture.module.code}</p></div>
            <div className={ui.cardFull}><p className={ui.textLabel}>Published quizzes</p><p className="mt-2 text-2xl font-semibold">{lecture.quizzes.length}</p></div>
            <div className={ui.cardFull}>
              <p className={ui.textLabel}>Next due</p>
              <p className="mt-2 text-2xl font-semibold">{nextQuiz?.dueAt ? new Date(nextQuiz.dueAt).toLocaleDateString() : "Any time"}</p>
            </div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Published quizzes for this lecture</h2>
            {lecture.quizzes.length === 0 ? (
              <p className={ui.textSmall}>No published quizzes are available for this lecture yet.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {lecture.quizzes.map((quiz) => (
                  <Link key={quiz.id} href={`/student/quizzes/${quiz.id}/start`} className={`${ui.cardList} block hover:border-teal-500 transition`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-stone-950">{quiz.title || "Untitled"}</p>
                        <p className="text-xs text-stone-600">
                          Max attempts: {quiz.maxAttempts} · Due {quiz.dueAt ? new Date(quiz.dueAt).toLocaleDateString() : "Any time"}
                        </p>
                      </div>
                      <span className={ui.buttonSmall}>Open quiz</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
