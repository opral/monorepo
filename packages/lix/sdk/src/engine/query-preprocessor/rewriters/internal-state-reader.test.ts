import { expect, test } from "vitest";
import { internalQueryBuilder } from "../../internal-query-builder.js";
import { openLix } from "../../../lix/index.js";
import {
	LixKeyValueSchema,
	type LixKeyValue,
} from "../../../key-value/schema-definition.js";
import { withWriterKey } from "../../../state/writer.js";
import { insertTransactionState } from "../../../state/transaction/insert-transaction-state.js";
import { getTimestamp } from "../../../engine/functions/timestamp.js";
import { rewriteInternalStateReader } from "./internal-state-reader.js";
import { SqliteQueryCompiler } from "kysely";

const sqliteCompiler = new SqliteQueryCompiler();

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

	// insert untracked key value
	// TODO replace with internal_state_writer view later
	lix.engine!.executeQuerySync(
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

	const original = internalQueryBuilder
		.selectFrom("internal_state_reader")
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "mock_key")
		.where("version_id", "=", "global")
		.select(["snapshot_content", "untracked", "version_id"])
		.compile();

	const rewritten = rewriteInternalStateReader(original.query);
	const compiled = sqliteCompiler.compileQuery(rewritten, original.queryId);

	const { rows: result } = lix.engine!.executeQuerySync(compiled);

	expect(result).toHaveLength(1);
	expect(result[0]).toMatchObject({
		untracked: 1,
		version_id: "global",
		snapshot_content: JSON.stringify({
			key: "mock_key",
			value: "mock_value",
		}),
	});
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

	lix.engine!.executeQuerySync(
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

	const original = internalQueryBuilder
		.selectFrom("internal_state_reader")
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "tracked_key")
		.where("version_id", "=", "global")
		.select(["snapshot_content", "untracked", "change_id", "commit_id"])
		.compile();

	const rewritten = rewriteInternalStateReader(original.query);
	const compiled = sqliteCompiler.compileQuery(rewritten, original.queryId);

	const { rows: result } = lix.engine!.executeQuerySync(compiled);

	expect(result).toHaveLength(1);
	expect(result[0]).toMatchObject({
		untracked: 0,
		change_id: expect.any(String),
		commit_id: expect.any(String),
		snapshot_content: JSON.stringify({
			key: "tracked_key",
			value: "tracked_value",
		}),
	});

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

	lix.engine!.executeQuerySync(
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
				},
			})
			.compile()
	);

	const original = internalQueryBuilder
		.selectFrom("internal_state_reader")
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "inherited_key")
		.where("version_id", "=", activeVersion!.version_id)
		.select(["snapshot_content", "inherited_from_version_id", "untracked"])
		.compile();

	const rewritten = rewriteInternalStateReader(original.query);
	const compiled = sqliteCompiler.compileQuery(rewritten, original.queryId);

	const { rows: result } = lix.engine!.executeQuerySync(compiled);

	expect(result).toHaveLength(1);
	expect(result[0]).toMatchObject({
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

	lix.engine!.executeQuerySync(
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

	const original = internalQueryBuilder
		.selectFrom("internal_state_reader")
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "inherited_untracked_key")
		.where("version_id", "=", activeVersion!.version_id)
		.select(["snapshot_content", "inherited_from_version_id", "untracked"])
		.compile();

	const rewritten = rewriteInternalStateReader(original.query);
	const compiled = sqliteCompiler.compileQuery(rewritten, original.queryId);

	const { rows: result } = lix.engine!.executeQuerySync(compiled);

	expect(result).toHaveLength(1);
	expect(result[0]).toMatchObject({
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

	// parent version row
	lix.engine!.executeQuerySync(
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
				},
			})
			.compile()
	);

	// child override
	lix.engine!.executeQuerySync(
		internalQueryBuilder
			.insertInto("state_all")
			.values({
				schema_key: LixKeyValueSchema["x-lix-key"],
				entity_id: "override_key",
				plugin_key: "lix_own_entity",
				file_id: "lix",
				version_id: activeVersion!.version_id,
				untracked: false,
				schema_version: LixKeyValueSchema["x-lix-version"],
				snapshot_content: {
					key: "override_key",
					value: "child_value",
				},
			})
			.compile()
	);

	const original = internalQueryBuilder
		.selectFrom("internal_state_reader")
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "override_key")
		.where("version_id", "=", activeVersion!.version_id)
		.select(["snapshot_content", "inherited_from_version_id", "untracked"])
		.compile();

	const rewritten = rewriteInternalStateReader(original.query);
	const compiled = sqliteCompiler.compileQuery(rewritten, original.queryId);

	const { rows: result } = lix.engine!.executeQuerySync(compiled);

	expect(result).toHaveLength(1);
	expect(result[0]).toMatchObject({
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

	lix.engine!.executeQuerySync(
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
				},
			})
			.compile()
	);

	const baseQuery = internalQueryBuilder
		.selectFrom("internal_state_reader")
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

	const rewrittenBase = rewriteInternalStateReader(baseQuery.query);
	const compiledBase = sqliteCompiler.compileQuery(
		rewrittenBase,
		baseQuery.queryId
	);
	const { rows: baseRows } = lix.engine!.executeQuerySync(compiledBase);

	expect(baseRows).toHaveLength(1);
	const parentRow = baseRows[0]!;
	const parentSnapshot = JSON.parse(parentRow.snapshot_content as string);

	expect(parentRow).toMatchObject({
		inherited_from_version_id: null,
		untracked: 0,
	});
	expect(parentSnapshot).toMatchObject({
		key: "metadata_key",
		value: "tracked_parent",
	});
	expect(parentRow.change_id).toEqual(expect.any(String));
	expect(parentRow.commit_id).toEqual(expect.any(String));

	const inheritedQuery = internalQueryBuilder
		.selectFrom("internal_state_reader")
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "metadata_key")
		.where("version_id", "=", activeVersion!.version_id)
		.select([
			"snapshot_content",
			"change_id",
			"commit_id",
			"untracked",
			"inherited_from_version_id",
		])
		.compile();

	const rewrittenInherited = rewriteInternalStateReader(inheritedQuery.query);
	const compiledInherited = sqliteCompiler.compileQuery(
		rewrittenInherited,
		inheritedQuery.queryId
	);
	const { rows: inheritedRows } =
		lix.engine!.executeQuerySync(compiledInherited);

	expect(inheritedRows).toHaveLength(1);
	const inheritedRow = inheritedRows[0]!;
	const inheritedSnapshot = JSON.parse(inheritedRow.snapshot_content as string);

	expect(inheritedRow).toMatchObject({
		inherited_from_version_id: "global",
		untracked: 0,
	});
	expect(inheritedRow.change_id).toBe(parentRow.change_id);
	expect(inheritedRow.commit_id).toBe(parentRow.commit_id);
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

	const original = internalQueryBuilder
		.selectFrom("internal_state_reader")
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "writer_example")
		.where("version_id", "=", "global")
		.select(["writer_key", "untracked"])
		.compile();

	const rewritten = rewriteInternalStateReader(original.query);
	const compiled = sqliteCompiler.compileQuery(rewritten, original.queryId);

	const { rows } = lix.engine!.executeQuerySync(compiled);

	expect(rows).toHaveLength(1);
	expect(rows[0]).toMatchObject({
		writer_key: writerKey,
		untracked: 0,
	});

	await lix.close();
});

test("exposes rows flagged as tombstones for consumers to filter", async () => {
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

	// Insert a live row
	engine.executeQuerySync(
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
				},
			})
			.compile()
	);

	engine.executeQuerySync(
		internalQueryBuilder
			.deleteFrom("state_all")
			.where("entity_id", "=", "tombstone_key")
			.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
			.where("version_id", "=", "global")
			.compile()
	);

	const original = internalQueryBuilder
		.selectFrom("internal_state_reader")
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "tombstone_key")
		.where("version_id", "=", "global")
		.select(["snapshot_content", "change_id"])
		.compile();

	const rewritten = rewriteInternalStateReader(original.query);
	const compiled = sqliteCompiler.compileQuery(rewritten, original.queryId);

	const { rows } = engine.executeQuerySync(compiled);

	expect(rows).toHaveLength(1);
	expect(rows[0]).toMatchObject({
		change_id: expect.any(String),
		snapshot_content: null,
	});

	const change = await lix.db
		.selectFrom("change")
		.where("id", "=", rows[0].change_id)
		.select(["snapshot_content"])
		.executeTakeFirst();

	expect(change?.snapshot_content).toBeNull();

	await lix.close();
});

test("includes open transaction rows before commit with writer metadata", async () => {
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

	insertTransactionState({
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

	const original = internalQueryBuilder
		.selectFrom("internal_state_reader")
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "txn_key")
		.where("version_id", "=", "global")
		.select(["writer_key", "untracked", "change_id", "commit_id"])
		.compile();

	const rewritten = rewriteInternalStateReader(original.query);
	const compiled = sqliteCompiler.compileQuery(rewritten, original.queryId);

	const { rows } = lix.engine!.executeQuerySync(compiled);

	expect(rows).toHaveLength(1);
	expect(rows[0]).toMatchObject({
		untracked: 0,
		commit_id: "pending",
	});
	expect(rows[0]?.change_id).toEqual(expect.any(String));

	await lix.close();
});

test("prunes cache query if cache table for schema doesn't exist yet", async () => {
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

	const original = internalQueryBuilder
		.selectFrom("internal_state_reader")
		.where("schema_key", "=", "mock_schema_without_cache")
		.selectAll()
		.compile();

	const rewritten = rewriteInternalStateReader(original.query);
	const compiled = sqliteCompiler.compileQuery(rewritten, original.queryId);

	const { rows } = lix.engine!.executeQuerySync(compiled);

	expect(rows).toHaveLength(0);
});
