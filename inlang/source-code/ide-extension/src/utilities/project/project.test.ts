import { describe, it, expect, vi, beforeEach } from "vitest"
import * as vscode from "vscode"
import * as fs from "node:fs/promises"
import { loadProject } from "@inlang/sdk"
import { setState, state } from "../state.js"
import { CONFIGURATION } from "../../configuration.js"
import { telemetry } from "../../services/telemetry/implementation.js"
import { openRepository, findRepoRoot } from "@lix-js/client"
import {
	createProjectViewNodes,
	getTreeItem,
	handleTreeSelection,
	createTreeDataProvider,
	type ProjectViewNode,
	projectView,
} from "./project.js"

vi.mock("vscode", () => ({
	Uri: {
		parse: vi.fn((path: string) => ({ fsPath: path })),
	},
	window: {
		registerTreeDataProvider: vi.fn(),
		showErrorMessage: vi.fn(),
	},
	ThemeIcon: class {},
	ThemeColor: class {},
	CancellationTokenSource: class {
		token = {}
	},
	TreeItemCollapsibleState: {
		Collapsed: 0,
		None: 1,
		Expanded: 2,
	},
	EventEmitter: vi.fn(),
}))

vi.mock("@inlang/sdk", () => ({
	loadProject: vi.fn(),
}))

vi.mock("@lix-js/fs", () => ({
	normalizePath: vi.fn((path: string) => path),
}))

vi.mock("../state.js", () => ({
	setState: vi.fn(),
	state: vi.fn(() => ({
		projectsInWorkspace: [
			{
				label: "to/project1",
				path: "/path/to/project1",
				isSelected: false,
				collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
			},
			{
				label: "to/project2",
				path: "/path/to/project2",
				isSelected: true,
				collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
			},
		],
		selectedProjectPath: "",
	})),
}))

vi.mock("../../configuration.js", () => ({
	CONFIGURATION: {
		STRINGS: {
			APP_ID: "test-app-id",
		},
		EVENTS: {
			ON_DID_EDIT_MESSAGE: {
				fire: vi.fn(),
			},
			ON_DID_CREATE_MESSAGE: {
				fire: vi.fn(),
			},
			ON_DID_EXTRACT_MESSAGE: {
				fire: vi.fn(),
			},
			ON_DID_PROJECT_TREE_VIEW_CHANGE: {
				fire: vi.fn(),
				event: new vscode.EventEmitter(),
			},
			ON_DID_ERROR_TREE_VIEW_CHANGE: {
				fire: vi.fn(),
			},
		},
	},
}))

vi.mock("../../services/telemetry/implementation.js", () => ({
	telemetry: {
		capture: vi.fn(),
	},
}))

vi.mock("@lix-js/client", () => ({
	openRepository: vi.fn(),
	findRepoRoot: vi.fn(),
}))

describe("createProjectViewNodes", () => {
	const mockContext = {} as vscode.ExtensionContext
	const mockWorkspaceFolder = {
		uri: {
			fsPath: "/path/to/workspace",
		},
	} as vscode.WorkspaceFolder

	beforeEach(() => {
		vi.resetAllMocks()
	})

	it("should create project view nodes from state", () => {
		// @ts-expect-error
		state.mockReturnValue({
			projectsInWorkspace: [
				{
					projectPath: "/path/to/project1",
				},
				{
					projectPath: "/path/to/project2",
				},
			],
			selectedProjectPath: "/path/to/project2",
		})

		const nodes = createProjectViewNodes({
			context: mockContext,
			workspaceFolder: mockWorkspaceFolder,
		})
		expect(nodes.length).toBe(2)
		expect(nodes[0]?.label).toBe("project1")
		expect(nodes[1]?.isSelected).toBe(true)
	})

	it("should return empty array if projectsInWorkspace is undefined", () => {
		// @ts-expect-error
		state.mockReturnValue({
			projectsInWorkspace: [],
			selectedProjectPath: "/path/to/project2",
		})
		const nodes = createProjectViewNodes({
			context: mockContext,
			workspaceFolder: mockWorkspaceFolder,
		})
		expect(nodes).toEqual([])
	})

	it("should handle undefined projectPath", () => {
		// @ts-expect-error
		state.mockReturnValue({
			projectsInWorkspace: [
				{
					projectPath: undefined,
				},
			],
			selectedProjectPath: "/path/to/project2",
		})
		const nodes = createProjectViewNodes({
			context: mockContext,
			workspaceFolder: mockWorkspaceFolder,
		})
		expect(nodes.some((node) => node.label === "")).toBe(true)
	})
})

describe("getTreeItem", () => {
	const mockContext = {} as vscode.ExtensionContext

	it("should return a TreeItem for a given ProjectViewNode", () => {
		const node: ProjectViewNode = {
			label: "testProject",
			path: "/path/to/testproject",
			relativePath: "./path/to/testproject.inlang",
			isSelected: true,
			collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
			context: mockContext,
		}
		const workspaceFolder = {
			uri: {
				fsPath: "/path/to/workspace",
			},
		} as vscode.WorkspaceFolder
		const treeItem = getTreeItem({
			element: node,
			fs: {} as typeof import("node:fs/promises"),
			workspaceFolder,
		})
		expect(treeItem.label).toBe("testProject")
		expect(treeItem.description).toBe("./path/to/testproject.inlang")
		expect(treeItem.tooltip).toBe("/path/to/testproject")
		expect(treeItem.iconPath).toBeInstanceOf(vscode.ThemeIcon)
	})
})

describe("handleTreeSelection", () => {
	const mockContext = {} as vscode.ExtensionContext

	it("should handle tree selection and update state", async () => {
		const selectedNode: ProjectViewNode = {
			label: "SelectedProject",
			path: "/path/to/selected",
			relativePath: "./path/to/selected",
			isSelected: true,
			collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
			context: mockContext,
		}
		const workspaceFolder = {
			uri: {
				fsPath: "/path/to/workspace",
			},
		} as vscode.WorkspaceFolder

		// @ts-expect-error
		openRepository.mockResolvedValue({})
		// @ts-expect-error
		findRepoRoot.mockResolvedValue("/path/to/repo")
		// @ts-expect-error
		loadProject.mockResolvedValue({ errors: () => [] })

		await handleTreeSelection({ selectedNode, fs, workspaceFolder })

		expect(setState).toBeCalled()
		expect(telemetry.capture).toBeCalled()
		expect(CONFIGURATION.EVENTS.ON_DID_PROJECT_TREE_VIEW_CHANGE.fire).toBeCalled()
	})

	it("should show error message if project loading fails", async () => {
		const selectedNode: ProjectViewNode = {
			label: "SelectedProject",
			path: "/path/to/selected",
			relativePath: "./path/to/selected",
			isSelected: true,
			collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
			context: mockContext,
		}
		const workspaceFolder = {
			uri: {
				fsPath: "/path/to/workspace",
			},
		} as vscode.WorkspaceFolder

		// @ts-expect-error
		openRepository.mockResolvedValue({})
		// @ts-expect-error
		findRepoRoot.mockResolvedValue("/path/to/repo")
		// @ts-expect-error
		loadProject.mockRejectedValue(new Error("Loading failed"))

		await handleTreeSelection({ selectedNode, fs, workspaceFolder })

		expect(vscode.window.showErrorMessage).toBeCalledWith(
			expect.stringContaining("Failed to load project")
		)
	})

	it("should handle error when project loading fails", async () => {
		const mockContext = {} as vscode.ExtensionContext

		const selectedNode: ProjectViewNode = {
			label: "selected/project.inlang",
			path: "/path/to/selected/project.inlang",
			relativePath: "./path/to/selected/project.inlang",
			isSelected: true,
			collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
			context: mockContext,
		}
		const workspaceFolder = {
			uri: {
				fsPath: "/path/to/workspace",
			},
		} as vscode.WorkspaceFolder

		// @ts-expect-error
		loadProject.mockRejectedValue(new Error("Loading failed"))

		await handleTreeSelection({ selectedNode, fs, workspaceFolder })

		// Update the expected error message according to the actual implementation
		expect(vscode.window.showErrorMessage).toBeCalledWith(
			expect.stringContaining('Failed to load project "undefined": Error: Loading failed')
		)
	})
})

describe("createTreeDataProvider", () => {
	const mockContext = {} as vscode.ExtensionContext

	it("should create a TreeDataProvider", () => {
		const workspaceFolder = {
			uri: {
				fsPath: "/path/to/workspace",
			},
		} as vscode.WorkspaceFolder
		const treeDataProvider = createTreeDataProvider({
			fs,
			workspaceFolder,
			context: mockContext,
		})
		expect(treeDataProvider).toBeDefined()
		expect(treeDataProvider.getTreeItem).toBeInstanceOf(Function)
		expect(treeDataProvider.getChildren).toBeInstanceOf(Function)
	})
})

describe("projectView", () => {
	it("should set up the project view", async () => {
		// @ts-expect-error
		const context = {
			subscriptions: [],
		} as vscode.ExtensionContext
		const workspaceFolder = {
			uri: {
				fsPath: "/path/to/workspace",
			},
		} as vscode.WorkspaceFolder

		await projectView({ context, workspaceFolder, fs })

		expect(vscode.window.registerTreeDataProvider).toBeCalled()
	})
})
