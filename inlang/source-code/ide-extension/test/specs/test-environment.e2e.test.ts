import { browser, expect } from "@wdio/globals"
import vscode from "vscode"
import {} from "wdio-vscode-service"

describe("Visual Studio Code extension (Sherlock) E2E Testing Environment", () => {
	it("should be able to load Visual Studio Code with inlang example code", async () => {
		const workbench = await browser.getWorkbench()
		const title = await workbench.getTitleBar().getTitle()
		expect(title).toContain("[Extension Development Host]")
		expect(title).toContain("inlang")
	})

	it("should load and install our Visual Studio Code extension (Sherlock)", async () => {
		const extensions = await browser.executeWorkbench((vscodeApi: typeof vscode) => {
			return vscodeApi.extensions.all
		})
		expect(extensions.some((extension) => extension.id === "inlang.vs-code-extension")).toBe(true)
	})
})
