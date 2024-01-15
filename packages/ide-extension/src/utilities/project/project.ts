import * as vscode from "vscode"
import { listProjects, loadProject } from "@inlang/sdk"
import { closestInlangProject } from "./closestInlangProject.js"
import { normalizePath, type NodeishFilesystem } from "@lix-js/fs"
import { setState } from "../../state.js"
import { CONFIGURATION } from "../../configuration.js"
import { createFileSystemMapper } from "../fs/createFileSystemMapper.js"
import fs from "node:fs/promises"
import { telemetry } from "../../services/telemetry/implementation.js"
import type { TelemetryEvents } from "../../services/telemetry/events.js"
import { createInlangConfigFile } from "../settings/createInlangConfigFile.js"
import path from "node:path"

export interface ProjectNode {
	label: string
	path: string
	isSelected: boolean
	isClosest: boolean
	collapsibleState: vscode.TreeItemCollapsibleState
}

let projectsList: Awaited<ReturnType<typeof listProjects>>
let closestProjectNode: Awaited<ReturnType<typeof closestInlangProject>>
let selectedProject: string | undefined = undefined
let projectNodes: ProjectNode[] = []

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
	const workspaceFolderFsPath = normalizePath(workspaceFolder.uri.fsPath)
	if (!projectsList) {
		projectsList = await listProjects(nodeishFs, workspaceFolderFsPath)
	}

	if (!closestProjectNode) {
		closestProjectNode = await closestInlangProject({
			workingDirectory: workspaceFolderFsPath,
			projects: projectsList,
		})
	}

	projectNodes = projectsList.map((project) => {
		const projectName = project.projectPath.split("/").slice(-2).join("/")
		return createProjectNode({
			label: projectName,
			path: project.projectPath,
			isSelected: project.projectPath === selectedProject,
			isClosest: project === closestProjectNode,
			collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
		})
	})

	// Handle initial selection
	if (!selectedProject && closestProjectNode) {
		const closestNode = projectNodes.find((node) => node.path === closestProjectNode?.projectPath)
		if (closestNode) {
			await handleTreeSelection(closestNode, nodeishFs, workspaceFolder)
		}
	}

	return projectNodes
}

export function getTreeItem(
	element: ProjectNode,
	nodeishFs: NodeishFilesystem,
	workspaceFolder: vscode.WorkspaceFolder
): vscode.TreeItem {
	return {
		label: element.label,
		tooltip: element.path,
		iconPath: element.isSelected
			? new vscode.ThemeIcon("pass-filled", new vscode.ThemeColor("statusBar.foreground"))
			: new vscode.ThemeIcon("circle-large-outline", new vscode.ThemeColor("statusBar.foreground")),
		contextValue: "projectNode",
		command: {
			command: "inlang.openProject", // This is a custom command you will define
			title: "Open File",
			arguments: [element, nodeishFs, workspaceFolder], // Pass the file path as an argument
		},
	}
}

export async function handleTreeSelection(
	selectedNode: ProjectNode,
	nodeishFs: NodeishFilesystem,
	workspaceFolder: vscode.WorkspaceFolder
): Promise<void> {
	// if no settings file is found
	if (workspaceFolder && projectNodes.length === 0) {
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

		// Here we get the relative path
		const relativeProjectPath = selectedProject
			? "/" + path.relative(normalizePath(workspaceFolder?.uri.fsPath), selectedProject) // adding leading slash
			: ""

		setState({ project: inlangProject, selectedProjectPath: relativeProjectPath })

		// Refresh the entire tree to reflect selection changes
		CONFIGURATION.EVENTS.ON_DID_PROJECT_TREE_VIEW_CHANGE.fire(undefined)
		CONFIGURATION.EVENTS.ON_DID_ERROR_TREE_VIEW_CHANGE.fire(undefined)
	} catch (error) {
		vscode.window.showErrorMessage(`Failed to load project "${selectedProject}": ${error}`)
	}
}

export async function createTreeDataProvider(
	workspaceFolder: vscode.WorkspaceFolder,
	nodeishFs: NodeishFilesystem
): Promise<vscode.TreeDataProvider<ProjectNode>> {
	return {
		getTreeItem: (element: ProjectNode) => getTreeItem(element, nodeishFs, workspaceFolder),
		getChildren: async () => await createProjectNodes(workspaceFolder, nodeishFs),
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
