import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
  enforceRateLimit: vi.fn(),
  getClientIp: vi.fn(),
  verifyPassword: vi.fn(),
}))

vi.mock("../../app/lib/db.js", () => ({ prisma: mocks.prisma }))
vi.mock("../../app/lib/rateLimit.js", () => ({
  enforceRateLimit: mocks.enforceRateLimit,
  getClientIp: mocks.getClientIp,
}))
vi.mock("../../app/lib/passwords.js", () => ({ verifyPassword: mocks.verifyPassword }))

process.env.AUTH_SECRET = "test-auth-secret"

const { POST } = await import("../../app/api/auth/login/route.js")

function jsonRequest(body) {
  return new Request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
      "sec-fetch-site": "same-origin",
      "x-forwarded-for": "127.0.0.1",
    },
    body: JSON.stringify(body),
  })
}

describe("/api/auth/login", () => {
  beforeEach(() => {
    mocks.enforceRateLimit.mockResolvedValue(null)
    mocks.getClientIp.mockReturnValue("127.0.0.1")
    mocks.verifyPassword.mockResolvedValue(true)
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "l@example.com",
      role: "LECTURER",
      passwordHash: "hash",
    })
  })

  it("rejects missing fields", async () => {
    const response = await POST(jsonRequest({ email: "", password: "", role: "" }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "email, password, and role are required" })
  })

  it("rejects invalid email formats", async () => {
    const response = await POST(jsonRequest({ email: "not-an-email", password: "LP123!", role: "LECTURER" }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Invalid email format" })
  })

  it("rejects role mismatches without revealing which field was wrong", async () => {
    const response = await POST(jsonRequest({ email: "l@example.com", password: "LP123!", role: "STUDENT" }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: "Invalid credentials" })
  })

  it("rejects invalid passwords", async () => {
    mocks.verifyPassword.mockResolvedValue(false)

    const response = await POST(jsonRequest({ email: "l@example.com", password: "wrong", role: "LECTURER" }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: "Invalid credentials" })
  })

  it("sets a session cookie for valid credentials", async () => {
    const response = await POST(jsonRequest({ email: "L@EXAMPLE.COM", password: "LP123!", role: "lecturer" }))

    expect(response.status).toBe(200)
    expect(response.headers.get("set-cookie")).toContain("lta_session=")
    await expect(response.json()).resolves.toEqual({ ok: true, role: "LECTURER" })
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { email: "l@example.com" },
    }))
  })
})

