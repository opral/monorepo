import { describe, expect, it, vi, type Mock } from "vitest"
import { createNewProjectHandler } from "./createNewProjectHandler.js"
import * as vscode from "vscode"
import { newProject, loadProjectInMemory, saveProjectToDirectory } from "@inlang/sdk2"

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

vi.mock("@inlang/sdk2", () => ({
	newProject: vi.fn().mockResolvedValue({}), // Mocking the project blob
	loadProjectInMemory: vi.fn().mockResolvedValue({}), // Mocking the project in memory
	saveProjectToDirectory: vi.fn().mockResolvedValue(undefined), // Mocking saveProjectToDirectory
}))

describe("createNewProjectHandler", () => {
	it("should create a new project successfully", async () => {
		await createNewProjectHandler({
			workspaceFolderPath: "/path/to/workspace",
		})

		// Check if newProject was called
		expect(newProject).toHaveBeenCalled()

		// Check if loadProjectInMemory was called with the blob from newProject
		expect(loadProjectInMemory).toHaveBeenCalledWith({
			blob: expect.any(Object), // Mock object representing the blob
		})

		// Check if saveProjectToDirectory was called with the expected arguments
		expect(saveProjectToDirectory).toHaveBeenCalledWith({
			fs: expect.any(Object), // Mock fs implementation (nodeishFs)
			project: expect.any(Object), // Project in memory
			path: "/path/to/workspace/project.inlang",
		})

		// Check if the window reload command was called
		expect(vscode.commands.executeCommand).toHaveBeenCalledWith("workbench.action.reloadWindow")
	})

	it("should handle errors when project creation fails", async () => {
		const errorMessage = "Failed to create project"
		;(newProject as Mock).mockRejectedValueOnce(new Error(errorMessage))

		await createNewProjectHandler({
			workspaceFolderPath: "/path/to/workspace",
		})

		// Check if error message is shown when newProject fails
		expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
			`Failed to create new project: ${errorMessage}`
		)
	})
})
