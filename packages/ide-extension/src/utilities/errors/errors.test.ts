import { describe, it, expect, vi } from "vitest"
import * as vscode from "vscode"
import {
	createErrorNode,
	createErrorNodes,
	getTreeItem,
	createErrorTreeDataProvider,
	errorView,
} from "./errors.js"
import { state } from "../state.js"

interface MockState {
	project: {
		errors: () => Error[]
	}
}

vi.mock("vscode", () => ({
	TreeItem: vi.fn(),
	ThemeIcon: vi.fn().mockImplementation((iconName) => iconName),
	ThemeColor: vi.fn().mockImplementation((colorName) => colorName),
	TreeItemCollapsibleState: {
		None: 0,
	},
	window: {
		registerTreeDataProvider: vi.fn(),
	},
	commands: {
		registerCommand: vi.fn(),
	},
	EventEmitter: vi.fn(),
	env: {
		clipboard: {
			writeText: vi.fn(),
		},
	},
}))

// Mock the state module
vi.mock("../state.js", () => ({
	state: vi.fn(() => ({
		project: {
			errors: vi.fn(() => [new Error("Test Error 1"), new Error("Test Error 2")]),
		},
	})),
}))

describe("error handling", () => {
	it("creates an error node for an error", () => {
		const error = new Error("Test Error")
		const errorNode = createErrorNode(error)
		expect(errorNode).toEqual({
			label: "Error",
			tooltip: "Test Error",
			description: "Test Error",
			error,
		})
	})

	it("creates an error node for no error", () => {
		const errorNode = createErrorNode(undefined)
		expect(errorNode).toEqual({
			error: new Error(
				"No project found in workspace. Please open a project to see errors. To create a new project, visit https://manage.inlang.com"
			),
			label: "No project found in workspace",
			tooltip:
				"No project found in workspace. Please open a project to see errors. To create a new project, visit https://manage.inlang.com",
		})
	})

	it("creates an error node for no error", () => {
		const errorNode = createErrorNode(0)
		expect(errorNode).toEqual({
			error: undefined,
			label: "No errors found",
			tooltip: "All good!",
		})
	})

	it("creates error nodes from errors", async () => {
		const expectedErrors = [
			{ label: "Error", tooltip: "Test Error 1", description: "Test Error 1" },
			{ label: "Error", tooltip: "Test Error 2", description: "Test Error 2" },
		]

		const nodes = await createErrorNodes()
		expect(nodes).toHaveLength(expectedErrors.length)

		for (const [index, node] of nodes.entries()) {
			const expected = expectedErrors[index]
			if (!node) {
				throw new Error(`Error node at index ${index} is undefined`)
			}
			expect(node.label).toBe(expected?.label)
			expect(node.tooltip).toBe(expected?.tooltip)
			expect(node.description).toBe(expected?.description)
			expect(node.error).toBeInstanceOf(Error)
		}
	})

	it("creates error nodes when no errors are present", async () => {
		// Redefine mock for this specific test
		vi.mocked(state).mockImplementation(
			(): MockState => ({
				project: {
					// @ts-expect-error
					errors: vi.fn(() => []),
				},
			})
		)

		const nodes = await createErrorNodes()
		expect(nodes).toHaveLength(1)
		if (!nodes[0]) {
			throw new Error("Error node is undefined")
		}
		expect(nodes[0].label).toBe("No errors found")
	})

	it("creates a tree item from an error node", () => {
		const errorNode = {
			label: "Test Error",
			tooltip: "Error message",
			description: "Error message",
			error: new Error("Error message"),
		}

		const treeItem = getTreeItem(errorNode)
		expect(treeItem.tooltip).toBe("Error message")
		expect(treeItem.description).toBe("Error message")
	})

	it("creates a tree data provider", () => {
		const provider = createErrorTreeDataProvider()
		expect(provider).toBeDefined()
	})

	it("registers error view", async () => {
		const mockContext = { subscriptions: [] }
		await errorView({ context: mockContext as unknown as vscode.ExtensionContext })
		expect(mockContext.subscriptions).toHaveLength(1)
	})
})
