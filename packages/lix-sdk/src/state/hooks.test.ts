import { test, expect, describe } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { newLixFile } from "../lix/new-lix.js";

describe("onStateCommit", () => {
	test("fires when inserting data", async () => {
		const lix = await openLix({ blob: await newLixFile() });

		// Register hook
		let hookCallCount = 0;
		const unsubscribe = lix.hooks.onStateCommit(() => {
			hookCallCount++;
		});

		// Execute an INSERT
		await lix.db
			.insertInto("key_value")
			.values({ key: "test", value: "value" })
			.execute();

		// Hook should fire once for the commit
		expect(hookCallCount).toBe(1);

		unsubscribe();
	});

	test("fires when updating data", async () => {
		const lix = await openLix({ blob: await newLixFile() });

		// Insert initial data
		await lix.db
			.insertInto("key_value")
			.values({ key: "test", value: "initial" })
			.execute();

		// Register hook after initial data
		let hookCallCount = 0;
		const unsubscribe = lix.hooks.onStateCommit(() => {
			hookCallCount++;
		});

		// Execute an UPDATE
		await lix.db
			.updateTable("key_value")
			.set({ value: "updated" })
			.where("key", "=", "test")
			.execute();

		// Hook should fire once for the commit
		expect(hookCallCount).toBe(1);

		unsubscribe();
	});

	test("fires when deleting data", async () => {
		const lix = await openLix({ blob: await newLixFile() });

		// Insert initial data
		await lix.db
			.insertInto("key_value")
			.values({ key: "test", value: "value" })
			.execute();

		// Register hook after initial data
		let hookCallCount = 0;
		const unsubscribe = lix.hooks.onStateCommit(() => {
			hookCallCount++;
		});

		// Execute a DELETE
		await lix.db.deleteFrom("key_value").where("key", "=", "test").execute();

		// Hook should fire once for the commit
		expect(hookCallCount).toBe(1);

		unsubscribe();
	});

	test("fires for batch operations", async () => {
		const lix = await openLix({ blob: await newLixFile() });

		// Register hook
		let hookCallCount = 0;
		const unsubscribe = lix.hooks.onStateCommit(() => {
			hookCallCount++;
		});

		// Execute multiple INSERTs in one operation
		await lix.db
			.insertInto("key_value")
			.values([
				{ key: "test1", value: "value1" },
				{ key: "test2", value: "value2" },
				{ key: "test3", value: "value3" },
			])
			.execute();

		// Hook should fire once for the single commit
		expect(hookCallCount).toBe(1);

		unsubscribe();
	});

	test("fires once per transaction", async () => {
		const lix = await openLix({ blob: await newLixFile() });

		// Register hook
		let hookCallCount = 0;
		const unsubscribe = lix.hooks.onStateCommit(() => {
			hookCallCount++;
		});

		// Execute multiple separate operations
		await lix.db
			.insertInto("key_value")
			.values({ key: "test1", value: "value1" })
			.execute();

		await lix.db
			.insertInto("key_value")
			.values({ key: "test2", value: "value2" })
			.execute();

		await lix.db
			.updateTable("key_value")
			.set({ value: "updated" })
			.where("key", "=", "test1")
			.execute();

		// Hook should fire once for each operation
		expect(hookCallCount).toBe(3);

		unsubscribe();
	});

	test("multiple listeners all fire", async () => {
		const lix = await openLix({ blob: await newLixFile() });

		// Register multiple hooks
		let listener1Count = 0;
		let listener2Count = 0;
		let listener3Count = 0;

		const unsubscribe1 = lix.hooks.onStateCommit(() => {
			listener1Count++;
		});

		const unsubscribe2 = lix.hooks.onStateCommit(() => {
			listener2Count++;
		});

		const unsubscribe3 = lix.hooks.onStateCommit(() => {
			listener3Count++;
		});

		// Execute an operation
		await lix.db
			.insertInto("key_value")
			.values({ key: "test", value: "value" })
			.execute();

		// All listeners should have fired
		expect(listener1Count).toBe(1);
		expect(listener2Count).toBe(1);
		expect(listener3Count).toBe(1);

		unsubscribe1();
		unsubscribe2();
		unsubscribe3();
	});

	test("unsubscribed listeners do not fire", async () => {
		const lix = await openLix({ blob: await newLixFile() });

		// Register hook
		let hookCallCount = 0;
		const unsubscribe = lix.hooks.onStateCommit(() => {
			hookCallCount++;
		});

		// First operation - hook should fire
		await lix.db
			.insertInto("key_value")
			.values({ key: "test1", value: "value1" })
			.execute();
		expect(hookCallCount).toBe(1);

		// Unsubscribe
		unsubscribe();

		// Second operation - hook should not fire
		await lix.db
			.insertInto("key_value")
			.values({ key: "test2", value: "value2" })
			.execute();
		expect(hookCallCount).toBe(1); // Should not increase
	});

	test("does not fire for SELECT operations", async () => {
		const lix = await openLix({ blob: await newLixFile() });

		// Insert some data first
		await lix.db
			.insertInto("key_value")
			.values({ key: "test", value: "value" })
			.execute();

		// Register hook
		let hookCallCount = 0;
		const unsubscribe = lix.hooks.onStateCommit(() => {
			hookCallCount++;
		});

		// Execute SELECT operations
		await lix.db.selectFrom("key_value").selectAll().execute();
		await lix.db.selectFrom("state").selectAll().execute();
		await lix.db
			.selectFrom("key_value")
			.where("key", "=", "test")
			.selectAll()
			.execute();

		// Hook should not fire for SELECT operations
		expect(hookCallCount).toBe(0);

		unsubscribe();
	});

	test("hook can access lix instance via closure", async () => {
		const lix = await openLix({ blob: await newLixFile() });

		// Register hook that uses lix instance
		let capturedValue: any = null;
		const unsubscribe = lix.hooks.onStateCommit(() => {
			// Access lix instance in the hook
			capturedValue = lix.db;
		});

		// Execute an operation
		await lix.db
			.insertInto("key_value")
			.values({ key: "test", value: "value" })
			.execute();

		// Hook should have access to lix instance
		expect(capturedValue).toBeDefined();
		expect(capturedValue).toBe(lix.db);

		unsubscribe();
	});

	// TODO hooks throwing is uncaught
	test.todo("errors in hook do not prevent commit", async () => {
		const lix = await openLix({ blob: await newLixFile() });

		// Register hook that throws an error
		const unsubscribe = lix.hooks.onStateCommit(() => {
			throw new Error("Hook error");
		});

		// Operation should still succeed despite hook error
		await expect(
			lix.db
				.insertInto("key_value")
				.values({ key: "test", value: "value" })
				.execute()
		).resolves.not.toThrow();

		// Verify data was inserted
		const result = await lix.db
			.selectFrom("key_value")
			.where("key", "=", "test")
			.selectAll()
			.execute();
		expect(result).toHaveLength(1);

		unsubscribe();
	});
});