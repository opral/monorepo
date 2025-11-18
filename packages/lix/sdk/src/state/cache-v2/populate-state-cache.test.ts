import { expect, test } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { populateStateCacheV2 } from "./populate-state-cache.js";
import { getTimestamp } from "../../engine/functions/timestamp.js";
import { updateStateCache } from "../cache/update-state-cache.js";
import { LixStoredSchemaSchema } from "../../stored-schema/schema-definition.js";
import type { Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import { schemaKeyToCacheTableNameV2 } from "./create-schema-cache-table.js";

const cacheTable = (schemaKey: string, schemaVersion = "1.0"): string =>
	schemaKeyToCacheTableNameV2(schemaKey, schemaVersion);

function selectCacheRows(
	sqlite: any,
	schemaKey: string,
	schemaVersion = "1.0"
) {
	return (
		sqlite.exec({
			sql: `SELECT * FROM ${cacheTable(schemaKey, schemaVersion)}`,
			returnValue: "resultRows",
			rowMode: "object",
		}) ?? []
	);
}

async function registerStoredSchema(
	lix: Awaited<ReturnType<typeof openLix>>,
	schemaKey: string
): Promise<void> {
	const entityId = `${schemaKey}~1.0`;
	const timestamp = new Date().toISOString();

	await updateStateCache({
		engine: lix.engine!,
		changes: [
			{
				id: `delete-${entityId}`,
				entity_id: entityId,
				schema_key: LixStoredSchemaSchema["x-lix-key"],
				schema_version: LixStoredSchemaSchema["x-lix-version"],
				file_id: "lix",
				plugin_key: "lix_sdk",
				snapshot_content: null,
				created_at: timestamp,
			},
		],
		commit_id: `delete-${entityId}`,
		version_id: "global",
	});

	await updateStateCache({
		engine: lix.engine!,
		changes: [
			{
				id: `insert-${entityId}`,
				entity_id: entityId,
				schema_key: LixStoredSchemaSchema["x-lix-key"],
				schema_version: LixStoredSchemaSchema["x-lix-version"],
				file_id: "lix",
				plugin_key: "lix_sdk",
				snapshot_content: JSON.stringify({
					value: {
						$schema: "http://json-schema.org/draft-07/schema#",
						type: "object",
						"x-lix-key": schemaKey,
						"x-lix-version": "1.0",
						properties: {
							id: { type: "string" },
							value: { type: "string" },
						},
						required: [],
						additionalProperties: false,
					},
				}),
				created_at: timestamp,
			},
		],
		commit_id: `insert-${entityId}`,
		version_id: "global",
	});
}

test("populateStateCacheV2 materializes normalized rows for global version", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	await registerStoredSchema(lix, "lix_example");

	const timestamp = await getTimestamp({ lix });
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	await db
		.insertInto("state_by_version")
		.values({
			entity_id: "entity-1",
			schema_key: "lix_example",
			file_id: "lix",
			version_id: "global",
			plugin_key: "test_plugin",
			snapshot_content: JSON.stringify({
				id: "entity-1",
				value: "seed",
			}) as any,
			schema_version: "1.0",
			created_at: timestamp,
			updated_at: timestamp,
			change_id: "change-1",
			commit_id: "commit-1",
		})
		.execute();

	populateStateCacheV2({ engine: lix.engine! });

	const rows = selectCacheRows(lix.engine!.sqlite, "lix_example");
	expect(rows).toHaveLength(1);
	const row = rows[0]!;
	expect(row.version_id).toBe("global");
	expect(typeof row.commit_id).toBe("string");
	expect(row.x_value).toBe("seed");
});
