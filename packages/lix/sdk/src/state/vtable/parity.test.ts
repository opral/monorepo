import { expect, test } from "vitest";
import { sql, type Kysely } from "kysely";
import { openLix } from "../../lix/open-lix.js";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import { updateStateCache } from "../cache/update-state-cache.js";
import { updateStateCacheV2 } from "../cache-v2/update-state-cache.js";
import { selectFromStateCache } from "../cache/select-from-state-cache.js";
import { selectFromStateCacheV2 } from "../cache-v2/select-from-state-cache.js";
import type { MaterializedState } from "./generate-commit.js";

const TEST_SCHEMA: LixSchemaDefinition = {
	"$schema": "http://json-schema.org/draft-07/schema#",
	type: "object",
	additionalProperties: false,
	properties: {
		id: { type: "string" },
		example: { type: "string" },
		flag: { type: "boolean" },
		count: { type: "integer" },
		payload: { type: "object" },
	},
	"x-lix-key": "test_cache_snapshot",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
} as const;

const DEFAULT_TIMESTAMP = "2024-01-01T00:00:00.000Z";
const VERSION_ID = "version-main";
const COMMIT_ID = "commit-main";

test("cache v1 and v2 selections return identical rows", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
			},
		],
	});

	await registerStoredSchema(lix, TEST_SCHEMA);

	const changes: MaterializedState[] = [
		{
			id: "change-add-1",
			entity_id: "entity-1",
			schema_key: TEST_SCHEMA["x-lix-key"],
			schema_version: TEST_SCHEMA["x-lix-version"],
			file_id: "file-a",
			plugin_key: "plugin-a",
			snapshot_content: JSON.stringify({
				id: "entity-1",
				example: "hello",
				flag: true,
				count: 42,
				payload: { nested: "value" },
			}),
			created_at: DEFAULT_TIMESTAMP,
			lixcol_version_id: VERSION_ID,
			lixcol_commit_id: COMMIT_ID,
			writer_key: null,
		},
		{
			id: "change-add-2",
			entity_id: "entity-2",
			schema_key: TEST_SCHEMA["x-lix-key"],
			schema_version: TEST_SCHEMA["x-lix-version"],
			file_id: "file-b",
			plugin_key: "plugin-b",
			snapshot_content: JSON.stringify({
				id: "entity-2",
				example: "world",
				flag: false,
				count: 7,
				payload: { items: [1, 2, 3] },
			}),
			created_at: DEFAULT_TIMESTAMP,
			lixcol_version_id: VERSION_ID,
			lixcol_commit_id: COMMIT_ID,
			writer_key: null,
		},
		{
			id: "change-delete-1",
			entity_id: "entity-3",
			schema_key: TEST_SCHEMA["x-lix-key"],
			schema_version: TEST_SCHEMA["x-lix-version"],
			file_id: "file-c",
			plugin_key: "plugin-c",
			snapshot_content: null,
			created_at: DEFAULT_TIMESTAMP,
			lixcol_version_id: VERSION_ID,
			lixcol_commit_id: COMMIT_ID,
			writer_key: null,
		},
	];

	updateStateCache({
		engine: lix.engine!,
		changes,
	});

	updateStateCacheV2({
		engine: lix.engine!,
		changes,
	});

	const rowsV1 = await selectCacheV1Rows(
		lix,
		TEST_SCHEMA["x-lix-key"]
	);
	const rowsV2 = await selectCacheV2Rows(
		lix,
		TEST_SCHEMA["x-lix-key"],
		TEST_SCHEMA["x-lix-version"]
	);

	expect(sortRows(rowsV2)).toEqual(sortRows(rowsV1));
});

async function registerStoredSchema(
	lix: Awaited<ReturnType<typeof openLix>>,
	schema: LixSchemaDefinition
): Promise<void> {
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
	const id = `${schema["x-lix-key"]}~${schema["x-lix-version"]}`;
	await db
		.deleteFrom("stored_schema")
		.where("lixcol_entity_id", "=", id)
		.execute();
	await db.insertInto("stored_schema").values({ value: schema }).execute();
}

async function selectCacheV1Rows(
	lix: Awaited<ReturnType<typeof openLix>>,
	schemaKey: string
): Promise<any[]> {
	const compiled = selectFromStateCache(schemaKey)
		.select([
			"entity_id",
			"schema_key",
			"file_id",
			"version_id",
			"plugin_key",
			"schema_version",
			"created_at",
			"updated_at",
			"inherited_from_version_id",
			"inheritance_delete_marker",
			"change_id",
			"commit_id",
			sql`json(snapshot_content)`.as("snapshot_content"),
		])
		.compile();
	const result = lix.engine!.executeSync({
		sql: compiled.sql,
		parameters: compiled.parameters,
	});
	return result.rows as any[];
}

async function selectCacheV2Rows(
	lix: Awaited<ReturnType<typeof openLix>>,
	schemaKey: string,
	schemaVersion: string
): Promise<any[]> {
	const compiled = selectFromStateCacheV2(schemaKey, schemaVersion)
		.selectAll()
		.compile();
	const result = lix.engine!.executeSync({
		sql: compiled.sql,
		parameters: compiled.parameters,
	});
	return result.rows as any[];
}

function byEntityId(a: any, b: any): number {
	return String(a.entity_id).localeCompare(String(b.entity_id));
}

function sortRows(rows: any[]): any[] {
	return [...rows].sort(byEntityId);
}
