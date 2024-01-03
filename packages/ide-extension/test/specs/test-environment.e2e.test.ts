import { browser, expect } from "@wdio/globals"
import vscode from "vscode"
import {} from "wdio-vscode-service"

describe("VSCode Extension E2E Testing Environment", () => {
	it("should be able to load VSCode with inlang example code", async () => {
		const workbench = await browser.getWorkbench()
		const title = await workbench.getTitleBar().getTitle()
		expect(title).toContain("[Extension Development Host]")
		expect(title).toContain("inlang")
	})

	it("should load and install our VSCode Extension", async () => {
		const extensions = await browser.executeWorkbench((vscodeApi: typeof vscode) => {
			return vscodeApi.extensions.all
		})
		expect(extensions.some((extension) => extension.id === "inlang.vs-code-extension")).toBe(true)
	})
})
