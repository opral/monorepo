import { describe, it, expect, vi, beforeEach, type Mock } from "vitest"
import * as vscode from "vscode"
import { shouldRecommend, add } from "@inlang/recommend-ninja"
import type { NodeishFilesystem } from "@lix-js/fs"
import { getSetting, updateSetting } from "../../settings/index.js"
import { recommendNinja } from "./ninja.js"

vi.mock("vscode", () => ({
	window: {
		showInformationMessage: vi.fn(),
	},
}))

vi.mock("@inlang/recommend-ninja", () => ({
	shouldRecommend: vi.fn(),
	add: vi.fn(),
}))

vi.mock("../../settings/index.js", () => ({
	getSetting: vi.fn(),
	updateSetting: vi.fn(),
}))

describe("recommendNinja", () => {
	const mockFs = {} as NodeishFilesystem

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should return early if ninja recommendation is disabled", async () => {
		;(getSetting as Mock).mockResolvedValue(false)

		await recommendNinja({ fs: mockFs })

		expect(getSetting).toHaveBeenCalledWith("appRecommendations.ninja.enabled")
		expect(shouldRecommend).not.toHaveBeenCalled()
		expect(vscode.window.showInformationMessage).not.toHaveBeenCalled()
	})

	it("should return early if Ninja GitHub Action is already adopted", async () => {
		;(getSetting as Mock).mockResolvedValue(true)
		;(shouldRecommend as Mock).mockResolvedValue(false)

		await recommendNinja({ fs: mockFs })

		expect(getSetting).toHaveBeenCalledWith("appRecommendations.ninja.enabled")
		expect(shouldRecommend).toHaveBeenCalledWith({ fs: mockFs })
		expect(vscode.window.showInformationMessage).not.toHaveBeenCalled()
	})

	it("should show prompt if recommendation is enabled and Ninja is not adopted", async () => {
		;(getSetting as Mock).mockResolvedValue(true)
		;(shouldRecommend as Mock).mockResolvedValue(true)
		;(vscode.window.showInformationMessage as Mock).mockResolvedValue("Yes")

		await recommendNinja({ fs: mockFs })

		expect(getSetting).toHaveBeenCalledWith("appRecommendations.ninja.enabled")
		expect(shouldRecommend).toHaveBeenCalledWith({ fs: mockFs })
		expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
			"Do you want to add the 🥷 [Ninja Github Action](https://inlang.com/m/3gk8n4n4/app-inlang-ninjaI18nAction) for linting translations in CI?",
			"Yes",
			"Do not ask again"
		)
	})

	it('should add Ninja GitHub Action if user selects "Yes"', async () => {
		;(getSetting as Mock).mockResolvedValue(true)
		;(shouldRecommend as Mock).mockResolvedValue(true)
		;(vscode.window.showInformationMessage as Mock).mockResolvedValue("Yes")

		await recommendNinja({ fs: mockFs })

		expect(add).toHaveBeenCalledWith({ fs: mockFs })
	})

	it('should update setting if user selects "Dont ask again"', async () => {
		;(getSetting as Mock).mockResolvedValue(true)
		;(shouldRecommend as Mock).mockResolvedValue(true)
		;(vscode.window.showInformationMessage as Mock).mockResolvedValue("Do not ask again")

		await recommendNinja({ fs: mockFs })

		expect(updateSetting).toHaveBeenCalledWith("appRecommendations.ninja.enabled", false)
	})
})
