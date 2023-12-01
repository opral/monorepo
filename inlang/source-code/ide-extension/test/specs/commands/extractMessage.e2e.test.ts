import { browser, expect } from "@wdio/globals"
import vscode from "vscode"
import {} from "wdio-vscode-service"

describe("Extract Message command", () => {
	beforeEach(async () => {})

	it("should be able to extract messages via Command Palette", async () => {
		await browser.executeWorkbench(async (vscodeApi: typeof vscode) => {
			const workspace = vscodeApi.workspace.workspaceFolders?.[0]
			if (!workspace) {
				return
			}
			const testFilePath = vscodeApi.Uri.joinPath(workspace.uri, "/app/[lng]/second-page/page.js")
			const document = await vscodeApi.workspace.openTextDocument(testFilePath)
			await vscode.window.showTextDocument(document)
		})

		await browser.debug()
		const workbench = await browser.getWorkbench()
	})
})
