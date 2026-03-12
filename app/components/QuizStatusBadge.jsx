import * as ui from "../styles/ui"

const normalizeStatus = (value) => (value || "Draft").toString().trim().toLowerCase()

const getClassName = (status) => {
  const normalized = normalizeStatus(status)
  if (
    normalized === "published"
    || normalized === "available"
    || normalized === "completed"
  ) {
    return ui.badgeApproved
  }
  if (normalized === "in progress") {
    return ui.badgeProcessing
  }
  if (normalized === "to do") {
    return ui.badgeDraft
  }
  if (normalized === "upcoming") {
    return ui.badgeProcessing
  }
  if (normalized === "closed" || normalized === "archived") {
    return ui.badgeFailed
  }
  return ui.badgeDraft
}

export default function QuizStatusBadge({ status }) {
  const normalized = normalizeStatus(status)
  const label = normalized.charAt(0).toUpperCase() + normalized.slice(1)

  return (
    <span className={getClassName(status)}>{label}</span>
  )
}
