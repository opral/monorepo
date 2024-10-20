import { describe, it, expect, vi } from "vitest"
import * as vscode from "vscode"
import { getSetting, updateSetting } from "./index.js"

vi.mock("vscode", () => ({
	workspace: {
		getConfiguration: vi.fn().mockImplementation(() => ({
			update: vi.fn(),
			get: vi.fn(),
		})),
	},
}))

describe("Settings functions", () => {
	describe("updateSetting", () => {
		it("updates a setting successfully", async () => {
			const mockUpdate = vi.fn()
			// @ts-expect-error
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
				update: mockUpdate,
			})

			await updateSetting("userId", "new-value")

			expect(mockUpdate).toHaveBeenCalledWith("userId", "new-value", true)
		})
	})

	describe("getSetting", () => {
		it("retrieves a setting successfully", async () => {
			const mockValue = "some-value"
			const mockGet = vi.fn().mockReturnValue(mockValue)
			// @ts-expect-error
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
				get: mockGet,
			})

			const result = await getSetting("userId")

			expect(mockGet).toHaveBeenCalledWith("userId")
			expect(result).toBe(mockValue)
		})

		it("throws an error if the setting is not found", async () => {
			const mockGet = vi.fn().mockReturnValue(undefined)
			// @ts-expect-error
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
				get: mockGet,
			})

			// @ts-expect-error
			await expect(getSetting("nonexistentSetting")).rejects.toThrow(
				"Could not find configuration property nonexistentSetting"
			)
		})
	})
})
