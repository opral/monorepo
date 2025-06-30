import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";

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
	await new Promise(resolve => setTimeout(resolve, 10));
	expect(values).toHaveLength(1);
	expect(values[0]).toEqual([]);

	// Insert a test key-value pair
	await lix.db
		.insertInto("key_value")
		.values({ key: "test_key", value: "test_value" })
		.execute();

	// Wait for update
	await new Promise(resolve => setTimeout(resolve, 10));

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
	await new Promise(resolve => setTimeout(resolve, 10));

	// Should have initial undefined (no demo_ keys yet)
	expect(values).toHaveLength(1);
	expect(values[0]).toBeUndefined();

	// Insert a demo key
	await lix.db
		.insertInto("key_value")
		.values({ key: "demo_first", value: "first_value" })
		.execute();

	// Wait for update
	await new Promise(resolve => setTimeout(resolve, 10));

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
	await new Promise(resolve => setTimeout(resolve, 10));

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
	await new Promise(resolve => setTimeout(resolve, 10));

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
	await new Promise(resolve => setTimeout(resolve, 10));

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
	await new Promise(resolve => setTimeout(resolve, 10));

	// Should have received the updated row
	expect(values).toHaveLength(2);
	expect(values[1]).toMatchObject({
		key: "singleton_test_key",
		value: "updated_singleton",
	});

	subscription.unsubscribe();
	await lix.close();
});

test("observe should re-execute queries on any state commit", async () => {
	const lix = await openLix({});
	const values: any[] = [];

	// Observe only our test namespace
	const subscription = lix
		.observe(
			lix.db.selectFrom("key_value").selectAll().where("key", "like", "multi_%")
		)
		.subscribe({ next: (rows) => values.push(rows) });

	// Wait for initial emission
	await new Promise(resolve => setTimeout(resolve, 10));
	expect(values).toHaveLength(1);
	expect(values[0]).toEqual([]);

	// Make multiple changes
	await lix.db
		.insertInto("key_value")
		.values({ key: "multi_key1", value: "value1" })
		.execute();

	await lix.db
		.insertInto("key_value")
		.values({ key: "multi_key2", value: "value2" })
		.execute();

	await lix.db
		.updateTable("key_value")
		.set({ value: "updated_value1" })
		.where("key", "=", "multi_key1")
		.execute();

	// Wait for mutations to complete
	await new Promise((resolve) => setTimeout(resolve, 50));

	// Focus on final state rather than exact emission count
	// (in case of future optimizations that batch commits)
	expect(values.length).toBeGreaterThanOrEqual(4); // initial + 3 mutations

	// Verify final state contains both keys with correct values
	const finalResult = values[values.length - 1];
	expect(finalResult).toHaveLength(2);
	expect(
		finalResult.find((row: any) => row.key === "multi_key1")
	).toMatchObject({
		key: "multi_key1",
		value: "updated_value1",
	});
	expect(
		finalResult.find((row: any) => row.key === "multi_key2")
	).toMatchObject({
		key: "multi_key2",
		value: "value2",
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
	await new Promise(resolve => setTimeout(resolve, 10));
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
	await new Promise(resolve => setTimeout(resolve, 10));

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
	await new Promise(resolve => setTimeout(resolve, 10));

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
	await new Promise(resolve => setTimeout(resolve, 10));

	// Should work correctly even with double limit
	expect(values).toHaveLength(1);
	expect(values[0]).toMatchObject({
		key: "limit_test_1",
		value: "value_1",
	});

	subscription.unsubscribe();
	await lix.close();
});
