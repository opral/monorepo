import { bench } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { getTimestamp } from "../../engine/functions/timestamp.js";
import type { LixChangeRaw } from "../../change/schema-definition.js";
import { updateStateCacheV2 } from "./update-state-cache.js";
import { LixStoredSchemaSchema } from "../../stored-schema/schema-definition.js";
import { schemaKeyToCacheTableNameV2 } from "./create-schema-cache-table.js";

const ROW_NUM = 1000;
const BENCH_SCHEMA_KEY = "bench_cache_v2";
const BENCH_SCHEMA_VERSION = "1.0";
const BENCH_PLUGIN_KEY = "bench_plugin";

const benchSchemaDefinition = {
	$schema: "http://json-schema.org/draft-07/schema#",
	type: "object",
	additionalProperties: false,
	properties: {
		id: { type: "string" },
		value: { type: "string" },
		data_index: { type: "integer" },
		nested: { type: "object" },
		tag: { type: "string" },
	},
	required: ["id", "value", "data_index", "tag"],
	"x-lix-key": BENCH_SCHEMA_KEY,
	"x-lix-version": BENCH_SCHEMA_VERSION,
	"x-lix-primary-key": ["/id"],
} as const;

async function registerBenchSchema(lix: Awaited<ReturnType<typeof openLix>>) {
	const timestamp = await getTimestamp({ lix });
	updateStateCacheV2({
		engine: adaptEngine(lix),
		changes: [
			{
				id: `schema-${BENCH_SCHEMA_KEY}`,
				entity_id: `${BENCH_SCHEMA_KEY}~${BENCH_SCHEMA_VERSION}`,
				schema_key: LixStoredSchemaSchema["x-lix-key"],
				schema_version: LixStoredSchemaSchema["x-lix-version"],
				file_id: "lix",
				plugin_key: "lix_sdk",
				snapshot_content: JSON.stringify({ value: benchSchemaDefinition }),
				created_at: timestamp,
			},
		],
		commit_id: "bench-schema",
		version_id: "global",
	});
}

function adaptEngine(lix: Awaited<ReturnType<typeof openLix>>) {
	const engine = lix.engine!;
	return {
		executeSync: engine.executeSync,
		runtimeCacheRef: engine.runtimeCacheRef,
		hooks: engine.hooks,
		sqlite: engine.sqlite,
	};
}

function buildChange(
	index: number,
	timestamp: string,
	overrides?: Partial<LixChangeRaw>
): LixChangeRaw {
	return {
		id: `change-${index}`,
		entity_id: `entity-${index}`,
		schema_key: BENCH_SCHEMA_KEY,
		schema_version: BENCH_SCHEMA_VERSION,
		file_id: "lix",
		plugin_key: BENCH_PLUGIN_KEY,
		snapshot_content: JSON.stringify({
			id: `entity-${index}`,
			value: `test-value-${index}`,
			data_index: index,
			nested: {
				field1: `field1-${index}`,
				field2: index * 2,
				field3: index % 2 === 0,
			},
			tag: `tag-${index % 10}`,
		}),
		created_at: timestamp,
		...overrides,
	};
}

function buildDeleteChange(index: number, timestamp: string): LixChangeRaw {
	return {
		id: `delete-${index}`,
		entity_id: `entity-${index}`,
		schema_key: BENCH_SCHEMA_KEY,
		schema_version: BENCH_SCHEMA_VERSION,
		file_id: "lix",
		plugin_key: BENCH_PLUGIN_KEY,
		snapshot_content: null,
		created_at: timestamp,
	};
}

async function seedCache(
	lix: Awaited<ReturnType<typeof openLix>>,
	rowCount: number,
	timestamp: string
) {
	const changes = Array.from({ length: rowCount }, (_, i) =>
		buildChange(i, timestamp)
	);
	updateStateCacheV2({
		engine: adaptEngine(lix),
		changes,
		commit_id: "bench-seed",
		version_id: "global",
	});
}

function clearTable(lix: Awaited<ReturnType<typeof openLix>>) {
	const tableName = schemaKeyToCacheTableNameV2(
		BENCH_SCHEMA_KEY,
		BENCH_SCHEMA_VERSION
	);
	lix.engine!.sqlite.exec({ sql: `DELETE FROM ${tableName}` });
}

bench(`insert ${ROW_NUM} rows into cache`, async () => {
	const lix = await openLix({});
	await registerBenchSchema(lix);
	clearTable(lix);
	const timestamp = await getTimestamp({ lix });
	await seedCache(lix, ROW_NUM, timestamp);
});

bench("query with json_extract from cache", async () => {
	const lix = await openLix({});
	await registerBenchSchema(lix);
	clearTable(lix);
	const timestamp = await getTimestamp({ lix });
	await seedCache(lix, ROW_NUM, timestamp);

	const tableName = schemaKeyToCacheTableNameV2(
		BENCH_SCHEMA_KEY,
		BENCH_SCHEMA_VERSION
	);
	lix.engine!.sqlite.exec({
		sql: `SELECT value, data_index, json_extract(nested, '$.field3') AS field3
			FROM ${tableName}
			WHERE json_extract(nested, '$.field3') = 1`,
		returnValue: "resultRows",
	});
});

bench("query through resolved_state_by_version view", async () => {
	const lix = await openLix({});
	await registerBenchSchema(lix);
	clearTable(lix);
	const timestamp = await getTimestamp({ lix });
	await seedCache(lix, ROW_NUM, timestamp);

	lix.engine!.sqlite.exec({
		sql: `SELECT entity_id, schema_key, json_extract(snapshot_content, '$.value') AS value
			FROM lix_internal_state_vtable
			WHERE schema_key = ? AND version_id = 'global'
			AND json_extract(snapshot_content, '$.nested.field3') = 1`,
		bind: [BENCH_SCHEMA_KEY],
		returnValue: "resultRows",
	});
});

bench("complex OR query (tag filter)", async () => {
	const lix = await openLix({});
	await registerBenchSchema(lix);
	clearTable(lix);
	const timestamp = await getTimestamp({ lix });
	await seedCache(lix, ROW_NUM, timestamp);

	const tableName = schemaKeyToCacheTableNameV2(
		BENCH_SCHEMA_KEY,
		BENCH_SCHEMA_VERSION
	);
	lix.engine!.sqlite.exec({
		sql: `SELECT entity_id FROM ${tableName}
			WHERE tag = 'tag-1' OR tag = 'tag-2'
			AND is_tombstone = 0`,
		returnValue: "resultRows",
	});
});

bench("update 100 rows in cache", async () => {
	const lix = await openLix({});
	await registerBenchSchema(lix);
	clearTable(lix);
	const timestamp = await getTimestamp({ lix });
	await seedCache(lix, ROW_NUM, timestamp);

	const updates = Array.from({ length: 100 }, (_, idx) =>
		buildChange(idx, timestamp, {
			snapshot_content: JSON.stringify({
				id: `entity-${idx}`,
				value: `updated-value-${idx}`,
				data_index: idx + 1000,
				nested: {
					field1: `updated-${idx}`,
					field2: (idx + 1000) * 2,
					field3: idx % 2 !== 0,
				},
				tag: `tag-${idx % 10}`,
			}),
		})
	);

	updateStateCacheV2({
		engine: adaptEngine(lix),
		changes: updates,
		commit_id: "bench-update",
		version_id: "global",
	});
});

bench("delete 100 rows from cache", async () => {
	const lix = await openLix({});
	await registerBenchSchema(lix);
	clearTable(lix);
	const timestamp = await getTimestamp({ lix });
	await seedCache(lix, ROW_NUM, timestamp);

	const deletes = Array.from({ length: 100 }, (_, idx) =>
		buildDeleteChange(idx, timestamp)
	);

	updateStateCacheV2({
		engine: adaptEngine(lix),
		changes: deletes,
		commit_id: "bench-delete",
		version_id: "global",
	});
});
