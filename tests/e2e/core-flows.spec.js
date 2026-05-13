import { expect, test } from "@playwright/test"

const lecturer = {
  email: process.env.E2E_LECTURER_EMAIL || "l@example.com",
  password: process.env.E2E_LECTURER_PASSWORD || "LP123!",
}

const student = {
  email: process.env.E2E_STUDENT_EMAIL || "s@example.com",
  password: process.env.E2E_STUDENT_PASSWORD || "SP123!",
}

async function signIn(page, { role, email, password }) {
  await page.goto(`/${role.toLowerCase()}/login`)
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Sign In" }).click()
  await expect(page).toHaveURL(new RegExp(`/${role.toLowerCase()}$`))
}

async function skipIfSeededAccountUnavailable(page, account) {
  await page.goto("/")
  const origin = new URL(page.url()).origin
  const response = await page.request.post("/api/auth/login", {
    headers: {
      origin,
      "sec-fetch-site": "same-origin",
    },
    data: account,
  })

  await page.context().clearCookies()
  test.skip(response.status() !== 200, `Seeded ${account.role.toLowerCase()} credentials are not available in this environment.`)
}

test.describe("core dissertation demo smoke tests", () => {
  test("home page exposes lecturer and student entry points", async ({ page }) => {
    await page.goto("/")

    await expect(page.getByRole("heading", { name: "Learning Through Analogies" })).toBeVisible()
    await expect(page.getByRole("link", { name: /Continue as Student/i })).toHaveAttribute("href", "/student/login")
    await expect(page.getByRole("link", { name: /Continue as Lecturer/i })).toHaveAttribute("href", "/lecturer/login")
  })

  test("lecturer can sign in and navigate core management areas", async ({ page }) => {
    await skipIfSeededAccountUnavailable(page, { role: "LECTURER", ...lecturer })
    await signIn(page, { role: "LECTURER", ...lecturer })

    await expect(page.getByRole("heading", { name: "Lecturer Dashboard" })).toBeVisible()

    for (const path of [
      "/lecturer/modules",
      "/lecturer/analogies",
      "/lecturer/quizzes",
      "/lecturer/students",
      "/lecturer/statistics",
    ]) {
      await page.goto(path)
      await expect(page).toHaveURL(new RegExp(path.replace("/", "\\/")))
    }
  })

  test("student can sign in and reach quiz pages", async ({ page }) => {
    await skipIfSeededAccountUnavailable(page, { role: "STUDENT", ...student })
    await signIn(page, { role: "STUDENT", ...student })

    await expect(page.getByRole("heading", { name: "Student Dashboard" })).toBeVisible()
    await page.goto("/student/quizzes")
    await expect(page).toHaveURL(/\/student\/quizzes/)
    await expect(page.getByText(/Quiz|Quizzes/i).first()).toBeVisible()
  })
})
