import * as vscode from "vscode"
import { loadProject } from "@inlang/sdk"
import { normalizePath, type NodeishFilesystem } from "@lix-js/fs"
import { CONFIGURATION } from "../../configuration.js"
import { telemetry } from "../../services/telemetry/implementation.js"
import { openRepository } from "@lix-js/client"
import { findRepoRoot } from "@lix-js/client"
import { setState, state } from "../state.js"

let projectViewNodes: ProjectViewNode[] = []

export interface ProjectViewNode {
	label: string
	path: string
	isSelected: boolean
	collapsibleState: vscode.TreeItemCollapsibleState
}

export function createProjectViewNodes(): ProjectViewNode[] {
	const projectsInWorkspace = state().projectsInWorkspace

	if (!projectsInWorkspace) {
		console.error("state().projectsInWorkspace is undefined")
		return []
	}

	projectViewNodes = projectsInWorkspace.map((project) => {
		// Ensure projectPath is a string
		const projectPath = typeof project.projectPath === "string" ? project.projectPath : ""
		const projectName = projectPath.split("/").slice(-2).join("/")

		return {
			label: projectName,
			path: project.projectPath,
			isSelected: project.projectPath === state().selectedProjectPath,
			collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
		} as ProjectViewNode
	})

	return projectViewNodes
}

export function getTreeItem(args: {
	element: ProjectViewNode
	nodeishFs: NodeishFilesystem
}): vscode.TreeItem {
	return {
		label: args.element.label,
		tooltip: args.element.path,
		iconPath: args.element.isSelected
			? new vscode.ThemeIcon("pass-filled", new vscode.ThemeColor("statusBar.foreground"))
			: new vscode.ThemeIcon("circle-large-outline", new vscode.ThemeColor("statusBar.foreground")),
		contextValue: "projectViewNode",
		command: {
			command: "inlang.openProject",
			title: "Open File",
			arguments: [args.element, args.nodeishFs],
		},
	}
}

export async function handleTreeSelection(args: {
	selectedNode: ProjectViewNode
	nodeishFs: NodeishFilesystem
}): Promise<void> {
	const selectedProject = normalizePath(args.selectedNode.path)

	projectViewNodes = projectViewNodes.map((node) => ({
		...node,
		isSelected: node.path === args.selectedNode.path,
	}))

	const newSelectedProject = projectViewNodes.find((node) => node.isSelected)?.path as string

	const repo = await openRepository(
		(await findRepoRoot({
			nodeishFs: args.nodeishFs,
			path: newSelectedProject,
		})) || "",
		{
			nodeishFs: args.nodeishFs,
		}
	)

	try {
		const inlangProject = await loadProject({
			projectPath: newSelectedProject,
			appId: CONFIGURATION.STRINGS.APP_ID,
			repo,
		})

		if (inlangProject.id) {
			telemetry.groupIdentify({
				groupType: "project",
				groupKey: inlangProject.id,
			})
		}

		telemetry.capture({
			event: "IDE-EXTENSION loaded project",
			properties: {
				errors: inlangProject?.errors(),
			},
		})

		setState({
			...state(),
			project: inlangProject,
			selectedProjectPath: newSelectedProject,
		})

		// Update decorations
		CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire(undefined)
		CONFIGURATION.EVENTS.ON_DID_EXTRACT_MESSAGE.fire(undefined)
		// Refresh the entire tree to reflect selection changes
		CONFIGURATION.EVENTS.ON_DID_PROJECT_TREE_VIEW_CHANGE.fire(undefined)
		CONFIGURATION.EVENTS.ON_DID_ERROR_TREE_VIEW_CHANGE.fire(undefined)
	} catch (error) {
		vscode.window.showErrorMessage(`Failed to load project "${selectedProject}": ${error}`)
	}
}

export function createTreeDataProvider(args: {
	nodeishFs: NodeishFilesystem
}): vscode.TreeDataProvider<ProjectViewNode> {
	return {
		getTreeItem: (element: ProjectViewNode) => getTreeItem({ element, nodeishFs: args.nodeishFs }),
		getChildren: async () => createProjectViewNodes(),
		onDidChangeTreeData: CONFIGURATION.EVENTS.ON_DID_PROJECT_TREE_VIEW_CHANGE.event,
	}
}

export const projectView = async (args: {
	context: vscode.ExtensionContext
	workspaceFolder: vscode.WorkspaceFolder
	nodeishFs: NodeishFilesystem
}) => {
	const treeDataProvider = await createTreeDataProvider({ nodeishFs: args.nodeishFs })

	// inital call to createProjectViewNodes() to set the selected project
	treeDataProvider.getChildren()

	args.context.subscriptions.push(
		vscode.window.registerTreeDataProvider("projectView", treeDataProvider)
	)

	// Trigger handleTreeSelection for the selected project after initializing the tree view
	const selectedProjectPath = state().selectedProjectPath
	if (selectedProjectPath) {
		const selectedNode = projectViewNodes.find((node) => node.path === selectedProjectPath)
		if (selectedNode) {
			await handleTreeSelection({ selectedNode, nodeishFs: args.nodeishFs })
		}
	}
}
