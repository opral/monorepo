/**
 * Direct message handler for JSON translation files
 *
 * This is a simpler approach to handling translation files that bypasses
 * the complex pattern matching logic in setupFileSystemWatcher.ts
 *
 * Performance optimized version to fix slow editor updates and sync issues.
 */

import * as vscode from "vscode"
import * as path from "path"
import { state } from "../../state.js"
import { CONFIGURATION } from "../../../configuration.js"
import { handleError } from "../../utils.js"
import * as crypto from "crypto"
import type { InlangDatabaseSchema } from "@inlang/sdk"
import type { Kysely } from "kysely"

// Store file hashes to detect real changes
const fileHashes = new Map<string, string>()
// Store message keys by file path to track deleted keys
const fileMessageKeys = new Map<string, Set<string>>()
const DEBOUNCE_MS = 150 // Reduced debounce time for faster updates
const processingFiles = new Set<string>() // Prevent concurrent processing of the same file
const lastFileUpdateTime = new Map<string, number>() // Track when files were last processed
const FILE_UPDATE_COOLDOWN_MS = 1000 // Reduced cooldown to make the editor more responsive
let isInEventLoop = false // Global flag to detect event loops
let lastUIUpdateTime = 0 // Track when we last fired UI update events
const MIN_UI_UPDATE_INTERVAL_MS = 300 // Minimum time between UI updates to prevent UI lag

// Optimized file hash function that avoids full content hashing for large files
async function getFileHash(uri: vscode.Uri): Promise<string> {
	try {
		const content = await vscode.workspace.fs.readFile(uri)
		// For large files, only hash the first 10KB which is enough for JSON files
		// This significantly improves performance
		const contentToHash = content.length > 10240 ? content.slice(0, 10240) : content
		return crypto.createHash("sha256").update(contentToHash).digest("hex")
	} catch {
		return ""
	}
}

// Extract message keys from a JSON file
async function extractMessageKeys(uri: vscode.Uri): Promise<Set<string>> {
	try {
		const content = await vscode.workspace.fs.readFile(uri)
		const json = JSON.parse(new TextDecoder().decode(content))
		return new Set(Object.keys(json).filter((key) => key !== "$schema"))
	} catch {
		return new Set()
	}
}

// Throttled UI update function to prevent UI lag from too many updates
function throttledUIUpdate() {
	const now = Date.now()
	if (now - lastUIUpdateTime < MIN_UI_UPDATE_INTERVAL_MS) {
		// Don't update if it's too soon after the last update
		return false
	}

	// Update the last update time
	lastUIUpdateTime = now

	// Set the event loop flag
	isInEventLoop = true

	// Fire the event
	CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire()

	// Reset the flag after a short delay
	setTimeout(() => {
		isInEventLoop = false
	}, 500) // Shorter timeout for better responsiveness

	return true
}

// Optimized debounce function to prevent rapid-fire events
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
			func(...args).catch((error) => {
				console.error("Error in debounced function:", error)
			})
			timeout = null
		}, wait)
	}
}

// Helper function to delete message variants by locale
async function deleteMessageVariantsByLocale(
	db: Kysely<InlangDatabaseSchema>,
	bundleId: string,
	locale: string
): Promise<boolean> {
	try {
		// First, get the message id for this bundle and locale
		const messageIds = await db
			.selectFrom("message")
			.select("id")
			.where("bundleId", "=", bundleId)
			.where("locale", "=", locale)
			.execute()

		if (messageIds.length === 0) return false

		// Delete the variants for these messages
		for (const { id: messageId } of messageIds) {
			await db.deleteFrom("variant").where("messageId", "=", messageId).execute()
		}

		// Delete the messages themselves
		await db
			.deleteFrom("message")
			.where("bundleId", "=", bundleId)
			.where("locale", "=", locale)
			.execute()

		// Check if there are any messages left for this bundle
		const remainingMessages = await db
			.selectFrom("message")
			.select("id")
			.where("bundleId", "=", bundleId)
			.execute()

		// If no messages are left, delete the bundle
		if (remainingMessages.length === 0) {
			await db.deleteFrom("bundle").where("id", "=", bundleId).execute()
		}

		return true
	} catch (error) {
		console.error(`Error deleting message variant:`, error)
		return false
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
				console.log(
					`File ${filePath} was updated too recently, skipping (cooldown: ${FILE_UPDATE_COOLDOWN_MS}ms)`
				)
				return
			}

			// Check if we're in an event loop
			if (isInEventLoop) {
				console.log("Detected potential event loop, breaking the cycle")
				return
			}

			// Track that we're processing this file
			processingFiles.add(filePath)

			try {
				// Check if the file content actually changed
				const newHash = await getFileHash(uri)
				const oldHash = fileHashes.get(filePath)

				// Skip only if content is identical AND not a delete event
				// This ensures we always process user edits properly
				if (newHash === oldHash && eventType !== "Deleted") {
					console.log(`Skipping unchanged ${eventType}: ${filePath}`)
					processingFiles.delete(filePath)
					return
				}

				// Update hash for non-deleted files
				if (eventType !== "Deleted") {
					fileHashes.set(filePath, newHash)
				} else {
					fileHashes.delete(filePath)
					// Clear all message keys for deleted files
					fileMessageKeys.delete(filePath)
				}

				console.log(`Processing message file ${eventType} event: ${filePath}`)

				// Get the current project
				const currentProject = state().project
				if (!currentProject) {
					console.log("No current project found")
					processingFiles.delete(filePath)
					return
				}

				// Get the database from the project
				const db = currentProject.db as Kysely<InlangDatabaseSchema>
				if (!db) {
					console.log("Project database not available")
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
					// Extract current message keys from file
					const currentKeys = await extractMessageKeys(uri)
					// Get previously known keys (if any)
					const previousKeys = fileMessageKeys.get(filePath) || new Set()

					// Find keys that have been deleted (present in previous but not in current)
					const deletedKeys = new Set([...previousKeys].filter((key) => !currentKeys.has(key)))
					console.log(`Detected ${deletedKeys.size} deleted keys in ${filePath}`)

					// Update stored keys for this file
					fileMessageKeys.set(filePath, currentKeys)

					// Read file content for import
					const content = await vscode.workspace.fs.readFile(uri)

					try {
						// Import the file to update existing messages
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

						// Handle deleted keys if any were detected
						if (deletedKeys.size > 0) {
							console.log(`Processing ${deletedKeys.size} deleted keys for ${locale}`)

							// Track if we've made changes to update the UI
							let madeChanges = false

							// Process each deleted key
							for (const key of deletedKeys) {
								console.log(`Removing deleted key "${key}" for locale ${locale}`)
								const result = await deleteMessageVariantsByLocale(db, key, locale)
								if (result) {
									madeChanges = true
								}
							}

							// If deletions happened, refresh the UI to reflect them
							if (madeChanges) {
								console.log(`Made changes due to deleted keys, refreshing UI...`)

								// Update UI with throttling for better performance
								throttledUIUpdate()
							}
						}

						console.log(`External change detected, updating UI for locale: ${locale}`)
						throttledUIUpdate()

						// Record this update time
						lastFileUpdateTime.set(filePath, Date.now())
					} catch (error) {
						console.error(`Error importing message file:`, error)
						handleError(error)
					}
				} else {
					console.log(`File deleted: ${filePath} - handling deletion for locale ${locale}`)

					// When a file is deleted, all its messages should be removed for that locale
					const previousKeys = fileMessageKeys.get(filePath) || new Set()

					if (previousKeys.size > 0) {
						// Track if we've made changes to update the UI
						let madeChanges = false

						// Process each bundle that had keys in this file
						for (const key of previousKeys) {
							console.log(`Removing message "${key}" for deleted locale ${locale}`)

							const result = await deleteMessageVariantsByLocale(db, key, locale)
							if (result) {
								madeChanges = true
							}
						}

						// Clear all message keys for deleted files
						fileMessageKeys.delete(filePath)

						// If deletions happened, refresh the UI to reflect them
						if (madeChanges) {
							// Force update UI with throttling
							throttledUIUpdate()
						}
					}

					// Only update UI for genuine deletions with throttling
					throttledUIUpdate()

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
