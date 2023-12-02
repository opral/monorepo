import { browser, expect } from "@wdio/globals"
import vscode from "vscode"
import {} from "wdio-vscode-service"

describe("Extract Message command", () => {
	it("should be able to extract messages via Command Palette", async () => {
		const testFile = "app/[lng]/page.js"
		const testKey = "e2etest"
		const testCommand = "inlang: extract message"
		const workbench = await browser.getWorkbench()
		const prompt = await workbench.openCommandPrompt()
		await prompt.setText(testFile)
		await prompt.confirm()

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

		const command = await workbench.executeCommand(testCommand)
		await command.setText(testKey)
		await command.confirm()
		const picks = await command.getQuickPicks()
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

		expect(editorText).toContain(testKey)
	})
})
