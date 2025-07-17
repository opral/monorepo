import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import type { Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import { commit } from "./commit.js";
import { insertTransactionState } from "./insert-transaction-state.js";

test("insertPendingState creates tracked entity with pending change", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: true,
				lixcol_version_id: "global",
			},
			{
				key: "lix_deterministic_bootstrap",
				value: true,
				lixcol_version_id: "global",
			},
		],
	});

	const lixInternalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Use insertPendingState function
	insertTransactionState({
		lix: { sqlite: lix.sqlite, db: lixInternalDb },
		data: {
			entity_id: "test-insert",
			schema_key: "lix_key_value",
			file_id: "mock",
			plugin_key: "mock",
			snapshot_content: JSON.stringify({ value: "inserted-value" }),
			schema_version: "1.0",
			version_id: activeVersion.version_id,
			untracked: false, // tracked entity
		},
	});

	const results = await lixInternalDb
		.selectFrom("internal_underlying_state_all")
		.where("entity_id", "=", "test-insert")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	expect(results).toHaveLength(1);
	expect(results[0]?.snapshot_content).toEqual({ value: "inserted-value" });

	// Check that the cache has been updated with a change_id
	const cacheBeforeCommit = await lixInternalDb
		.selectFrom("internal_state_cache")
		.where("entity_id", "=", "test-insert")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(cacheBeforeCommit).toBeDefined();
	expect(cacheBeforeCommit.snapshot_content).toEqual({
		value: "inserted-value",
	});
	// Change ID should exist and match what's in the view
	expect(cacheBeforeCommit.change_id).toBeTruthy();
	expect(cacheBeforeCommit.change_id).toBe(results[0]?.change_id);

	// Check that the change is in the transaction table before commit
	const changeInTransaction = await lixInternalDb
		.selectFrom("internal_change_in_transaction")
		.where("entity_id", "=", "test-insert")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(changeInTransaction).toBeDefined();
	expect(changeInTransaction.id).toBe(cacheBeforeCommit.change_id);

	// Trigger a commit
	commit({ lix });

	// After commit, check that the change is in the internal_change table
	const changeAfterCommit = await lixInternalDb
		.selectFrom("change")
		.where("entity_id", "=", "test-insert")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(changeAfterCommit).toBeDefined();
	expect(changeAfterCommit.id).toBe(cacheBeforeCommit.change_id);

	// Verify the transaction table is cleared
	const transactionAfterCommit = await lixInternalDb
		.selectFrom("internal_change_in_transaction")
		.selectAll()
		.execute();

	expect(transactionAfterCommit).toHaveLength(0);

	// Verify state_all and underlying state are consistent
	const resultingState = await lix.db
		.selectFrom("state_all")
		.selectAll()
		.execute();

	const resultingUnderlyingState = await lixInternalDb
		.selectFrom("internal_underlying_state_all")
		.selectAll()
		.execute();

	expect(resultingState).toEqual(resultingUnderlyingState);
});
