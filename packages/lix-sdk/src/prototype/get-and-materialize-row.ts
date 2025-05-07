import { sql, type Kysely } from "kysely";
import type { InternalDatabaseSchema } from "./database-schema.js";
import { executeSync } from "../database/execute-sync.js";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";

export function getAndMaterializeRow(
	sqlite: SqliteWasmDatabase,
	db: Kysely<InternalDatabaseSchema>,
	...args: any[]
): any {
	if (args.length < 2 || args.length % 2 !== 1) {
		throw new Error("Expected: table, key1, value1, [key2, value2, ...]");
	}

	const table = args[0] as string;
	const keyPairs = args.slice(1);

	// Build key-value object
	const whereObj: Record<string, any> = {};
	for (let i = 0; i < keyPairs.length; i += 2) {
		whereObj[keyPairs[i]] = keyPairs[i + 1];
	}

	// 1. Try cache lookup
	// @ts-expect-error - dynamic table name
	let cacheQuery = db.selectFrom(table).selectAll();
	for (const [key, value] of Object.entries(whereObj)) {
		cacheQuery = cacheQuery.where(key as any, "=", value);
	}
	const cacheResult = executeSync({
		lix: { sqlite },
		query: cacheQuery,
	});

	if (cacheResult.length > 0) {
		return cacheResult[0];
	}

	// 2. Cache miss: Compute the value (example for 'version_materialized')
	let computedResult: any = null;
	if (table === "version_materialized") {
		// RankedSnapshots logic
		let rankedQuery = db
			.with("ranked_snapshots", (db) =>
				db
					.selectFrom("change as ch")
					.innerJoin("snapshot as s", "ch.snapshot_id", "s.id")
					.select([
						"ch.entity_id as name",
						sql`json_extract(s.content, '$.change_set_id')`.as("change_set_id"),
						sql`json_extract(s.content, '$.id')`.as("id"),
						sql`s.content IS NULL`.as("is_deleted"),
						sql`ROW_NUMBER() OVER (PARTITION BY ch.entity_id ORDER BY ch.created_at DESC, ch.id DESC)`.as(
							"rn"
						),
					])
					.where("ch.schema_key", "=", "lix_version_table")
			)
			.selectFrom("ranked_snapshots")
			.selectAll()
			.where("rn", "=", 1)
			.where("is_deleted", "=", 0);

		for (const [key, value] of Object.entries(whereObj)) {
			rankedQuery = rankedQuery.where(key as any, "=", value);
		}

		const rankedResult = executeSync({
			lix: { sqlite },
			query: rankedQuery,
		});

		if (rankedResult.length > 0) {
			computedResult = rankedResult[0];
			// Insert into materialized table for caching
			const insertData: Record<string, any> = {};
			for (const key of Object.keys(whereObj)) {
				insertData[key] = computedResult[key];
			}
			insertData["change_set_id"] = computedResult["change_set_id"];
			insertData["id"] = computedResult["id"];

			// executeSync({
			// 	lix: { sqlite },
			// 	query: db.insertInto("version_materialized").values({
			// 		change_set_id: computedResult["change_set_id"],
			// 		name: "wtf",
			// 		id: computedResult["id"],
			// 	}),
			// });
		}
	}

	return computedResult ? JSON.stringify(computedResult) : null;
}
