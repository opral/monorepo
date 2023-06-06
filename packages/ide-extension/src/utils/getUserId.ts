import * as vscode from "vscode"

/**
 * Returns the user ID. If it doesn't exist yet, it will be generated and persisted.
 * @returns {string} The user ID
 *
 * @example
 * const userId = await getUserId()
 * console.log(userId) // id-123456
 */
export async function getUserId() {
	const persistedId = await getPersistedId()

	if (!persistedId) {
		// Generate a new ID
		const newId = generateUniqueId()

		// Persist the new ID
		await persistId(newId)

		return newId
	}

	// ID already exists, use it
	return persistedId
}

const generateUniqueId = (): string => {
	return "id-" + Math.random().toString(36).slice(6)
}

const getPersistedId = async (): Promise<string | undefined> => {
	return await vscode.workspace.getConfiguration("inlang").get("userId")
}

const persistId = async (id: string) => {
	await vscode.workspace
		.getConfiguration("inlang")
		.update("userId", id, vscode.ConfigurationTarget.Global)
}
