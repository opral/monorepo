import { browser, expect } from '@wdio/globals'
import {} from "wdio-vscode-service"

describe("VS Code Extension Testing", () => {
	it("should be able to load VSCode", async () => {
		const workbench = await browser.getWorkbench()
		expect(await workbench.getTitleBar().getTitle()).toContain("[Extension Development Host]")
	})
})

