import { randomUUID } from "node:crypto"
import * as vscode from "vscode"

/**
 * Returns the user ID. If it doesn't exist yet, it will be generated and persisted.
 * @returns {string} The user ID
 *
 * @example
 * const userId = await getUserId()
 * console.log(userId) // 123e4567-e89b-12d3-a456-426614174000
 */
export async function getUserId() {
	const persistedId = await getPersistedId()

	if (!persistedId) {
		// Generate a new ID
		const newId = randomUUID()

		// Persist the new ID
		await persistId(newId)

		return newId
	}

	// ID already exists, use it
	return persistedId
}

const getPersistedId = async (): Promise<string | undefined> => {
	return await vscode.workspace.getConfiguration("inlang").get("userId")
}

const persistId = async (id: string) => {
	await vscode.workspace
		.getConfiguration("inlang")
		.update("userId", id, vscode.ConfigurationTarget.Global)
}
