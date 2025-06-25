import { useQuery } from "./useQuery";

/**
 * A hook that provides persistent key-value storage using the Lix database.
 * The value is kept in sync across components using the same key.
 * 
 * Note: This requires a lix instance to be available in scope.
 * You'll need to adapt this based on how lix is accessed in your app.
 *
 * @example
 *   const [value, setValue] = useKeyValue("my-key", lix);
 *   setValue("new-value");
 *
 * @param key - The unique key to store the value under
 * @param lix - The lix instance to use for database operations
 * @returns A tuple of [value, setValue] similar to useState
 */
export function useKeyValue<T>(key: string, lix: any) {
	// Use the query hook to keep the value in sync
	// using 75ms interval for non perceivable polling
	const [value, , , refetch] = useQuery(() => selectKeyValue(key, lix), 75);

	// Function to update the value
	const setValue = async (newValue: T) => {
		await upsertKeyValue(key, newValue, lix);
		refetch();
	};

	// Return the current value and the setter function
	return [value, setValue] as const;
}

/**
 * Retrieves the value associated with a key from the Lix database.
 * If the key does not exist, returns null.
 *
 * @param key - The unique key to retrieve the value for
 * @param lix - The lix instance to use for database operations
 * @returns The value associated with the key, or null if not found
 */
async function selectKeyValue(key: string, lix: any) {
	// Try to find the key in the database
	const result = await lix.db
		.selectFrom("key_value")
		.where("key", "=", key)
		.select(["value"])
		.executeTakeFirst();

	// Return the value if found, otherwise null
	// need to figure out why json parsing is flaky
	return result?.value;
}

/**
 * Upserts a key-value pair into the Lix database.
 * If the key already exists, it will be updated.
 * Otherwise, a new key will be created.
 *
 * @param key - The unique key to store the value under
 * @param value - The value to store
 * @param lix - The lix instance to use for database operations
 * @returns The stored value
 */
async function upsertKeyValue(key: string, value: any, lix: any) {
	// Use a transaction to ensure atomicity and handle race conditions
	return await lix.db.transaction().execute(async (trx: any) => {
		const existing = await trx
			.selectFrom("key_value")
			.where("key", "=", key)
			.select(["key"])
			.executeTakeFirst();

		if (existing) {
			await trx
				.updateTable("key_value")
				.set({
					value,
					// skip change control as this is only UI state that
					// should be persisted but not controlled
					// skip_change_control: true,
				})
				.where("key", "=", key)
				.execute();
		} else {
			await trx
				.insertInto("key_value")
				.values({
					key,
					value,
				})
				.execute();
		}

		return value;
	});
}