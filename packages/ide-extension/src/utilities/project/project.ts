import * as vscode from "vscode"
import { loadProject } from "@inlang/sdk"
import { closestInlangProject } from "./closestInlangProject.js"
import { normalizePath, type NodeishFilesystem } from "@lix-js/fs"
import { setState, state } from "../../state.js"
import { CONFIGURATION } from "../../configuration.js"

import { telemetry } from "../../services/telemetry/implementation.js"
import type { TelemetryEvents } from "../../services/telemetry/events.js"
import path from "node:path"

let projectViewNodes: ProjectViewNode[] = []

export interface ProjectViewNode {
	label: string
	path: string
	isSelected: boolean
	isClosest: boolean
	collapsibleState: vscode.TreeItemCollapsibleState
}

export async function createProjectViewNodes(
	workspaceFolder: vscode.WorkspaceFolder,
	nodeishFs: NodeishFilesystem
): Promise<ProjectViewNode[]> {
	let closestProjectToWorkspace: Awaited<ReturnType<typeof closestInlangProject>>
	const selectedProject = state().selectedProjectPath
	const workspaceFolderFsPath = normalizePath(workspaceFolder.uri.fsPath)
	const projectList = state().projectsInWorkspace

	if (!projectList || projectList.length === 0) {
		return []
	}

	if (!closestProjectToWorkspace) {
		closestProjectToWorkspace = await closestInlangProject({
			workingDirectory: workspaceFolderFsPath,
			projects: projectList,
		})
	}

	projectViewNodes = projectList.map((project) => {
		const projectName = normalizePath(project.projectPath).split("/").slice(-2).join("/")
		const projectPathRelative = project.projectPath.replace(workspaceFolderFsPath, "")

		return {
			label: projectName,
			path: project.projectPath,
			isSelected: projectPathRelative === selectedProject,
			isClosest: project === closestProjectToWorkspace,
			collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
		} as ProjectViewNode
	})

	// Handle initial selection
	if (!selectedProject && closestProjectToWorkspace) {
		const closestNode = projectViewNodes.find(
			(node) => node.path === closestProjectToWorkspace?.projectPath
		)
		if (closestNode) {
			await handleTreeSelection(closestNode, nodeishFs, workspaceFolder)
		}
	}

	return projectViewNodes
}

export function getTreeItem(
	element: ProjectViewNode,
	nodeishFs: NodeishFilesystem,
	workspaceFolder: vscode.WorkspaceFolder
): vscode.TreeItem {
	return {
		label: element.label,
		tooltip: element.path,
		iconPath: element.isSelected
			? new vscode.ThemeIcon("pass-filled", new vscode.ThemeColor("statusBar.foreground"))
			: new vscode.ThemeIcon("circle-large-outline", new vscode.ThemeColor("statusBar.foreground")),
		contextValue: "projectViewNode",
		command: {
			command: "inlang.openProject",
			title: "Open File",
			arguments: [element, nodeishFs, workspaceFolder],
		},
	}
}

export async function handleTreeSelection(
	selectedNode: ProjectViewNode,
	nodeishFs: NodeishFilesystem,
	workspaceFolder: vscode.WorkspaceFolder
): Promise<void> {
	const selectedProject = selectedNode.path

	projectViewNodes = projectViewNodes.map((node) => ({
		...node,
		isSelected: node.path === selectedNode.path,
	}))

	const newSelectedProject = projectViewNodes.find((node) => node.isSelected)?.path

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

		// Get the relative path
		const relativeProjectPath = newSelectedProject
			? "/" + path.relative(normalizePath(workspaceFolder?.uri.fsPath), selectedProject) // adding leading slash
			: ""

		setState({
			...state(),
			project: inlangProject,
			selectedProjectPath: relativeProjectPath,
		})

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
): Promise<vscode.TreeDataProvider<ProjectViewNode>> {
	return {
		getTreeItem: (element: ProjectViewNode) => getTreeItem(element, nodeishFs, workspaceFolder),
		getChildren: async () => await createProjectViewNodes(workspaceFolder, nodeishFs),
		onDidChangeTreeData: CONFIGURATION.EVENTS.ON_DID_PROJECT_TREE_VIEW_CHANGE.event,
	}
}

function createNoProjectsFoundViewProvider(): vscode.WebviewViewProvider {
	return {
		resolveWebviewView(webviewView: vscode.WebviewView) {
			webviewView.webview.options = {
				enableScripts: false,
			}
			webviewView.webview.html = getNoProjectsFoundHtml()
		},
	}
}

function getNoProjectsFoundHtml(): string {
	return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>No Projects Found</title>
			<style>
				body{
					margin: 0;
					padding: 0;
					box-sizing: border-box;
				}
				main {
					margin: 5px 10px;
				}
				h1 {
					font-size: 12px;
					text-weight: bold;
				}
				span {
					display: block;
					font-size: 12px;
					line-height: 1.2;
					margin-bottom: 10px;
				}
				button {
					color: var(--vscode-button-foreground);
					background-color: var(--vscode-button-background);
					border: none;
					padding: 5px 10px;
					width: 100%;
					text-align: center;
					text-decoration: none;
					display: inline-block;
					font-size: 12px;
					font-weight: bold;
					margin: 4px 2px;
					transition-duration: 0.4s;
					cursor: pointer;
					border-radius: 2px;
					margin-bottom: 10px;
				}
				
				button:hover {
					background-color: var(--vscode-button-hoverBackground);
				}

				ol, ul {
					margin-top: 5px;
				}

				li {
					font-size: 12px;
					margin-bottom: 5px;
				}
			</style>
        </head>
        <body>
			<main>
				<h1>No project found</h1>
				<span>Please create a project or make sure to have the correct workspace open.</span>
				<a href="https://manage.inlang.com"><button>Create Project</button></a>
				<span style="text-align: center;">Or, see <a href="https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension">documentation</a></span>
			</main>
        </body>
        </html>`
}

export const projectView = async (args: {
	context: vscode.ExtensionContext
	gitOrigin: string | undefined
	workspaceFolder: vscode.WorkspaceFolder
	nodeishFs: NodeishFilesystem
}) => {
	const projectList = state().projectsInWorkspace

	if (projectList && projectList.length === 0) {
		vscode.window.registerWebviewViewProvider(
			"gettingStartedView",
			createNoProjectsFoundViewProvider()
		)
	} else {
		const treeDataProvider = await createTreeDataProvider(
			args.workspaceFolder || "",
			args.nodeishFs
		)

		args.context.subscriptions.push(
			vscode.window.registerTreeDataProvider("projectView", treeDataProvider)
		)
	}

	return
}
