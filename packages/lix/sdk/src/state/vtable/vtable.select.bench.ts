import { promises as fs } from "fs";
import { afterAll, bench, describe } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { insertTransactionState } from "../transaction/insert-transaction-state.js";
import { getTimestamp } from "../../engine/functions/timestamp.js";
import { createVersion } from "../../version/create-version.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";

const TEST_SCHEMA = "bench_vtable_schema";
const FILE_ID = "bench-file";
const GLOBAL_VERSION_ID = "global";
const ACTIVE_VERSION_ID = "bench_active_version";
const SCHEMA_VERSION = "1.0";
const PLUGIN_KEY = "lix_own_entity";

const ENTITY_TXN = "bench_priority_transaction";
const ENTITY_UNTRACKED = "bench_priority_untracked";
const ENTITY_CACHE = "bench_priority_cache";
const EXTRA_ENTITIES_PER_TIER = 25;
const BENCH_OUTPUT_DIR = decodeURIComponent(
	new URL("./__bench__", import.meta.url).pathname
);

type QueryShape = { sql: string; parameters: ReadonlyArray<unknown> };

type ScenarioDefinition = {
	key: string;
	label: string;
	entityId: string;
	versionId: string;
};

type FilterDefinition = {
	key: string;
	label: string;
	clauses: string[];
	parameters: (args: {
		entityId: string;
		versionId: string;
	}) => ReadonlyArray<unknown>;
};

type BenchCtx = {
	lix: Awaited<ReturnType<typeof openLix>>;
	queries: Record<string, QueryShape>;
};

const SCENARIOS: ScenarioDefinition[] = [
	{
		key: "transaction",
		label: "transaction",
		entityId: ENTITY_TXN,
		versionId: GLOBAL_VERSION_ID,
	},
	{
		key: "untracked",
		label: "untracked",
		entityId: ENTITY_UNTRACKED,
		versionId: GLOBAL_VERSION_ID,
	},
	{
		key: "cache",
		label: "cache",
		entityId: ENTITY_CACHE,
		versionId: GLOBAL_VERSION_ID,
	},
	{
		key: "untracked-inherited",
		label: "(inherited) untracked",
		entityId: ENTITY_UNTRACKED,
		versionId: ACTIVE_VERSION_ID,
	},
	{
		key: "cache-inherited",
		label: "(inherited) cache",
		entityId: ENTITY_CACHE,
		versionId: ACTIVE_VERSION_ID,
	},
];

const FILTERS: FilterDefinition[] = [
	{
		key: "entity-version",
		label: "entity+version",
		clauses: ["entity_id = ?", "version_id = ?"],
		parameters: ({ entityId, versionId }) => [entityId, versionId],
	},
	{
		key: "entity-version-file",
		label: "entity+version+file",
		clauses: ["entity_id = ?", "version_id = ?", `file_id = '${FILE_ID}'`],
		parameters: ({ entityId, versionId }) => [entityId, versionId],
	},
	{
		key: "entity-version-file-plugin",
		label: "entity+version+file+plugin",
		clauses: [
			"entity_id = ?",
			"version_id = ?",
			`file_id = '${FILE_ID}'`,
			`plugin_key = '${PLUGIN_KEY}'`,
		],
		parameters: ({ entityId, versionId }) => [entityId, versionId],
	},
];

const labelFor = (scenario: ScenarioDefinition, filter: FilterDefinition) =>
	`${scenario.label} • ${filter.label}`;

const CASE_LABELS = SCENARIOS.flatMap((scenario) =>
	FILTERS.map((filter) => labelFor(scenario, filter))
);

async function prepareBenchContext(): Promise<BenchCtx> {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: GLOBAL_VERSION_ID,
				lixcol_untracked: true,
			},
		],
	});

	const BENCH_STORED_SCHEMA: LixSchemaDefinition = {
		type: "object",
		additionalProperties: false,
		properties: {
			source: { type: "string" },
			idx: { type: "integer" },
		},
		required: ["source"],
		"x-lix-key": TEST_SCHEMA,
		"x-lix-version": SCHEMA_VERSION,
		"x-lix-primary-key": ["/source"],
	};

	await lix.db
		.insertInto("stored_schema")
		.values({ value: BENCH_STORED_SCHEMA })
		.execute();

	await seedVtableFixture(lix);

	const queries: Record<string, QueryShape> = {};
	for (const scenario of SCENARIOS) {
		for (const filter of FILTERS) {
			const label = labelFor(scenario, filter);
			queries[label] = buildQuery(
				{
					entityId: scenario.entityId,
					versionId: scenario.versionId,
					includeLimit: scenario.versionId === GLOBAL_VERSION_ID,
				},
				filter
			);
		}
	}

	await exportExplainPlans({ lix, queries });

	return { lix, queries };
}

describe("vtable select benchmarks", async () => {
	const ctx = await prepareBenchContext();

	afterAll(async () => {
		await ctx.lix.close();
	});

	for (const label of CASE_LABELS) {
		bench(label, () => {
			const query = ctx.queries[label];
			if (!query) {
				throw new Error(`missing query for benchmark label: ${label}`);
			}
			try {
				const result = ctx.lix.engine!.executeSync({
					sql: query.sql,
					parameters: [...query.parameters],
				});
				if (!result.rows || result.rows.length === 0) {
					throw new Error(`expected rows for benchmark label: ${label}`);
				}
			} catch (error) {
				console.error(`benchmark query failed for label: ${label}`);
				console.error(error);
				throw error;
			}
		});
	}
});

/**
 * Populate the internal state tables so each priority tier (transaction, untracked,
 * cached) is represented in the benchmark dataset.
 */
async function seedVtableFixture(lix: Awaited<ReturnType<typeof openLix>>) {
	const timestamp = await getTimestamp({ lix });

	insertTransactionState({
		engine: lix.engine!,
		data: buildTransactionRows({
			versionId: GLOBAL_VERSION_ID,
			suffix: "global",
		}),
		timestamp,
	});

	await insertRowsForVersion({
		lix,
		versionId: GLOBAL_VERSION_ID,
		suffix: "global",
	});

	await createVersion({
		lix,
		id: ACTIVE_VERSION_ID,
		inheritsFrom: { id: GLOBAL_VERSION_ID },
		name: "bench_child_version",
	});

	insertTransactionState({
		engine: lix.engine!,
		data: buildTransactionRows({
			versionId: ACTIVE_VERSION_ID,
			suffix: "child",
		}),
		timestamp,
	});

	await insertRowsForVersion({
		lix,
		versionId: ACTIVE_VERSION_ID,
		suffix: "child",
	});

	const childRows = lix.engine!.executeSync({
		sql: `SELECT entity_id FROM lix_internal_state_vtable WHERE schema_key = ? AND version_id = ?`,
		parameters: [TEST_SCHEMA, ACTIVE_VERSION_ID],
	});

	for (const requiredEntity of [ENTITY_TXN, ENTITY_UNTRACKED, ENTITY_CACHE]) {
		if (!childRows.rows.some((row) => row.entity_id === requiredEntity)) {
			throw new Error(
				`expected entity ${requiredEntity} for version ${ACTIVE_VERSION_ID}`
			);
		}
	}
}

function buildTransactionRows(args: { versionId: string; suffix: string }) {
	const { versionId, suffix } = args;
	const baseLabel = `transaction-${suffix}`;
	return [
		{
			entity_id: ENTITY_TXN,
			schema_key: TEST_SCHEMA,
			file_id: FILE_ID,
			plugin_key: PLUGIN_KEY,
			snapshot_content: JSON.stringify({ source: baseLabel }),
			schema_version: SCHEMA_VERSION,
			version_id: versionId,
			untracked: false,
		},
		...Array.from({ length: EXTRA_ENTITIES_PER_TIER }, (_, index) => ({
			entity_id: `${ENTITY_TXN}_extra_${index}`,
			schema_key: TEST_SCHEMA,
			file_id: FILE_ID,
			plugin_key: PLUGIN_KEY,
			snapshot_content: JSON.stringify({
				source: `${baseLabel}-extra-${index}`,
				idx: index,
			}),
			schema_version: SCHEMA_VERSION,
			version_id: versionId,
			untracked: false,
		})),
	];
}

async function insertRowsForVersion(args: {
	lix: Awaited<ReturnType<typeof openLix>>;
	versionId: string;
	suffix: string;
}) {
	const { lix, versionId, suffix } = args;
	await insertEntityRows({
		lix,
		versionId,
		baseEntityId: ENTITY_UNTRACKED,
		sourcePrefix: "untracked",
		suffix,
		untracked: 1,
	});
	await insertEntityRows({
		lix,
		versionId,
		baseEntityId: ENTITY_CACHE,
		sourcePrefix: "cache",
		suffix,
		untracked: 0,
	});
}

async function insertEntityRows(args: {
	lix: Awaited<ReturnType<typeof openLix>>;
	versionId: string;
	baseEntityId: string;
	sourcePrefix: string;
	suffix: string;
	untracked: 0 | 1;
}) {
	const { lix, versionId, baseEntityId, sourcePrefix, suffix, untracked } =
		args;
	await insertViaVtable(lix, {
		entityId: baseEntityId,
		versionId,
		snapshot: { source: `${sourcePrefix}-${suffix}` },
		untracked,
		commitId: `${sourcePrefix}-${suffix}`,
		changeId: `${sourcePrefix}-${suffix}`,
	});

	for (let index = 0; index < EXTRA_ENTITIES_PER_TIER; index += 1) {
		await insertViaVtable(lix, {
			entityId: `${baseEntityId}_extra_${index}`,
			versionId,
			snapshot: {
				source: `${sourcePrefix}-extra-${suffix}-${index}`,
				idx: index,
			},
			untracked,
			commitId: `${sourcePrefix}-extra-${suffix}-${index}`,
			changeId: `${sourcePrefix}-extra-${suffix}-${index}`,
		});
	}
}

async function insertViaVtable(
	lix: Awaited<ReturnType<typeof openLix>>,
	options: {
		entityId: string;
		versionId: string;
		snapshot: Record<string, unknown>;
		untracked: 0 | 1;
		commitId: string;
		changeId: string;
	}
) {
	lix.engine!.executeSync({
		sql: `INSERT INTO lix_internal_state_vtable (
        entity_id,
        schema_key,
        file_id,
        version_id,
        plugin_key,
        schema_version,
        snapshot_content,
        untracked,
        commit_id,
        change_id
      ) VALUES (?, ?, ?, ?, ?, ?, json(?), ?, ?, ?)`,
		parameters: [
			options.entityId,
			TEST_SCHEMA,
			FILE_ID,
			options.versionId,
			PLUGIN_KEY,
			SCHEMA_VERSION,
			JSON.stringify(options.snapshot),
			options.untracked,
			options.commitId,
			options.changeId,
		],
	});
}

function buildQuery(
	params: {
		entityId: string;
		versionId: string;
		includeLimit?: boolean;
	},
	filter: FilterDefinition
): QueryShape {
	const clauses = [`schema_key = '${TEST_SCHEMA}'`, ...filter.clauses];
	const baseSql = `SELECT * FROM lix_internal_state_vtable
	        WHERE ${clauses.join("\n          AND ")}`;
	const sql =
		params.includeLimit === false ? baseSql : `${baseSql}\n        LIMIT 1`;
	const parameters = [
		...filter.parameters({
			entityId: params.entityId,
			versionId: params.versionId,
		}),
	];
	return { sql, parameters };
}

async function exportExplainPlans(args: {
	lix: Awaited<ReturnType<typeof openLix>>;
	queries: Record<string, QueryShape>;
}) {
	await fs.mkdir(BENCH_OUTPUT_DIR, { recursive: true });

	for (const [label, query] of Object.entries(args.queries)) {
		const slug = label
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "");
		const outputPath = `${BENCH_OUTPUT_DIR}/${slug}.explain.txt`;

		const report = (await args.lix.call("lix_explain_query", {
			sql: query.sql,
			parameters: [...query.parameters],
		})) as {
			originalSql: string;
			rewrittenSql: string | null;
			plan: unknown;
		};

		const payload = [
			"-- label --",
			label,
			"\n-- original SQL --",
			report.originalSql,
			"\n-- rewritten SQL --",
			report.rewrittenSql ?? "<unchanged>",
			"\n-- plan --",
			JSON.stringify(report.plan, null, 2),
			"",
		].join("\n");

		await fs.writeFile(outputPath, payload, "utf8");
	}
}
