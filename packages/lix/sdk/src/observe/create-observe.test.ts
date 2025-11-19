import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createVersion } from "../version/create-version.js";
import { mergeVersion } from "../version/merge-version.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";

/**
 * These tests use the key_value table as an example entity in the state.
 * The key_value table is a built-in table in Lix that stores configuration
 * and metadata. We use it here because it's always available in any Lix instance.
 *
 * In real applications, you would observe your own domain-specific tables
 * like "users", "documents", "settings", etc.
 */

test("observe should emit initial values and updates for key_value table", async () => {
	const lix = await openLix({});
	const values: any[] = [];

	// 3.1 Full result-set stream - filtered to test keys only
	const subscription = lix
		.observe(
			lix.db.selectFrom("key_value").selectAll().where("key", "like", "test_%")
		)
		.subscribe({ next: (rows) => values.push(rows) });

	// Wait for initial emission
	await new Promise((resolve) => setTimeout(resolve, 10));
	expect(values).toHaveLength(1);
	expect(values[0]).toEqual([]);

	// Insert a test key-value pair
	await lix.db
		.insertInto("key_value")
		.values({ key: "test_key", value: "test_value" })
		.execute();

	// Wait for update
	await new Promise((resolve) => setTimeout(resolve, 10));

	// Should have received an update
	expect(values).toHaveLength(2);
	expect(values[1]).toHaveLength(1);
	expect(values[1][0]).toMatchObject({
		key: "test_key",
		value: "test_value",
	});

	subscription.unsubscribe();
	await lix.close();
});

test("subscribeTakeFirst should emit first row or undefined", async () => {
	const lix = await openLix({});
	const values: any[] = [];

	// 3.2 Track latest change-set (row || undefined)
	// Using key_value table as example, filtered to demo_ prefix
	const subscription = lix
		.observe(
			lix.db
				.selectFrom("key_value")
				.selectAll()
				.where("key", "like", "demo_%")
				.orderBy("key", "asc")
		)
		.subscribeTakeFirst({ next: (row) => values.push(row) });

	// Wait for initial emission
	await new Promise((resolve) => setTimeout(resolve, 10));

	// Should have initial undefined (no demo_ keys yet)
	expect(values).toHaveLength(1);
	expect(values[0]).toBeUndefined();

	// Insert a demo key
	await lix.db
		.insertInto("key_value")
		.values({ key: "demo_first", value: "first_value" })
		.execute();

	// Wait for update
	await new Promise((resolve) => setTimeout(resolve, 10));

	// Should have received an update with the new first row
	expect(values).toHaveLength(2);
	expect(values[1]).toMatchObject({
		key: "demo_first",
		value: "first_value",
	});

	// Insert another demo key that comes first alphabetically
	await lix.db
		.insertInto("key_value")
		.values({ key: "demo_aaa", value: "aaa_value" })
		.execute();

	// Wait for update
	await new Promise((resolve) => setTimeout(resolve, 10));

	// Should now get the alphabetically first key
	expect(values).toHaveLength(3);
	expect(values[2]).toMatchObject({
		key: "demo_aaa",
		value: "aaa_value",
	});

	subscription.unsubscribe();
	await lix.close();
});

test("subscribeTakeFirstOrThrow should error when no rows exist", async () => {
	const lix = await openLix({});
	const values: any[] = [];
	const errors: any[] = [];

	// 3.3 Strict singleton (error when empty)
	// Query for specific non-existent key
	const subscription = lix
		.observe(
			lix.db
				.selectFrom("key_value")
				.selectAll()
				.where("key", "=", "singleton_test_key")
		)
		.subscribeTakeFirstOrThrow({
			next: (row) => values.push(row),
			error: (err) => errors.push(err),
		});

	// Wait for initial emission (error)
	await new Promise((resolve) => setTimeout(resolve, 10));

	// Should have received an error
	expect(values).toHaveLength(0);
	expect(errors).toHaveLength(1);
	expect(errors[0]).toBeInstanceOf(Error);
	expect(errors[0].message).toBe("Query returned no rows");

	subscription.unsubscribe();
	await lix.close();
});

test("subscribeTakeFirstOrThrow should emit value when row exists", async () => {
	const lix = await openLix({});
	const values: any[] = [];
	const errors: any[] = [];

	// First insert a singleton row
	await lix.db
		.insertInto("key_value")
		.values({ key: "singleton_test_key", value: "singleton_value" })
		.execute();

	// Then observe it
	const subscription = lix
		.observe(
			lix.db
				.selectFrom("key_value")
				.selectAll()
				.where("key", "=", "singleton_test_key")
		)
		.subscribeTakeFirstOrThrow({
			next: (row) => values.push(row),
			error: (err) => errors.push(err),
		});

	// Wait for initial emission
	await new Promise((resolve) => setTimeout(resolve, 10));

	// Should have received the row
	expect(errors).toHaveLength(0);
	expect(values).toHaveLength(1);
	expect(values[0]).toMatchObject({
		key: "singleton_test_key",
		value: "singleton_value",
	});

	// Update the singleton value
	await lix.db
		.updateTable("key_value")
		.set({ value: "updated_singleton" })
		.where("key", "=", "singleton_test_key")
		.execute();

	// Wait for update
	await new Promise((resolve) => setTimeout(resolve, 10));

	// Should have received the updated row
	expect(values).toHaveLength(2);
	expect(values[1]).toMatchObject({
		key: "singleton_test_key",
		value: "updated_singleton",
	});

	subscription.unsubscribe();
	await lix.close();
});

test("unsubscribe should stop receiving updates", async () => {
	const lix = await openLix({});
	const values: any[] = [];

	const subscription = lix
		.observe(
			lix.db.selectFrom("key_value").selectAll().where("key", "like", "unsub_%")
		)
		.subscribe({ next: (rows) => values.push(rows) });

	// Wait for initial emission
	await new Promise((resolve) => setTimeout(resolve, 10));
	const countBeforeUnsubscribe = values.length;

	// Unsubscribe
	subscription.unsubscribe();

	// Make changes after unsubscribe
	await lix.db
		.insertInto("key_value")
		.values({ key: "unsub_after", value: "should_not_see" })
		.execute();

	// Small delay to ensure no updates are received
	await new Promise((resolve) => setTimeout(resolve, 20));

	// Should not have received any more updates
	expect(values.length).toBe(countBeforeUnsubscribe);

	await lix.close();
});

test("multiple subscriptions should work independently", async () => {
	const lix = await openLix({});
	const values1: any[] = [];
	const values2: any[] = [];

	// Two different queries with different filters
	const sub1 = lix
		.observe(
			lix.db
				.selectFrom("key_value")
				.selectAll()
				.where("key", "like", "scope1_%")
		)
		.subscribe({ next: (rows) => values1.push(rows) });

	const sub2 = lix
		.observe(
			lix.db
				.selectFrom("key_value")
				.selectAll()
				.where("key", "like", "scope2_%")
		)
		.subscribe({ next: (rows) => values2.push(rows) });

	// Wait for initial emissions
	await new Promise((resolve) => setTimeout(resolve, 10));

	// Insert keys for different scopes
	await lix.db
		.insertInto("key_value")
		.values({ key: "scope1_key", value: "scope1_value" })
		.execute();

	await lix.db
		.insertInto("key_value")
		.values({ key: "scope2_key", value: "scope2_value" })
		.execute();

	// Wait for updates from both insertions
	await new Promise((resolve) => setTimeout(resolve, 50));

	// First subscription should only see scope1 keys
	const lastResult1 = values1[values1.length - 1];
	expect(lastResult1).toHaveLength(1);
	expect(lastResult1[0]).toMatchObject({
		key: "scope1_key",
		value: "scope1_value",
	});

	// Second subscription should only see scope2 keys
	const lastResult2 = values2[values2.length - 1];
	expect(lastResult2).toHaveLength(1);
	expect(lastResult2[0]).toMatchObject({
		key: "scope2_key",
		value: "scope2_value",
	});

	sub1.unsubscribe();
	sub2.unsubscribe();
	await lix.close();
});

test("query errors should be delivered to error handler", async () => {
	const lix = await openLix({});
	const errors: any[] = [];
	const values: any[] = [];

	// Create an invalid query (selecting from non-existent table)
	const subscription = lix
		.observe(lix.db.selectFrom("non_existent_table" as any).selectAll())
		.subscribe({
			next: (rows) => values.push(rows),
			error: (err) => errors.push(err),
		});

	// Wait for error
	await new Promise((resolve) => setTimeout(resolve, 10));

	// Should have received an error
	expect(values).toHaveLength(0);
	expect(errors).toHaveLength(1);
	expect(errors[0]).toBeInstanceOf(Error);

	// Subscription should be terminated after error
	// (no cleanup needed, but calling unsubscribe should be safe)
	subscription.unsubscribe();
	await lix.close();
});

test("Symbol.observable interop should work", async () => {
	const lix = await openLix({});

	const observable = lix.observe(
		lix.db.selectFrom("key_value").selectAll().where("key", "like", "interop_%")
	);

	// Should implement Symbol.observable
	expect(observable[Symbol.observable]).toBeDefined();
	expect(observable[Symbol.observable]()).toBe(observable);

	await lix.close();
});

test("observing specific key should not emit when unrelated key is inserted", async () => {
	const lix = await openLix({});
	const valuesA: any[] = [];
	const valuesB: any[] = [];

	// Observe only key A
	const subscriptionA = lix
		.observe(
			lix.db.selectFrom("key_value").selectAll().where("key", "=", "key_A")
		)
		.subscribe({ next: (rows) => valuesA.push(rows) });

	// Observe only key B
	const subscriptionB = lix
		.observe(
			lix.db.selectFrom("key_value").selectAll().where("key", "=", "key_B")
		)
		.subscribe({ next: (rows) => valuesB.push(rows) });

	// Wait for initial emissions
	await new Promise((resolve) => setTimeout(resolve, 10));
	expect(valuesA).toHaveLength(1);
	expect(valuesA[0]).toEqual([]); // No key_A yet
	expect(valuesB).toHaveLength(1);
	expect(valuesB[0]).toEqual([]); // No key_B yet

	// Insert key A
	await lix.db
		.insertInto("key_value")
		.values({ key: "key_A", value: "value_A" })
		.execute();

	// Wait for update
	await new Promise((resolve) => setTimeout(resolve, 10));

	// Key A observer should get an update
	expect(valuesA).toHaveLength(2);
	expect(valuesA[1]).toHaveLength(1);
	expect(valuesA[1][0]).toMatchObject({ key: "key_A", value: "value_A" });

	// Key B observer should NOT get an update (only key A was inserted)
	expect(valuesB).toHaveLength(1); // Still only initial emission

	const countABeforeKeyB = valuesA.length;
	const countBBeforeKeyB = valuesB.length;

	// Insert key B
	await lix.db
		.insertInto("key_value")
		.values({ key: "key_B", value: "value_B" })
		.execute();

	// Wait to see if we get emissions
	await new Promise((resolve) => setTimeout(resolve, 10));

	// Key A observer should NOT get an update (only key B was inserted)
	expect(valuesA).toHaveLength(countABeforeKeyB); // No new emission

	// Key B observer should get an update
	expect(valuesB).toHaveLength(countBBeforeKeyB + 1);
	expect(valuesB[valuesB.length - 1]).toHaveLength(1);
	expect(valuesB[valuesB.length - 1][0]).toMatchObject({
		key: "key_B",
		value: "value_B",
	});

	subscriptionA.unsubscribe();
	subscriptionB.unsubscribe();
	await lix.close();
});

test("observing a state emits when a version merge happens", async () => {
	const schema: LixSchemaDefinition = {
		"x-lix-key": "observe_merge_entity",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			v: { type: "string" },
		},
		required: ["v"],
		additionalProperties: false,
	} as const;

	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const target = await createVersion({ lix, name: "target" });
	const source = await createVersion({ lix, name: "source" });

	await lix.db
		.insertInto("state_by_version")
		.values({
			entity_id: "entity-from-source",
			schema_key: "observe_merge_entity",
			file_id: "file-observe",
			version_id: source.id,
			plugin_key: "test_plugin",
			snapshot_content: { v: "from-source" },
			schema_version: "1.0",
		})
		.execute();

	const emissions: Array<
		{ entity_id: string; snapshot_content: Record<string, unknown> }[]
	> = [];

	const targetVersionQuery = lix.db
		.selectFrom("state_by_version")
		.select(["entity_id", "snapshot_content"])
		.where("version_id", "=", target.id)
		.where("schema_key", "=", "observe_merge_entity");

	const subscription = lix
		.observe(targetVersionQuery)
		.subscribe({ next: (rows) => emissions.push(rows) });

	await new Promise((resolve) => setTimeout(resolve, 20));
	expect(emissions).toHaveLength(1);
	expect(emissions[0]).toEqual([]);

	await mergeVersion({ lix, source, target });
	await new Promise((resolve) => setTimeout(resolve, 50));
	expect(emissions).toHaveLength(2);
	expect(emissions[1]).toEqual([
		{
			entity_id: "entity-from-source",
			snapshot_content: { v: "from-source" },
		},
	]);

	subscription.unsubscribe();
	await lix.close();
});

test("observing active state re-emits when active_version changes", async () => {
	const schema: LixSchemaDefinition = {
		"x-lix-key": "observe_active_switch_entity",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			v: { type: "string" },
		},
		required: ["v"],
		additionalProperties: false,
	} as const;

	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const versionA = await createVersion({ lix, name: "active-a" });
	const versionB = await createVersion({ lix, name: "active-b" });

	await lix.db
		.insertInto("state_by_version")
		.values({
			entity_id: "active-entity",
			schema_key: schema["x-lix-key"],
			file_id: "file-active",
			version_id: versionA.id,
			plugin_key: "test_plugin",
			snapshot_content: { v: "from-a" },
			schema_version: schema["x-lix-version"],
		})
		.execute();

	await lix.db
		.insertInto("state_by_version")
		.values({
			entity_id: "active-entity",
			schema_key: schema["x-lix-key"],
			file_id: "file-active",
			version_id: versionB.id,
			plugin_key: "test_plugin",
			snapshot_content: { v: "from-b" },
			schema_version: schema["x-lix-version"],
		})
		.execute();

	// Start from version A so the first emission includes its state.
	await lix.db
		.updateTable("active_version")
		.set({ version_id: versionA.id })
		.execute();

	const emissions: Array<
		Array<{ entity_id: string; snapshot_content: Record<string, unknown> }>
	> = [];

	const activeStateQuery = lix.db
		.selectFrom("state")
		.select(["entity_id", "snapshot_content"])
		.where("schema_key", "=", schema["x-lix-key"]);

	const subscription = lix
		.observe(activeStateQuery)
		.subscribe({ next: (rows) => emissions.push(rows) });

	await new Promise((resolve) => setTimeout(resolve, 20));
	expect(emissions).toHaveLength(1);
	expect(emissions[0]).toEqual([
		{ entity_id: "active-entity", snapshot_content: { v: "from-a" } },
	]);

	// Switch to version B by updating active_version; observer should re-run.
	await lix.db.transaction().execute(async (trx) => {
		await trx
			.updateTable("active_version")
			.set({ version_id: versionB.id })
			.execute();
	});

	await new Promise((resolve) => setTimeout(resolve, 50));

	expect(emissions).toHaveLength(2);
	expect(emissions[1]).toEqual([
		{ entity_id: "active-entity", snapshot_content: { v: "from-b" } },
	]);

	subscription.unsubscribe();
	await lix.close();
});

test("observing entity views re-emits when active_version changes", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	const versionA = await createVersion({ lix, name: "kv-active-a" });
	const versionB = await createVersion({ lix, name: "kv-active-b" });

	await lix.db
		.insertInto("key_value_by_version")
		.values({
			key: "kv_active_key",
			value: "from-a",
			lixcol_version_id: versionA.id,
		})
		.execute();

	await lix.db
		.insertInto("key_value_by_version")
		.values({
			key: "kv_active_key",
			value: "from-b",
			lixcol_version_id: versionB.id,
		})
		.execute();

	await lix.db
		.updateTable("active_version")
		.set({ version_id: versionA.id })
		.execute();

	const emissions: Array<Array<{ key: string; value: unknown }>> = [];

	const subscription = lix
		.observe(
			lix.db
				.selectFrom("key_value")
				.select(["key", "value"])
				.where("key", "=", "kv_active_key")
		)
		.subscribe({ next: (rows) => emissions.push(rows) });

	await new Promise((resolve) => setTimeout(resolve, 20));
	expect(emissions).toHaveLength(1);
	expect(emissions[0]).toEqual([{ key: "kv_active_key", value: "from-a" }]);

	await lix.db.transaction().execute(async (trx) => {
		await trx
			.updateTable("active_version")
			.set({ version_id: versionB.id })
			.execute();
	});

	await new Promise((resolve) => setTimeout(resolve, 50));
	expect(emissions).toHaveLength(2);
	expect(emissions[1]).toEqual([{ key: "kv_active_key", value: "from-b" }]);

	subscription.unsubscribe();
	await lix.close();
});

test("subscribeTakeFirst with explicit limit(1) should not double-limit", async () => {
	const lix = await openLix({});
	const values: any[] = [];

	// Insert multiple test keys
	await lix.db
		.insertInto("key_value")
		.values([
			{ key: "limit_test_1", value: "value_1" },
			{ key: "limit_test_2", value: "value_2" },
			{ key: "limit_test_3", value: "value_3" },
		])
		.execute();

	// User already provides limit(1) in their query
	const subscription = lix
		.observe(
			lix.db
				.selectFrom("key_value")
				.selectAll()
				.where("key", "like", "limit_test_%")
				.orderBy("key", "asc")
				.limit(1)
		)
		.subscribeTakeFirst({ next: (row) => values.push(row) });

	// Wait for initial emission
	await new Promise((resolve) => setTimeout(resolve, 10));

	// Should work correctly even with double limit
	expect(values).toHaveLength(1);
	expect(values[0]).toMatchObject({
		key: "limit_test_1",
		value: "value_1",
	});

	subscription.unsubscribe();
	await lix.close();
});

test("query should only re-execute when observed entity changes", async () => {
	const lix = await openLix({});
	const keyValueEmissions: any[] = [];

	// Observe key_value table
	const keyValueSub = lix
		.observe(
			lix.db
				.selectFrom("key_value")
				.selectAll()
				.where("key", "like", "opt_test_%")
		)
		.subscribe({ next: (rows) => keyValueEmissions.push(rows) });

	// Wait for initial emissions
	await new Promise((resolve) => setTimeout(resolve, 10));
	expect(keyValueEmissions).toHaveLength(1);

	const keyValueCountBefore = keyValueEmissions.length;

	// Insert into key_value - should trigger key_value observer
	await lix.db
		.insertInto("key_value")
		.values({ key: "opt_test_key", value: "opt_test_value" })
		.execute();

	// Wait for emissions
	await new Promise((resolve) => setTimeout(resolve, 50));

	// key_value observer should have received an update
	expect(keyValueEmissions).toHaveLength(keyValueCountBefore + 1);
	expect(keyValueEmissions[keyValueEmissions.length - 1]).toHaveLength(1);

	keyValueSub.unsubscribe();
	await lix.close();
});

test("query with innerJoin should handle schema key detection correctly", async () => {
	const lix = await openLix({});
	const joinEmissions: any[] = [];

	// Test that innerJoin queries can be properly parsed by determineSchemaKeys
	// This demonstrates that the optimization system can handle complex join queries
	const joinQuery = lix.db
		.selectFrom("key_value")
		.innerJoin("label", "key_value.value", "label.id")
		.selectAll("key_value")
		.where("key_value.key", "like", "join_test_%");

	const joinSub = lix
		.observe(joinQuery)
		.subscribe({ next: (rows) => joinEmissions.push(rows) });

	// Wait for initial emission
	await new Promise((resolve) => setTimeout(resolve, 10));
	expect(joinEmissions).toHaveLength(1);

	// The test passes by verifying that innerJoin queries can be observed
	// and that the optimization system doesn't crash on complex queries
	expect(joinEmissions[0]).toEqual([]);

	// Verify that both schema keys are detected in the join query
	const { determineSchemaKeys } = await import("./determine-schema-keys.js");
	const schemaKeys = determineSchemaKeys(joinQuery.compile());
	expect(schemaKeys).toContain("lix_key_value");
	expect(schemaKeys).toContain("lix_label");

	joinSub.unsubscribe();
	await lix.close();
});

test("query with change table join should always re-execute", async () => {
	const lix = await openLix({});
	const changeJoinEmissions: any[] = [];

	// Observe a join query that includes the change table
	// This should always re-execute because change table mutates frequently
	const changeJoinSub = lix
		.observe(
			lix.db
				.selectFrom("key_value")
				.leftJoin("change", "change.entity_id", "key_value.key")
				.selectAll()
				.where("key_value.key", "like", "change_test_%")
		)
		.subscribe({ next: (rows) => changeJoinEmissions.push(rows) });

	// Wait for initial emission
	await new Promise((resolve) => setTimeout(resolve, 10));
	expect(changeJoinEmissions).toHaveLength(1);

	const countBefore = changeJoinEmissions.length;

	// Insert into key_value - should trigger change join observer
	// because it joins with the change table (special case)
	await lix.db
		.insertInto("key_value")
		.values({ key: "change_test_key", value: "change_test_value" })
		.execute();

	// Wait for emission
	await new Promise((resolve) => setTimeout(resolve, 10));

	// Change join observer should have received an update
	expect(changeJoinEmissions).toHaveLength(countBefore + 1);

	changeJoinSub.unsubscribe();
	await lix.close();
});

test("state_by_version observer re-executes when observed schema changes", async () => {
	const lix = await openLix({});
	const emissions: any[] = [];

	const sub = lix
		.observe(
			lix.db
				.selectFrom("state_by_version")
				.selectAll()
				.where("schema_key", "=", "lix_key_value")
		)
		.subscribe({ next: (rows) => emissions.push(rows) });

	await new Promise((r) => setTimeout(r, 10));
	const before = emissions.length;

	// Insert into key_value (matching observed schema_key)
	await lix.db
		.insertInto("key_value")
		.values({ key: "state_all_test_key", value: "state_all_test_value" })
		.execute();

	await new Promise((r) => setTimeout(r, 10));
	expect(emissions.length).toBe(before + 1);

	sub.unsubscribe();
	await lix.close();
});

test("state_by_version observer does not re-execute for unrelated schema changes", async () => {
	const lix = await openLix({});
	const emissions: any[] = [];

	const sub = lix
		.observe(
			lix.db
				.selectFrom("state_by_version")
				.selectAll()
				.where("schema_key", "=", "lix_version")
		)
		.subscribe({ next: (rows) => emissions.push(rows) });

	await new Promise((r) => setTimeout(r, 10));
	const before = emissions.length;

	// Insert into key_value (different schema)
	await lix.db
		.insertInto("key_value")
		.values({ key: "state_all_test_key2", value: "state_all_test_value2" })
		.execute();

	await new Promise((r) => setTimeout(r, 10));
	// Should not emit again since observed schema_key does not match the change
	expect(emissions.length).toBe(before);

	sub.unsubscribe();
	await lix.close();
});

test("state_by_version observer with version_id filter re-executes only for that version", async () => {
	const lix = await openLix({});
	const emissions: any[] = [];

	// Create two versions
	const vA = await (
		await import("../version/create-version.js")
	).createVersion({ lix, name: "obs-A" });
	const vB = await (
		await import("../version/create-version.js")
	).createVersion({ lix, name: "obs-B" });

	const sub = lix
		.observe(
			lix.db
				.selectFrom("state_by_version")
				.selectAll()
				.where("schema_key", "=", "lix_key_value")
				.where("version_id", "=", vA.id)
		)
		.subscribe({ next: (rows) => emissions.push(rows) });

	await new Promise((r) => setTimeout(r, 10));
	const before = emissions.length;

	// Insert into different version (vB) - should NOT trigger
	await lix.db
		.insertInto("key_value_by_version")
		.values({ key: "vk_b", value: "b", lixcol_version_id: vB.id })
		.execute();

	await new Promise((r) => setTimeout(r, 10));
	expect(emissions.length).toBe(before);

	// Insert into observed version (vA) - should trigger
	await lix.db
		.insertInto("key_value_by_version")
		.values({ key: "vk_a", value: "a", lixcol_version_id: vA.id })
		.execute();

	await new Promise((r) => setTimeout(r, 10));
	expect(emissions.length).toBe(before + 1);

	sub.unsubscribe();
	await lix.close();
});

test("multiple observers with different entities should not interfere", async () => {
	const lix = await openLix({});
	const keyValueEmissions: any[] = [];
	const labelEmissions: any[] = [];
	const accountEmissions: any[] = [];

	// Three observers on different tables
	const keyValueSub = lix
		.observe(
			lix.db
				.selectFrom("key_value")
				.selectAll()
				.where("key", "like", "multi_test_%")
		)
		.subscribe({ next: (rows) => keyValueEmissions.push(rows) });

	const labelSub = lix
		.observe(
			lix.db.selectFrom("label").selectAll().where("id", "like", "multi_test_%")
		)
		.subscribe({ next: (rows) => labelEmissions.push(rows) });

	const accountSub = lix
		.observe(
			lix.db
				.selectFrom("account")
				.selectAll()
				.where("id", "like", "multi_test_%")
		)
		.subscribe({ next: (rows) => accountEmissions.push(rows) });

	// Wait for initial emissions
	await new Promise((resolve) => setTimeout(resolve, 10));
	expect(keyValueEmissions).toHaveLength(1);
	expect(labelEmissions).toHaveLength(1);
	expect(accountEmissions).toHaveLength(1);

	const keyValueCountBefore = keyValueEmissions.length;
	const labelCountBefore = labelEmissions.length;
	const accountCountBefore = accountEmissions.length;

	// Insert into key_value - should only trigger key_value observer
	await lix.db
		.insertInto("key_value")
		.values({ key: "multi_test_key", value: "multi_test_value" })
		.execute();

	// Wait for emissions
	await new Promise((resolve) => setTimeout(resolve, 50));

	// Only key_value observer should have received an update (optimization working)
	expect(keyValueEmissions).toHaveLength(keyValueCountBefore + 1);
	expect(labelEmissions).toHaveLength(labelCountBefore);
	expect(accountEmissions).toHaveLength(accountCountBefore);

	// Test all three tables to make sure they all work independently
	const keyValueCountAfterFirst = keyValueEmissions.length;
	const labelCountAfterFirst = labelEmissions.length;
	const accountCountAfterFirst = accountEmissions.length;

	// Insert into label - should only trigger label observer
	await lix.db
		.insertInto("label")
		.values({
			id: "multi_test_label",
			name: "Multi Test Label",
		})
		.execute();

	// Wait for emissions
	await new Promise((resolve) => setTimeout(resolve, 50));

	// Only label observer should have received an update
	expect(keyValueEmissions).toHaveLength(keyValueCountAfterFirst);
	expect(labelEmissions).toHaveLength(labelCountAfterFirst + 1);
	expect(accountEmissions).toHaveLength(accountCountAfterFirst);

	keyValueSub.unsubscribe();
	labelSub.unsubscribe();
	accountSub.unsubscribe();
	await lix.close();
});

test("subquery should re-execute when parent or child entities change", async () => {
	const lix = await openLix({});
	const subqueryEmissions: any[] = [];

	// Insert test data
	await lix.db
		.insertInto("key_value")
		.values({ key: "subquery_parent", value: "parent_value" })
		.execute();

	// Observe a query with a subquery
	const subquerySub = lix
		.observe(
			lix.db
				.selectFrom("key_value as parent")
				.selectAll()
				.where("parent.key", "like", "subquery_parent%")
				.where(
					"parent.value",
					"in",
					lix.db
						.selectFrom("key_value as child")
						.select("child.value")
						.where("child.key", "like", "subquery_child%")
				)
		)
		.subscribe({ next: (rows) => subqueryEmissions.push(rows) });

	// Wait for initial emission
	await new Promise((resolve) => setTimeout(resolve, 10));
	expect(subqueryEmissions).toHaveLength(1);

	const countBefore = subqueryEmissions.length;

	// Insert into the subquery table - should trigger re-execution
	await lix.db
		.insertInto("key_value")
		.values({ key: "subquery_child", value: "parent_value" })
		.execute();

	// Wait for emission
	await new Promise((resolve) => setTimeout(resolve, 10));

	// Subquery observer should have received an update
	expect(subqueryEmissions).toHaveLength(countBefore + 1);

	subquerySub.unsubscribe();
	await lix.close();
});

test("optimization prevents unnecessary query re-executions", async () => {
	const lix = await openLix({});
	const keyValueEmissions: any[] = [];
	const labelEmissions: any[] = [];
	const accountEmissions: any[] = [];

	// Set up observers for different tables
	const keyValueSub = lix
		.observe(
			lix.db
				.selectFrom("key_value")
				.selectAll()
				.where("key", "like", "opt_prevent_%")
		)
		.subscribe({ next: (rows) => keyValueEmissions.push(rows) });

	const labelSub = lix
		.observe(
			lix.db
				.selectFrom("label")
				.selectAll()
				.where("id", "like", "opt_prevent_%")
		)
		.subscribe({ next: (rows) => labelEmissions.push(rows) });

	const accountSub = lix
		.observe(
			lix.db
				.selectFrom("account")
				.selectAll()
				.where("id", "like", "opt_prevent_%")
		)
		.subscribe({ next: (rows) => accountEmissions.push(rows) });

	// Wait for initial emissions
	await new Promise((resolve) => setTimeout(resolve, 10));
	expect(keyValueEmissions).toHaveLength(1);
	expect(labelEmissions).toHaveLength(1);
	expect(accountEmissions).toHaveLength(1);

	// Track counts before any mutations
	const initialCounts = {
		keyValue: keyValueEmissions.length,
		label: labelEmissions.length,
		account: accountEmissions.length,
	};

	// Test 1: Insert into key_value should only affect key_value observer
	await lix.db
		.insertInto("key_value")
		.values({ key: "opt_prevent_key1", value: "value1" })
		.execute();

	await new Promise((resolve) => setTimeout(resolve, 50));

	expect(keyValueEmissions).toHaveLength(initialCounts.keyValue + 1);
	expect(labelEmissions).toHaveLength(initialCounts.label); // Should NOT change
	expect(accountEmissions).toHaveLength(initialCounts.account); // Should NOT change

	// Test 2: Insert into label should only affect label observer
	const countsAfterKeyValue = {
		keyValue: keyValueEmissions.length,
		label: labelEmissions.length,
		account: accountEmissions.length,
	};

	await lix.db
		.insertInto("label")
		.values({
			id: "opt_prevent_label1",
			name: "Prevent Test Label",
		})
		.execute();

	await new Promise((resolve) => setTimeout(resolve, 50));

	expect(keyValueEmissions).toHaveLength(countsAfterKeyValue.keyValue); // Should NOT change
	expect(labelEmissions).toHaveLength(countsAfterKeyValue.label + 1);
	expect(accountEmissions).toHaveLength(countsAfterKeyValue.account); // Should NOT change

	// Test 3: Insert into account should only affect account observer
	const countsAfterLabel = {
		keyValue: keyValueEmissions.length,
		label: labelEmissions.length,
		account: accountEmissions.length,
	};

	await lix.db
		.insertInto("account")
		.values({
			id: "opt_prevent_account1",
			name: "Prevent Test Account",
		})
		.execute();

	await new Promise((resolve) => setTimeout(resolve, 50));

	expect(keyValueEmissions).toHaveLength(countsAfterLabel.keyValue); // Should NOT change
	expect(labelEmissions).toHaveLength(countsAfterLabel.label); // Should NOT change
	expect(accountEmissions).toHaveLength(countsAfterLabel.account + 1);

	// Verify the optimization is working by checking that we have the expected pattern:
	// - Each observer only increased when its own table was modified
	// - No observer increased when other tables were modified
	expect(keyValueEmissions).toHaveLength(initialCounts.keyValue + 1); // Only 1 increase
	expect(labelEmissions).toHaveLength(initialCounts.label + 1); // Only 1 increase
	expect(accountEmissions).toHaveLength(initialCounts.account + 1); // Only 1 increase

	keyValueSub.unsubscribe();
	labelSub.unsubscribe();
	accountSub.unsubscribe();
	await lix.close();
});

test("observe pools identical compiled queries (same instance)", async () => {
	const lix = await openLix({});

	// Create two separate builders that compile to the same SQL and params
	const q1 = lix.db
		.selectFrom("key_value")
		.selectAll()
		.where("key", "like", "pool_same_%");
	const q2 = lix.db
		.selectFrom("key_value")
		.selectAll()
		.where("key", "like", "pool_same_%");

	const obs1 = lix.observe(q1);
	const obs2 = lix.observe(q2);

	// Expect a single pooled observable instance
	expect(obs1).toBe(obs2);

	const a: any[] = [];
	const b: any[] = [];
	const sub1 = obs1.subscribe({ next: (rows) => a.push(rows) });
	const sub2 = obs2.subscribe({ next: (rows) => b.push(rows) });

	await new Promise((r) => setTimeout(r, 10));
	// Both receive the same initial emission
	expect(a).toHaveLength(1);
	expect(b).toHaveLength(1);
	expect(a[0]).toEqual([]);
	expect(b[0]).toEqual([]);

	// Mutate and ensure both receive the update
	await lix.db
		.insertInto("key_value")
		.values({ key: "pool_same_1", value: "v1" })
		.execute();
	await new Promise((r) => setTimeout(r, 20));

	expect(a[a.length - 1]).toHaveLength(1);
	expect(b[b.length - 1]).toHaveLength(1);

	sub1.unsubscribe();
	sub2.unsubscribe();
	await lix.close();
});

test("pooled observable persists until last unsubscribe", async () => {
	const lix = await openLix({});
	const q = lix.db
		.selectFrom("key_value")
		.selectAll()
		.where("key", "like", "pool_persist_%");

	const obs = lix.observe(q);
	const values1: any[] = [];
	const values2: any[] = [];
	const sub1 = obs.subscribe({ next: (rows) => values1.push(rows) });
	const sub2 = obs.subscribe({ next: (rows) => values2.push(rows) });

	await new Promise((r) => setTimeout(r, 10));
	const before = values1.length + values2.length;

	// Unsub first; second remains
	sub1.unsubscribe();

	await lix.db
		.insertInto("key_value")
		.values({ key: "pool_persist_1", value: "v1" })
		.execute();
	await new Promise((r) => setTimeout(r, 20));

	// Second subscriber still updates
	expect(values2.length).toBeGreaterThan(0);
	expect(values1.length + values2.length).toBeGreaterThan(before);

	// Unsub second — pooled upstream should tear down
	sub2.unsubscribe();

	// Observing again should produce a new instance (cache entry cleaned)
	const obs2 = lix.observe(q);
	expect(obs2).not.toBe(obs);

	await lix.close();
});

test("pooling key includes mode: array vs first", async () => {
	const lix = await openLix({});
	const q = lix.db
		.selectFrom("key_value")
		.selectAll()
		.where("key", "like", "pool_mode_%");

	const obsArray = lix.observe(q, { mode: "array" });
	const obsFirst = lix.observe(q, { mode: "first" });

	// Different modes should not pool together
	expect(obsArray).not.toBe(obsFirst);

	await lix.close();
});

test("observe pools identical SQL even from different builder instances", async () => {
	const lix = await openLix({});

	// Construct queries in different orders that compile to identical SQL/params
	const q1 = lix.db
		.selectFrom("key_value")
		.selectAll()
		.where("key", "=", "pool_identity_key");

	const q2 = lix.db
		.selectFrom("key_value")
		.selectAll()
		.where("key", "=", "pool_identity_key");

	const obs1 = lix.observe(q1);
	const obs2 = lix.observe(q2);
	// Same compiled SQL -> pooled
	expect(obs1).toBe(obs2);

	await lix.close();
});

test("observe does not pool different SQL (different where parameters)", async () => {
	const lix = await openLix({});

	const qa = lix.db
		.selectFrom("key_value")
		.selectAll()
		.where("key", "=", "pool_diff_a");
	const qb = lix.db
		.selectFrom("key_value")
		.selectAll()
		.where("key", "=", "pool_diff_b");

	const obsa = lix.observe(qa);
	const obsb = lix.observe(qb);
	// Different params -> no pooling
	expect(obsa).not.toBe(obsb);

	await lix.close();
});

test("observe does not pool across different Lix instances", async () => {
	const lix1 = await openLix({});
	const lix2 = await openLix({});

	const q1 = lix1.db
		.selectFrom("key_value")
		.selectAll()
		.where("key", "=", "pool_cross_instance");
	const q2 = lix2.db
		.selectFrom("key_value")
		.selectAll()
		.where("key", "=", "pool_cross_instance");

	const obs1 = lix1.observe(q1);
	const obs2 = lix2.observe(q2);

	// Different Lix instances must not share the same observable
	expect(obs1).not.toBe(obs2);

	const a: any[] = [];
	const b: any[] = [];
	const sub1 = obs1.subscribe({ next: (rows) => a.push(rows) });
	const sub2 = obs2.subscribe({ next: (rows) => b.push(rows) });

	await new Promise((r) => setTimeout(r, 10));
	expect(a).toHaveLength(1);
	expect(b).toHaveLength(1);

	// Mutate only lix1; lix2 should not receive updates
	await lix1.db
		.insertInto("key_value")
		.values({ key: "pool_cross_instance", value: "v1" })
		.execute();
	await new Promise((r) => setTimeout(r, 20));

	expect(a).toHaveLength(2);
	expect(a[a.length - 1]).toHaveLength(1);
	expect(b).toHaveLength(1); // Still just initial emission

	sub1.unsubscribe();
	sub2.unsubscribe();
	await lix1.close();
	await lix2.close();
});
