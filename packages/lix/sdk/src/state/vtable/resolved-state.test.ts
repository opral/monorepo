import { expect, test } from "vitest";
import { buildResolvedStateQuery } from "./resolved-state.js";
import { internalQueryBuilder } from "../../engine/internal-query-builder.js";
import { openLix } from "../../lix/index.js";
import {
	LixKeyValueSchema,
	type LixKeyValue,
} from "../../key-value/schema-definition.js";
import { withWriterKey } from "../../state/writer.js";
import { insertTransactionState } from "../../state/transaction/insert-transaction-state.js";
import { getTimestamp } from "../../engine/functions/timestamp.js";
import { updateStateCache } from "../../state/cache/update-state-cache.js";


test("returns untracked entities", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
				lixcol_untracked: true,
			},
		],
	});

	// Insert an untracked entity directly into the internal state, matching the
	// legacy view fixture that the resolved builder needs to reproduce.
	lix.engine!.executeSync(
		internalQueryBuilder
			.insertInto("state_all")
			.values({
				schema_key: LixKeyValueSchema["x-lix-key"],
				entity_id: "mock_key",
				plugin_key: "lix_own_entity",
				file_id: "lix",
				version_id: "global",
				untracked: true,
				schema_version: LixKeyValueSchema["x-lix-version"],
				snapshot_content: {
					key: "mock_key",
					value: "mock_value",
				} satisfies LixKeyValue,
			})
			.compile()
	);

	const compiled = buildResolvedStateQuery()
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "mock_key")
		.where("version_id", "=", "global")
		.select(["snapshot_content", "untracked", "version_id"])
		.compile();

	const { rows } = lix.engine!.executeSync(compiled);

	expect(rows).toHaveLength(1);
	expect(rows[0]).toMatchObject({
		untracked: 1,
		version_id: "global",
		snapshot_content: JSON.stringify({
			key: "mock_key",
			value: "mock_value",
		}),
	});

	await lix.close();
});

test("returns tracked entities with change metadata", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
				lixcol_untracked: true,
			},
		],
	});

	// Insert a tracked entity into the canonical state table so the builder must
	// surface it with change metadata.
	lix.engine!.executeSync(
		internalQueryBuilder
			.insertInto("state_all")
			.values({
				schema_key: LixKeyValueSchema["x-lix-key"],
				entity_id: "tracked_key",
				plugin_key: "lix_own_entity",
				file_id: "lix",
				version_id: "global",
				untracked: false,
				schema_version: LixKeyValueSchema["x-lix-version"],
				snapshot_content: {
					key: "tracked_key",
					value: "tracked_value",
				} satisfies LixKeyValue,
			})
			.compile()
	);

	const compiled = buildResolvedStateQuery()
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "tracked_key")
		.where("version_id", "=", "global")
		.select(["snapshot_content", "untracked", "change_id", "commit_id"])
		.compile();

	const { rows } = lix.engine!.executeSync(compiled);

	expect(rows).toHaveLength(1);
	expect(rows[0]).toMatchObject({
		untracked: 0,
		snapshot_content: JSON.stringify({
			key: "tracked_key",
			value: "tracked_value",
		}),
	});
	expect(rows[0]?.change_id).toEqual(expect.any(String));
	expect(rows[0]?.commit_id).toEqual(expect.any(String));

	await lix.close();
});

test("resolves inherited rows from ancestor versions", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
				lixcol_untracked: true,
			},
		],
	});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirst();

	if (!activeVersion?.version_id) {
		throw new Error("active version not initialised");
	}

	// Persist a tracked row on the global version so the child inherits it.
	lix.engine!.executeSync(
		internalQueryBuilder
			.insertInto("state_all")
			.values({
				schema_key: LixKeyValueSchema["x-lix-key"],
				entity_id: "inherited_key",
				plugin_key: "lix_own_entity",
				file_id: "lix",
				version_id: "global",
				untracked: false,
				schema_version: LixKeyValueSchema["x-lix-version"],
				snapshot_content: {
					key: "inherited_key",
					value: "inherited_value",
				} satisfies LixKeyValue,
			})
			.compile()
	);

	const compiled = buildResolvedStateQuery()
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "inherited_key")
		.where("version_id", "=", activeVersion.version_id)
		.select(["snapshot_content", "inherited_from_version_id", "untracked"])
		.compile();

	const { rows } = lix.engine!.executeSync(compiled);

	expect(rows).toHaveLength(1);
	expect(rows[0]).toMatchObject({
		inherited_from_version_id: "global",
		untracked: 0,
		snapshot_content: JSON.stringify({
			key: "inherited_key",
			value: "inherited_value",
		}),
	});

	await lix.close();
});

test("resolves inherited untracked rows from ancestor versions", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
				lixcol_untracked: true,
			},
		],
	});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirst();

	if (!activeVersion?.version_id) {
		throw new Error("active version not initialised");
	}

	lix.engine!.executeSync(
		internalQueryBuilder
			.insertInto("state_all")
			.values({
				schema_key: LixKeyValueSchema["x-lix-key"],
				entity_id: "inherited_untracked_key",
				plugin_key: "lix_own_entity",
				file_id: "lix",
				version_id: "global",
				untracked: true,
				schema_version: LixKeyValueSchema["x-lix-version"],
				snapshot_content: {
					key: "inherited_untracked_key",
					value: "inherited_untracked_value",
				} satisfies LixKeyValue,
			})
			.compile()
	);

	const compiled = buildResolvedStateQuery()
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "inherited_untracked_key")
		.where("version_id", "=", activeVersion.version_id)
		.select(["snapshot_content", "inherited_from_version_id", "untracked"])
		.compile();

	const { rows } = lix.engine!.executeSync(compiled);

	expect(rows).toHaveLength(1);
	expect(rows[0]).toMatchObject({
		inherited_from_version_id: "global",
		untracked: 1,
		snapshot_content: JSON.stringify({
			key: "inherited_untracked_key",
			value: "inherited_untracked_value",
		}),
	});

	await lix.close();
});

test.skip("skips inherited rows when child overrides", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
				lixcol_untracked: true,
			},
		],
	});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirst();

	if (!activeVersion?.version_id) {
		throw new Error("active version not initialised");
	}

	// Parent version row
	lix.engine!.executeSync(
		internalQueryBuilder
			.insertInto("state_all")
			.values({
				schema_key: LixKeyValueSchema["x-lix-key"],
				entity_id: "override_key",
				plugin_key: "lix_own_entity",
				file_id: "lix",
				version_id: "global",
				untracked: false,
				schema_version: LixKeyValueSchema["x-lix-version"],
				snapshot_content: {
					key: "override_key",
					value: "parent_value",
				} satisfies LixKeyValue,
			})
			.compile()
	);

	// Child override row
	lix.engine!.executeSync(
		internalQueryBuilder
			.insertInto("state_all")
			.values({
				schema_key: LixKeyValueSchema["x-lix-key"],
				entity_id: "override_key",
				plugin_key: "lix_own_entity",
				file_id: "lix",
				version_id: activeVersion.version_id,
				untracked: false,
				schema_version: LixKeyValueSchema["x-lix-version"],
				snapshot_content: {
					key: "override_key",
					value: "child_value",
				} satisfies LixKeyValue,
			})
			.compile()
	);

	const compiled = buildResolvedStateQuery()
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "override_key")
		.where("version_id", "=", activeVersion.version_id)
		.select(["snapshot_content", "inherited_from_version_id", "untracked"])
		.compile();

	const { rows } = lix.engine!.executeSync(compiled);

	expect(rows).toHaveLength(1);
	expect(rows[0]).toMatchObject({
		inherited_from_version_id: null,
		untracked: 0,
		snapshot_content: JSON.stringify({
			key: "override_key",
			value: "child_value",
		}),
	});

	await lix.close();
});

test("includes change metadata for inherited and live rows", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
				lixcol_untracked: true,
			},
		],
	});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirst();

	if (!activeVersion?.version_id) {
		throw new Error("active version not initialised");
	}

	// Parent tracked row
	lix.engine!.executeSync(
		internalQueryBuilder
			.insertInto("state_all")
			.values({
				schema_key: LixKeyValueSchema["x-lix-key"],
				entity_id: "metadata_key",
				plugin_key: "lix_own_entity",
				file_id: "lix",
				version_id: "global",
				untracked: false,
				schema_version: LixKeyValueSchema["x-lix-version"],
				snapshot_content: {
					key: "metadata_key",
					value: "tracked_parent",
				} satisfies LixKeyValue,
			})
			.compile()
	);

	const baseCompiled = buildResolvedStateQuery()
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "metadata_key")
		.where("version_id", "=", "global")
		.select([
			"snapshot_content",
			"change_id",
			"commit_id",
			"untracked",
			"inherited_from_version_id",
		])
		.compile();

	const { rows: baseRows } = lix.engine!.executeSync(baseCompiled);

	expect(baseRows).toHaveLength(1);
	const baseRow = baseRows[0]!;
	expect(baseRow).toMatchObject({
		inherited_from_version_id: null,
		untracked: 0,
	});
	const baseSnapshot = JSON.parse(String(baseRow.snapshot_content));
	expect(baseSnapshot).toMatchObject({
		key: "metadata_key",
		value: "tracked_parent",
	});
	expect(baseRow.change_id).toEqual(expect.any(String));
	expect(baseRow.commit_id).toEqual(expect.any(String));

	const inheritedCompiled = buildResolvedStateQuery()
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "metadata_key")
		.where("version_id", "=", activeVersion.version_id)
		.select([
			"snapshot_content",
			"change_id",
			"commit_id",
			"untracked",
			"inherited_from_version_id",
		])
		.compile();

	const { rows: inheritedRows } = lix.engine!.executeSync(inheritedCompiled);

	expect(inheritedRows).toHaveLength(1);
	const inheritedRow = inheritedRows[0]!;
	const inheritedSnapshot = JSON.parse(String(inheritedRow.snapshot_content));

	expect(inheritedRow).toMatchObject({
		inherited_from_version_id: "global",
		untracked: 0,
	});
	expect(inheritedRow.change_id).toBe(baseRow.change_id);
	expect(inheritedRow.commit_id).toBe(baseRow.commit_id);
	expect(inheritedSnapshot).toMatchObject({
		key: "metadata_key",
		value: "tracked_parent",
	});

	await lix.close();
});

test("exposes writer key", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
				lixcol_untracked: true,
			},
		],
	});

	const writerKey = "test_writer";

	await withWriterKey(lix.db, writerKey, async (trx) => {
		await trx
			.insertInto("key_value_all")
			.values({
				key: "writer_example",
				value: "tracked",
				lixcol_version_id: "global",
			})
			.execute();
	});

	const compiled = buildResolvedStateQuery()
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "writer_example")
		.where("version_id", "=", "global")
		.select(["writer_key", "untracked"])
		.compile();

	const { rows } = lix.engine!.executeSync(compiled);

	expect(rows).toHaveLength(1);
	expect(rows[0]).toMatchObject({
		writer_key: writerKey,
		untracked: 0,
	});

	await lix.close();
});

test("exposes rows flagged as tombstones", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
				lixcol_untracked: true,
			},
		],
	});

	const engine = lix.engine!;

	engine.executeSync(
		internalQueryBuilder
			.insertInto("state_all")
			.values({
				schema_key: LixKeyValueSchema["x-lix-key"],
				entity_id: "tombstone_key",
				plugin_key: "lix_own_entity",
				file_id: "lix",
				version_id: "global",
				untracked: false,
				schema_version: LixKeyValueSchema["x-lix-version"],
				snapshot_content: {
					key: "tombstone_key",
					value: "live",
				} satisfies LixKeyValue,
			})
			.compile()
	);

	engine.executeSync(
		internalQueryBuilder
			.deleteFrom("state_all")
			.where("entity_id", "=", "tombstone_key")
			.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
			.where("version_id", "=", "global")
			.compile()
	);

	const compiled = buildResolvedStateQuery()
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "tombstone_key")
		.where("version_id", "=", "global")
		.select(["snapshot_content", "change_id"])
		.compile();

	const { rows } = engine.executeSync(compiled);

	expect(rows).toHaveLength(1);
	expect(rows[0]).toMatchObject({
		snapshot_content: null,
		change_id: expect.any(String),
	});

	await lix.close();
});

test("includes open transaction rows before commit", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
				lixcol_untracked: true,
			},
		],
	});

	await insertTransactionState({
		engine: lix.engine!,
		timestamp: await getTimestamp({ lix }),
		data: [
			{
				entity_id: "txn_key",
				schema_key: LixKeyValueSchema["x-lix-key"],
				file_id: "lix",
				plugin_key: "lix_own_entity",
				version_id: "global",
				schema_version: LixKeyValueSchema["x-lix-version"],
				snapshot_content: JSON.stringify({
					key: "txn_key",
					value: "txn_value",
				}),
				untracked: false,
			},
		],
	});

	const compiled = buildResolvedStateQuery()
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "txn_key")
		.where("version_id", "=", "global")
		.select(["writer_key", "untracked", "change_id", "commit_id"])
		.compile();

	const { rows } = lix.engine!.executeSync(compiled);

	expect(rows).toHaveLength(1);
	expect(rows[0]).toMatchObject({
		untracked: 0,
		commit_id: "pending",
	});
	expect(rows[0]?.change_id).toEqual(expect.any(String));

	await lix.close();
});

test("returns empty results when schema cache is missing", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
				lixcol_untracked: true,
			},
		],
	});

	const compiled = buildResolvedStateQuery()
		.where("schema_key", "=", "mock_schema_without_cache")
		.selectAll()
		.compile();

	const { rows } = lix.engine!.executeSync(compiled);

	expect(rows).toHaveLength(0);

	await lix.close();
});

test("unions cache tables when multiple schema keys are routed", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
				lixcol_untracked: true,
			},
		],
	});

	updateStateCache({
		engine: lix.engine!,
		changes: [
			{
				id: "cache-change-a",
				entity_id: "cache-entity-a",
				schema_key: "cache_schema_a",
				schema_version: "1.0",
				file_id: "file_a",
				plugin_key: "test_plugin",
				snapshot_content: JSON.stringify({ value: "a" }),
				created_at: "1970-01-01T00:00:00.000Z",
			},
			{
				id: "cache-change-b",
				entity_id: "cache-entity-b",
				schema_key: "cache_schema_b",
				schema_version: "1.0",
				file_id: "file_b",
				plugin_key: "test_plugin",
				snapshot_content: JSON.stringify({ value: "b" }),
				created_at: "1970-01-01T00:00:00.000Z",
			},
		],
		commit_id: "test-commit",
		version_id: "global",
	});

	const compiled = buildResolvedStateQuery({
		cacheRouting: { schemaKeys: ["cache_schema_a", "cache_schema_b"] },
	})
		.select(["entity_id", "schema_key"])
		.compile();

	const { rows } = lix.engine!.executeSync(compiled);

	const entitySet = new Set(rows.map((row) => row.entity_id));
	expect(entitySet.has("cache-entity-a")).toBe(true);
	expect(entitySet.has("cache-entity-b")).toBe(true);

	await lix.close();
});
