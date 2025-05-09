import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixInternalDatabaseSchema } from "./schema.js";
import { sql, type Kysely } from "kysely";
import { executeSync } from "./execute-sync.js";
import { ChangeSetSchema } from "../change-set-v2/schema.js";

const schemaMap = {
	change_set: { entityIdPropertyName: "id", value: ChangeSetSchema },
} as const;

export function getAndCacheRow(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixInternalDatabaseSchema>,
	...args: any[]
): any {
	if (args.length < 2 || args.length % 2 !== 1) {
		throw new Error("Expected: table, key1, value1, [key2, value2, ...]");
	}

	const name = args[0] as string;
	const keyPairs = args.slice(1);
	const schema = schemaMap[name as keyof typeof schemaMap];

	// Build key-value object
	const whereObj: Record<string, any> = {};
	for (let i = 0; i < keyPairs.length; i += 2) {
		whereObj[keyPairs[i]] = keyPairs[i + 1];
	}

	// 1. Try cache lookup
	// let cacheQuery = db.selectFrom(tableName).selectAll();
	// for (const [key, value] of Object.entries(whereObj)) {
	// 	cacheQuery = cacheQuery.where(key as any, "=", value);
	// }
	// const cacheResult = executeSync({
	// 	lix: { sqlite },
	// 	query: cacheQuery,
	// });

	// if (cacheResult.length > 0) {
	// 	return cacheResult[0];
	// }

	// // 2. Cache miss: Compute the value (example for 'version_materialized')
	let computedResult: any = null;

	const selectExpressions = createSelectExpressionsForSchema(
		schema.value,
		schema.entityIdPropertyName
	);

	// RankedSnapshots logic
	let rankedQuery = db
		.with("ranked_snapshots", (db) =>
			db
				.selectFrom("change as ch")
				.innerJoin("snapshot as s", "ch.snapshot_id", "s.id")
				.select(selectExpressions)
				.where("ch.schema_key", "=", `lix_${name}`)
		)
		.selectFrom("ranked_snapshots")
		.where("rn", "=", 1)
		.where("is_deleted", "=", 0)
		.selectAll();

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

	return computedResult ? JSON.stringify(computedResult) : null;
}

/**
 * Generate Kysely select expressions for each property in a JSON schema.
 * @param schema - The JSON schema object with a `properties` field.
 * @param entityIdPropertyName - The property name that should select from `ch.entity_id`.
 * @returns Array of Kysely select expressions for use in .select([...])
 */
function createSelectExpressionsForSchema(
	schema: Record<string, any>, // Using Record<string, any> as requested
	entityIdPropertyName: string
): any[] {
	const selectExpressions: any[] = [];

	// Add common fields first
	selectExpressions.push(
		sql`s.content IS NULL`.as("is_deleted"),
		sql`ROW_NUMBER() OVER (PARTITION BY ch.entity_id ORDER BY ch.created_at DESC, ch.id DESC)`.as(
			"rn"
		)
	);

	// Iterate over properties defined in the schema
	for (const propertyName in schema.properties) {
		if (propertyName === entityIdPropertyName) {
			// If the property name matches the alias for ch.entity_id, select ch.entity_id directly
			selectExpressions.push(sql`ch.entity_id`.as(propertyName));
		} else {
			// Otherwise, assume the property is within snapshot.content (JSON)
			selectExpressions.push(
				sql`json_extract(s.content, ${sql.raw(`'$.${propertyName}'`)})`.as(
					propertyName
				)
			);
		}
	}

	return selectExpressions;
}
