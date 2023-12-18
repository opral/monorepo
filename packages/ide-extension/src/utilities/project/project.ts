// src/treeDataProvider.ts
import * as vscode from "vscode"
import { loadProject } from "@inlang/sdk"
import { findInlangProjectRecursively } from "./findInlangProjectRecusively.js"
import { closestInlangProject } from "./closestInlangProject.js"
import { type NodeishFilesystem } from "@lix-js/fs"
import { setState } from "../../state.js"
import { CONFIGURATION } from "../../configuration.js"

export interface ProjectNode {
	label: string
	path: string
	isSelected: boolean
	isClosest: boolean
	collapsibleState: vscode.TreeItemCollapsibleState
}

let selectedProject: string | undefined = undefined // Store the currently selected project path
let projectNodes: ProjectNode[] = [] // Store the project nodes

function createProjectNode(args: {
	label: string
	path: string
	isSelected: boolean
	isClosest: boolean
	collapsibleState: vscode.TreeItemCollapsibleState
}): ProjectNode {
	return { ...args }
}

export async function createProjectNodes(
	workingDirectory: string,
	nodeishFs: NodeishFilesystem
): Promise<ProjectNode[]> {
	const projects = await findInlangProjectRecursively({
		rootPath: workingDirectory,
		nodeishFs,
	})

	const closestProject = await closestInlangProject({ workingDirectory, projects })

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

function getTreeItem(element: ProjectNode, nodeishFs: NodeishFilesystem): vscode.TreeItem {
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
	nodeishFs: NodeishFilesystem
): Promise<void> {
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
		})

		setState({ project: inlangProject })

		// Refresh the entire tree to reflect selection changes
		CONFIGURATION.EVENTS.ON_DID_PROJECT_TREE_VIEW_CHANGE.fire(undefined)
	} catch (error) {
		vscode.window.showErrorMessage(`Failed to load project "${selectedProject}": ${error}`)
	}
}

export function createTreeDataProvider(
	workingDirectory: string,
	nodeishFs: NodeishFilesystem
): vscode.TreeDataProvider<ProjectNode> {
	return {
		getTreeItem: (element: ProjectNode) => getTreeItem(element, nodeishFs),
		getChildren: () => createProjectNodes(workingDirectory, nodeishFs),
		onDidChangeTreeData: CONFIGURATION.EVENTS.ON_DID_PROJECT_TREE_VIEW_CHANGE.event,
	}
}
