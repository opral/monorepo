import { beforeEach, describe, expect, it, vi } from "vitest"
import { Uri, commands, env } from "vscode"
import { getGitOrigin } from "../services/telemetry/implementation.js"
import { openInEditorCommand } from "./openInEditor.js" // Adjust the import path
import { CONFIGURATION } from "../configuration.js"

vi.mock("vscode", () => ({
	commands: {
		registerCommand: vi.fn(),
	},
	env: {
		openExternal: vi.fn(),
	},
	Uri: {
		parse: vi.fn(),
	},
	EventEmitter: vi.fn(),
}))

vi.mock("../services/telemetry/implementation.js", () => ({
	getGitOrigin: vi.fn(),
	telemetry: {
		capture: vi.fn(),
	},
}))

describe("openInEditorCommand", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should register the command correctly", () => {
		openInEditorCommand.register(openInEditorCommand.command, openInEditorCommand.callback)
		expect(commands.registerCommand).toHaveBeenCalledWith(
			openInEditorCommand.command,
			expect.any(Function)
		)
	})

	it("should open the editor with message id in URL", async () => {
		const mockArgs = { messageId: "testMessageId", selectedProjectPath: "/test/path" }
		const mockOrigin = "https://github.com/user/repo"
		vi.mocked(getGitOrigin).mockResolvedValue(mockOrigin)

		await openInEditorCommand.callback(mockArgs)

		expect(env.openExternal).toHaveBeenCalledWith(
			Uri.parse(
				`${CONFIGURATION.STRINGS.EDITOR_BASE_URL}${mockOrigin}?project=${encodeURIComponent(
					mockArgs.selectedProjectPath
				)}&id=${encodeURIComponent(mockArgs.messageId)}`
			)
		)
	})

	it("should handle failure to get Git origin", async () => {
		const mockArgs = { messageId: "testMessageId", selectedProjectPath: "/test/path" }
		vi.mocked(getGitOrigin).mockResolvedValue(undefined) // Simulate failure

		await openInEditorCommand.callback(mockArgs)

		expect(env.openExternal).toHaveBeenCalledWith(
			Uri.parse(`${CONFIGURATION.STRINGS.EDITOR_BASE_URL}`)
		)
	})
})
