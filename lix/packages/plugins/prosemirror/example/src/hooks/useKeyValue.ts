import { useQuery } from "./useQuery";
import { lix } from "../state";

/**
 * A hook that provides persistent key-value storage using the Lix database.
 * The value is kept in sync across components using the same key.
 *
 * @example
 *   const [value, setValue] = useKeyValue("my-key");
 *   setValue("new-value");
 *
 * @param key - The unique key to store the value under
 * @returns A tuple of [value, setValue] similar to useState
 */
export function useKeyValue<T>(key: string) {
	// Use the query hook to keep the value in sync
	// using 75ms interval for non perceivable polling
	const [value, , , refetch] = useQuery(() => selectKeyValue(key), 75);

	// Function to update the value
	const setValue = async (newValue: T) => {
		await upsertKeyValue(key, newValue);
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
 * @returns The value associated with the key, or null if not found
 */
async function selectKeyValue(key: string) {
	// Try to find the key in the database
	const result = await lix.db
		.selectFrom("key_value")
		.where("key", "=", key)
		.select(["value"])
		.executeTakeFirst();

	// Return the value if found, otherwise null
	// need to figure out why json parsing is flaky
	return result
		? typeof result.value === "string"
			? JSON.parse(result.value)
			: result.value
		: null;
}

/**
 * Upserts a key-value pair into the Lix database.
 * If the key already exists, it will be updated.
 * Otherwise, a new key will be created.
 *
 * @param key - The unique key to store the value under
 * @param value - The value to store
 * @returns The stored value
 */
async function upsertKeyValue(key: string, value: any) {
	// Convert value to JSON string for storage
	const jsonValue = JSON.stringify(value);

	// Update existing key
	await lix.db
		.insertInto("key_value")
		.values({ key, value: jsonValue })
		.onConflict((oc) => oc.doUpdateSet({ value: jsonValue }))
		.execute();

	return value;
}
