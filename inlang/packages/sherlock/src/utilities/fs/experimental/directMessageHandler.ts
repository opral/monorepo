/**
 * Direct message handler for JSON translation files
 *
 * This is a simpler approach to handling translation files that bypasses
 * the complex pattern matching logic in setupFileSystemWatcher.ts
 */

import * as vscode from "vscode"
import * as path from "path"
import { state } from "../../state.js"
import { CONFIGURATION } from "../../../configuration.js"
import { handleError } from "../../utils.js"
import * as crypto from "crypto"
import { saveProject } from "../../../main.js"

// Store file hashes to detect real changes
const fileHashes = new Map<string, string>()
const selfModifiedFiles = new Set<string>() // Tracks files modified by the extension
const DEBOUNCE_MS = 300
const processingFiles = new Set<string>() // Prevent concurrent processing of the same file
const lastFileUpdateTime = new Map<string, number>() // Track when files were last processed
const FILE_UPDATE_COOLDOWN_MS = 3000 // Minimum time between processing the same file
let isInEventLoop = false // Global flag to detect event loops

async function getFileHash(uri: vscode.Uri): Promise<string> {
	try {
		const content = await vscode.workspace.fs.readFile(uri)
		return crypto.createHash("sha256").update(content).digest("hex")
	} catch {
		return ""
	}
}

// Debounce function to prevent rapid-fire events
function debounce<T extends (...args: any[]) => Promise<void>>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout | null = null
	return function (...args: Parameters<T>) {
		if (timeout) {
			clearTimeout(timeout)
		}
		timeout = setTimeout(() => {
			func(...args)
			timeout = null
		}, wait)
	}
}

/**
 * Set up a watcher for message JSON files specifically
 */
export async function setupDirectMessageWatcher(args: {
	context: vscode.ExtensionContext
	workspaceFolder: vscode.WorkspaceFolder
}) {
	try {
		console.log("Setting up direct message watcher...")

		// Create a watcher for JSON files in any 'messages' directory
		const messagePattern = new vscode.RelativePattern(args.workspaceFolder, "**/messages/*.json")
		const watcher = vscode.workspace.createFileSystemWatcher(messagePattern)

		console.log("Created message watcher for pattern: **/messages/*.json")

		// Create debounced handler for message file events
		const debouncedHandleMessageEvent = debounce(async (uri: vscode.Uri, eventType: string) => {
			const filePath = uri.fsPath

			// Skip if already processing
			if (processingFiles.has(filePath)) {
				console.log(`Already processing ${filePath}, skipping`)
				return
			}
			
			// Check cooldown period to prevent rapid-fire updates to the same file
			const now = Date.now()
			const lastUpdate = lastFileUpdateTime.get(filePath) || 0
			if (now - lastUpdate < FILE_UPDATE_COOLDOWN_MS) {
				console.log(`File ${filePath} was updated too recently, skipping (cooldown: ${FILE_UPDATE_COOLDOWN_MS}ms)`)
				return
			}
			
			// Check if we're in an event loop
			if (isInEventLoop) {
				console.log("Detected potential event loop, breaking the cycle")
				return
			}

			// Note if this file was self-modified, but always process it
			// We clear it from the tracking set but still remember this info
			const wasModifiedBySelf = selfModifiedFiles.has(filePath)
			if (wasModifiedBySelf) {
				console.log(`File was self-modified, but still processing: ${filePath}`)
				// Remove from tracking to prevent future issues
				selfModifiedFiles.delete(filePath)
			}

			// Track that we're processing this file
			processingFiles.add(filePath)

			try {
				// Check if the file content actually changed
				const newHash = await getFileHash(uri)
				const oldHash = fileHashes.get(filePath)

				// Skip only if content is identical AND not a delete event AND not previously self-modified
				// This ensures we always process user edits properly
				if (newHash === oldHash && eventType !== "Deleted" && !wasModifiedBySelf) {
					console.log(`Skipping unchanged ${eventType}: ${filePath}`)
					processingFiles.delete(filePath)
					return
				}

				// Update hash for non-deleted files
				if (eventType !== "Deleted") {
					fileHashes.set(filePath, newHash)
				} else {
					fileHashes.delete(filePath)
				}

				console.log(`Processing message file ${eventType} event: ${filePath}`)

				// Get the current project
				const currentProject = state().project
				if (!currentProject) {
					console.log("No current project found")
					processingFiles.delete(filePath)
					return
				}

				// Get current plugins and find message format plugin
				const currentPlugins = await currentProject.plugins.get()
				const messageFormatPlugin = currentPlugins.find((p) =>
					(p.key || p.id || "").toLowerCase().includes("messageformat")
				)

				if (!messageFormatPlugin) {
					console.log("No message format plugin found")
					processingFiles.delete(filePath)
					return
				}

				const pluginKey = messageFormatPlugin.id || messageFormatPlugin.key
				console.log(`Using message format plugin: ${pluginKey}`)

				// Extract locale from filename
				const locale = path.basename(filePath, ".json")
				console.log(`Extracted locale from filename: ${locale}`)

				if (eventType !== "Deleted") {
					// Read file content
					const content = await vscode.workspace.fs.readFile(uri)

					try {
						// Import the file
						await currentProject.importFiles({
							pluginKey,
							files: [
								{
									locale,
									content: new Uint8Array(content),
								},
							],
						})

						console.log(`Imported messages for locale: ${locale}`)

						// Mark as self-modified to prevent loops
						selfModifiedFiles.add(filePath)

						// Only update UI if this wasn't a self-triggered change or if the file has changed
						if (!wasModifiedBySelf) {
							console.log(`External change detected, updating UI for locale: ${locale}`)
							
							// Set the event loop flag to prevent cyclic updates
							isInEventLoop = true
							CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire()
							
							// Reset loop flag after a delay
							setTimeout(() => {
								isInEventLoop = false
							}, 1000);
						} else {
							console.log(`Self-triggered change, not updating UI for locale: ${locale}`)
						}
						
						// Record this update time
						lastFileUpdateTime.set(filePath, Date.now())

						// Save project
						await saveProject()
					} catch (error) {
						console.error(`Error importing message file:`, error)
						handleError(error)
					}
				} else {
					console.log(`File deleted: ${filePath} - skipping import but updating UI`)
					
					// Only update UI for genuine deletions
					if (!wasModifiedBySelf) {
						// Set the event loop flag to prevent cyclic updates
						isInEventLoop = true
						CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire()
						
						// Reset loop flag after a delay
						setTimeout(() => {
							isInEventLoop = false
						}, 1000);
					}
					
					// Record this update
					lastFileUpdateTime.set(filePath, Date.now())
				}
			} finally {
				// Always remove from processing list
				processingFiles.delete(filePath)
			}
		}, DEBOUNCE_MS)

		// Attach event handlers
		watcher.onDidChange(async (e) => debouncedHandleMessageEvent(e, "Changed"))
		watcher.onDidCreate(async (e) => debouncedHandleMessageEvent(e, "Created"))
		watcher.onDidDelete(async (e) => debouncedHandleMessageEvent(e, "Deleted"))

		// Track and register watcher
		args.context.subscriptions.push(watcher)

		console.log("Direct message watcher setup complete")
	} catch (error) {
		console.error("Error setting up direct message watcher:", error)
		handleError(error)
	}
}