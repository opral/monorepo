import { describe, it, beforeEach, expect, vi } from "vitest"
import { extractMessageCommand } from "./extractMessage.js"
import { msg } from "../utilities/messages/msg.js"
import { window } from "vscode"
import { CONFIGURATION } from "../configuration.js"
import { getSetting } from "../utilities/settings/index.js"
import { state } from "../utilities/state.js"
import { upsertBundleNested } from "@inlang/sdk"

// Mocking the necessary modules

vi.mock("vscode", async () => {
	return {
		window: {
			showInputBox: vi.fn(),
			showQuickPick: vi.fn(),
			showErrorMessage: vi.fn(),
		},
		commands: {
			registerTextEditorCommand: vi.fn(),
		},
		CodeActionKind: {
			QuickFix: "quickfix",
			Refactor: "refactor",
		},
		CodeAction: vi.fn().mockImplementation(function (title, kind) {
			return {
				title,
				kind,
				command: undefined,
			}
		}),
	}
})

vi.mock("../utilities/messages/msg", () => ({
	msg: vi.fn(),
}))

vi.mock("../services/telemetry/index.js", () => ({
	capture: vi.fn(),
}))

vi.mock("../configuration", () => ({
	CONFIGURATION: {
		EVENTS: {
			ON_DID_EXTRACT_MESSAGE: {
				fire: vi.fn(),
			},
		},
	},
}))

vi.mock("../utilities/settings/index.js", () => ({
	getSetting: vi.fn(),
}))

vi.mock("@inlang/sdk", () => ({
	humanId: vi.fn().mockReturnValue("generated_human_id"),
	createBundle: vi.fn().mockReturnValue({ id: "bundleId123", alias: "alias123" }),
	createMessage: vi
		.fn()
		.mockReturnValue({ id: "messageId123", bundleId: "bundleId123bundleId123" }),
	upsertBundleNested: vi.fn(),
}))

vi.mock("nanoid", () => ({
	customAlphabet: vi.fn().mockReturnValue(() => "nanoidnano"),
}))

vi.mock("../utilities/messages/isQuoted", () => ({
	isQuoted: vi.fn(),
	stripQuotes: vi.fn(),
}))

vi.mock("../utilities/state.js", () => {
	const stateFn = vi.fn()
	return {
		state: stateFn,
		safeState: stateFn,
	}
})

describe("extractMessageCommand", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should show warning if ideExtension is not configured", async () => {
		vi.mocked(state).mockReturnValue({
			project: {
				plugins: {
					get: async () => [
						{
							key: "plugin1",
							meta: {},
						},
					],
				},
				// @ts-expect-error
				settings: {
					get: async () => ({ baseLocale: "en", locales: ["en"] }),
				},
			},
		})

		const mockTextEditor = {
			selection: {
				isEmpty: false,
				start: { line: 0, character: 0 },
				end: { line: 0, character: 10 },
			},
			document: {
				getText: vi.fn().mockReturnValue("Some text"),
			},
			edit: vi.fn((callback) => {
				const mockBuilder = {
					replace: vi.fn(),
				}
				callback(mockBuilder) // Simulate text replacement
				return Promise.resolve(true)
			}),
		}

		// @ts-expect-error
		await extractMessageCommand.callback(mockTextEditor)
		expect(msg).toHaveBeenCalledWith(
			"There is no `plugin` configuration for the Visual Studio Code extension (Sherlock). One of the `modules` should expose a `plugin` which has `customApi` containing `app.inlang.ideExtension`",
			"warn",
			"notification"
		)
	})

	it("should show warning if extractMessageOptions is not defined", async () => {
		vi.mocked(state).mockReturnValue({
			project: {
				plugins: {
					get: async () => [
						{
							key: "plugin1",
							meta: {
								"app.inlang.ideExtension": {},
							},
						},
					],
				},
				// @ts-expect-error
				settings: {
					get: async () => ({ baseLocale: "en", locales: ["en"] }),
				},
			},
		})

		const mockTextEditor = {
			selection: {
				isEmpty: false,
				start: {
					line: 0,
					character: 0,
				},
				end: {
					line: 0,
					character: 0,
				},
			},
			document: {
				getText: () => "Some text",
			},
			edit: vi.fn(),
		}

		// @ts-expect-error
		await extractMessageCommand.callback(mockTextEditor)
		expect(msg).toHaveBeenCalledWith(
			"The `extractMessageOptions` are not defined in `app.inlang.ideExtension` but required to extract a message.",
			"warn",
			"notification"
		)
	})

	it("should show warning if no active text editor is found", async () => {
		vi.mocked(state).mockReturnValue({
			project: {
				plugins: {
					get: async () => [
						{
							key: "plugin1",
							meta: {
								"app.inlang.ideExtension": {
									extractMessageOptions: [
										{
											callback: vi.fn(),
										},
									],
								},
							},
						},
					],
				},
				// @ts-expect-error
				settings: {
					get: async () => ({ baseLocale: "en", locales: ["en"] }),
				},
			},
		})

		await extractMessageCommand.callback(undefined)
		expect(msg).toHaveBeenCalledWith(
			"No active text editor found. Please open a file in the editor to extract a message.",
			"warn",
			"notification"
		)
	})

	it("should show warning if no text is selected", async () => {
		vi.mocked(state).mockReturnValue({
			project: {
				plugins: {
					get: async () => [
						{
							key: "plugin1",
							meta: {
								"app.inlang.ideExtension": {
									extractMessageOptions: [
										{
											callback: vi.fn(),
										},
									],
								},
							},
						},
					],
				},
				// @ts-expect-error
				settings: {
					get: async () => ({ baseLocale: "en", locales: ["en"] }),
				},
			},
		})

		const mockTextEditor = {
			selection: {
				isEmpty: true,
			},
			edit: vi.fn(),
		}

		// @ts-expect-error
		await extractMessageCommand.callback(mockTextEditor)
		expect(msg).toHaveBeenCalledWith(
			"Please select a text in your text editor to extract a message.",
			"warn",
			"notification"
		)
	})

	it("should cancel operation if messageId is not provided", async () => {
		vi.mocked(state).mockReturnValue({
			project: {
				plugins: {
					get: async () => [
						{
							key: "plugin1",
							meta: {
								"app.inlang.ideExtension": {
									extractMessageOptions: [
										{
											callback: vi.fn(() => ({
												bundleId: undefined,
												messageReplacement: undefined,
											})),
										},
									],
								},
							},
						},
					],
				},
				// @ts-expect-error
				settings: {
					get: async () => ({ baseLocale: "en", locales: ["en"] }),
				},
			},
		})

		const mockTextEditor = {
			selection: {
				isEmpty: false,
				start: {
					line: 0,
					character: 0,
				},
				end: {
					line: 0,
					character: 0,
				},
			},
			document: {
				getText: () => "Some text",
			},
			edit: vi.fn(),
		}

		vi.mocked(getSetting).mockResolvedValueOnce(true)
		vi.mocked(window.showInputBox).mockResolvedValueOnce(undefined)

		// @ts-expect-error
		await extractMessageCommand.callback(mockTextEditor)
		expect(window.showQuickPick).not.toHaveBeenCalled()
	})

	it("should handle non-existent extract option", async () => {
		vi.mocked(state).mockReturnValue({
			project: {
				plugins: {
					get: async () => [
						{
							key: "plugin1",
							meta: {
								"app.inlang.ideExtension": {
									extractMessageOptions: [
										{
											callback: vi.fn(() => ({
												bundleId: "messageId123",
												messageReplacement: "Replacement Text",
											})),
										},
										{
											callback: vi.fn(() => ({
												bundleId: "messageId345",
												messageReplacement: "Replacement Text",
											})),
										},
									],
								},
							},
						},
					],
				},
				// @ts-expect-error
				settings: {
					get: async () => ({ baseLocale: "en", locales: ["en"] }),
				},
			},
		})

		const mockTextEditor = {
			selection: {
				isEmpty: false,
				start: {
					line: 0,
					character: 0,
				},
				end: {
					line: 0,
					character: 0,
				},
			},
			document: {
				getText: () => "Some text",
			},
			edit: vi.fn(),
		}

		vi.mocked(getSetting).mockResolvedValueOnce(true)
		vi.mocked(window.showInputBox).mockResolvedValueOnce("generatedId123")
		vi.mocked(window.showQuickPick).mockResolvedValueOnce(undefined)

		// @ts-expect-error
		await extractMessageCommand.callback(mockTextEditor)

		expect(msg).toHaveBeenCalledWith(
			"Couldn't find choosen extract option.",
			"warn",
			"notification"
		)
	})

	it("should show error message if message creation fails", async () => {
		vi.mocked(state).mockReturnValue({
			project: {
				plugins: {
					get: async () => [
						{
							key: "plugin1",
							meta: {
								"app.inlang.ideExtension": {
									extractMessageOptions: [
										{
											callback: vi.fn(() => ({
												bundleId: "messageId123",
												messageReplacement: "Replacement Text",
											})),
										},
									],
								},
							},
						},
					],
				},
				// @ts-expect-error
				settings: {
					get: async () => ({ baseLocale: "en", locales: ["en"] }),
				},
				db: {
					// @ts-expect-error
					transaction: () => ({
						execute: vi.fn().mockRejectedValue(new Error("Some error")),
					}),
				},
			},
		})

		const mockTextEditor = {
			selection: {
				isEmpty: false,
				start: {
					line: 0,
					character: 0,
				},
				end: {
					line: 0,
					character: 0,
				},
			},
			document: {
				getText: () => "Some text",
			},
			edit: vi.fn(),
		}

		vi.mocked(getSetting).mockResolvedValueOnce(true)
		vi.mocked(window.showInputBox).mockResolvedValueOnce("generatedId123")
		// @ts-expect-error
		vi.mocked(window.showQuickPick).mockResolvedValueOnce("Replacement Text")

		vi.mocked(upsertBundleNested).mockRejectedValueOnce(new Error("Some error"))

		// @ts-expect-error
		await extractMessageCommand.callback(mockTextEditor)

		expect(window.showErrorMessage).toHaveBeenCalledWith(
			`Couldn't extract new message. Error: Some error`
		)
	})

	it("should extract a message successfully", async () => {
		vi.mocked(state).mockReturnValue({
			project: {
				plugins: {
					get: async () => [
						{
							key: "plugin1",
							meta: {
								"app.inlang.ideExtension": {
									extractMessageOptions: [
										{
											callback: vi.fn(() => ({
												bundleId: "generatedId123",
												messageReplacement: "Replacement Text",
											})),
										},
									],
								},
							},
						},
					],
				},
				// @ts-expect-error
				settings: {
					get: async () => ({ baseLocale: "en", locales: ["en"] }),
				},
				db: {
					// @ts-expect-error
					transaction: () => ({
						execute: vi.fn().mockResolvedValueOnce(true),
					}),
				},
			},
		})

		const mockTextEditor = {
			selection: {
				isEmpty: false,
				start: {
					line: 1,
					character: 1,
				},
				end: {
					line: 1,
					character: 20,
				},
			},
			document: {
				getText: () => "Some text",
			},
			edit: vi.fn(),
		}

		vi.mocked(getSetting).mockResolvedValueOnce(true)
		vi.mocked(window.showInputBox).mockResolvedValueOnce("generatedId123")
		// @ts-expect-error
		vi.mocked(window.showQuickPick).mockResolvedValueOnce("Replacement Text")

		// @ts-expect-error
		await extractMessageCommand.callback(mockTextEditor)

		expect(mockTextEditor.edit).toHaveBeenCalled()
		expect(CONFIGURATION.EVENTS.ON_DID_EXTRACT_MESSAGE.fire).toHaveBeenCalled()
		expect(msg).toHaveBeenCalledWith("Message extracted.")
	})

	it("should use the right generator if configured", async () => {
		vi.mocked(state).mockReturnValue({
			project: {
				plugins: {
					get: async () => [
						{
							key: "plugin1",
							meta: {
								"app.inlang.ideExtension": {
									extractMessageOptions: [
										{
											callback: vi.fn(() => ({
												bundleId: "generatedId123",
												messageReplacement: "Replacement Text",
											})),
										},
									],
								},
							},
						},
					],
				},
				// @ts-expect-error
				settings: {
					get: async () => ({ baseLocale: "en", locales: ["en"] }),
				},
				db: {
					// @ts-expect-error
					transaction: () => ({
						execute: vi.fn().mockResolvedValueOnce(true),
					}),
				},
			},
		})

		const mockTextEditor = {
			selection: {
				isEmpty: false,
				start: {
					line: 1,
					character: 1,
				},
				end: {
					line: 1,
					character: 20,
				},
			},
			document: {
				getText: () => "Some text",
			},
			edit: vi.fn(),
		}

		for (const [generator, expected] of [
			["humanId", "generated_human_id"],
			["nanoid", "nanoidnano"],
			["none", ""],
		]) {
			vi.mocked(getSetting).mockResolvedValue(generator)
			vi.mocked(window.showInputBox).mockResolvedValueOnce("generatedId123")
			// @ts-expect-error
			vi.mocked(window.showQuickPick).mockResolvedValueOnce("Replacement Text")

			// @ts-expect-error
			await extractMessageCommand.callback(mockTextEditor)

			expect(window.showInputBox).toHaveBeenCalledWith(
				expect.objectContaining({
					value: expected,
				})
			)

			expect(mockTextEditor.edit).toHaveBeenCalled()
			expect(CONFIGURATION.EVENTS.ON_DID_EXTRACT_MESSAGE.fire).toHaveBeenCalled()
			expect(msg).toHaveBeenCalledWith("Message extracted.")

			vi.mocked(window.showInputBox).mockReset()
			vi.mocked(mockTextEditor.edit).mockReset()
			vi.mocked(CONFIGURATION.EVENTS.ON_DID_EXTRACT_MESSAGE.fire).mockReset()
			vi.mocked(msg).mockReset()
		}
	})
})
