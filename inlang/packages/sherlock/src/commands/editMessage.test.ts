import { beforeEach, describe, expect, it, vi } from "vitest"
import { window as vscodeWindow } from "vscode"
import {
	loadProjectInMemory,
	newProject,
	selectBundleNested,
	type InlangProject,
} from "@inlang/sdk"
import { editMessageCommand } from "./editMessage.js"
import { setState, state } from "../utilities/state.js"
import { CONFIGURATION } from "../configuration.js"
import { getStringFromPattern } from "../utilities/messages/query.js"
import * as msgModule from "../utilities/messages/msg.js"

vi.mock("vscode", () => {
	const makeStatusBarItem = () => ({ show: vi.fn(), hide: vi.fn(), text: "" })
	const createEmitter = () => {
		const listeners = new Set<(value: unknown) => void>()
		return {
			fire: (value: unknown) => {
				for (const listener of listeners) {
					listener(value)
				}
			},
			event: (listener: (value: unknown) => void) => {
				listeners.add(listener)
				return { dispose: () => listeners.delete(listener) }
			},
			dispose: () => listeners.clear(),
		}
	}

	return {
		window: {
			showInputBox: vi.fn(),
			showErrorMessage: vi.fn(),
			createStatusBarItem: vi.fn(() => makeStatusBarItem()),
		},
		commands: {
			registerCommand: vi.fn(),
			executeCommand: vi.fn(),
		},
		StatusBarAlignment: { Left: 1, Right: 2 },
		CodeActionKind: { QuickFix: "quickfix" },
		ThemeColor: vi.fn(),
		EventEmitter: vi.fn(() => createEmitter()),
		workspace: {
			getConfiguration: vi.fn(() => ({ get: vi.fn(), update: vi.fn() })),
		},
	}
})

describe("editMessageCommand (integration)", () => {
	let project: Awaited<ReturnType<typeof loadProjectInMemory>>

	async function seedBundleWithVariant(
		target: InlangProject,
		opts?: { id?: string; locale?: string }
	) {
		const bundleId = opts?.id ?? "welcome"
		const locale = opts?.locale ?? "en"

		await target.db.insertInto("bundle").values({ id: bundleId, declarations: [] }).execute()
		await target.db
			.insertInto("message")
			.values({ id: `${bundleId}-${locale}`, bundleId, locale, selectors: [] })
			.execute()
		await target.db
			.insertInto("variant")
			.values({
				id: `${bundleId}-${locale}-default`,
				messageId: `${bundleId}-${locale}`,
				matches: [],
				pattern: [{ type: "text", value: "Hello world" }],
			})
			.execute()
	}

	beforeEach(async () => {
		project = await loadProjectInMemory({
			blob: await newProject(),
			appId: CONFIGURATION.STRINGS.APP_ID,
		})

		setState({
			project,
			selectedProjectPath: "/virtual-project",
			projectsInWorkspace: [{ projectPath: "/virtual-project" }],
		})

		vi.clearAllMocks()
	})

	it("shows a warning when the bundle is missing", async () => {
		const msgSpy = vi.spyOn(msgModule, "msg")

		await editMessageCommand.callback({ bundleId: "missing", locale: "en" })

		expect(msgSpy).toHaveBeenCalledWith("Bundle with id missing not found.")
	})

	it("shows a warning when the message for a locale is missing", async () => {
		await project.db.insertInto("bundle").values({ id: "welcome", declarations: [] }).execute()
		await project.db
			.insertInto("message")
			.values({ id: "welcome-de", bundleId: "welcome", locale: "de", selectors: [] })
			.execute()

		const msgSpy = vi.spyOn(msgModule, "msg")

		await editMessageCommand.callback({ bundleId: "welcome", locale: "en" })

		expect(msgSpy).toHaveBeenCalledWith("Message with locale en not found.")
	})

	it("shows a warning when no editable variant exists", async () => {
		await project.db.insertInto("bundle").values({ id: "welcome", declarations: [] }).execute()
		await project.db
			.insertInto("message")
			.values({ id: "welcome-en", bundleId: "welcome", locale: "en", selectors: [] })
			.execute()

		const msgSpy = vi.spyOn(msgModule, "msg")

		await editMessageCommand.callback({ bundleId: "welcome", locale: "en" })

		expect(msgSpy).toHaveBeenCalledWith("Variant with locale en not found.")
	})

	it("cancels when the user does not provide a new value", async () => {
		await seedBundleWithVariant(project)

		const msgSpy = vi.spyOn(msgModule, "msg")
		const fireSpy = vi.spyOn(CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE, "fire")
		vi.mocked(vscodeWindow.showInputBox).mockResolvedValueOnce(undefined)

		await editMessageCommand.callback({ bundleId: "welcome", locale: "en" })

		const stored = await selectBundleNested(state().project.db)
			.where("bundle.id", "=", "welcome")
			.executeTakeFirstOrThrow()

		const patternString = getStringFromPattern({
			pattern: stored.messages[0]?.variants[0]?.pattern ?? [],
			locale: "en",
			messageId: stored.messages[0]?.id ?? "",
		})

		expect(patternString).toBe("Hello world")
		expect(fireSpy).not.toHaveBeenCalled()
		expect(msgSpy).not.toHaveBeenCalled()
	})

	it("updates the stored variant when the user provides a new value", async () => {
		await seedBundleWithVariant(project)

		const msgSpy = vi.spyOn(msgModule, "msg")
		const fireSpy = vi.spyOn(CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE, "fire")
		vi.mocked(vscodeWindow.showInputBox).mockResolvedValueOnce("Hello universe")

		await editMessageCommand.callback({ bundleId: "welcome", locale: "en" })

		const stored = await selectBundleNested(state().project.db)
			.where("bundle.id", "=", "welcome")
			.executeTakeFirstOrThrow()

		const patternString = getStringFromPattern({
			pattern: stored.messages[0]?.variants[0]?.pattern ?? [],
			locale: "en",
			messageId: stored.messages[0]?.id ?? "",
		})

		expect(patternString).toBe("Hello universe")
		expect(fireSpy).toHaveBeenCalledWith({ origin: "command:editMessage" })
		expect(msgSpy).toHaveBeenCalledWith("Message updated.")
	})

	it.todo("surfaces database errors while leaving the project untouched")
})
