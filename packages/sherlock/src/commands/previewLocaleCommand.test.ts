import { describe, it, expect, vi, beforeEach } from "vitest"
import * as vscode from "vscode"
import * as settings from "../utilities/settings/index.js"
import { previewLocaleCommand } from "./previewLocaleCommand.js"
import { CONFIGURATION } from "../configuration.js"
import { state } from "../utilities/state.js"

vi.mock("vscode", () => ({
	window: { showQuickPick: vi.fn() },
	commands: { registerCommand: vi.fn() },
}))
vi.mock("../utilities/settings/index.js", () => ({ updateSetting: vi.fn() }))
vi.mock("../utilities/settings/statusBar.js", () => ({
	showStatusBar: vi.fn(),
}))
vi.mock("../utilities/state.js", () => {
	const stateFn = vi.fn()
	return {
		state: stateFn,
		safeState: stateFn,
	}
})
vi.mock("../configuration.js", () => ({
	CONFIGURATION: {
		EVENTS: {
			ON_DID_CREATE_MESSAGE: { fire: vi.fn() },
			ON_DID_EDIT_MESSAGE: { fire: vi.fn() },
			ON_DID_EXTRACT_MESSAGE: { fire: vi.fn() },
			ON_DID_PREVIEW_LOCALE_CHANGE: { fire: vi.fn() },
		},
	},
}))

describe("previewLocaleCommand", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should register the command", () => {
		expect(previewLocaleCommand.command).toBe("sherlock.previewLanguageTag")
		expect(previewLocaleCommand.title).toBe("Sherlock: Change preview language tag")
		expect(previewLocaleCommand.register).toBe(vscode.commands.registerCommand)
	})

	it("should show language tags and update setting if a tag is selected", async () => {
		vi.mocked(state).mockReturnValue({
			project: {
				// @ts-expect-error
				settings: {
					get: vi.fn().mockResolvedValue({
						baseLocale: "en",
						locales: ["en", "es", "fr"],
					}),
				},
			},
		})
		// @ts-expect-error
		vi.mocked(vscode.window.showQuickPick).mockResolvedValue("en")

		await previewLocaleCommand.callback()

		expect(vscode.window.showQuickPick).toHaveBeenCalledWith(["en", "es", "fr"], {
			placeHolder: "Select a language",
		})
		expect(settings.updateSetting).toHaveBeenCalledWith("previewLanguageTag", "en")
		expect(CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire).toHaveBeenCalledWith({
			origin: "command:previewLocale",
		})
		expect(CONFIGURATION.EVENTS.ON_DID_CREATE_MESSAGE.fire).toHaveBeenCalledTimes(1)
		expect(CONFIGURATION.EVENTS.ON_DID_EXTRACT_MESSAGE.fire).toHaveBeenCalledTimes(1)
		expect(CONFIGURATION.EVENTS.ON_DID_PREVIEW_LOCALE_CHANGE.fire).toHaveBeenCalledTimes(1)
	})

	it("should not update setting if no tag is selected", async () => {
		vi.mocked(vscode.window.showQuickPick).mockResolvedValue(undefined)

		await previewLocaleCommand.callback()

		expect(settings.updateSetting).not.toHaveBeenCalled()
		expect(CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire).not.toHaveBeenCalled()
		expect(CONFIGURATION.EVENTS.ON_DID_CREATE_MESSAGE.fire).not.toHaveBeenCalled()
		expect(CONFIGURATION.EVENTS.ON_DID_EXTRACT_MESSAGE.fire).not.toHaveBeenCalled()
		expect(CONFIGURATION.EVENTS.ON_DID_PREVIEW_LOCALE_CHANGE.fire).not.toHaveBeenCalled()
	})
})
