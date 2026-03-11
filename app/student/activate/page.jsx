import { Suspense } from "react"
import Link from "next/link"
import StudentActivationForm from "../../components/StudentActivationForm"
import * as ui from "../../styles/ui"

function ActivationContent() {
  return <StudentActivationForm />
}

export default function StudentActivatePage() {
  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContentNarrow}>
          <div>
            <p className={ui.textLabel}>Student invitation</p>
            <h1 className="text-lg font-semibold">Activate account</h1>
          </div>
          <Link href="/student/login" className={ui.buttonSecondary}>Back to sign in</Link>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.containerNarrow} py-10 space-y-5`}>
          <Suspense fallback={<div className={ui.cardFull}>Loading invite...</div>}>
            <ActivationContent />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
