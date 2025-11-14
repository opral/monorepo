import { promises as fs } from "fs";
import { afterAll, bench, describe } from "vitest";
import { openLix } from "../../../lix/open-lix.js";
import { createPreprocessor } from "../create-preprocessor.js";

const BENCH_OUTPUT_DIR = decodeURIComponent(
	new URL("./__bench__", import.meta.url).pathname
);

describe("entity view select rewrite", async () => {
	const ENTITY_SCHEMA = {
		"x-lix-key": "bench_entity_view",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		type: "object",
		properties: {
			id: { type: "string" },
			foo: { type: "string" },
		},
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

	afterAll(async () => {
		await lix.close();
	});

	await lix.db
		.insertInto("stored_schema")
		.values({ value: ENTITY_SCHEMA })
		.execute();

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	const ROW_COUNT = 100;
	const entities = Array.from({ length: ROW_COUNT }, (_, index) => ({
		entity_id: `entity_${index}`,
		schema_key: ENTITY_SCHEMA["x-lix-key"],
		file_id: `file_${Math.floor(index / 10)}`,
		version_id: activeVersion.version_id,
		plugin_key: "lix_sdk",
		snapshot_content: {
			id: `entity_${index}`,
			foo: `/segments/${Math.floor(index / 5)}/value_${index}`,
		},
		schema_version: ENTITY_SCHEMA["x-lix-version"],
		metadata: null,
		untracked: false,
	}));

	await lix.db.insertInto("state_by_version").values(entities).execute();

	const preprocess = createPreprocessor({ engine: lix.engine! });
	const selectAllSql = "SELECT foo FROM bench_entity_view";
	const selectWithFilterSql = "SELECT foo FROM bench_entity_view WHERE id = ?";

	const idParameters = Array.from({ length: 20 }, (_, index) => [
		`entity_${index}`,
	]);

	await exportExplain({
		lix,
		preprocess,
		label: "entity view select • all rows",
		sql: selectAllSql,
		parameters: [],
	});
	await exportExplain({
		lix,
		preprocess,
		label: "entity view select • id filter",
		sql: selectWithFilterSql,
		parameters: ["entity_0"],
	});

	bench("entity view select without filter", async () => {
		try {
			for (let i = 0; i < 10; i++) {
				const rewritten = preprocess({
					sql: selectAllSql,
					parameters: [],
				});
				await lix.engine!.sqlite.exec({
					sql: rewritten.sql,
					bind: rewritten.parameters as any[],
					returnValue: "resultRows",
					rowMode: "array",
					columnNames: [],
				});
			}
		} catch (error) {
			console.error("Bench 'entity view select without filter' failed", error);
			throw error;
		}
	});

	bench("entity view select with id filter", async () => {
		try {
			for (const parameters of idParameters) {
				const rewritten = preprocess({
					sql: selectWithFilterSql,
					parameters,
				});
				await lix.engine!.sqlite.exec({
					sql: rewritten.sql,
					bind: rewritten.parameters as any[],
					returnValue: "resultRows",
					rowMode: "array",
					columnNames: [],
				});
			}
		} catch (error) {
			console.error("Bench 'entity view select with id filter' failed", error);
			throw error;
		}
	});
});

async function exportExplain(args: {
	lix: Awaited<ReturnType<typeof openLix>>;
	preprocess: ReturnType<typeof createPreprocessor>;
	label: string;
	sql: string;
	parameters: unknown[];
}) {
	await fs.mkdir(BENCH_OUTPUT_DIR, { recursive: true });
	const slug = args.label
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	const outputPath = `${BENCH_OUTPUT_DIR}/${slug}.explain.txt`;
	const rewritten = args.preprocess({
		sql: args.sql,
		parameters: args.parameters,
	});
	const explain = (await args.lix.call("lix_explain_query", {
		sql: rewritten.sql,
		parameters: [...rewritten.parameters],
	})) as {
		originalSql: string;
		rewrittenSql: string | null;
		plan: unknown;
	};
	const payload = [
		"-- label --",
		args.label,
		"\n-- original SQL --",
		args.sql,
		"\n-- rewritten SQL --",
		rewritten.sql,
		"\n-- plan --",
		JSON.stringify(explain.plan, null, 2),
		"",
	].join("\n");
	await fs.writeFile(outputPath, payload, "utf8");
}
