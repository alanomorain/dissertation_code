"use client"

import { useRouter } from "next/navigation"
import * as ui from "../styles/ui"

export default function SignOutButton({ redirectTo = "/" }) {
  const router = useRouter()

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <button type="button" onClick={signOut} className={ui.buttonSecondary}>
      Log out
    </button>
  )
}
