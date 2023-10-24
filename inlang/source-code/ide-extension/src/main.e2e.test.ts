import * as assert from "node:assert"
import * as vscode from "vscode"

suite("main.ts suite", () => {
	test("if extension is loaded", () => {
		assert.notEqual(vscode.extensions.getExtension("inlang.vs-code-extension"), undefined)
	})
	test("if extension is initialized", async () => {
		if (!vscode.workspace.workspaceFolders?.[0]?.uri) {
			throw new Error("There is no workspace defined to run tests on.")
		}
		const document = await vscode.workspace.openTextDocument(
			vscode.Uri.joinPath(
				vscode.workspace.workspaceFolders[0].uri,
				"/app/[lng]/second-page/page.js"
			)
		)
		await vscode.window.showTextDocument(document)
	})
})
