import { useLix, useQueryTakeFirst } from "@lix-js/react-utils";
import { Lix } from "@lix-js/sdk";

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
	const lix = useLix();
	const result = useQueryTakeFirst((lix) => selectKeyValue(lix, key));

	const setValue = async (newValue: T) => {
		await upsertKeyValue(lix, key, newValue);
	};

	return [result?.value, setValue] as const;
}

function selectKeyValue(lix: Lix, key: string) {
	return lix.db
		.selectFrom("key_value")
		.where("key", "=", key)
		.select(["value"]);
}

/**
 * Upserts a key-value pair into the Lix database.
 */
export async function upsertKeyValue(
	lix: Lix,
	key: string,
	value: any,
	options?: { global?: boolean }
) {
	// Use a transaction to ensure atomicity and handle race conditions
	return await lix.db.transaction().execute(async (trx) => {
		const existing = await trx
			.selectFrom("key_value")
			.where("key", "=", key)
			.select(["key"])
			.executeTakeFirst();

		if (existing) {
			await trx
				.updateTable("key_value_all")
				.set({
					value,
					// skip change control as this is only UI state that
					// should be persisted but not controlled
					// skip_change_control: true,
				})
				.where(
					"lixcol_version_id",
					"=",
					options?.global
						? "global"
						: lix.db.selectFrom("active_version").select("version_id")
				)
				.where("key", "=", key)
				.execute();
		} else {
			await trx
				.insertInto("key_value_all")
				.values({
					key,
					value,
					lixcol_version_id: options?.global
						? "global"
						: lix.db.selectFrom("active_version").select("version_id"),
				})
				.execute();
		}

		return value;
	});
}
