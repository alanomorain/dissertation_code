import { cookies } from "next/headers"
import { prisma } from "./db"

const ROLE_ENV_MAP = {
  ADMIN: "DEMO_ADMIN_EMAIL",
  LECTURER: "DEMO_LECTURER_EMAIL",
  STUDENT: "DEMO_STUDENT_EMAIL",
}

export async function getCurrentUser(role, select) {
  const cookieStore = await cookies()
  const cookieRole = cookieStore.get("demo-role")?.value || ""
  const normalizedRole = cookieRole.toUpperCase()
  const requestedRole = typeof role === "string" ? role.toUpperCase() : ""
  const targetRole = ROLE_ENV_MAP[requestedRole]
    ? requestedRole
    : (ROLE_ENV_MAP[normalizedRole] ? normalizedRole : "")

  if (targetRole === "STUDENT") {
    const studentEmail = (cookieStore.get("demo-student-email")?.value || "").trim().toLowerCase()
    if (studentEmail) {
      const studentUser = await prisma.user.findFirst({
        where: { email: studentEmail, role: "STUDENT" },
        select,
      })

      if (studentUser) {
        return studentUser
      }
    }
  }

  const roleEnvKey = targetRole ? ROLE_ENV_MAP[targetRole] : undefined
  const roleEmail = roleEnvKey ? process.env[roleEnvKey] : undefined
  const fallbackEmail = process.env.DEMO_USER_EMAIL
  const email = (roleEmail || fallbackEmail || "").trim()

  if (email) {
    return prisma.user.findUnique({
      where: { email },
      select,
    })
  }

  if (targetRole) {
    return prisma.user.findFirst({
      where: { role: targetRole },
      select,
    })
  }

  return null
}
