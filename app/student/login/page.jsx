import Link from "next/link"
import LoginForm from "../../components/LoginForm"
import * as ui from "../../styles/ui"

export default function StudentLoginPage() {
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
          <LoginForm
            role="STUDENT"
            title="Student sign in"
            redirectTo="/student"
            subtitle="Sign in to access your enrolled modules, analogies, quizzes, and results."
          />
          <div className={ui.cardFull}>
            <p className="text-sm text-slate-300">
              New here? Create a student account or activate an invitation from your lecturer.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Link href="/student/register" className={ui.buttonPrimary}>Create account</Link>
              <Link href="/student/activate" className={ui.buttonSecondary}>Activate invite</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
