import { bench, afterAll } from "vitest";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import { openLix } from "../../lix/open-lix.js";

const BENCH_SCHEMA_KEY = "bench_state_view";
const BENCH_SCHEMA_VERSION = "1.0";
const BENCH_FILE_ID = "bench-state-view-file";
const BENCH_PLUGIN_KEY = "lix_own_entity";
const TRACKED_ENTITY_ID = "bench_state_tracked_anchor";
const UNTRACKED_ENTITY_ID = "bench_state_untracked_anchor";
const SELECT_ENTITY_LABEL = "state select • tracked entity";
const SELECT_FILE_SCAN_LABEL = "state select • recent file scan";
const SELECT_UNTRACKED_LABEL = "state select • untracked filter";

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
	selectQueries: Record<string, QueryShape>;
	counters: { tracked: number; untracked: number };
};

const readyCtx: Promise<BenchCtx> = (async () => {
	const lix = await openLix({});

	await registerBenchSchema(lix);

	await ensureActiveVersion(lix);

	await seedStateView({
		lix,
		trackedExtra: 64,
		untrackedExtra: 16,
	});

	const selectQueries: Record<string, QueryShape> = {
		[SELECT_ENTITY_LABEL]: {
			sql: `SELECT entity_id, snapshot_content
        FROM state
        WHERE schema_key = ? AND entity_id = ?`,
			parameters: [BENCH_SCHEMA_KEY, TRACKED_ENTITY_ID],
		},
		[SELECT_FILE_SCAN_LABEL]: {
			sql: `SELECT entity_id, updated_at
        FROM state
        WHERE file_id = ?
        ORDER BY updated_at DESC
        LIMIT 20`,
			parameters: [BENCH_FILE_ID],
		},
		[SELECT_UNTRACKED_LABEL]: {
			sql: `SELECT entity_id
        FROM state
        WHERE untracked = 1 AND schema_key = ?
        LIMIT 1`,
			parameters: [BENCH_SCHEMA_KEY],
		},
	};

	return {
		lix,
		selectQueries,
		counters: { tracked: 0, untracked: 0 },
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

bench("state insert • tracked row", async () => {
	const ctx = await readyCtx;
	const entityId = `bench_state_tracked_insert_${ctx.counters.tracked++}`;
	insertStateRow(ctx.lix, {
		entityId,
		untracked: 0,
		value: "tracked-insert",
	});
	deleteStateRow(ctx.lix, entityId);
});

bench("state insert • untracked row", async () => {
	const ctx = await readyCtx;
	const entityId = `bench_state_untracked_insert_${ctx.counters.untracked++}`;
	insertStateRow(ctx.lix, {
		entityId,
		untracked: 1,
		value: "untracked-insert",
	});
	deleteStateRow(ctx.lix, entityId);
});

async function registerBenchSchema(lix: Awaited<ReturnType<typeof openLix>>) {
	await lix.db
		.insertInto("stored_schema")
		.values({ value: BENCH_SCHEMA_DEFINITION })
		.execute();
}

async function ensureActiveVersion(lix: Awaited<ReturnType<typeof openLix>>) {
	const { rows } = lix.engine!.executeSync({
		sql: "SELECT version_id FROM active_version LIMIT 1",
		parameters: [],
	});
	const versionId = rows?.[0]?.version_id;
	if (typeof versionId !== "string" || versionId.length === 0) {
		throw new Error("Failed to determine active version id for bench setup");
	}
}

async function seedStateView(args: {
	lix: Awaited<ReturnType<typeof openLix>>;
	trackedExtra: number;
	untrackedExtra: number;
}) {
	const { lix, trackedExtra, untrackedExtra } = args;

	insertStateRow(lix, {
		entityId: TRACKED_ENTITY_ID,
		untracked: 0,
		value: "tracked-anchor",
	});

	insertStateRow(lix, {
		entityId: UNTRACKED_ENTITY_ID,
		untracked: 1,
		value: "untracked-anchor",
	});

	for (let index = 0; index < trackedExtra; index += 1) {
		insertStateRow(lix, {
			entityId: `bench_state_tracked_extra_${index}`,
			untracked: 0,
			value: `tracked-extra-${index}`,
		});
	}

	for (let index = 0; index < untrackedExtra; index += 1) {
		insertStateRow(lix, {
			entityId: `bench_state_untracked_extra_${index}`,
			untracked: 1,
			value: `untracked-extra-${index}`,
		});
	}
}

/**
 * Insert a row into the public state view with deterministic payloads so the
 * triggers exercise the state_all forwarding path.
 */
function insertStateRow(
	lix: Awaited<ReturnType<typeof openLix>>,
	args: { entityId: string; untracked: 0 | 1; value: string }
) {
	lix.engine!.executeSync({
		sql: `INSERT INTO state (
        entity_id,
        schema_key,
        file_id,
        plugin_key,
        snapshot_content,
        schema_version,
        metadata,
        untracked
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		parameters: [
			args.entityId,
			BENCH_SCHEMA_KEY,
			BENCH_FILE_ID,
			BENCH_PLUGIN_KEY,
			JSON.stringify({ id: args.entityId, value: args.value }),
			BENCH_SCHEMA_VERSION,
			JSON.stringify({ bench: true }),
			args.untracked,
		],
	});
}

function deleteStateRow(
	lix: Awaited<ReturnType<typeof openLix>>,
	entityId: string
) {
	lix.engine!.executeSync({
		sql: `DELETE FROM state
      WHERE entity_id = ? AND schema_key = ? AND file_id = ?`,
		parameters: [entityId, BENCH_SCHEMA_KEY, BENCH_FILE_ID],
	});
}
