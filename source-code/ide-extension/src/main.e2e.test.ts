import * as assert from "node:assert"
import * as vscode from "vscode"

suite("main.ts suite", () => {
	test("if extension is loaded", () => {
		assert.notEqual(vscode.extensions.getExtension("inlang.vs-code-extension"), undefined)
	})
})
