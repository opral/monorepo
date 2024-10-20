import { describe, it, expect, vi, beforeEach } from "vitest"
import { toggleInlineAnnotationsCommand } from "./toggleInlineAnnotation.js"
import * as vscode from "vscode"
import { updateSetting } from "../utilities/settings/index.js"

vi.mock("vscode", () => {
	return {
		window: {
			showQuickPick: vi.fn(),
		},
		workspace: {
			getConfiguration: vi.fn(() => ({
				get: vi.fn(),
			})),
		},
		commands: {
			registerCommand: vi.fn(),
		},
	}
})

vi.mock("../utilities/settings/index.js", () => ({
	updateSetting: vi.fn().mockResolvedValue(undefined),
}))

describe("toggleInlineAnnotationsCommand", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should handle no selection from quick pick", async () => {
		vi.mocked(vscode.window.showQuickPick).mockResolvedValue(undefined)

		await toggleInlineAnnotationsCommand.callback()

		expect(vscode.window.showQuickPick).toHaveBeenCalled()
		expect(updateSetting).not.toHaveBeenCalled()
	})

	it('should enable inline annotations when "Enable" is selected', async () => {
		vi.mocked(vscode.window.showQuickPick).mockResolvedValue({
			label: "Enable",
		})

		await toggleInlineAnnotationsCommand.callback()

		expect(updateSetting).toHaveBeenCalledWith("inlineAnnotations.enabled", true)
	})

	it('should disable inline annotations when "Disable" is selected', async () => {
		vi.mocked(vscode.window.showQuickPick).mockResolvedValue({
			label: "Disable",
		})

		await toggleInlineAnnotationsCommand.callback()

		expect(updateSetting).toHaveBeenCalledWith("inlineAnnotations.enabled", false)
	})
})
