import { expect, test } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { updateStateCacheV2 } from "./update-state-cache.js";
import {
	createSchemaCacheTableV2,
	schemaKeyToCacheTableNameV2,
} from "./create-schema-cache-table.js";
import { getStateCacheV2Tables } from "./schema.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import { CACHE_COLUMNS } from "./cache-columns.js";

const sanitize = (schemaKey: string): string =>
	schemaKey.replace(/[^a-zA-Z0-9]/g, "_");

const cacheTable = (schemaKey: string, schemaVersion = "1.0"): string =>
	schemaKeyToCacheTableNameV2(schemaKey, schemaVersion);

type PragmaRow = { name: string; type: string };

function pragmaColumns(sqlite: any, tableName: string): PragmaRow[] {
	return (sqlite.exec({
		sql: `PRAGMA table_info(${tableName})`,
		returnValue: "resultRows",
		rowMode: "object",
	}) ?? []) as PragmaRow[];
}

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
	schema: LixSchemaDefinition
): Promise<void> {
	const id = `${schema["x-lix-key"]}~${schema["x-lix-version"]}`;
	await lix.db
		.deleteFrom("stored_schema")
		.where("lixcol_entity_id", "=", id)
		.execute();

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();
}

test("normalized cache tables are registered per schema", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	const schema: LixSchemaDefinition = {
		$schema: "http://json-schema.org/draft-07/schema#",
		type: "object",
		additionalProperties: false,
		properties: {
			id: { type: "string" },
			value: { type: "string" },
		},
		"x-lix-key": "schema_meta",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
	};

	await registerStoredSchema(lix, schema);

	createSchemaCacheTableV2({
		engine: lix.engine!,
		schema,
		tableName: cacheTable("schema_meta", schema["x-lix-version"] ?? "1.0"),
	});

	updateStateCacheV2({
		engine: lix.engine!,
		changes: [
			{
				id: "change1",
				entity_id: "entity1",
				schema_key: "schema_meta",
				schema_version: "1.0",
				file_id: "file1",
				plugin_key: "plugin1",
				snapshot_content: JSON.stringify({ value: "a1" }),
				created_at: "2024-01-01T00:00:00Z",
			},
		],
		commit_id: "commit1",
		version_id: "version-1",
	});

	const tables = getStateCacheV2Tables({ engine: lix.engine! });
	const expectedTable = cacheTable(
		"schema_meta",
		schema["x-lix-version"] ?? "1.0"
	);

	expect(tables.has(expectedTable)).toBe(true);

	const columnInfo = pragmaColumns(lix.engine!.sqlite, expectedTable);
	const columnNames = new Set(columnInfo.map((row) => row.name));
	for (const core of CACHE_COLUMNS) {
		expect(columnNames.has(core)).toBe(true);
	}
	expect(columnNames.has("x_id")).toBe(true);
	expect(columnNames.has("x_value")).toBe(true);

	const rows = selectCacheRows(
		lix.engine!.sqlite,
		"schema_meta",
		schema["x-lix-version"] ?? "1.0"
	);
	expect(rows).toHaveLength(1);
	const row = rows[0]!;
	expect(row).toMatchObject({
		entity_id: "entity1",
		schema_key: "schema_meta",
		file_id: "file1",
		version_id: "version-1",
		plugin_key: "plugin1",
		schema_version: "1.0",
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z",
		is_tombstone: 0,
		change_id: "change1",
		commit_id: "commit1",
	});
	expect(row.x_id).toBeNull();
	expect(row.x_value).toBe("a1");
});

test("string properties create TEXT columns", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	const schema: LixSchemaDefinition = {
		$schema: "http://json-schema.org/draft-07/schema#",
		type: "object",
		additionalProperties: false,
		properties: {
			name: { type: "string" },
		},
		"x-lix-key": "schema_string",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/name"],
	};

	await registerStoredSchema(lix, schema);

	createSchemaCacheTableV2({
		engine: lix.engine!,
		schema,
		tableName: cacheTable("schema_string", schema["x-lix-version"] ?? "1.0"),
	});

	const columnInfo = pragmaColumns(
		lix.engine!.sqlite,
		cacheTable("schema_string", schema["x-lix-version"] ?? "1.0")
	);
	const nameColumn = columnInfo.find((row) => row.name === "x_name");
	expect(nameColumn?.type).toBe("TEXT");
});

test("integer properties create INTEGER columns", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	const schema: LixSchemaDefinition = {
		$schema: "http://json-schema.org/draft-07/schema#",
		type: "object",
		additionalProperties: false,
		properties: {
			count: { type: "integer" },
		},
		"x-lix-key": "schema_integer",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/count"],
	};

	await registerStoredSchema(lix, schema);

	createSchemaCacheTableV2({
		engine: lix.engine!,
		schema,
		tableName: cacheTable("schema_integer", schema["x-lix-version"] ?? "1.0"),
	});

	const columnInfo = pragmaColumns(
		lix.engine!.sqlite,
		cacheTable("schema_integer", schema["x-lix-version"] ?? "1.0")
	);
	const column = columnInfo.find((row) => row.name === "x_count");
	expect(column?.type).toBe("INTEGER");
});

test("number properties create REAL columns", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	const schema: LixSchemaDefinition = {
		$schema: "http://json-schema.org/draft-07/schema#",
		type: "object",
		additionalProperties: false,
		properties: {
			price: { type: "number" },
		},
		"x-lix-key": "schema_number",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/price"],
	};

	await registerStoredSchema(lix, schema);

	createSchemaCacheTableV2({
		engine: lix.engine!,
		schema,
		tableName: cacheTable("schema_number", schema["x-lix-version"] ?? "1.0"),
	});

	const columnInfo = pragmaColumns(
		lix.engine!.sqlite,
		cacheTable("schema_number", schema["x-lix-version"] ?? "1.0")
	);
	const column = columnInfo.find((row) => row.name === "x_price");
	expect(column?.type).toBe("REAL");
});

test("boolean properties create INTEGER columns", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	const schema: LixSchemaDefinition = {
		$schema: "http://json-schema.org/draft-07/schema#",
		type: "object",
		additionalProperties: false,
		properties: {
			isActive: { type: "boolean" },
		},
		"x-lix-key": "schema_boolean",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/isActive"],
	};

	await registerStoredSchema(lix, schema);

	createSchemaCacheTableV2({
		engine: lix.engine!,
		schema,
		tableName: cacheTable("schema_boolean", schema["x-lix-version"] ?? "1.0"),
	});

	const columnInfo = pragmaColumns(
		lix.engine!.sqlite,
		cacheTable("schema_boolean", schema["x-lix-version"] ?? "1.0")
	);
	const column = columnInfo.find((row) => row.name === "x_isActive");
	expect(column?.type).toBe("INTEGER");
});

test("object properties create TEXT columns and store JSON", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	const schema: LixSchemaDefinition = {
		$schema: "http://json-schema.org/draft-07/schema#",
		type: "object",
		additionalProperties: false,
		properties: {
			metadata: { type: "object" },
		},
		"x-lix-key": "schema_object",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/metadata"],
	};

	await registerStoredSchema(lix, schema);

	createSchemaCacheTableV2({
		engine: lix.engine!,
		schema,
		tableName: cacheTable("schema_object", schema["x-lix-version"] ?? "1.0"),
	});

	const columnInfo = pragmaColumns(
		lix.engine!.sqlite,
		cacheTable("schema_object", schema["x-lix-version"] ?? "1.0")
	);
	const column = columnInfo.find((row) => row.name === "x_metadata");
	expect(column?.type).toBe("TEXT");

	updateStateCacheV2({
		engine: lix.engine!,
		changes: [
			{
				id: "change-json",
				entity_id: "entity-json",
				schema_key: "schema_object",
				schema_version: "1.0",
				file_id: "file-json",
				plugin_key: "plugin-json",
				snapshot_content: JSON.stringify({ metadata: { nested: true } }),
				created_at: "2024-01-01T00:00:00Z",
			},
		],
		commit_id: "commit-json",
		version_id: "version-json",
	});

	const rows = selectCacheRows(
		lix.engine!.sqlite,
		"schema_object",
		schema["x-lix-version"] ?? "1.0"
	);
	expect(rows).toHaveLength(1);
	const stored = rows[0]!;
	expect(stored.x_metadata).toBe(JSON.stringify({ nested: true }));
	expect(JSON.parse(stored.x_metadata as string)).toEqual({ nested: true });
});
