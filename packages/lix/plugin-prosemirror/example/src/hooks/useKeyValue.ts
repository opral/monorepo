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
export function useKeyValue<T>(
	key: string,
	options: { versionId?: string; untracked?: boolean } = {},
) {
	const lix = useLix();
	const result = useQueryTakeFirst(({ lix }) => selectKeyValue(lix, key));

	const setValue = async (newValue: T) => {
		await upsertKeyValue(lix, key, newValue, options);
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
async function upsertKeyValue(
	lix: Lix,
	key: string,
	value: any,
	options: { versionId?: string; untracked?: boolean } = {},
) {
	// Use a transaction to ensure atomicity and handle race conditions
	return await lix.db.transaction().execute(async (trx) => {
		const existing = await trx
			.selectFrom("key_value_by_version")
			.where("key", "=", key)
			.where(
				"lixcol_version_id",
				"=",
				options.versionId ??
					trx.selectFrom("active_version").select("version_id"),
			)
			.select(["key"])
			.executeTakeFirst();

		if (existing) {
			await trx
				.updateTable("key_value_by_version")
				.set({
					value,
					lixcol_untracked: options.untracked,
				})
				.where(
					"lixcol_version_id",
					"=",
					options.versionId ??
						trx.selectFrom("active_version").select("version_id"),
				)
				.where("key", "=", key)
				.execute();
		} else {
			await trx
				.insertInto("key_value_by_version")
				.values({
					key,
					value,
					lixcol_untracked: options.untracked,
					lixcol_version_id:
						options.versionId ??
						trx.selectFrom("active_version").select("version_id"),
				})
				.execute();
		}

		return value;
	});
}
