import Link from "next/link"
import { cookies } from "next/headers"
import { prisma } from "../../lib/db"
import StudentLoginForm from "../../components/StudentLoginForm"
import * as ui from "../../styles/ui"

export default async function StudentLoginPage() {
  const cookieStore = await cookies()
  const selectedEmail = cookieStore.get("demo-student-email")?.value || ""

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: { id: true, email: true, studentNumber: true },
    orderBy: [{ studentNumber: "asc" }, { email: "asc" }],
  })

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContentNarrow}>
          <div>
            <p className={ui.textLabel}>Student access</p>
            <h1 className="text-lg font-semibold">Sign in</h1>
          </div>
          <Link href="/" className={ui.buttonSecondary}>Back to home</Link>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.containerNarrow} py-10 space-y-5`}>
          <p className="text-sm text-slate-300">
            Use this demo login to view the platform from different student perspectives.
          </p>
          <StudentLoginForm students={students} selectedEmail={selectedEmail} />
        </div>
      </section>
    </main>
  )
}
