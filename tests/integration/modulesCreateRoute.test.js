import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  prisma: {
    module: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
  getCurrentUser: vi.fn(),
  enforceRateLimit: vi.fn(),
}))

vi.mock("../../app/lib/db.js", () => ({ prisma: mocks.prisma }))
vi.mock("../../app/lib/currentUser.js", () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock("../../app/lib/rateLimit.js", () => ({ enforceRateLimit: mocks.enforceRateLimit }))

const { POST } = await import("../../app/api/modules/create/route.js")

function jsonRequest(body) {
  return new Request("http://localhost:3000/api/modules/create", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
      "sec-fetch-site": "same-origin",
    },
    body: JSON.stringify(body),
  })
}

describe("/api/modules/create", () => {
  beforeEach(() => {
    mocks.getCurrentUser.mockResolvedValue({ id: "lecturer-1" })
    mocks.enforceRateLimit.mockResolvedValue(null)
    mocks.prisma.module.findUnique.mockResolvedValue(null)
    mocks.prisma.module.create.mockResolvedValue({
      id: "module-1",
      code: "CSC7058",
      name: "Individual Software Development Project",
      description: null,
    })
  })

  it("rejects unauthenticated users", async () => {
    mocks.getCurrentUser.mockResolvedValue(null)

    const response = await POST(jsonRequest({ code: "CSC7058", name: "Project" }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" })
  })

  it("validates required module fields", async () => {
    const response = await POST(jsonRequest({ code: "", name: "" }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Module code and name are required" })
  })

  it("rejects invalid module codes before creating records", async () => {
    const response = await POST(jsonRequest({ code: "cs", name: "Too short" }))

    expect(response.status).toBe(400)
    expect(mocks.prisma.module.create).not.toHaveBeenCalled()
  })

  it("rejects duplicate module codes", async () => {
    mocks.prisma.module.findUnique.mockResolvedValue({ id: "existing", code: "CSC7058" })

    const response = await POST(jsonRequest({ code: "csc7058", name: "Duplicate" }))

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({ error: 'Module code "CSC7058" already exists' })
  })

  it("creates a module for the signed-in lecturer", async () => {
    const response = await POST(jsonRequest({
      code: "csc7058",
      name: "Individual Software Development Project",
      description: "Dissertation module",
    }))

    expect(response.status).toBe(201)
    expect(mocks.prisma.module.create).toHaveBeenCalledWith({
      data: {
        code: "CSC7058",
        name: "Individual Software Development Project",
        description: "Dissertation module",
        lecturerId: "lecturer-1",
      },
    })
    await expect(response.json()).resolves.toMatchObject({ code: "CSC7058" })
  })
})

