import { browser, expect } from "@wdio/globals"
import vscode from "vscode"
import {} from "wdio-vscode-service"

describe("Extract Message command", () => {
	it("should be able to extract messages via Command Palette", async () => {
		// remember that the slashes are different on windows
		const testFile = "page.js"
		const testFilePath = `app [lng] ${testFile}`
		const testKey = "e2etest"
		const testCommand = "sherlock: extract message"
		const workbench = await browser.getWorkbench()

		// open test file
		const prompt = await workbench.openCommandPrompt()
		await prompt.setText(testFilePath)
		await prompt.wait(30000)
		await prompt.confirm()

		// wait until test file is opened
		await browser.waitUntil(async () => {
			const editorView = workbench.getEditorView()
			const tabs = await editorView.getOpenTabs()
			return tabs.some(async (tab) => (await tab.getTitle()) === testFile)
		})

		// select text
		await browser.executeWorkbench(async (vscodeApi: typeof vscode) => {
			const editor = vscodeApi.window.activeTextEditor
			const search = "Translate me"

			if (!editor) {
				return
			}

			const text = editor.document.getText()
			const offset = text.indexOf(search)
			const startPosition = editor.document.positionAt(offset)
			const endPosition = editor.document.positionAt(offset + search.length)
			editor.selection = new vscodeApi.Selection(startPosition, endPosition)
		})

		await browser.pause(30000)

		// execute extract message command
		const command = await workbench.executeCommand(testCommand)
		await command.setText(testKey)
		await command.wait(30000)
		await command.confirm()

		const picks = await command.getQuickPicks()
		await command.wait(30000)
		const pick = picks.find(async (p) => {
			const label = await p.getLabel()
			return label.includes(testKey)
		})
		const label = await pick?.getLabel()
		expect(label).toContain(testKey)
		await command.confirm()

		const editorText = await browser.executeWorkbench(async (vscodeApi: typeof vscode) => {
			const editor = vscodeApi.window.activeTextEditor

			if (!editor) {
				return
			}

			return editor.document.getText()
		})
		await browser.pause(30000)

		expect(editorText).toContain(testKey)
	})
})
