import * as vscode from "vscode"
import * as path from "path"
import * as fg from "fast-glob"
import { state } from "../state.js"
import { CONFIGURATION } from "../../configuration.js"
import type { FileSystem } from "./createFileSystemMapper.js"
import { absolutePathFromProject } from "../../../../sdk/dist/project/loadProjectFromDirectory.js"
import { handleError } from "../utils.js"
import * as crypto from "crypto"
import { activate } from "../../main.js"

// Store file hashes to detect real changes
const fileHashes = new Map<string, string>()
const selfModifiedFiles = new Set<string>() // Tracks files modified by the extension
const DEBOUNCE_MS = 500

async function getFileHash(uri: vscode.Uri): Promise<string> {
	try {
		const content = await vscode.workspace.fs.readFile(uri)
		return crypto.createHash("sha256").update(content).digest("hex")
	} catch {
		return ""
	}
}

export async function setupFileSystemWatcher(args: {
	context: vscode.ExtensionContext
	workspaceFolder: vscode.WorkspaceFolder
	fs: FileSystem
}) {
	try {
		const workspacePath = fg.convertPathToPattern(args.workspaceFolder.uri.fsPath)
		const projectPaths = await fg.async(`${workspacePath}/**/*.inlang`, {
			onlyDirectories: true,
			ignore: ["**/node_modules/**"],
			absolute: true,
			cwd: workspacePath,
		})

		const watchers: vscode.FileSystemWatcher[] = []

		for (const projectPath of projectPaths) {
			const project = state().projectsInWorkspace.find((p) => p.projectPath === projectPath)
			if (!project) continue

			const plugins = await state().project.plugins.get()
			const settings = await state().project.settings.get()
			const watchedPatterns: string[] = []

			for (const plugin of plugins) {
				const pathPattern = settings[plugin.key]?.pathPattern
				if (pathPattern) {
					const resolvedPattern = pathPattern.replace(/\{(languageTag|locale)\}/g, "*")
					const absolutePattern = absolutePathFromProject(projectPath, resolvedPattern)
					watchedPatterns.push(path.relative(workspacePath, absolutePattern))
				}
			}

			watchedPatterns.push(path.relative(workspacePath, projectPath))

			for (const pattern of watchedPatterns) {
				const relativePattern = new vscode.RelativePattern(args.workspaceFolder, pattern)
				const watcher = vscode.workspace.createFileSystemWatcher(relativePattern)

				const handleFileEvent = async (uri: vscode.Uri, eventType: string) => {
					const filePath = uri.fsPath

					// Prevent duplicate rapid-fire events
					if (selfModifiedFiles.has(filePath)) {
						console.log(`Skipping self-modified ${eventType}: ${filePath}`)
						selfModifiedFiles.delete(filePath)
						return
					}

					// Check if the file content actually changed (hash-based detection)
					const newHash = await getFileHash(uri)
					const oldHash = fileHashes.get(filePath)

					if (newHash === oldHash) {
						console.log(`Skipping unchanged ${eventType}: ${filePath}`)
						return
					}

					// Update hash
					fileHashes.set(filePath, newHash)
					console.log(`${eventType}: ${filePath}`)

					// Find the relevant project and plugin
					const project = state().projectsInWorkspace.find((p) =>
						filePath.startsWith(p.projectPath)
					)
					if (!project) return

					try {
						// Get the current project instance and plugins
						const currentProject = state().project
						if (!currentProject) return

						const plugins = await currentProject.plugins.get()
						const settings = await currentProject.settings.get()

						// For each plugin that has a pathPattern matching this file
						for (const plugin of plugins) {
							const pathPattern = settings[plugin.key]?.pathPattern
							if (!pathPattern) continue

							// Convert the glob pattern to a regex pattern
							const resolvedPattern = pathPattern.replace(/\{(languageTag|locale)\}/g, "([^/]+)")
							const regex = new RegExp(resolvedPattern)

							// Extract locale from the file path using the regex
							const relativePath = path.relative(project.projectPath, filePath)
							const match = relativePath.match(regex)

							if (match && match[1]) {
								// Ensure both match and locale group exist
								const locale = match[1] // The first capture group contains the locale

								// Read the file content
								const content = await vscode.workspace.fs.readFile(uri)

								// Import the file for this plugin
								await currentProject.importFiles({
									pluginKey: plugin.key,
									files: [
										{
											locale,
											content: new Uint8Array(content),
										},
									],
								})

								console.log(`Reimported messages for plugin ${plugin.key} with locale ${locale}`)
							}
						}
					} catch (error) {
						handleError(error)
					}

					// Update the messages in the UI
					CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire()
				}

				watcher.onDidChange(async (e) => handleFileEvent(e, "Changed"))
				watcher.onDidCreate(async (e) => handleFileEvent(e, "Created"))
				watcher.onDidDelete(async (e) => handleFileEvent(e, "Deleted"))

				watchers.push(watcher)
				args.context.subscriptions.push(watcher)
			}
		}

		console.log(`Watching ${watchers.length} file patterns across ${projectPaths.length} projects.`)
	} catch (error) {
		handleError(error)
	}
}

// Function to mark files as modified by the extension (to prevent self-triggering)
export async function markFileAsEdited(uri: vscode.Uri) {
	const filePath = uri.fsPath
	selfModifiedFiles.add(filePath)
	const newHash = await getFileHash(uri)
	fileHashes.set(filePath, newHash)
}
