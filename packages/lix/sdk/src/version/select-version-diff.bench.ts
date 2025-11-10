import { bench } from "vitest";
import { promises as fs } from "fs";
import { performance } from "node:perf_hooks";
import { openLix } from "../lix/open-lix.js";
import { createVersion } from "./create-version.js";
import { selectVersionDiff } from "./select-version-diff.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import { createExplainQuery } from "../engine/explain-query.js";

const COUNTS = {
	created: 10,
	updated: 10,
	deleted: 10,
} as const;

type Ctx = {
	lix: Awaited<ReturnType<typeof openLix>>;
	sourceId: string;
	targetId: string;
};

const readyCtx: Promise<Ctx> = (async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	const BENCH_STORED_SCHEMA: LixSchemaDefinition = {
		type: "object",
		additionalProperties: false,
		properties: {
			v: { type: "string" },
		},
		required: ["v"],
		"x-lix-key": "bench_diff_entity",
		"x-lix-version": "1.0",
	};

	await lix.db
		.insertInto("stored_schema")
		.values({ value: BENCH_STORED_SCHEMA })
		.execute();

	const source = await createVersion({ lix, name: "bench_source" });
	const target = await createVersion({ lix, name: "bench_target" });

	// Seed created (only in source)
	for (let i = 0; i < COUNTS.created; i++) {
		await lix.db
			.insertInto("state_by_version")
			.values({
				entity_id: `created_${i}`,
				schema_key: "bench_diff_entity",
				file_id: "bench_file",
				version_id: source.id,
				plugin_key: "bench_plugin",
				snapshot_content: { v: `${i}` },
				schema_version: "1.0",
			})
			.execute();
	}

	// Seed deleted (only in target)
	for (let i = 0; i < COUNTS.deleted; i++) {
		await lix.db
			.insertInto("state_by_version")
			.values({
				entity_id: `deleted_${i}`,
				schema_key: "bench_diff_entity",
				file_id: "bench_file",
				version_id: target.id,
				plugin_key: "bench_plugin",
				snapshot_content: { v: `${i}` },
				schema_version: "1.0",
			})
			.execute();
	}

	// Seed updated (present in both, different change ids/content)
	for (let i = 0; i < COUNTS.updated; i++) {
		const id = `updated_${i}`;
		// target first (older)
		await lix.db
			.insertInto("state_by_version")
			.values({
				entity_id: id,
				schema_key: "bench_diff_entity",
				file_id: "bench_file",
				version_id: target.id,
				plugin_key: "bench_plugin",
				snapshot_content: { v: "old" },
				schema_version: "1.0",
			})
			.execute();
		// source later (newer)
		await lix.db
			.insertInto("state_by_version")
			.values({
				entity_id: id,
				schema_key: "bench_diff_entity",
				file_id: "bench_file",
				version_id: source.id,
				plugin_key: "bench_plugin",
				snapshot_content: { v: "new" },
				schema_version: "1.0",
			})
			.execute();
	}

	await emitBenchExplains({
		lix,
		sourceId: source.id,
		targetId: target.id,
	});

	return { lix, sourceId: source.id, targetId: target.id } satisfies Ctx;
})();

bench("selectVersionDiff (exclude unchanged)", async () => {
	try {
		const { lix, sourceId, targetId } = await readyCtx;

		const qb = selectVersionDiff({
			lix,
			source: { id: sourceId },
			target: { id: targetId },
		}).where("diff.status", "!=", "unchanged");

		const rows = await qb.execute();
		// Consume result to prevent dead-code elimination
		if (!rows || rows.length === 0)
			throw new Error("unexpected empty diff in bench");
	} catch (error) {
		console.error("Error during selectVersionDiff bench:", error);
	}
});

bench("selectVersionDiff (full document diff)", async () => {
	const { lix, sourceId, targetId } = await readyCtx;
	const qb = selectVersionDiff({
		lix,
		source: { id: sourceId },
		target: { id: targetId },
	});

const rows = await qb.execute();
if (!rows || rows.length === 0)
	throw new Error("unexpected empty diff in bench");
});

type ExplainStage = ReturnType<ReturnType<typeof createExplainQuery>>;

type CapturedQuery = {
	sql: string;
	parameters: unknown[];
	stage: ExplainStage;
	durationMs: number;
};

const benchOutputDir = decodeURIComponent(
	new URL("./__bench__", import.meta.url).pathname
);
const excludePlanPath = decodeURIComponent(
	new URL(
		"./__bench__/select-version-diff.exclude-unchanged.plan.txt",
		import.meta.url
	).pathname
);
const fullPlanPath = decodeURIComponent(
	new URL(
		"./__bench__/select-version-diff.full.plan.txt",
		import.meta.url
	).pathname
);

async function emitBenchExplains(args: {
	lix: Awaited<ReturnType<typeof openLix>>;
	sourceId: string;
	targetId: string;
}) {
	const { lix, sourceId, targetId } = args;
	await fs.mkdir(benchOutputDir, { recursive: true });

	await captureBenchQuery({
		lix,
		outputPath: excludePlanPath,
		run: async () => {
			const qb = selectVersionDiff({
				lix,
				source: { id: sourceId },
				target: { id: targetId },
			}).where("diff.status", "!=", "unchanged");
			const rows = await qb.execute();
			if (!rows || rows.length === 0) {
				throw new Error("expected diff rows for exclude benchmark");
			}
		},
	});

	await captureBenchQuery({
		lix,
		outputPath: fullPlanPath,
		run: async () => {
			const qb = selectVersionDiff({
				lix,
				source: { id: sourceId },
				target: { id: targetId },
			});
			const rows = await qb.execute();
			if (!rows || rows.length === 0) {
				throw new Error("expected diff rows for full benchmark");
			}
		},
	});
}

async function captureBenchQuery(args: {
	lix: Awaited<ReturnType<typeof openLix>>;
	outputPath: string;
	run: () => Promise<void>;
}) {
	const { lix, outputPath, run } = args;
	const captured: CapturedQuery[] = [];
	const engine = lix.engine;
	if (!engine) {
		throw new Error("lix engine not initialized");
	}
	const originalExecute = engine.executeSync;
	const explain = createExplainQuery({ engine });
	let explaining = false;
	engine.executeSync = ((
		queryArgs: Parameters<typeof originalExecute>[0]
	) => {
		if (explaining) {
			return originalExecute(queryArgs);
		}
		const parameters = Array.isArray(queryArgs.parameters)
			? queryArgs.parameters
			: queryArgs.parameters
				? [queryArgs.parameters]
				: [];
		let stage: ExplainStage | null = null;
		try {
			explaining = true;
			stage = explain({
				sql: queryArgs.sql,
				parameters,
			});
		} finally {
			explaining = false;
		}
		const start = performance.now();
		try {
			return originalExecute(queryArgs);
		} finally {
			if (stage) {
				captured.push({
					sql: queryArgs.sql,
					parameters,
					stage,
					durationMs: performance.now() - start,
				});
			}
		}
	}) as typeof originalExecute;

	try {
		await run();
	} finally {
		engine.executeSync = originalExecute;
	}

	const text = formatExplainStages(captured);
	await fs.writeFile(outputPath, text, "utf8");
}

function formatExplainStages(entries: CapturedQuery[]): string {
	const now = new Date().toISOString();
	const sections = entries.map((entry, idx) => {
		const planLines =
			entry.stage.plan.length === 0
				? ["(no plan rows returned)"]
				: entry.stage.plan.map((planRow: Record<string, unknown>) =>
						Object.entries(planRow)
							.map(([key, value]) => `${key}=${value}`)
							.join(", ")
					);
		return [
			`# Query ${idx + 1}`,
			`Time:\n${entry.durationMs.toFixed(2)}ms`,
			`Original SQL:\n${entry.sql}`,
			entry.stage.rewrittenSql
				? `Rewritten SQL:\n${entry.stage.rewrittenSql}`
				: "Rewritten SQL: (not rewritten)",
			entry.parameters.length
				? `Parameters:\n${entry.parameters
						.map(
							(param, paramIdx) =>
								`  $${paramIdx + 1}: ${JSON.stringify(param)}`
						)
						.join("\n")}`
				: "Parameters: (none)",
			"Plan:",
			...planLines.map((line) => `  • ${line}`),
		].join("\n\n");
	});
	return [
		"Select version diff benchmark query plan",
		`Generated at: ${now}`,
		sections.join("\n\n"),
		"",
	].join("\n\n");
}
