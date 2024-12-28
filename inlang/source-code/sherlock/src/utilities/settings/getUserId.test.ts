import { describe, it, expect, vi } from "vitest"
import { getSetting, updateSetting } from "./index.js"
import { getUserId } from "./getUserId.js"

vi.mock("./index.js", () => ({
	getSetting: vi.fn(),
	updateSetting: vi.fn(),
	migrateSettingsFromInlangToSherlock: vi.fn(),
}))

describe("getUserId", () => {
	it("returns existing user ID", async () => {
		const existingId = "123e4567-e89b-12d3-a456-426614174000"
		vi.mocked(getSetting).mockResolvedValueOnce(existingId)

		const userId = await getUserId()

		expect(userId).toBe(existingId)
		expect(getSetting).toHaveBeenCalledWith("userId")
		expect(updateSetting).not.toHaveBeenCalled()
	})

	it("generates and persists new user ID when none exists", async () => {
		vi.mocked(getSetting).mockResolvedValueOnce(undefined)
		vi.mocked(updateSetting).mockResolvedValueOnce(undefined)

		const userId = await getUserId()

		expect(userId).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/)
		expect(getSetting).toHaveBeenCalledWith("userId")
		expect(updateSetting).toHaveBeenCalledWith("userId", expect.any(String))
	})
})
