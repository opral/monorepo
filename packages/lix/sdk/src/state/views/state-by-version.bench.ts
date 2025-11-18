import { promises as fs } from "fs";
import { bench, afterAll } from "vitest";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import { openLix } from "../../lix/open-lix.js";

const BENCH_SCHEMA_KEY = "bench_state_by_version_view";
const BENCH_SCHEMA_VERSION = "1.0";
const BENCH_FILE_ID = "bench-state-by-version-file";
const BENCH_PLUGIN_KEY = "lix_sdk";
const TRACKED_ENTITY_ID = "bench_sbvv_tracked_anchor";
const UNTRACKED_ENTITY_ID = "bench_sbvv_untracked_anchor";
const SELECT_ENTITY_LABEL = "state_by_version select • tracked entity";
const SELECT_FILE_SCAN_LABEL = "state_by_version select • recent file scan";
const SELECT_UNTRACKED_LABEL = "state_by_version select • untracked filter";
const INSERT_TRACKED_LABEL = "state_by_version insert • tracked row";
const INSERT_UNTRACKED_LABEL = "state_by_version insert • untracked row";
const UPDATE_TRACKED_LABEL = "state_by_version update • tracked row";
const DELETE_TRACKED_LABEL = "state_by_version delete • tracked row";

const BENCH_OUTPUT_DIR = decodeURIComponent(
	new URL("./__bench__", import.meta.url).pathname
);

const BENCH_SCHEMA_DEFINITION: LixSchemaDefinition = {
	"x-lix-key": BENCH_SCHEMA_KEY,
	"x-lix-version": BENCH_SCHEMA_VERSION,
	"x-lix-primary-key": ["/id"],
	type: "object",
	properties: {
		id: { type: "string" },
		value: { type: "string" },
	},
	required: ["id", "value"],
	additionalProperties: false,
};

type QueryShape = { sql: string; parameters: ReadonlyArray<unknown> };

type BenchCtx = {
	lix: Awaited<ReturnType<typeof openLix>>;
	versionId: string;
	selectQueries: Record<string, QueryShape>;
	counters: {
		tracked: number;
		untracked: number;
		updates: number;
		deletes: number;
	};
};

const STATE_BY_VERSION_INSERT_SQL = `INSERT INTO state_by_version (
        entity_id,
        schema_key,
        file_id,
        version_id,
        plugin_key,
        snapshot_content,
        schema_version,
        metadata,
        untracked
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const STATE_BY_VERSION_UPDATE_SQL = `UPDATE state_by_version
      SET snapshot_content = ?, metadata = ?
      WHERE entity_id = ? AND schema_key = ? AND file_id = ? AND version_id = ?`;

const STATE_BY_VERSION_DELETE_SQL = `DELETE FROM state_by_version
      WHERE entity_id = ? AND schema_key = ? AND file_id = ? AND version_id = ?`;

const readyCtx: Promise<BenchCtx> = (async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
				lixcol_untracked: true,
			},
		],
	});

	await registerBenchSchema(lix);

	const versionId = await ensureActiveVersion(lix);

	await seedStateByVersionView({
		lix,
		versionId,
		trackedExtra: 64,
		untrackedExtra: 16,
	});

	const selectQueries: Record<string, QueryShape> = {
		[SELECT_ENTITY_LABEL]: {
			sql: `SELECT entity_id, snapshot_content
        FROM state_by_version
        WHERE schema_key = ? AND entity_id = ? AND version_id = ?`,
			parameters: [BENCH_SCHEMA_KEY, TRACKED_ENTITY_ID, versionId],
		},
		[SELECT_FILE_SCAN_LABEL]: {
			sql: `SELECT entity_id, version_id, updated_at
        FROM state_by_version
        WHERE file_id = ? AND version_id = ?
        ORDER BY updated_at DESC
        LIMIT 20`,
			parameters: [BENCH_FILE_ID, versionId],
		},
		[SELECT_UNTRACKED_LABEL]: {
			sql: `SELECT entity_id, version_id
        FROM state_by_version
        WHERE untracked = 1 AND schema_key = ? AND version_id = ?
        LIMIT 1`,
			parameters: [BENCH_SCHEMA_KEY, versionId],
		},
	};

	const mutationQueries: Record<string, QueryShape> = {
		[INSERT_TRACKED_LABEL]: buildInsertQuery({
			entityId: "bench_sbvv_tracked_insert_plan",
			versionId,
			untracked: 0,
			value: "tracked-plan",
		}),
		[INSERT_UNTRACKED_LABEL]: buildInsertQuery({
			entityId: "bench_sbvv_untracked_insert_plan",
			versionId,
			untracked: 1,
			value: "untracked-plan",
		}),
		[UPDATE_TRACKED_LABEL]: {
			sql: STATE_BY_VERSION_UPDATE_SQL,
			parameters: [
				JSON.stringify({ id: TRACKED_ENTITY_ID, value: "tracked-update-plan" }),
				JSON.stringify({ bench: true, plan: true }),
				TRACKED_ENTITY_ID,
				BENCH_SCHEMA_KEY,
				BENCH_FILE_ID,
				versionId,
			],
		},
		[DELETE_TRACKED_LABEL]: {
			sql: STATE_BY_VERSION_DELETE_SQL,
			parameters: [
				TRACKED_ENTITY_ID,
				BENCH_SCHEMA_KEY,
				BENCH_FILE_ID,
				versionId,
			],
		},
	};

	await exportExplainPlans({
		lix,
		queries: { ...selectQueries, ...mutationQueries },
	});

	return {
		lix,
		versionId,
		selectQueries,
		counters: { tracked: 0, untracked: 0, updates: 0, deletes: 0 },
	};
})();

afterAll(async () => {
	const { lix } = await readyCtx;
	await lix.close();
});

for (const label of [
	SELECT_ENTITY_LABEL,
	SELECT_FILE_SCAN_LABEL,
	SELECT_UNTRACKED_LABEL,
]) {
	bench(label, async () => {
		const { lix, selectQueries } = await readyCtx;
		const query = selectQueries[label];
		const result = lix.engine!.executeSync({
			sql: query!.sql,
			parameters: [...query!.parameters],
		});
		if (!result.rows || result.rows.length === 0) {
			throw new Error(`Expected rows for benchmark label: ${label}`);
		}
	});
}

bench(INSERT_TRACKED_LABEL, async () => {
	const ctx = await readyCtx;
	const entityId = `bench_sbvv_tracked_insert_${ctx.counters.tracked++}`;
	insertStateByVersionRow(ctx.lix, {
		entityId,
		versionId: ctx.versionId,
		untracked: 0,
		value: "tracked-insert",
	});
	deleteStateByVersionRow(ctx.lix, {
		entityId,
		versionId: ctx.versionId,
	});
});

bench(INSERT_UNTRACKED_LABEL, async () => {
	const ctx = await readyCtx;
	const entityId = `bench_sbvv_untracked_insert_${ctx.counters.untracked++}`;
	insertStateByVersionRow(ctx.lix, {
		entityId,
		versionId: ctx.versionId,
		untracked: 1,
		value: "untracked-insert",
	});
	deleteStateByVersionRow(ctx.lix, {
		entityId,
		versionId: ctx.versionId,
	});
});

bench(UPDATE_TRACKED_LABEL, async () => {
	const ctx = await readyCtx;
	const updateIndex = ctx.counters.updates++;
	const updatedValue = `tracked-update-${updateIndex}`;
	const updatedMetadata = { bench: true, revision: updateIndex };

	ctx.lix.engine!.executeSync({
		sql: STATE_BY_VERSION_UPDATE_SQL,
		parameters: [
			JSON.stringify({ id: TRACKED_ENTITY_ID, value: updatedValue }),
			JSON.stringify(updatedMetadata),
			TRACKED_ENTITY_ID,
			BENCH_SCHEMA_KEY,
			BENCH_FILE_ID,
			ctx.versionId,
		],
	});

	ctx.lix.engine!.executeSync({
		sql: STATE_BY_VERSION_UPDATE_SQL,
		parameters: [
			JSON.stringify({ id: TRACKED_ENTITY_ID, value: "tracked-anchor" }),
			JSON.stringify({ bench: true }),
			TRACKED_ENTITY_ID,
			BENCH_SCHEMA_KEY,
			BENCH_FILE_ID,
			ctx.versionId,
		],
	});
});

bench(DELETE_TRACKED_LABEL, async () => {
	const ctx = await readyCtx;
	ctx.counters.deletes += 1;

	deleteStateByVersionRow(ctx.lix, {
		entityId: TRACKED_ENTITY_ID,
		versionId: ctx.versionId,
	});
	insertStateByVersionRow(ctx.lix, {
		entityId: TRACKED_ENTITY_ID,
		versionId: ctx.versionId,
		untracked: 0,
		value: "tracked-anchor",
	});
});

async function registerBenchSchema(lix: Awaited<ReturnType<typeof openLix>>) {
	await lix.db
		.insertInto("stored_schema")
		.values({ value: BENCH_SCHEMA_DEFINITION })
		.execute();
}

async function ensureActiveVersion(
	lix: Awaited<ReturnType<typeof openLix>>
): Promise<string> {
	const { rows } = lix.engine!.executeSync({
		sql: "SELECT version_id FROM active_version LIMIT 1",
		parameters: [],
	});
	const versionId = rows?.[0]?.version_id;
	if (typeof versionId !== "string" || versionId.length === 0) {
		throw new Error("Failed to determine active version id for bench setup");
	}
	return versionId;
}

async function seedStateByVersionView(args: {
	lix: Awaited<ReturnType<typeof openLix>>;
	versionId: string;
	trackedExtra: number;
	untrackedExtra: number;
}) {
	const { lix, versionId, trackedExtra, untrackedExtra } = args;

	insertStateByVersionRow(lix, {
		entityId: TRACKED_ENTITY_ID,
		versionId,
		untracked: 0,
		value: "tracked-anchor",
	});

	insertStateByVersionRow(lix, {
		entityId: UNTRACKED_ENTITY_ID,
		versionId,
		untracked: 1,
		value: "untracked-anchor",
	});

	for (let index = 0; index < trackedExtra; index += 1) {
		insertStateByVersionRow(lix, {
			entityId: `bench_sbvv_tracked_extra_${index}`,
			versionId,
			untracked: 0,
			value: `tracked-extra-${index}`,
		});
	}

	for (let index = 0; index < untrackedExtra; index += 1) {
		insertStateByVersionRow(lix, {
			entityId: `bench_sbvv_untracked_extra_${index}`,
			versionId,
			untracked: 1,
			value: `untracked-extra-${index}`,
		});
	}
}

/**
 * Insert a row into the public state_by_version view with deterministic payloads so
 * the triggers exercise the vtable forwarding path scoped to a version id.
 */
function insertStateByVersionRow(
	lix: Awaited<ReturnType<typeof openLix>>,
	args: { entityId: string; versionId: string; untracked: 0 | 1; value: string }
) {
	lix.engine!.executeSync({
		sql: STATE_BY_VERSION_INSERT_SQL,
		parameters: [
			args.entityId,
			BENCH_SCHEMA_KEY,
			BENCH_FILE_ID,
			args.versionId,
			BENCH_PLUGIN_KEY,
			JSON.stringify({ id: args.entityId, value: args.value }),
			BENCH_SCHEMA_VERSION,
			JSON.stringify({ bench: true }),
			args.untracked,
		],
	});
}

function deleteStateByVersionRow(
	lix: Awaited<ReturnType<typeof openLix>>,
	args: { entityId: string; versionId: string }
) {
	lix.engine!.executeSync({
		sql: STATE_BY_VERSION_DELETE_SQL,
		parameters: [args.entityId, BENCH_SCHEMA_KEY, BENCH_FILE_ID, args.versionId],
	});
}

function buildInsertQuery(args: {
	entityId: string;
	versionId: string;
	untracked: 0 | 1;
	value: string;
}): QueryShape {
	return {
		sql: STATE_BY_VERSION_INSERT_SQL,
		parameters: [
			args.entityId,
			BENCH_SCHEMA_KEY,
			BENCH_FILE_ID,
			args.versionId,
			BENCH_PLUGIN_KEY,
			JSON.stringify({ id: args.entityId, value: args.value }),
			BENCH_SCHEMA_VERSION,
			JSON.stringify({ bench: true }),
			args.untracked,
		],
	};
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
