import Link from "next/link"
import StudentRegisterForm from "../../components/StudentRegisterForm"
import * as ui from "../../styles/ui"

export default function StudentRegisterPage() {
  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContentNarrow}>
          <div>
            <p className={ui.textLabel}>Student access</p>
            <h1 className="text-lg font-semibold">Create account</h1>
          </div>
          <Link href="/student/login" className={ui.buttonSecondary}>Back to sign in</Link>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.containerNarrow} py-10 space-y-5`}>
          <StudentRegisterForm />
        </div>
      </section>
    </main>
  )
}
