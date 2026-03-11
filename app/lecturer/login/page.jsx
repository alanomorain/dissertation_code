import Link from "next/link"
import LoginForm from "../../components/LoginForm"
import * as ui from "../../styles/ui"

export default function LecturerLoginPage() {
  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContentNarrow}>
          <div>
            <p className={ui.textLabel}>Lecturer access</p>
            <h1 className="text-lg font-semibold">Sign in</h1>
          </div>
          <Link href="/" className={ui.buttonSecondary}>Back to home</Link>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.containerNarrow} py-10 space-y-5`}>
          <LoginForm
            role="LECTURER"
            title="Lecturer sign in"
            redirectTo="/lecturer"
            subtitle="Sign in to manage your modules, analogies, quizzes, and analytics."
          />
        </div>
      </section>
    </main>
  )
}
