import { promises as fs } from "fs";
import { bench, describe } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { mockJsonPlugin } from "../plugin/mock-json-plugin.js";

const BENCH_OUTPUT_DIR = decodeURIComponent(
	new URL("./__bench__", import.meta.url).pathname
);

describe("sequential file reads - unique files", async () => {
	const NUM_FILES = 10;
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

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

	const selectFileByIdQuery = (id: string) =>
		lix.db.selectFrom("file").where("id", "=", id).selectAll();

	await exportExplainPlan({
		lix,
		label: "sequential file reads - unique files",
		query: selectFileByIdQuery("file_0").compile(),
	});

	bench("", async () => {
		try {
			for (let i = 0; i < NUM_FILES; i++) {
				await selectFileByIdQuery(`file_${i}`).executeTakeFirst();
			}
		} catch (error) {
			console.error(
				"Bench 'sequential file reads - unique files' failed",
				error
			);
			throw error;
		}
	});
});

describe("repeated file reads - same file (cache hit scenario)", async () => {
	const NUM_READS = 10;
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

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

	const selectCachedFileQuery = lix.db
		.selectFrom("file")
		.where("id", "=", "cached_file")
		.selectAll();

	await exportExplainPlan({
		lix,
		label: "repeated file reads - same file (cache hit scenario)",
		query: selectCachedFileQuery.compile(),
	});

	bench("", async () => {
		try {
			for (let i = 0; i < NUM_READS; i++) {
				await selectCachedFileQuery.executeTakeFirst();
			}
		} catch (error) {
			console.error(
				"Bench 'repeated file reads - same file (cache hit scenario)' failed",
				error
			);
			throw error;
		}
	});
});

describe("mixed file read pattern - 80/20 distribution", async () => {
	const NUM_READS = 10;
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

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

	const hotFileIds = files.slice(0, 4).map((f) => f.id);
	const coldFileIds = files.slice(4).map((f) => f.id);

	const selectMixedFileQuery = (id: string) =>
		lix.db.selectFrom("file").where("id", "=", id).selectAll();

	await exportExplainPlan({
		lix,
		label: "mixed file read pattern - 80/20 distribution",
		query: selectMixedFileQuery(hotFileIds[0]!).compile(),
	});

	bench("", async () => {
		let toggle = 0;

		try {
			for (let i = 0; i < NUM_READS; i++) {
				const fileId =
					toggle % 5 !== 0
						? hotFileIds[(toggle / 5) % hotFileIds.length]!
						: coldFileIds[(toggle / 5) % coldFileIds.length]!;
				await selectMixedFileQuery(fileId).executeTakeFirst();
				toggle++;
			}
		} catch (error) {
			console.error(
				"Bench 'mixed file read pattern - 80/20 distribution' failed",
				error
			);
			throw error;
		}
	});
});

describe("batch file reads - select multiple files", async () => {
	const NUM_FILES = 10;
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

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

	const selectBatchQuery = (fileIds: string[]) =>
		lix.db.selectFrom("file").where("id", "in", fileIds).selectAll();

	await exportExplainPlan({
		lix,
		label: "batch file reads - select multiple files",
		query: selectBatchQuery(
			Array.from({ length: 10 }, (_, j) => `batch_file_${j}`)
		).compile(),
	});

	bench("", async () => {
		try {
			for (let i = 0; i < Math.max(NUM_FILES, 50); i += 10) {
				const fileIds = Array.from(
					{ length: 10 },
					(_, j) => `batch_file_${i + j}`
				);
				await selectBatchQuery(fileIds).execute();
			}
		} catch (error) {
			console.error(
				"Bench 'batch file reads - select multiple files' failed",
				error
			);
			throw error;
		}
	});
});

describe("file reads with varying sizes", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	const files = Array.from({ length: 10 }, (_, i) => {
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

	const selectSizedFileQuery = (fileId: string) =>
		lix.db.selectFrom("file").where("id", "=", fileId).selectAll();

	await exportExplainPlan({
		lix,
		label: "file reads with varying sizes",
		query: selectSizedFileQuery("sized_file_0").compile(),
	});

	bench("", async () => {
		try {
			for (const file of files) {
				await selectSizedFileQuery(file.id).executeTakeFirst();
			}
		} catch (error) {
			console.error("Bench 'file reads with varying sizes' failed", error);
			throw error;
		}
	});
});

describe("file read with path-based LIKE", async () => {
	const NUM_FILES = 10;
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

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

	const selectPathLikeQuery = (moduleIndex: number) =>
		lix.db
			.selectFrom("file")
			.where("path", "like", `/project/src/module_${moduleIndex}/%`)
			.selectAll();

	await exportExplainPlan({
		lix,
		label: "file read with path-based LIKE",
		query: selectPathLikeQuery(0).compile(),
	});

	bench("", async () => {
		try {
			for (let i = 0; i < 10; i++) {
				await selectPathLikeQuery(i).execute();
			}
		} catch (error) {
			console.error("Bench 'file read with path-based queries' failed", error);
			throw error;
		}
	});
});

describe("file read by exact path", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	const targetPath = "/exact-path-file.json";

	await lix.db
		.insertInto("file")
		.values({
			id: "exact_path_file",
			path: targetPath,
			data: new TextEncoder().encode(
				JSON.stringify({ greeting: "Hello from exact path" })
			),
		})
		.execute();

	const selectExactPathQuery = lix.db
		.selectFrom("file")
		.selectAll()
		.where("path", "=", targetPath);

	await exportExplainPlan({
		lix,
		label: "file read by exact path",
		query: selectExactPathQuery.compile(),
	});

	bench("", async () => {
		try {
			await selectExactPathQuery.executeTakeFirst();
		} catch (error) {
			console.error("Bench 'file read by exact path' failed", error);
			throw error;
		}
	});
});

describe("file read excluding file path via NOT LIKE", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	await lix.db
		.insertInto("file")
		.values([
			{
				id: "scan_db",
				path: "/project/db.sqlite",
				data: new TextEncoder().encode("sqlite"),
			},
			{
				id: "scan_settings",
				path: "/project/settings.json",
				data: new TextEncoder().encode("{}"),
			},
		])
		.execute();

	const selectNotLikeQuery = lix.db
		.selectFrom("file")
		.where("path", "not like", "%db.sqlite")
		.select(["path", "data", "lixcol_writer_key"]);

	await exportExplainPlan({
		lix,
		label: "file read excluding file path via NOT LIKE",
		query: selectNotLikeQuery.compile(),
	});

	bench("", async () => {
		try {
			await selectNotLikeQuery.execute();
		} catch (error) {
			console.error(
				"Bench 'file read excluding file path via NOT LIKE' failed",
				error
			);
			throw error;
		}
	});
});

describe("file table full scan", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	await lix.db
		.insertInto("file")
		.values(
			Array.from({ length: 25 }, (_, i) => ({
				id: `full_scan_${i}`,
				path: `/full-scan/file-${i}.json`,
				data: new TextEncoder().encode(JSON.stringify({ index: i })),
			}))
		)
		.execute();

	const selectFullScanQuery = lix.db.selectFrom("file").selectAll();

	await exportExplainPlan({
		lix,
		label: "file table full scan",
		query: selectFullScanQuery.compile(),
	});

	bench("", async () => {
		try {
			await selectFullScanQuery.execute();
		} catch (error) {
			console.error("Bench 'file table full scan' failed", error);
			throw error;
		}
	});
});

describe("file update by path", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	const targetPath = "/update-target.json";

	await lix.db
		.insertInto("file")
		.values({
			id: "update_target",
			path: targetPath,
			data: new TextEncoder().encode(JSON.stringify({ greeting: "original" })),
		})
		.execute();

	const updatedData = new TextEncoder().encode(
		JSON.stringify({ greeting: "updated" })
	);

	const updateByPathQuery = lix.db
		.updateTable("file")
		.set({
			data: updatedData,
		})
		.where("path", "=", targetPath);

	await exportExplainPlan({
		lix,
		label: "file update by path",
		query: updateByPathQuery.compile(),
	});

	bench("", async () => {
		try {
			await updateByPathQuery.execute();
		} catch (error) {
			console.error("Bench 'file update by path' failed", error);
			throw error;
		}
	});
});

describe("file insert operations", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	let insertCounter = 0;

	const buildInsertFileQuery = (identifier: string | number) => {
		const suffix = String(identifier);
		return lix.db.insertInto("file").values({
			id: `insert_bench_${suffix}`,
			path: `/bench-insert/file-${suffix}.json`,
			data: new TextEncoder().encode(
				JSON.stringify({ greeting: `insert ${suffix}` })
			),
		});
	};

	await exportExplainPlan({
		lix,
		label: "file insert operations",
		query: buildInsertFileQuery("plan").compile(),
	});

	bench("", async () => {
		try {
			const index = insertCounter++;
			await buildInsertFileQuery(index).execute();
		} catch (error) {
			console.error("Bench 'file insert operations' failed", error);
			throw error;
		}
	});
});

describe("file delete operations", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	let deleteCounter = 0;

	const buildDeleteInsertQuery = (args: {
		id: string;
		path: string;
		greeting: string;
	}) =>
		lix.db.insertInto("file").values({
			id: args.id,
			path: args.path,
			data: new TextEncoder().encode(
				JSON.stringify({ greeting: args.greeting })
			),
		});

	const buildDeleteQuery = (path: string) =>
		lix.db.deleteFrom("file").where("path", "=", path);

	await exportExplainPlan({
		lix,
		label: "file delete operations - insert",
		query: buildDeleteInsertQuery({
			id: "delete_bench_plan",
			path: `/bench-delete/file-plan.json`,
			greeting: "delete plan",
		}).compile(),
	});

	await exportExplainPlan({
		lix,
		label: "file delete operations - delete",
		query: buildDeleteQuery(`/bench-delete/file-plan.json`).compile(),
	});

	bench("", async () => {
		try {
			const index = deleteCounter++;
			const targetPath = `/bench-delete/file-${index}.json`;

			await buildDeleteInsertQuery({
				id: `delete_bench_${index}`,
				path: targetPath,
				greeting: `delete ${index}`,
			}).execute();

			await buildDeleteQuery(targetPath).execute();
		} catch (error) {
			console.error("Bench 'file delete operations' failed", error);
			throw error;
		}
	});
});

async function exportExplainPlan(args: {
	lix: Awaited<ReturnType<typeof openLix>>;
	label: string;
	query: { sql: string; parameters: readonly unknown[] };
}) {
	await fs.mkdir(BENCH_OUTPUT_DIR, { recursive: true });
	const slug = args.label
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	const outputPath = `${BENCH_OUTPUT_DIR}/${slug}.explain.txt`;
	const explain = (await args.lix.call("lix_explain_query", {
		sql: args.query.sql,
		parameters: [...args.query.parameters],
	})) as {
		originalSql: string;
		rewrittenSql: string | null;
		plan: unknown;
	};
	const payload = [
		"-- label --",
		args.label,
		"\n-- original SQL --",
		explain.originalSql,
		"\n-- rewritten SQL --",
		explain.rewrittenSql ?? "<unchanged>",
		"\n-- plan --",
		JSON.stringify(explain.plan, null, 2),
		"",
	].join("\n");
	await fs.writeFile(outputPath, payload, "utf8");
}
