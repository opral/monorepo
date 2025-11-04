import { afterAll, beforeAll, beforeEach, bench, describe } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { mockJsonPlugin } from "../../plugin/mock-json-plugin.js";

const NUM_FILES = 1;
const NUM_READS = 10;

type FileBenchCtx = Awaited<ReturnType<typeof openLix>>;

async function createFileBenchCtx(): Promise<FileBenchCtx> {
	return openLix({ providePlugins: [mockJsonPlugin] });
}

async function clearFiles(lix: FileBenchCtx): Promise<void> {
	await lix.db.deleteFrom("file").execute();
}

describe("sequential file reads - unique files", () => {
	let lix: FileBenchCtx;

	beforeAll(async () => {
		lix = await createFileBenchCtx();
	});

	afterAll(async () => {
		await lix.close();
	});

	beforeEach(async () => {
		await clearFiles(lix);

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
	});

	bench("sequential file reads - unique files", async () => {
		for (let i = 0; i < NUM_FILES; i++) {
			await lix.db
				.selectFrom("file")
				.where("id", "=", `file_${i}`)
				.selectAll()
				.executeTakeFirst();
		}
	});
});

describe("repeated file reads - same file (cache hit scenario)", () => {
	let lix: FileBenchCtx;

	beforeAll(async () => {
		lix = await createFileBenchCtx();
	});

	afterAll(async () => {
		await lix.close();
	});

	beforeEach(async () => {
		await clearFiles(lix);

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
	});

	bench("repeated file reads - same file (cache hit scenario)", async () => {
		for (let i = 0; i < NUM_READS; i++) {
			await lix.db
				.selectFrom("file")
				.where("id", "=", "cached_file")
				.selectAll()
				.executeTakeFirst();
		}
	});
});

describe("mixed file read pattern - 80/20 distribution", () => {
	let lix: FileBenchCtx;
	let hotFileIds: string[];
	let coldFileIds: string[];

	beforeAll(async () => {
		lix = await createFileBenchCtx();
	});

	afterAll(async () => {
		await lix.close();
	});

	beforeEach(async () => {
		await clearFiles(lix);

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

		hotFileIds = files.slice(0, 4).map((f) => f.id);
		coldFileIds = files.slice(4).map((f) => f.id);
	});

	bench("mixed file read pattern - 80/20 distribution", async () => {
		let toggle = 0;
		for (let i = 0; i < NUM_READS; i++) {
			const fileId =
				toggle % 5 !== 0
					? hotFileIds[(toggle / 5) % hotFileIds.length]!
					: coldFileIds[(toggle / 5) % coldFileIds.length]!;
			await lix.db
				.selectFrom("file")
				.where("id", "=", fileId)
				.selectAll()
				.executeTakeFirst();
			toggle++;
		}
	});
});

describe("batch file reads - select multiple files", () => {
	let lix: FileBenchCtx;

	beforeAll(async () => {
		lix = await createFileBenchCtx();
	});

	afterAll(async () => {
		await lix.close();
	});

	beforeEach(async () => {
		await clearFiles(lix);

		const files = Array.from({ length: Math.max(NUM_FILES, 50) }, (_, i) => ({
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
	});

	bench("batch file reads - select multiple files", async () => {
		for (let i = 0; i < Math.max(NUM_FILES, 50); i += 10) {
			const fileIds = Array.from(
				{ length: 10 },
				(_, j) => `batch_file_${i + j}`
			);
			await lix.db
				.selectFrom("file")
				.where("id", "in", fileIds)
				.selectAll()
				.execute();
		}
	});
});

describe("file reads with varying sizes", () => {
	let lix: FileBenchCtx;
	let files: { id: string }[];

	beforeAll(async () => {
		lix = await createFileBenchCtx();
	});

	afterAll(async () => {
		await lix.close();
	});

	beforeEach(async () => {
		await clearFiles(lix);

		files = Array.from({ length: 10 }, (_, i) => {
			const size = Math.pow(2, i);
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
	});

	bench("file reads with varying sizes", async () => {
		for (const file of files) {
			await lix.db
				.selectFrom("file")
				.where("id", "=", file.id)
				.selectAll()
				.executeTakeFirst();
		}
	});
});

describe("file read with path-based queries", () => {
	let lix: FileBenchCtx;

	beforeAll(async () => {
		lix = await createFileBenchCtx();
	});

	afterAll(async () => {
		await lix.close();
	});

	beforeEach(async () => {
		await clearFiles(lix);

		const files = Array.from({ length: Math.max(NUM_FILES, 100) }, (_, i) => ({
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
	});

	bench("file read with path-based queries", async () => {
		for (let i = 0; i < 10; i++) {
			await lix.db
				.selectFrom("file")
				.where("path", "like", `/project/src/module_${i}/%`)
				.selectAll()
				.execute();
		}
	});
});

bench.todo("concurrent file reads - parallel access");
