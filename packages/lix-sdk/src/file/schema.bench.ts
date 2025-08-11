import { bench } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { mockJsonPlugin } from "../plugin/mock-json-plugin.js";

const NUM_FILES = 1;
const NUM_READS = 10;

/**
 * Benchmarks for file operations to measure the impact of caching.
 *
 * These benchmarks test:
 * 1. Reading multiple files sequentially
 * 2. Reading the same file multiple times (cache hit scenario)
 * 3. Mixed read patterns (simulating real-world usage)
 * 4. File operations with varying sizes
 * 5. Concurrent file reads
 *
 * @example
 * pnpm exec vitest bench src/file/schema.bench.ts
 */

bench("sequential file reads - unique files", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
	});

	// Insert test files
	const files = Array.from({ length: NUM_FILES }, (_, i) => ({
		id: `file_${i}`,
		path: `/test/file_${i}.json`,
		data: new TextEncoder().encode(
			JSON.stringify({
				id: `file_${i}`,
				content: `Test content for file ${i}`,
				metadata: { index: i, type: "benchmark" },
				largeData: Array(100).fill(`data_${i}`),
			})
		),
	}));

	await lix.db.insertInto("file").values(files).execute();

	// Benchmark: Read all files sequentially
	for (let i = 0; i < NUM_FILES; i++) {
		await lix.db
			.selectFrom("file")
			.where("id", "=", `file_${i}`)
			.selectAll()
			.executeTakeFirst();
	}
});

bench("repeated file reads - same file (cache hit scenario)", async () => {
	try {
		const lix = await openLix({
			providePlugins: [mockJsonPlugin],
		});

		// Insert a single test file
		await lix.db
			.insertInto("file")
			.values({
				id: "cached_file",
				path: "/test/cached_file.json",
				data: new TextEncoder().encode(
					JSON.stringify({
						id: "cached_file",
						content: "Frequently accessed file content",
						metadata: { type: "hot_file" },
						largeData: Array(1000).fill("cached_data"),
					})
				),
			})
			.execute();

		// Benchmark: Read the same file multiple times
		for (let i = 0; i < NUM_READS; i++) {
			await lix.db
				.selectFrom("file")
				.where("id", "=", "cached_file")
				.selectAll()
				.executeTakeFirst();
		}
	} catch (error) {
		console.error("Error during repeated file reads benchmark:", error);
		throw error;
	}
});

bench("mixed file read pattern - 80/20 distribution", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
	});

	// Insert test files
	const files = Array.from({ length: 20 }, (_, i) => ({
		id: `mixed_file_${i}`,
		path: `/test/mixed_file_${i}.json`,
		data: new TextEncoder().encode(
			JSON.stringify({
				id: `mixed_file_${i}`,
				content: `Mixed pattern file ${i}`,
				metadata: { index: i },
			})
		),
	}));

	await lix.db.insertInto("file").values(files).execute();

	// Benchmark: 80% of reads on 20% of files (hot files)
	const hotFileIds = files.slice(0, 4).map((f) => f.id);
	const coldFileIds = files.slice(4).map((f) => f.id);

	for (let i = 0; i < NUM_READS; i++) {
		const fileId =
			Math.random() < 0.8
				? hotFileIds[Math.floor(Math.random() * hotFileIds.length)]!
				: coldFileIds[Math.floor(Math.random() * coldFileIds.length)]!;

		await lix.db
			.selectFrom("file")
			.where("id", "=", fileId)
			.selectAll()
			.executeTakeFirst();
	}
});

bench("batch file reads - select multiple files", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
	});

	// Insert test files
	const files = Array.from({ length: NUM_FILES }, (_, i) => ({
		id: `batch_file_${i}`,
		path: `/test/batch_file_${i}.json`,
		data: new TextEncoder().encode(
			JSON.stringify({
				id: `batch_file_${i}`,
				content: `Batch file ${i}`,
			})
		),
	}));

	await lix.db.insertInto("file").values(files).execute();

	// Benchmark: Read files in batches of 10
	for (let i = 0; i < NUM_FILES; i += 10) {
		const fileIds = Array.from({ length: 10 }, (_, j) => `batch_file_${i + j}`);
		await lix.db
			.selectFrom("file")
			.where("id", "in", fileIds)
			.selectAll()
			.execute();
	}
});

bench("file reads with varying sizes", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
	});

	// Insert files with varying sizes
	const files = Array.from({ length: 10 }, (_, i) => {
		const size = Math.pow(2, i); // Exponentially increasing sizes
		return {
			id: `sized_file_${i}`,
			path: `/test/sized_file_${i}.json`,
			data: new TextEncoder().encode(
				JSON.stringify({
					id: `sized_file_${i}`,
					content: `File with size factor ${size}`,
					largeData: Array(size * 10).fill(`data_${i}`),
				})
			),
		};
	});

	await lix.db.insertInto("file").values(files).execute();

	// Benchmark: Read files of different sizes
	for (const file of files) {
		await lix.db
			.selectFrom("file")
			.where("id", "=", file.id)
			.selectAll()
			.executeTakeFirst();
	}
});

bench("file read with path-based queries", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
	});

	// Insert test files with structured paths
	const files = Array.from({ length: NUM_FILES }, (_, i) => ({
		id: `path_file_${i}`,
		path: `/project/src/module_${Math.floor(i / 10)}/file_${i}.json`,
		data: new TextEncoder().encode(
			JSON.stringify({
				id: `path_file_${i}`,
				content: `Path-based file ${i}`,
			})
		),
	}));

	await lix.db.insertInto("file").values(files).execute();

	// Benchmark: Query files by path pattern
	for (let i = 0; i < 10; i++) {
		await lix.db
			.selectFrom("file")
			.where("path", "like", `/project/src/module_${i}/%`)
			.selectAll()
			.execute();
	}
});

bench.todo("concurrent file reads - parallel access");

bench.todo("file reads with cache invalidation");

bench.todo("memory usage during large file operations");
