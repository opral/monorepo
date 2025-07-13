import { expect, test } from "vitest";
import { InMemoryStorage } from "./in-memory.js";
import { openLix } from "../open-lix.js";

test("should open a database with new lix on first call", async () => {
	const storage = new InMemoryStorage();
	const lix = await openLix({ storage });

	const lixId = await lix.db
		.selectFrom("key_value")
		.select("value")
		.where("key", "=", "lix_id")
		.executeTakeFirstOrThrow();

	expect(lixId.value).toBeDefined();
	expect(typeof lixId.value).toBe("string");
});

test("should return same database instance on subsequent calls", async () => {
	const storage = new InMemoryStorage();
	const database1 = await storage.open();
	const database2 = await storage.open();

	expect(database1).toBe(database2);
});

test("should export current database state as blob", async () => {
	const storage = new InMemoryStorage();
	const lix = await openLix({ storage });

	// Add some test data
	await lix.db
		.insertInto("file")
		.values({
			id: "test-file",
			path: "/test.txt",
			data: new TextEncoder().encode("test content"),
		})
		.execute();

	const blob = await storage.export();

	// Create new storage and import the blob
	const newStorage = new InMemoryStorage();
	const newLix = await openLix({ storage: newStorage, blob });

	// Verify the data was exported and imported correctly
	const files = await newLix.db.selectFrom("file").selectAll().execute();
	expect(files).toHaveLength(1);
	expect(files[0]).toMatchObject({
		id: "test-file",
		path: "/test.txt",
		data: new TextEncoder().encode("test content"),
	});
});

test("should close database connection", async () => {
	const storage = new InMemoryStorage();
	const database1 = await storage.open();

	await storage.close();

	// Opening again should create a new database
	const database2 = await storage.open();
	expect(database1).not.toBe(database2);
});


test("should handle export before open", async () => {
	const storage = new InMemoryStorage();

	// Export should work even if we haven't opened yet
	const blob = await storage.export();

	expect(blob).toBeInstanceOf(Blob);
	expect(blob.size).toBeGreaterThan(0);
});

test("multiple storage instances should be independent", async () => {
	const storage1 = new InMemoryStorage();
	const storage2 = new InMemoryStorage();

	const lix1 = await openLix({ storage: storage1 });
	const lix2 = await openLix({ storage: storage2 });

	// Add data to first instance
	await lix1.db
		.insertInto("file")
		.values({
			id: "file1",
			path: "/test1.txt",
			data: new TextEncoder().encode("data1"),
		})
		.execute();

	// Second instance should not have the data
	const files2 = await lix2.db.selectFrom("file").selectAll().execute();
	expect(files2).toHaveLength(0);

	// First instance should still have the data
	const files1 = await lix1.db.selectFrom("file").selectAll().execute();
	expect(files1).toHaveLength(1);
	expect(files1[0]).toMatchObject({
		id: "file1",
		path: "/test1.txt",
	});
});
