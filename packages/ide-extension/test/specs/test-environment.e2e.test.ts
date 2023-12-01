import { browser, expect } from "@wdio/globals"
import {} from "wdio-vscode-service"

describe("VSCode Extension E2E Testing Environment", () => {
	it("should be able to load VSCode with inlang example code", async () => {
		const workbench = await browser.getWorkbench()
		const title = await workbench.getTitleBar().getTitle()
		expect(title).toContain("[Extension Development Host]")
		expect(title).toContain("inlang")
	})
})
