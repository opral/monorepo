import { expect, test, vi } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { updateStateCacheV2 } from "./update-state-cache.js";
import { getTimestamp } from "../../engine/functions/timestamp.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import * as storedSchemaModule from "../../stored-schema/get-stored-schema.js";
import type { MaterializedState } from "../vtable/generate-commit.js";
import { schemaKeyToCacheTableNameV2 } from "./create-schema-cache-table.js";

const cacheTableName = (schemaKey: string, schemaVersion: string): string =>
	schemaKeyToCacheTableNameV2(schemaKey, schemaVersion);

function selectCacheRows(
	sqlite: any,
	schemaKey: string,
	schemaVersion: string,
	filters: { entityId?: string; versionId?: string } = {}
): any[] {
	const table = cacheTableName(schemaKey, schemaVersion);
	let sql = `SELECT * FROM ${table}`;
	const where: string[] = [];
	const bind: any[] = [];

	if (filters.entityId) {
		where.push("entity_id = ?");
		bind.push(filters.entityId);
	}
	if (filters.versionId) {
		where.push("version_id = ?");
		bind.push(filters.versionId);
	}

	if (where.length > 0) {
		sql += ` WHERE ${where.join(" AND ")}`;
	}

	return (
		sqlite.exec({
			sql,
			bind,
			returnValue: "resultRows",
			rowMode: "object",
		}) ?? []
	);
}

const exampleSchemaV1: LixSchemaDefinition = {
	$schema: "http://json-schema.org/draft-07/schema#",
	type: "object",
	"x-lix-key": "lix_example",
	"x-lix-version": "1.0",
	properties: {
		id: { type: "string" },
		value: { type: "string" },
	},
	required: ["id", "value"],
	additionalProperties: false,
};

const exampleSchemaV2: LixSchemaDefinition = {
	...exampleSchemaV1,
	"x-lix-version": "2.0",
};

const commitSchema: LixSchemaDefinition = {
	$schema: "http://json-schema.org/draft-07/schema#",
	type: "object",
	"x-lix-key": "lix_commit",
	"x-lix-version": "1.0",
	properties: {
		id: { type: "string" },
		change_set_id: { type: "string" },
		parent_commit_ids: { type: "array", items: { type: "string" } },
	},
	required: ["id", "change_set_id"],
	additionalProperties: false,
};

const commitEdgeSchema: LixSchemaDefinition = {
	$schema: "http://json-schema.org/draft-07/schema#",
	type: "object",
	"x-lix-key": "lix_commit_edge",
	"x-lix-version": "1.0",
	properties: {
		parent_id: { type: "string" },
		child_id: { type: "string" },
	},
	required: ["parent_id", "child_id"],
	additionalProperties: false,
};

const changeSetSchema: LixSchemaDefinition = {
	$schema: "http://json-schema.org/draft-07/schema#",
	type: "object",
	"x-lix-key": "lix_change_set",
	"x-lix-version": "1.0",
	properties: {
		id: { type: "string" },
		metadata: { type: ["object", "null"] },
	},
	required: ["id"],
	additionalProperties: false,
};

async function withMockedStoredSchemas<T>(
	schemas: Record<string, LixSchemaDefinition>,
	run: () => Promise<T>
): Promise<T> {
	const original = storedSchemaModule.getStoredSchema;
	const spy = vi
		.spyOn(storedSchemaModule, "getStoredSchema")
		.mockImplementation((args) => {
			const override = schemas[args.key];
			if (override) return override;
			return original(args);
		});
	try {
		return await run();
	} finally {
		spy.mockRestore();
	}
}

test("writes normalized columns for inserted entities", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	await withMockedStoredSchemas({ lix_example: exampleSchemaV1 }, async () => {
		const timestamp = await getTimestamp({ lix });
		const change: MaterializedState = {
			id: "change-1",
			entity_id: "entity-1",
			schema_key: "lix_example",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "test_plugin",
			snapshot_content: JSON.stringify({ id: "entity-1", value: "test-data" }),
			created_at: timestamp,
			lixcol_version_id: "global",
			lixcol_commit_id: "commit-1",
		};

		updateStateCacheV2({ engine: lix.engine!, changes: [change] });

		const rows = selectCacheRows(lix.engine!.sqlite, "lix_example", "1.0", {
			entityId: "entity-1",
			versionId: "global",
		});

		expect(rows).toHaveLength(1);
		const row = rows[0]!;
		expect(row).toMatchObject({
			entity_id: "entity-1",
			schema_key: "lix_example",
			file_id: "lix",
			version_id: "global",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			created_at: timestamp,
			updated_at: timestamp,
			inherited_from_version_id: null,
			is_tombstone: 0,
			change_id: "change-1",
			commit_id: "commit-1",
		});
		expect(row.x_id).toBe("entity-1");
		expect(row.x_value).toBe("test-data");
	});
});

test("upserts while preserving creation timestamp", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	await withMockedStoredSchemas(
		{
			lix_example: exampleSchemaV2,
		},
		async () => {
			const firstTimestamp = await getTimestamp({ lix });
			const firstChange: MaterializedState = {
				id: "change-initial",
				entity_id: "entity-upsert",
				schema_key: "lix_example",
				schema_version: "2.0",
				file_id: "lix",
				plugin_key: "test_plugin",
				snapshot_content: JSON.stringify({
					id: "entity-upsert",
					value: "initial",
				}),
				created_at: firstTimestamp,
				lixcol_version_id: "global",
				lixcol_commit_id: "commit-initial",
			};

			updateStateCacheV2({ engine: lix.engine!, changes: [firstChange] });

			const secondTimestamp = await getTimestamp({ lix });
			const secondChange: MaterializedState = {
				id: "change-updated",
				entity_id: "entity-upsert",
				schema_key: "lix_example",
				schema_version: "2.0",
				file_id: "lix",
				plugin_key: "test_plugin_updated",
				snapshot_content: JSON.stringify({
					id: "entity-upsert",
					value: "updated",
				}),
				created_at: secondTimestamp,
				lixcol_version_id: "global",
				lixcol_commit_id: "commit-updated",
			};

			updateStateCacheV2({ engine: lix.engine!, changes: [secondChange] });

			const rows = selectCacheRows(lix.engine!.sqlite, "lix_example", "2.0", {
				entityId: "entity-upsert",
				versionId: "global",
			});

			expect(rows).toHaveLength(1);
			const row = rows[0]!;
			expect(row.created_at).toBe(firstTimestamp);
			expect(row.updated_at).toBe(secondTimestamp);
			expect(row.schema_version).toBe("2.0");
			expect(row.commit_id).toBe("commit-updated");
			expect(row.x_value).toBe("updated");
		}
	);
});

test("creates tombstones with cleared property columns", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	await withMockedStoredSchemas({ lix_example: exampleSchemaV1 }, async () => {
		const timestamp = await getTimestamp({ lix });
		const createChange: MaterializedState = {
			id: "change-create",
			entity_id: "entity-tombstone",
			schema_key: "lix_example",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "test_plugin",
			snapshot_content: JSON.stringify({
				id: "entity-tombstone",
				value: "active",
			}),
			created_at: timestamp,
			lixcol_version_id: "branch",
			lixcol_commit_id: "commit-create",
		};

		updateStateCacheV2({ engine: lix.engine!, changes: [createChange] });

		const deleteChange: MaterializedState = {
			id: "change-delete",
			entity_id: "entity-tombstone",
			schema_key: "lix_example",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "test_plugin",
			snapshot_content: null,
			created_at: timestamp,
			lixcol_version_id: "branch",
			lixcol_commit_id: "commit-delete",
		};

		updateStateCacheV2({ engine: lix.engine!, changes: [deleteChange] });

		const rows = selectCacheRows(lix.engine!.sqlite, "lix_example", "1.0", {
			entityId: "entity-tombstone",
			versionId: "branch",
		});

		expect(rows).toHaveLength(1);
		const row = rows[0]!;
		expect(row.is_tombstone).toBe(1);
		expect(row.x_value).toBeNull();
	});
});

test("derives commit edges and change sets", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	await withMockedStoredSchemas(
		{
			lix_commit: commitSchema,
			lix_commit_edge: commitEdgeSchema,
			lix_change_set: changeSetSchema,
		},
		async () => {
			const timestamp = await getTimestamp({ lix });
			const change: MaterializedState = {
				id: "commit-change",
				entity_id: "commit-987",
				schema_key: "lix_commit",
				schema_version: "1.0",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					id: "commit-987",
					parent_commit_ids: ["parent-1", "parent-2"],
					change_set_id: "changeset-123",
				}),
				created_at: timestamp,
				lixcol_version_id: "global",
				lixcol_commit_id: "commit-987",
			};

			updateStateCacheV2({ engine: lix.engine!, changes: [change] });

			const edgeRows = selectCacheRows(
				lix.engine!.sqlite,
				"lix_commit_edge",
				"1.0",
				{
					versionId: "global",
				}
			);
			const relevantEdges = edgeRows.filter(
				(row) => row.x_child_id === "commit-987"
			);
			expect(relevantEdges).toHaveLength(2);

			const changeSetRows = selectCacheRows(
				lix.engine!.sqlite,
				"lix_change_set",
				"1.0",
				{ entityId: "changeset-123", versionId: "global" }
			);
			expect(changeSetRows).toHaveLength(1);
			expect(changeSetRows[0]!.entity_id).toBe("changeset-123");
			expect(changeSetRows[0]!.x_id).toBe("changeset-123");
		}
	);
});
