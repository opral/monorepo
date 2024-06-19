import { describe, it, expect, vi, beforeEach } from "vitest"
import * as vscode from "vscode"
import { isAdopted, add } from "@inlang/cross-sell-ninja"
import type { NodeishFilesystem } from "@lix-js/fs"
import { getSetting, updateSetting } from "../../settings/index.js"
import { crossSellNinja } from "./ninja.js"

vi.mock("vscode", () => ({
	window: {
		showInformationMessage: vi.fn(),
	},
}))

vi.mock("@inlang/cross-sell-ninja", () => ({
	isAdopted: vi.fn(),
	add: vi.fn(),
}))

vi.mock("../settings/index.js", () => ({
	getSetting: vi.fn(),
	updateSetting: vi.fn(),
}))

describe("crossSellNinja", () => {
	const mockFs = {} as NodeishFilesystem

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should return early if ninja recommendation is disabled", async () => {
		// @ts-expect-error
		getSetting.mockResolvedValue(false)

		await crossSellNinja({ fs: mockFs })

		expect(getSetting).toHaveBeenCalledWith("appRecommendations.ninja.enabled")
		expect(isAdopted).not.toHaveBeenCalled()
		expect(vscode.window.showInformationMessage).not.toHaveBeenCalled()
	})

	it("should return early if Ninja GitHub Action is already adopted", async () => {
		// @ts-expect-error
		getSetting.mockResolvedValue(true)
		// @ts-expect-error
		isAdopted.mockResolvedValue(true)

		await crossSellNinja({ fs: mockFs })

		expect(getSetting).toHaveBeenCalledWith("appRecommendations.ninja.enabled")
		expect(isAdopted).toHaveBeenCalledWith({ fs: mockFs })
		expect(vscode.window.showInformationMessage).not.toHaveBeenCalled()
	})

	it("should show prompt if recommendation is enabled and Ninja is not adopted", async () => {
		// @ts-expect-error
		getSetting.mockResolvedValue(true)
		// @ts-expect-error
		isAdopted.mockResolvedValue(false)
		// @ts-expect-error
		vscode.window.showInformationMessage.mockResolvedValue("Yes")

		await crossSellNinja({ fs: mockFs })

		expect(getSetting).toHaveBeenCalledWith("appRecommendations.ninja.enabled")
		expect(isAdopted).toHaveBeenCalledWith({ fs: mockFs })
		expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
			"Do you want to add the 🥷 Ninja Github Action for linting translations in CI?\n\nhttps://inlang.com/m/3gk8n4n4/app-inlang-ninjaI18nAction",
			"Yes",
			"Not now"
		)
	})

	it('should add Ninja GitHub Action if user selects "Yes"', async () => {
		// @ts-expect-error
		getSetting.mockResolvedValue(true)
		// @ts-expect-error
		isAdopted.mockResolvedValue(false)
		// @ts-expect-error
		vscode.window.showInformationMessage.mockResolvedValue("Yes")

		await crossSellNinja({ fs: mockFs })

		expect(add).toHaveBeenCalledWith({ fs: mockFs })
	})

	it('should update setting if user selects "Not now"', async () => {
		// @ts-expect-error
		getSetting.mockResolvedValue(true)
		// @ts-expect-error
		isAdopted.mockResolvedValue(false)
		// @ts-expect-error
		vscode.window.showInformationMessage.mockResolvedValue("Not now")

		await crossSellNinja({ fs: mockFs })

		expect(updateSetting).toHaveBeenCalledWith("appRecommendations.ninja.enabled", false)
	})
})
