/**
 * Shared Tailwind design system for consistent UI patterns
 * Import and use these string constants across pages
 */

// Layout & Container
export const container = "mx-auto max-w-6xl px-4"
export const containerNarrow = "mx-auto max-w-5xl px-4"
export const page = "min-h-screen bg-stone-50 text-stone-950 flex flex-col"
export const pageSection = "flex-1"
export const pageSpacing = "py-6 space-y-4"

// Cards
export const card = "bg-white border border-stone-200 rounded-2xl shadow-sm"
export const cardPadding = "p-5"
export const cardFull = "bg-white border border-stone-200 rounded-2xl p-5 shadow-sm"
export const cardInner = "bg-stone-50 border border-stone-200 rounded-xl p-4"
export const cardList = "rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm"

// Headers
export const header = "sticky top-0 z-30 w-full border-b border-stone-200 bg-white/90 backdrop-blur-md"
export const headerContent = "mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between"
export const headerContentNarrow = "mx-auto max-w-5xl px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between"
export const cardHeader = "text-base font-semibold mb-3"

// Buttons
export const buttonPrimary = "rounded-lg bg-teal-600 px-3 py-1.5 font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition text-sm"
export const buttonSecondary = "rounded-lg border border-stone-300 bg-white px-3 py-1.5 font-medium text-stone-700 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition text-sm"
export const buttonSmall = "text-xs rounded-lg border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition"

// Badges
export const badgeReady = "inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
export const badgeProcessing = "inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700"
export const badgeFailed = "inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700"
export const badgeApproved = "inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
export const badgeDraft = "inline-flex items-center rounded-full border border-stone-200 bg-stone-100 px-2 py-1 text-xs font-medium text-stone-700"
export const badgeChanges = "inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700"

// Status badge helper (use in components)
export const getBadgeClass = (status) => {
  if (status === "ready") return badgeReady
  if (status === "failed") return badgeFailed
  return badgeProcessing
}

export const getReviewBadgeClass = (status) => {
  if (status === "APPROVED") return badgeApproved
  if (status === "CHANGES") return badgeChanges
  return badgeDraft
}

// Links
export const linkCard = "block rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm hover:border-teal-200 hover:bg-teal-50 transition"

// Text
export const textMuted = "text-stone-600"
export const textSmall = "text-sm text-stone-600"
export const textLabel = "text-xs uppercase tracking-wide text-stone-600"
export const textHighlight = "text-xs uppercase tracking-wide text-teal-700"

// Forms
export const input = "rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
export const inputFull = `w-full ${input}`
export const calloutTeal = "rounded-2xl border border-teal-100 bg-teal-50 p-6 text-teal-900"
export const alertSuccess = "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
export const alertWarning = "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700"
export const alertError = "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
