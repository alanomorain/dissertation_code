import Link from "next/link"
import { redirect } from "next/navigation"
import SignOutButton from "../../../components/SignOutButton"
import { prisma } from "../../../lib/db"
import { getCurrentUser } from "../../../lib/currentUser"
import * as ui from "../../../styles/ui"

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

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContentNarrow}>
          <div>
            <p className={ui.textLabel}>Student · Lecture</p>
            <h1 className="text-lg font-semibold">{lecture.title}</h1>
            <p className={ui.textSmall}>{lecture.module.code} · {lecture.module.name}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <SignOutButton />
            <Link href="/student/lectures" className={ui.buttonSecondary}>All lectures</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.containerNarrow} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Published quizzes for this lecture</h2>
            {lecture.quizzes.length === 0 ? (
              <p className={ui.textSmall}>No published quizzes are available for this lecture yet.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {lecture.quizzes.map((quiz) => (
                  <Link key={quiz.id} href={`/student/quizzes/${quiz.id}/start`} className={ui.linkCard}>
                    <p className="font-medium">{quiz.title || "Untitled"}</p>
                    <p className="text-xs text-slate-400">
                      Max attempts: {quiz.maxAttempts} · Due {quiz.dueAt ? new Date(quiz.dueAt).toLocaleDateString() : "Any time"}
                    </p>
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
