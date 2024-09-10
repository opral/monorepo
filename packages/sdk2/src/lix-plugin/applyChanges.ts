import { getLeafChange, type Change, type LixPlugin } from "@lix-js/sdk";
import { contentFromDatabase, loadDatabaseInMemory } from "sqlite-wasm-kysely";
import { initDb } from "../database/initDb.js";

export const applyChanges: NonNullable<LixPlugin["applyChanges"]> = async ({
	lix,
	file,
	changes,
}) => {
	if (file.path?.endsWith("db.sqlite") === false) {
		throw new Error(
			"Unimplemented. Only the db.sqlite file can be handled for now."
		);
	}

	// todo make transactional

	const sqlite = await loadDatabaseInMemory(file.data);
	const db = initDb({ sqlite });

	const leafChanges = new Set(
		await Promise.all(
			changes.map(async (change) => {
				const leafChange = await getLeafChange({ change, lix });
				// enable string comparison and avoid duplicates
				return JSON.stringify(leafChange);
			})
		)
	);

	for (const unparsedLeafChange of leafChanges) {
		const leafChange: Change = JSON.parse(unparsedLeafChange);

		// deletion
		if (leafChange.value === undefined) {
			await db
				.deleteFrom(leafChange.type as "bundle" | "message" | "variant")
				.where("id", "=", leafChange.meta?.id)
				.execute();
			continue;
		}

		// upsert the value
		const value = leafChange.value as any;
		await db
			.insertInto(leafChange.type as "bundle" | "message" | "variant")
			.values(value)
			.onConflict((c) => c.column("id").doUpdateSet(value))
			.execute();
	}
	return { fileData: contentFromDatabase(sqlite) };
};
