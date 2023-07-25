import { randomUUID } from "node:crypto"
import { getSetting, updateSetting } from "./index.js"

/**
 * Returns the user ID. If it doesn't exist yet, it will be generated and persisted.
 * @returns {string} The user ID
 *
 * @example
 * const userId = await getUserId()
 * console.info(userId) // 123e4567-e89b-12d3-a456-426614174000
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
	return await getSetting("userId")
}

const persistId = async (id: string): Promise<void> => {
	await updateSetting("userId", id)
}
