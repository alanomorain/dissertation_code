import Link from "next/link"
import { redirect } from "next/navigation"
import LecturerInviteStudentForm from "../../../components/LecturerInviteStudentForm"
import { prisma } from "../../../lib/db"
import { getCurrentUser } from "../../../lib/currentUser"
import * as ui from "../../../styles/ui"

export default async function LecturerInviteStudentPage({ searchParams }) {
  const lecturer = await getCurrentUser("LECTURER", { id: true })
  if (!lecturer) {
    redirect("/lecturer/login")
  }

  const modules = await prisma.module.findMany({
    where: { lecturerId: lecturer.id },
    select: { id: true, code: true, name: true },
    orderBy: { code: "asc" },
  })

  const query = await searchParams
  const initialModuleCode = typeof query?.module === "string" ? query.module : ""

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <p className={ui.textLabel}>Lecturer · Students</p>
            <h1 className="text-lg font-semibold">Invite students</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/lecturer" className={ui.buttonSecondary}>Back to dashboard</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <LecturerInviteStudentForm modules={modules} initialModuleCode={initialModuleCode} />
        </div>
      </section>
    </main>
  )
}
