import { afterEach, expect, test, vi } from "vitest";
import { internalQueryBuilder } from "../internal-query-builder.js";
import { openLix } from "../../lix/index.js";
import {
	LixKeyValueSchema,
	type LixKeyValue,
} from "../../key-value/schema-definition.js";
import { withWriterKey } from "../../state/writer.js";
import { insertTransactionState } from "../../state/transaction/insert-transaction-state.js";
import { getTimestamp } from "../functions/timestamp.js";
import { updateStateCache } from "../../state/cache/update-state-cache.js";
import { createInternalStateVtablePreprocessor } from "./internal-state-vtable.js";
import * as populateStateCacheModule from "../../state/cache/populate-state-cache.js";
import {
	markStateCacheAsFresh,
	markStateCacheAsStale,
} from "../../state/cache/mark-state-cache-as-stale.js";

afterEach(() => {
	vi.restoreAllMocks();
});

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

	const preprocess = await createInternalStateVtablePreprocessor({
		engine: lix.engine!,
	});

	// insert untracked key value
	// TODO replace with internal_state_writer view later
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

	const original = internalQueryBuilder
		.selectFrom("internal_state_vtable")
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "mock_key")
		.where("version_id", "=", "global")
		.select(["snapshot_content", "untracked", "version_id"])
		.compile();

	const rewritten = preprocess(original);

	const { rows: result } = lix.engine!.executeSync(rewritten);
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
	const preprocess = await createInternalStateVtablePreprocessor({
		engine: lix.engine!,
	});

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

	const original = internalQueryBuilder
		.selectFrom("internal_state_vtable")
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "tracked_key")
		.where("version_id", "=", "global")
		.select(["snapshot_content", "untracked", "change_id", "commit_id"])
		.compile();

	const rewritten = preprocess(original);
	const { rows: result } = lix.engine!.executeSync(rewritten);

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

test("populates cache when stale and skips when fresh", async () => {
	const populateSpy = vi.spyOn(populateStateCacheModule, "populateStateCache");

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

	const preprocess = await createInternalStateVtablePreprocessor({
		engine: lix.engine!,
	});

	// ensure cache is marked fresh so the first run proves we populate when skipped
	markStateCacheAsFresh({ engine: lix.engine! });

	const original = internalQueryBuilder
		.selectFrom("internal_state_vtable")
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.selectAll()
		.compile();

	// First call with fresh cache should not repopulate
	populateSpy.mockClear();
	preprocess(original);
	expect(populateSpy).not.toHaveBeenCalled();

	// Mark stale and ensure populate is called
	markStateCacheAsStale({ engine: lix.engine! });
	populateSpy.mockClear();
	preprocess(original);
	expect(populateSpy).toHaveBeenCalled();

	await lix.close();
	populateSpy.mockRestore();
});

test("populate marks cache fresh to avoid subsequent repopulates", async () => {
	const populateSpy = vi.spyOn(populateStateCacheModule, "populateStateCache");

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

	const preprocess = await createInternalStateVtablePreprocessor({
		engine: lix.engine!,
	});

	const original = internalQueryBuilder
		.selectFrom("internal_state_vtable")
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.selectAll()
		.compile();

	// Force stale, first call should repopulate and mark fresh.
	markStateCacheAsStale({ engine: lix.engine! });
	populateSpy.mockClear();
	preprocess(original);
	expect(populateSpy).toHaveBeenCalledTimes(1);

	// Second call with fresh cache should not repopulate.
	populateSpy.mockClear();
	preprocess(original);
	expect(populateSpy).not.toHaveBeenCalled();

	populateSpy.mockRestore();
	await lix.close();
});

test("rewritten reader queries avoid scanning internal_state_vtable", async () => {
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

	try {
		const preprocess = await createInternalStateVtablePreprocessor({
			engine: lix.engine!,
		});

		const original = internalQueryBuilder
			.selectFrom("internal_state_vtable")
			.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
			.selectAll()
			.compile();

		const rewritten = preprocess(original);

		const plan = lix.engine!.sqlite.exec({
			sql: `EXPLAIN QUERY PLAN ${rewritten.sql}`,
			returnValue: "resultRows",
			rowMode: "object",
			columnNames: [],
		}) as Array<Record<string, unknown>>;

		const details = plan.map((row) => String(row.detail ?? ""));

		expect(
			details.some((detail) => /internal_state_vtable/i.test(detail))
		).toBe(false);
		expect(
			details.some((detail) => /internal_transaction_state/i.test(detail))
		).toBe(true);
	} finally {
		await lix.close();
}
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

	const preprocess = await createInternalStateVtablePreprocessor({
		engine: lix.engine!,
	});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirst();

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
				},
			})
			.compile()
	);

	const original = internalQueryBuilder
		.selectFrom("internal_state_vtable")
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "inherited_key")
		.where("version_id", "=", activeVersion!.version_id)
		.select(["snapshot_content", "inherited_from_version_id", "untracked"])
		.compile();

	const rewritten = preprocess(original);

	const { rows: result } = lix.engine!.executeSync(rewritten);

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

	const preprocess = await createInternalStateVtablePreprocessor({
		engine: lix.engine!,
	});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirst();

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

	const original = internalQueryBuilder
		.selectFrom("internal_state_vtable")
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "inherited_untracked_key")
		.where("version_id", "=", activeVersion!.version_id)
		.select(["snapshot_content", "inherited_from_version_id", "untracked"])
		.compile();

	const rewritten = preprocess(original);

	const { rows: result } = lix.engine!.executeSync(rewritten);

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
	const preprocess = await createInternalStateVtablePreprocessor({
		engine: lix.engine!,
	});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirst();

	// parent version row
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
				},
			})
			.compile()
	);

	// child override
	lix.engine!.executeSync(
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
		.selectFrom("internal_state_vtable")
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "override_key")
		.where("version_id", "=", activeVersion!.version_id)
		.select(["snapshot_content", "inherited_from_version_id", "untracked"])
		.compile();

	const rewritten = preprocess(original);

	const { rows: result } = lix.engine!.executeSync(rewritten);

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

	const preprocess = await createInternalStateVtablePreprocessor({
		engine: lix.engine!,
	});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirst();

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
				},
			})
			.compile()
	);

	const baseQuery = internalQueryBuilder
		.selectFrom("internal_state_vtable")
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

	const rewrittenBase = preprocess(baseQuery);
	const { rows: baseRows } = lix.engine!.executeSync(rewrittenBase);

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
		.selectFrom("internal_state_vtable")
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

	const rewrittenInherited = preprocess(inheritedQuery);
	const { rows: inheritedRows } = lix.engine!.executeSync(rewrittenInherited);

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

	const preprocess = await createInternalStateVtablePreprocessor({
		engine: lix.engine!,
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
		.selectFrom("internal_state_vtable")
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "writer_example")
		.where("version_id", "=", "global")
		.select(["writer_key", "untracked"])
		.compile();

	const rewritten = preprocess(original);

	const { rows } = lix.engine!.executeSync(rewritten);

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
	const preprocess = await createInternalStateVtablePreprocessor({ engine });

	// Insert a live row
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
				},
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

	const original = internalQueryBuilder
		.selectFrom("internal_state_vtable")
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "tombstone_key")
		.where("version_id", "=", "global")
		.select(["snapshot_content", "change_id"])
		.compile();

	const rewritten = preprocess(original);

	const { rows } = engine.executeSync(rewritten);

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

	const preprocess = await createInternalStateVtablePreprocessor({
		engine: lix.engine!,
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
		.selectFrom("internal_state_vtable")
		.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
		.where("entity_id", "=", "txn_key")
		.where("version_id", "=", "global")
		.select(["writer_key", "untracked", "change_id", "commit_id"])
		.compile();

	const rewritten = preprocess(original);

	const { rows } = lix.engine!.executeSync(rewritten);

	expect(rows).toHaveLength(1);
	expect(rows[0]).toMatchObject({
		untracked: 0,
		commit_id: "pending",
	});
	expect(rows[0]?.change_id).toEqual(expect.any(String));

	await lix.close();
});

test("transaction rows override cached rows", async () => {
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

	try {
		const engine = lix.engine!;
		const preprocess = await createInternalStateVtablePreprocessor({ engine });

		updateStateCache({
			engine,
			changes: [
				{
					id: "cache-txn",
					entity_id: "priority_entry",
					schema_key: LixKeyValueSchema["x-lix-key"],
					schema_version: LixKeyValueSchema["x-lix-version"],
					file_id: "lix",
					plugin_key: "lix_own_entity",
					snapshot_content: JSON.stringify({
						key: "priority_entry",
						value: "cached_value",
					}),
					created_at: "1970-01-01T00:00:00.000Z",
				},
			],
			commit_id: "cache-commit",
			version_id: "global",
		});

		insertTransactionState({
			engine,
			timestamp: await getTimestamp({ lix }),
			data: [
				{
					entity_id: "priority_entry",
					schema_key: LixKeyValueSchema["x-lix-key"],
					file_id: "lix",
					plugin_key: "lix_own_entity",
					version_id: "global",
					schema_version: LixKeyValueSchema["x-lix-version"],
					snapshot_content: JSON.stringify({
						key: "priority_entry",
						value: "txn_value",
					}),
					untracked: false,
				},
			],
		});

		const original = internalQueryBuilder
			.selectFrom("internal_state_vtable")
			.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
			.where("entity_id", "=", "priority_entry")
			.where("version_id", "=", "global")
			.select(["snapshot_content", "commit_id", "untracked"])
			.compile();

		const rewritten = preprocess(original);
		const { rows } = engine.executeSync(rewritten);
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ commit_id: "pending", untracked: 0 });
		expect(JSON.parse(rows[0].snapshot_content as string)).toMatchObject({
			value: "txn_value",
		});
	} finally {
		await lix.close();
	}
});

test("untracked rows override cached rows", async () => {
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

	try {
		const engine = lix.engine!;
		const preprocess = await createInternalStateVtablePreprocessor({ engine });

		updateStateCache({
			engine,
			changes: [
				{
					id: "cache-untracked",
					entity_id: "untracked_priority",
					schema_key: LixKeyValueSchema["x-lix-key"],
					schema_version: LixKeyValueSchema["x-lix-version"],
					file_id: "lix",
					plugin_key: "lix_own_entity",
					snapshot_content: JSON.stringify({
						key: "untracked_priority",
						value: "cached_value",
					}),
					created_at: "1970-01-01T00:00:00.000Z",
				},
			],
			commit_id: "cache-commit",
			version_id: "global",
		});

		engine.executeSync(
			internalQueryBuilder
				.updateTable("state_all")
				.set({
					untracked: true,
					snapshot_content: {
						key: "untracked_priority",
						value: "untracked_value",
					},
				})
				.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
				.where("entity_id", "=", "untracked_priority")
				.where("version_id", "=", "global")
				.compile()
		);

		const original = internalQueryBuilder
			.selectFrom("internal_state_vtable")
			.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
			.where("entity_id", "=", "untracked_priority")
			.where("version_id", "=", "global")
			.select(["snapshot_content", "commit_id", "untracked"])
			.compile();

		const rewritten = preprocess(original);
		const { rows } = engine.executeSync(rewritten);
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ commit_id: "untracked", untracked: 1 });
		expect(JSON.parse(rows[0].snapshot_content as string)).toMatchObject({
			value: "untracked_value",
		});
	} finally {
		await lix.close();
	}
});

test("transaction rows override untracked rows", async () => {
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

	try {
		const engine = lix.engine!;
		const preprocess = await createInternalStateVtablePreprocessor({ engine });

		engine.executeSync(
			internalQueryBuilder
				.insertInto("state_all")
				.values({
					schema_key: LixKeyValueSchema["x-lix-key"],
					entity_id: "txn_over_untracked",
					plugin_key: "lix_own_entity",
					file_id: "lix",
					version_id: "global",
					untracked: true,
					schema_version: LixKeyValueSchema["x-lix-version"],
					snapshot_content: {
						key: "txn_over_untracked",
						value: "untracked_value",
					},
				})
				.compile()
		);

		insertTransactionState({
			engine,
			timestamp: await getTimestamp({ lix }),
			data: [
				{
					entity_id: "txn_over_untracked",
					schema_key: LixKeyValueSchema["x-lix-key"],
					file_id: "lix",
					plugin_key: "lix_own_entity",
					version_id: "global",
					schema_version: LixKeyValueSchema["x-lix-version"],
					snapshot_content: JSON.stringify({
						key: "txn_over_untracked",
						value: "txn_value",
					}),
					untracked: false,
				},
			],
		});

		const original = internalQueryBuilder
			.selectFrom("internal_state_vtable")
			.where("schema_key", "=", LixKeyValueSchema["x-lix-key"])
			.where("entity_id", "=", "txn_over_untracked")
			.where("version_id", "=", "global")
			.select(["snapshot_content", "commit_id", "untracked"])
			.compile();

		const rewritten = preprocess(original);
		const { rows } = engine.executeSync(rewritten);
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ commit_id: "pending", untracked: 0 });
		expect(JSON.parse(rows[0].snapshot_content as string)).toMatchObject({
			value: "txn_value",
		});
	} finally {
		await lix.close();
	}
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

	const preprocess = await createInternalStateVtablePreprocessor({
		engine: lix.engine!,
	});

	const original = internalQueryBuilder
		.selectFrom("internal_state_vtable")
		.where("schema_key", "=", "mock_schema_without_cache")
		.selectAll()
		.compile();

	const rewritten = preprocess(original);
	const { rows } = lix.engine!.executeSync(rewritten);

	expect(rows).toHaveLength(0);

	await lix.close();
});

test("unions cache tables if no schema key is provided", async () => {
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

	const preprocess = await createInternalStateVtablePreprocessor({
		engine: lix.engine!,
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

	const original = internalQueryBuilder
		.selectFrom("internal_state_vtable")
		.selectAll()
		.compile();

	const rewritten = preprocess(original);

	const { rows } = lix.engine!.executeSync(rewritten);

	const cacheEntities = rows.filter(
		(row: any) =>
			row.entity_id === "cache-entity-a" || row.entity_id === "cache-entity-b"
	);
	const entityIdSet = new Set(cacheEntities.map((row: any) => row.entity_id));
	expect(entityIdSet.has("cache-entity-a")).toBe(true);
	expect(entityIdSet.has("cache-entity-b")).toBe(true);

	await lix.close();
});
