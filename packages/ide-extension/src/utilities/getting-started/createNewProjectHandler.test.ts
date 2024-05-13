import { describe, expect, it, vi, type Mock } from "vitest"
import { createNewProjectHandler } from "./createNewProjectHandler.js"
import * as vscode from "vscode"
import { openRepository } from "@lix-js/client"
import { createNewProject } from "@inlang/sdk"

vi.mock("vscode", () => ({
	commands: {
		registerCommand: vi.fn(),
		executeCommand: vi.fn(),
	},
	window: {
		showErrorMessage: vi.fn(),
		showInformationMessage: vi.fn(),
	},
	Uri: {
		parse: vi.fn(),
	},
}))

vi.mock("@lix-js/client", () => ({
	openRepository: vi.fn().mockResolvedValue({}),
}))

vi.mock("@inlang/sdk", () => ({
	createNewProject: vi.fn().mockResolvedValue(undefined),
	defaultProjectSettings: { dummy: "settings" },
}))

describe("createNewProjectHandler", () => {
	it("should create a new project successfully", async () => {
		await createNewProjectHandler({ workspaceFolderPath: "/path/to/workspace" })

		expect(openRepository).toHaveBeenCalledWith("file:///path/to/workspace", expect.anything())
		expect(createNewProject).toHaveBeenCalledWith({
			projectPath: "/path/to/workspace/yourProjectName.inlang",
			repo: {},
			projectSettings: { dummy: "settings" },
		})
		expect(vscode.commands.executeCommand).toHaveBeenCalledWith("workbench.action.reloadWindow")
	})

	it("should handle errors when project creation fails", async () => {
		const errorMessage = "Failed to create project"
		;(createNewProject as Mock).mockRejectedValueOnce(new Error(errorMessage))

		await createNewProjectHandler({ workspaceFolderPath: "/path/to/workspace" })

		expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
			`Failed to create new project: ${errorMessage}`
		)
	})
})
