import { test, expect } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { mockJsonPlugin } from "../../plugin/mock-json-plugin.js";
import type { Lix } from "../../lix/open-lix.js";

// Helper function to query cache directly
function getFileDataCache(args: {
	lix: Pick<Lix, "sqlite">;
	fileId: string;
	versionId: string;
}): Uint8Array | undefined {
	const result = args.lix.sqlite.exec({
		sql: `
			SELECT data 
			FROM internal_file_data_cache 
			WHERE file_id = ? 
			AND version_id = ?
		`,
		bind: [args.fileId, args.versionId],
		returnValue: "resultRows",
	});
	return result[0]?.[0] as Uint8Array | undefined;
}

/**
 * File data caching uses READ-THROUGH caching, not write-through.
 *
 * Why read-through instead of write-through?
 * 1. File writes receive raw data, but the cache needs materialized data (after plugin processing)
 * 2. Materializing on every write would make writes slow
 * 3. There could be consistency gaps between written raw data and cached materialized data
 *
 * Trade-offs:
 * - First read after insert/update has a cache miss (slower)
 * - But writes remain fast and cache consistency is guaranteed
 * - Cache is only populated when actually needed
 */
test("file data cache - read-through caching", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
	});

	const testData = new TextEncoder().encode(
		JSON.stringify({
			id: "test_file",
			content: "Test content",
		})
	);

	// Insert a file
	await lix.db
		.insertInto("file")
		.values({
			id: "test_file",
			path: "/test/file.json",
			data: testData,
		})
		.execute();

	// Get active version
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	// Cache should be empty initially (read-through caching)
	let cachedData = getFileDataCache({
		lix,
		fileId: "test_file",
		versionId: activeVersion.version_id,
	});
	expect(cachedData).toBeUndefined();

	// First read - should populate cache
	const file = await lix.db
		.selectFrom("file")
		.where("id", "=", "test_file")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(file.data).toEqual(testData);

	// Now cache should be populated
	cachedData = getFileDataCache({
		lix,
		fileId: "test_file",
		versionId: activeVersion.version_id,
	});
	expect(cachedData).toBeDefined();
	expect(cachedData).toEqual(testData);
});

test("file data cache - update invalidates and rewrites cache", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
	});

	const initialData = new TextEncoder().encode(
		JSON.stringify({
			id: "update_file",
			content: "Initial content",
		})
	);

	// Insert initial file
	await lix.db
		.insertInto("file")
		.values({
			id: "update_file",
			path: "/test/update.json",
			data: initialData,
		})
		.execute();

	// Get active version
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	// First read to populate cache
	let file = await lix.db
		.selectFrom("file")
		.where("id", "=", "update_file")
		.selectAll()
		.executeTakeFirstOrThrow();
	expect(file.data).toEqual(initialData);

	// Verify initial cache
	let cachedData = getFileDataCache({
		lix,
		fileId: "update_file",
		versionId: activeVersion.version_id,
	});
	expect(cachedData).toEqual(initialData);

	// Update the file
	const updatedData = new TextEncoder().encode(
		JSON.stringify({
			id: "update_file",
			content: "Updated content",
			newField: "New data",
		})
	);

	await lix.db
		.updateTable("file")
		.where("id", "=", "update_file")
		.set({
			data: updatedData,
		})
		.execute();

	// Check cache was cleared after update (read-through caching)
	cachedData = getFileDataCache({
		lix,
		fileId: "update_file",
		versionId: activeVersion.version_id,
	});
	expect(cachedData).toBeUndefined();

	// Read the file - should materialize and cache updated data
	file = await lix.db
		.selectFrom("file")
		.where("id", "=", "update_file")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(file.data).toEqual(updatedData);

	// Now cache should be populated with updated data
	cachedData = getFileDataCache({
		lix,
		fileId: "update_file",
		versionId: activeVersion.version_id,
	});
	expect(cachedData).toEqual(updatedData);
});

// test("file data cache - performance improvement for repeated reads", async () => {
// 	const lix = await openLix({
// 		providePlugins: [mockJsonPlugin],
// 	});

// 	const testData = new TextEncoder().encode(
// 		JSON.stringify({
// 			id: "perf_file",
// 			content: "Performance test content",
// 			largeData: Array(1000).fill("data"),
// 		})
// 	);

// 	// Insert a file
// 	await lix.db
// 		.insertInto("file")
// 		.values({
// 			id: "perf_file",
// 			path: "/test/perf.json",
// 			data: testData,
// 		})
// 		.execute();

// 	// First read - populates cache
// 	const start1 = performance.now();
// 	const [file1] = await lix.db
// 		.selectFrom("file")
// 		.where("id", "=", "perf_file")
// 		.selectAll()
// 		.execute();
// 	const time1 = performance.now() - start1;

// 	// Second read - should use cache and be faster
// 	const start2 = performance.now();
// 	const [file2] = await lix.db
// 		.selectFrom("file")
// 		.where("id", "=", "perf_file")
// 		.selectAll()
// 		.execute();
// 	const time2 = performance.now() - start2;

// 	// Multiple reads to average out timing variations
// 	const times = [];
// 	for (let i = 0; i < 10; i++) {
// 		const start = performance.now();
// 		await lix.db
// 			.selectFrom("file")
// 			.where("id", "=", "perf_file")
// 			.selectAll()
// 			.executeTakeFirst();
// 		times.push(performance.now() - start);
// 	}
// 	const avgCachedTime = times.reduce((a, b) => a + b, 0) / times.length;

// 	// Files should be identical
// 	expect(file1.data).toEqual(file2.data);
// 	expect(file1.data).toEqual(testData);

// 	// Log the timing results for visibility
// 	console.log(`First read (cold): ${time1.toFixed(2)}ms`);
// 	console.log(`Second read (cached): ${time2.toFixed(2)}ms`);
// 	console.log(`Average cached read (10 reads): ${avgCachedTime.toFixed(2)}ms`);

// 	// Cache reads should generally be faster, but we won't assert this
// 	// as timing can vary in CI environments
// });

test("file data cache - cache is cleared when file is deleted", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
	});

	const testData = new TextEncoder().encode(
		JSON.stringify({
			id: "delete_test_file",
			content: "File to be deleted",
		})
	);

	// Insert a file - should trigger write-through caching
	await lix.db
		.insertInto("file")
		.values({
			id: "delete_test_file",
			path: "/test/delete.json",
			data: testData,
		})
		.execute();

	// Get active version
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	// First read to populate cache
	const file = await lix.db
		.selectFrom("file")
		.where("id", "=", "delete_test_file")
		.selectAll()
		.executeTakeFirstOrThrow();
	expect(file.data).toEqual(testData);

	// Verify cache was populated
	let cachedData = getFileDataCache({
		lix,
		fileId: "delete_test_file",
		versionId: activeVersion.version_id,
	});
	expect(cachedData).toBeDefined();
	expect(cachedData).toEqual(testData);

	// Delete the file
	await lix.db
		.deleteFrom("file")
		.where("id", "=", "delete_test_file")
		.execute();

	// Verify cache was cleared
	cachedData = getFileDataCache({
		lix,
		fileId: "delete_test_file",
		versionId: activeVersion.version_id,
	});
	expect(cachedData).toBeUndefined();
});
