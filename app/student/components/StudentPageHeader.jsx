import SignOutButton from "../../components/SignOutButton"
import * as ui from "../../styles/ui"

export default function StudentPageHeader({ label, title, actions }) {
  return (
    <header className={ui.header}>
      <div className={ui.headerContent}>
        <div>
          <p className={ui.textLabel}>{label}</p>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
          <SignOutButton />
          {actions}
        </div>
      </div>
    </header>
  )
}
