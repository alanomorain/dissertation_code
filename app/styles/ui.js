/**
 * Shared Tailwind design system for consistent UI patterns
 * Import and use these string constants across pages
 */

// Layout & Container
export const container = "mx-auto max-w-6xl px-4"
export const containerNarrow = "mx-auto max-w-5xl px-4"
export const page = "min-h-screen bg-transparent text-slate-100 flex flex-col"
export const pageSection = "flex-1"
export const pageSpacing = "py-6 space-y-4"

// Cards
export const card = "bg-slate-950/50 border border-slate-800/50 backdrop-blur rounded-2xl"
export const cardPadding = "p-5"
export const cardFull = "bg-slate-950/50 border border-slate-800/50 backdrop-blur rounded-2xl p-5"
export const cardInner = "bg-slate-900/70 border border-slate-800/50 backdrop-blur rounded-xl p-4"
export const cardList = "rounded-xl border border-slate-800/50 bg-slate-900/70 px-4 py-3 backdrop-blur"

// Headers
export const header = "sticky top-0 z-30 w-full border-b border-slate-800/50 bg-slate-950/70 backdrop-blur-md"
export const headerContent = "mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between"
export const headerContentNarrow = "mx-auto max-w-5xl px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between"
export const cardHeader = "text-base font-semibold mb-3"

// Buttons
export const buttonPrimary = "rounded-lg bg-indigo-500 px-3 py-1.5 font-medium text-white hover:bg-indigo-400 transition text-sm"
export const buttonSecondary = "rounded-lg border border-slate-600 px-3 py-1.5 hover:border-indigo-400 hover:text-indigo-200 transition text-sm"
export const buttonSmall = "text-xs rounded-lg border border-slate-600 px-3 py-1 hover:border-indigo-400 hover:text-indigo-200 transition"

// Badges
export const badgeReady = "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-900/50 text-green-200"
export const badgeProcessing = "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-yellow-900/50 text-yellow-200"
export const badgeFailed = "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-red-900/50 text-red-200"
export const badgeApproved = "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-emerald-900/50 text-emerald-200"
export const badgeDraft = "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-slate-800/60 text-slate-200"
export const badgeChanges = "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-amber-900/50 text-amber-200"

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
export const linkCard = "block rounded-xl border border-slate-800/50 bg-slate-900/70 px-4 py-3 hover:border-indigo-400 transition backdrop-blur"

// Text
export const textMuted = "text-slate-400"
export const textSmall = "text-sm text-slate-400"
export const textLabel = "text-xs uppercase tracking-wide text-slate-400"
export const textHighlight = "text-xs uppercase tracking-wide text-indigo-300"
