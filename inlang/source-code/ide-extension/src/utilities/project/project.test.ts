import { describe, it, expect, vi } from "vitest"
import * as vscode from "vscode"
import { createTreeDataProvider, projectView } from "./project.js"
import { type NodeishFilesystem } from "@lix-js/fs"

// Mocking VS Code API
vi.mock("vscode", () => ({
	TreeItem: vi.fn(),
	ThemeIcon: vi.fn().mockImplementation((iconName) => iconName),
	ThemeColor: vi.fn().mockImplementation((colorName) => colorName),
	TreeItemCollapsibleState: {
		None: 0,
		Collapsed: 1,
	},
	workspace: {
		createFileSystemWatcher: vi.fn(),
		workspaceFolders: [{ uri: { fsPath: "/workspace" } }],
		findFiles: vi.fn().mockResolvedValue([]),
	},
	window: {
		showErrorMessage: vi.fn(),
		registerTreeDataProvider: vi.fn(),
	},
	commands: {
		registerCommand: vi.fn(),
	},
}))

// Mocking other dependencies
vi.mock("@inlang/sdk", () => ({
	loadProject: vi.fn(),
	listProjects: vi
		.fn()
		.mockResolvedValue([
			{ projectPath: "/workspace/project1.inlang" },
			{ projectPath: "/workspace/project2.inlang" },
		]),
}))
vi.mock("../../services/telemetry/implementation", () => ({
	telemetry: {
		capture: vi.fn(),
	},
}))
vi.mock("../../configuration", () => ({
	CONFIGURATION: {
		EVENTS: {
			ON_DID_PROJECT_TREE_VIEW_CHANGE: {
				fire: vi.fn(),
			},
			ON_DID_ERROR_TREE_VIEW_CHANGE: {
				fire: vi.fn(),
			},
		},
	},
}))
vi.mock("../../state", () => ({
	state: vi.fn(() => ({
		projectsInWorkspace: [
			{ projectPath: "/workspace/project1.inlang" },
			{ projectPath: "/workspace/project2.inlang" },
		],
	})),
}))

// Mocking state module
const mockSelectedProject: string | undefined = undefined
const mockProjectNodes: vscode.TreeItem[] = []
vi.mock("../../state.js", () => ({
	setState: vi.fn(),
	state: vi.fn(() => ({
		selectedProject: mockSelectedProject,
		projectNodes: mockProjectNodes,
	})),
}))

describe("project view", () => {
	// TODO: test other functions from project.ts

	it("createTreeDataProvider returns a TreeDataProvider", async () => {
		const workspaceFolder = { uri: { fsPath: "/workspace" } } as vscode.WorkspaceFolder
		const nodeishFs = {} as NodeishFilesystem // Mock as needed

		const provider = createTreeDataProvider(workspaceFolder, nodeishFs)
		expect(provider).toBeDefined()
	})

	it("projectView registers TreeDataProvider", async () => {
		const mockContext = { subscriptions: [] } as unknown as vscode.ExtensionContext
		const workspaceFolder = { uri: { fsPath: "/workspace" } } as vscode.WorkspaceFolder
		const gitOrigin = "git@github.com:user/repo.git"
		const nodeishFs = {} as NodeishFilesystem // Mock as needed

		await projectView({ context: mockContext, gitOrigin, workspaceFolder, nodeishFs })
		expect(mockContext.subscriptions.length).toBeGreaterThan(0)
	})
})
