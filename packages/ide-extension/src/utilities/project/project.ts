import * as vscode from "vscode"
import { loadProject } from "@inlang/sdk"
import { findInlangProjectRecursively } from "./findInlangProjectRecusively.js"
import { closestInlangProject } from "./closestInlangProject.js"
import { type NodeishFilesystem } from "@lix-js/fs"
import { setState } from "../../state.js"
import { CONFIGURATION } from "../../configuration.js"
import { createFileSystemMapper } from "../fs/createFileSystemMapper.js"
import fs from "node:fs/promises"
import { telemetry } from "../../services/telemetry/implementation.js"
import type { TelemetryEvents } from "../../services/telemetry/events.js"
import { createInlangConfigFile } from "../settings/createInlangConfigFile.js"

export interface ProjectNode {
	label: string
	path: string
	isSelected: boolean
	isClosest: boolean
	collapsibleState: vscode.TreeItemCollapsibleState
}

let selectedProject: string | undefined = undefined // Store the currently selected project path
let projectNodes: ProjectNode[] = [] // Store the project nodes

export function createProjectNode(args: {
	label: string
	path: string
	isSelected: boolean
	isClosest: boolean
	collapsibleState: vscode.TreeItemCollapsibleState
}): ProjectNode {
	return { ...args }
}

export async function createProjectNodes(
	workspaceFolder: vscode.WorkspaceFolder,
	nodeishFs: NodeishFilesystem
): Promise<ProjectNode[]> {
	const projects = await findInlangProjectRecursively({
		rootPath: workspaceFolder.uri.fsPath,
		nodeishFs,
	})

	const closestProject = await closestInlangProject({
		workingDirectory: workspaceFolder.uri.fsPath,
		projects,
	})

	projectNodes = projects.map((project) => {
		const projectName = project.split("/").pop() ?? ""
		return createProjectNode({
			label: projectName,
			path: project,
			isSelected: project === selectedProject,
			isClosest: project === closestProject,
			collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
		})
	})

	// Handle initial selection
	if (!selectedProject && closestProject) {
		const closestNode = projectNodes.find((node) => node.path === closestProject)
		if (closestNode) {
			await handleTreeSelection(closestNode, nodeishFs)
		}
	}

	return projectNodes
}

export function getTreeItem(element: ProjectNode, nodeishFs: NodeishFilesystem): vscode.TreeItem {
	return {
		label: element.label,
		iconPath: element.isSelected
			? new vscode.ThemeIcon("pass-filled", new vscode.ThemeColor("statusBar.foreground"))
			: new vscode.ThemeIcon("circle-large-outline", new vscode.ThemeColor("statusBar.foreground")),
		contextValue: "projectNode",
		command: {
			command: "inlang.openProject", // This is a custom command you will define
			title: "Open File",
			arguments: [element, nodeishFs], // Pass the file path as an argument
		},
	}
}

export async function handleTreeSelection(
	selectedNode: ProjectNode,
	nodeishFs: NodeishFilesystem,
	workspaceFolder?: vscode.WorkspaceFolder
): Promise<void> {
	const possibleInlangProjectPaths = [
		...(await vscode.workspace.findFiles("*.inlang/settings.json")),
		// remove after migration
		...(await vscode.workspace.findFiles("project.inlang.json")),
	]

	// if no settings file is found
	if (workspaceFolder && possibleInlangProjectPaths.length === 0) {
		// Try to auto config
		await createInlangConfigFile({ workspaceFolder })
	}

	// update isSelected
	projectNodes = projectNodes.map((node) => {
		return {
			...node,
			isSelected: node.path === selectedNode.path,
		}
	})

	// update selectedProject
	selectedProject = projectNodes.find((node) => node.isSelected)?.path

	try {
		const inlangProject = await loadProject({
			projectPath: selectedProject ?? "",
			nodeishFs,
			_capture(id, props) {
				telemetry.capture({
					event: id as TelemetryEvents,
					properties: props,
				})
			},
		})

		telemetry.capture({
			event: "IDE-EXTENSION loaded project",
			properties: {
				errors: inlangProject?.errors(),
			},
		})

		setState({ project: inlangProject })

		// Refresh the entire tree to reflect selection changes
		CONFIGURATION.EVENTS.ON_DID_PROJECT_TREE_VIEW_CHANGE.fire(undefined)
		CONFIGURATION.EVENTS.ON_DID_ERROR_TREE_VIEW_CHANGE.fire(undefined)
	} catch (error) {
		vscode.window.showErrorMessage(`Failed to load project "${selectedProject}": ${error}`)
	}
}

export async function createTreeDataProvider(
	workingDirectory: vscode.WorkspaceFolder,
	nodeishFs: NodeishFilesystem
): Promise<vscode.TreeDataProvider<ProjectNode>> {
	return {
		getTreeItem: (element: ProjectNode) => getTreeItem(element, nodeishFs),
		getChildren: async () => await createProjectNodes(workingDirectory, nodeishFs),
		onDidChangeTreeData: CONFIGURATION.EVENTS.ON_DID_PROJECT_TREE_VIEW_CHANGE.event,
	}
}

export const projectView = async (args: {
	context: vscode.ExtensionContext
	gitOrigin: string | undefined
	workspaceFolder: vscode.WorkspaceFolder
}) => {
	const nodeishFs = createFileSystemMapper(args.workspaceFolder.uri.fsPath, fs)
	const treeDataProvider = await createTreeDataProvider(args.workspaceFolder || "", nodeishFs)

	await treeDataProvider.getChildren()

	args.context.subscriptions.push(
		vscode.window.registerTreeDataProvider("projectView", treeDataProvider)
	)
}
