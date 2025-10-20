import { expect, test } from "vitest";
import { tokenize } from "../../../sql-parser/tokenizer.js";
import { analyzeShape } from "../microparser/analyze-shape.js";
import {
	buildHoistedInternalStateVtableCte,
	buildInternalStateVtableProjection,
} from "./rewrite-internal-state-vtable.js";
import { openLix } from "../../../../lix/open-lix.js";
import { insertTransactionState } from "../../../../state/transaction/insert-transaction-state.js";
import { updateStateCache } from "../../../../state/cache/update-state-cache.js";
import { getTimestamp } from "../../../../engine/functions/timestamp.js";
import { internalQueryBuilder } from "../../../../engine/internal-query-builder.js";
import { rewriteSql } from "../rewrite-sql.js";
import { sql } from "kysely";
import {
	createSchemaCacheTable,
	schemaKeyToCacheTableName,
} from "../../../../state/cache/create-schema-cache-table.js";
import type { LixSchemaDefinition } from "../../../../schema-definition/definition.js";

const EXPECTED_VISIBLE_COLUMNS = [
	"entity_id",
	"schema_key",
	"file_id",
	"plugin_key",
	"snapshot_content",
	"schema_version",
	"version_id",
	"created_at",
	"updated_at",
	"inherited_from_version_id",
	"change_id",
	"untracked",
	"commit_id",
	"metadata",
	"writer_key",
];

test("hoists wide path with schema filters", () => {
	const sql = `SELECT * FROM lix_internal_state_vtable v WHERE v.schema_key = 'lix_key_value';`;
	const tokens = tokenize(sql);
	const shape = analyzeShape(tokens);
	expect(shape).not.toBeNull();

	const cte = buildHoistedInternalStateVtableCte([shape!]);
	expect(cte).toBeTruthy();
	expect(cte).toContain("lix_internal_state_vtable_rewritten AS");
	expect(cte).toContain("lix_internal_state_cache_v1_lix_key_value");
	expect(cte).toContain("lix_key_value");
});

test("prunes cache branches without physical tables", () => {
	const sql = `SELECT * FROM lix_internal_state_vtable v WHERE v.schema_key = 'lix_key_value';`;
	const tokens = tokenize(sql);
	const shape = analyzeShape(tokens);

	expect(shape).not.toBeNull();

	const cte = buildHoistedInternalStateVtableCte([shape!], {
		existingCacheTables: new Set(),
	});
	expect(cte).toBeTruthy();
	expect(cte).not.toContain("lix_internal_state_cache_v1_lix_key_value");
	expect(cte).not.toContain("'CI' ||");
	expect(cte).toContain("lix_internal_state_all_untracked");
});

test("buildInternalStateVtableProjection strips hidden primary key when unused", () => {
	const sql = `SELECT * FROM lix_internal_state_vtable;`;
	const tokens = tokenize(sql);
	const shape = analyzeShape(tokens);

	expect(shape).not.toBeNull();

	const projection = buildInternalStateVtableProjection(shape!);
	expect(projection).toBe(
		`(SELECT ${EXPECTED_VISIBLE_COLUMNS.join(", ")} FROM lix_internal_state_vtable_rewritten) AS lix_internal_state_vtable`
	);
});

test("buildInternalStateVtableProjection retains _pk when referenced", () => {
	const sql = `SELECT v._pk FROM lix_internal_state_vtable v;`;
	const tokens = tokenize(sql);
	const shape = analyzeShape(tokens);

	expect(shape).not.toBeNull();

	const projection = buildInternalStateVtableProjection(shape!);
	expect(projection).toBe(
		`(SELECT _pk, ${EXPECTED_VISIBLE_COLUMNS.join(", ")} FROM lix_internal_state_vtable_rewritten) AS v`
	);
});

test("rewriteSql hoists a shared CTE and rewrites table reference", () => {
	const sql = `SELECT * FROM lix_internal_state_vtable;`;
	const rewritten = rewriteSql(sql);

	expect(rewritten.trim().startsWith("WITH")).toBe(true);
	expect(rewritten).toContain("lix_internal_state_vtable_rewritten AS (");
	expect(rewritten).toContain(
		`(SELECT ${EXPECTED_VISIBLE_COLUMNS.join(", ")} FROM lix_internal_state_vtable_rewritten) AS lix_internal_state_vtable`
	);
});

test("version placeholder seeds recursion with numbered parameter", () => {
	const sql = `SELECT * FROM lix_internal_state_vtable v WHERE v.schema_key = 'lix_key_value' AND v.version_id = ?`;
	const rewritten = rewriteSql(sql);

	expect(rewritten).toMatch(/params\(version_id/);
	expect(rewritten).toContain("?1 AS version_id");
	expect(rewritten).toContain("'lix_key_value' AS schema_key");
});

test("version placeholder seeds recursion with named parameter", () => {
	const sql = `SELECT * FROM lix_internal_state_vtable v WHERE v.schema_key = 'lix_key_value' AND v.version_id = :version_id`;
	const rewritten = rewriteSql(sql);

	expect(rewritten).toMatch(/params\(version_id/);
	expect(rewritten).toContain(":version_id AS version_id");
	expect(rewritten).toContain("'lix_key_value' AS schema_key");
});

test("schema placeholder never references legacy cache view", () => {
	const sql = `SELECT * FROM lix_internal_state_vtable v WHERE v.schema_key = ?1 AND v.version_id = ?2`;
	const rewritten = rewriteSql(sql);
	expect(rewritten).toContain("params(version_id, schema_key)");
	expect(rewritten).not.toContain("FROM lix_internal_state_cache ");
});

test("queries selecting _pk still rewrite to the CTE projection", () => {
	const sql = `SELECT v._pk FROM lix_internal_state_vtable v WHERE v.schema_key = 'lix_key_value';`;
	const rewritten = rewriteSql(sql);

	// Hoisted CTE present
	expect(rewritten).toContain("lix_internal_state_vtable_rewritten AS (");
	// Table reference rewritten with _pk included
	expect(rewritten).toContain(
		`(SELECT _pk, ${EXPECTED_VISIBLE_COLUMNS.join(", ")} FROM lix_internal_state_vtable_rewritten) AS v`
	);
	expect(rewritten).toContain("SELECT v._pk FROM (SELECT");
});

test("matrix of queries preserves precedence across rewrites", async () => {
	await withSeededFixture(async (ctx) => {
		const baseSql = `SELECT v._pk AS pk_tag, v.entity_id, v.schema_key FROM lix_internal_state_vtable v WHERE v.schema_key = '${TEST_SCHEMA}' AND v.version_id = '${VERSION_GLOBAL}' ORDER BY pk_tag;`;
		const limitSql = `SELECT v._pk AS pk_tag, v.entity_id, v.schema_key FROM lix_internal_state_vtable v WHERE v.schema_key = '${TEST_SCHEMA}' AND v.version_id = '${VERSION_GLOBAL}' AND v.entity_id = '${ENTITY_TXN}' LIMIT 1;`;

		const variants: Array<{
			name: string;
			originalSql: string;
			rewrite: boolean;
			planAssert?: (plan: string) => void;
		}> = [
			{
				name: "wide",
				originalSql: baseSql,
				rewrite: true,
			},
			{
				name: "limit1",
				originalSql: limitSql,
				rewrite: true,
				planAssert: (plan) => {
					expect(plan).toContain("CO-ROUTINE ranked");
					expect(plan).toContain("SCAN w");
				},
			},
		];

		for (const variant of variants) {
			const baselineRows = await executeQuery(ctx, variant.originalSql, {
				rewrite: false,
			});
			const rewrittenRows = await executeQuery(ctx, variant.originalSql, {
				rewrite: variant.rewrite,
			});

			expect(rewrittenRows).toEqual(baselineRows);
			assertPrecedence(baselineRows);

			if (variant.planAssert && variant.rewrite) {
				const plan = await explainQueryPlan(rewriteSql(variant.originalSql));
				variant.planAssert(plan);
			}
		}
	});
});

test("rewriteSql routes placeholder schema key through state_all expansion with cache tables", () => {
	const sqlText = `select "snapshot_content" from (
      SELECT
        entity_id,
        schema_key,
        file_id,
        version_id,
        plugin_key,
        snapshot_content,
        schema_version,
        created_at,
        updated_at,
        inherited_from_version_id,
        change_id,
        untracked,
        commit_id,
        writer_key,
        (
          SELECT json(metadata)
          FROM change
          WHERE change.id = lix_internal_state_vtable.change_id
        ) AS metadata
      FROM lix_internal_state_vtable
      WHERE snapshot_content IS NOT NULL
    ) AS "state_all"
    WHERE "schema_key" = ?1
      AND json_extract(snapshot_content, '$.id') = ?2
      AND "version_id" = ?3
      AND "inherited_from_version_id" IS NULL`;
	const schemaKey = `${TEST_SCHEMA}_expanded`;
	const schemaTable = schemaKeyToCacheTableName(schemaKey);
	const existingCacheTables = new Set([
		"lix_internal_state_cache_v1_lix_version_descriptor",
		"lix_internal_state_cache_v1_lix_stored_schema",
		"lix_internal_state_cache_v1_lix_commit",
		schemaTable,
	]);
	const rewritten = rewriteSql(sqlText, {
		parameters: [schemaKey, "entity-456", VERSION_GLOBAL],
		existingCacheTables,
	});

	const unexpected = [
		"lix_internal_state_cache_v1_lix_stored_schema",
		"lix_internal_state_cache_v1_lix_commit",
	];
	for (const table of unexpected) {
		expect(rewritten).not.toContain(table);
	}
	expect(rewritten).toContain(schemaTable);
});

const TEST_SCHEMA = "rewrite_matrix_schema";
const FILE_ID = "matrix-file";
const VERSION_GLOBAL = "global";
const SCHEMA_VERSION = "1.0";
const PLUGIN_KEY = "lix_own_entity";

const ENTITY_TXN = "priority_shared";
const ENTITY_UNTRACKED = "priority_untracked";
const ENTITY_CACHE = "priority_cache";

const TEST_CACHE_SCHEMA_DEFINITION = {
	"x-lix-key": TEST_SCHEMA,
	"x-lix-version": SCHEMA_VERSION,
	type: "object",
	additionalProperties: false,
	properties: {
		id: { type: "string" },
		name: { type: "string" },
	},
	required: ["id"],
} as const satisfies LixSchemaDefinition;

interface FixtureContext {
	lix: Awaited<ReturnType<typeof openLix>>;
}

async function withSeededFixture(run: (ctx: FixtureContext) => Promise<void>) {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: VERSION_GLOBAL,
				lixcol_untracked: true,
			},
		],
	});

	await (lix.db as any)
		.insertInto("stored_schema")
		.values({ value: TEST_CACHE_SCHEMA_DEFINITION })
		.onConflict((oc: any) => oc.doNothing())
		.execute();
	try {
		await seedFixture(lix);
		await run({ lix });
	} finally {
		await lix.close();
	}
}

async function seedFixture(lix: Awaited<ReturnType<typeof openLix>>) {
	const timestamp = await getTimestamp({ lix });

	insertTransactionState({
		engine: lix.engine!,
		data: [
			{
				entity_id: ENTITY_TXN,
				schema_key: TEST_SCHEMA,
				file_id: FILE_ID,
				plugin_key: PLUGIN_KEY,
				snapshot_content: JSON.stringify({ source: "transaction" }),
				schema_version: SCHEMA_VERSION,
				version_id: VERSION_GLOBAL,
				untracked: false,
			},
		],
		timestamp,
	});

	await insertUntrackedRow(lix, ENTITY_TXN, timestamp, {
		source: "untracked-shared",
	});
	await insertUntrackedRow(lix, ENTITY_UNTRACKED, timestamp, {
		source: "untracked-only",
	});

	updateStateCache({
		engine: lix.engine!,
		changes: [
			createCacheChange(ENTITY_TXN, timestamp, { source: "cache-shared" }),
			createCacheChange(ENTITY_CACHE, timestamp, { source: "cache-only" }),
		],
		commit_id: "commit-cache",
		version_id: VERSION_GLOBAL,
	});
}

async function insertUntrackedRow(
	lix: Awaited<ReturnType<typeof openLix>>,
	entityId: string,
	timestamp: string,
	snapshot: Record<string, unknown>
) {
	const compiled = internalQueryBuilder
		.insertInto("lix_internal_state_all_untracked")
		.values({
			entity_id: entityId,
			schema_key: TEST_SCHEMA,
			file_id: FILE_ID,
			version_id: VERSION_GLOBAL,
			plugin_key: PLUGIN_KEY,
			snapshot_content: sql`jsonb(${JSON.stringify(snapshot)})`,
			schema_version: SCHEMA_VERSION,
			created_at: timestamp,
			updated_at: timestamp,
			inherited_from_version_id: null,
			is_tombstone: 0,
		})
		.onConflict((oc) => oc.doNothing())
		.compile();

	lix.engine!.executeSync(compiled);
}

function createCacheChange(
	entityId: string,
	createdAt: string,
	snapshot: Record<string, unknown>
) {
	return {
		id: `cache-${entityId}`,
		entity_id: entityId,
		schema_key: TEST_SCHEMA,
		schema_version: SCHEMA_VERSION,
		file_id: FILE_ID,
		plugin_key: PLUGIN_KEY,
		snapshot_content: JSON.stringify(snapshot),
		created_at: createdAt,
		change_id: `change-${entityId}`,
	};
}

async function executeQuery(
	ctx: FixtureContext,
	originalSql: string,
	options: { rewrite: boolean }
) {
	const sql = options.rewrite ? rewriteSql(originalSql) : originalSql;
	if (options.rewrite) {
		const rows = ctx.lix.engine!.sqlite.exec({
			sql,
			bind: [],
			returnValue: "resultRows",
			rowMode: "object",
			columnNames: [],
		});
		return normalizeRows(rows as Array<Record<string, unknown>>);
	}

	const { rows } = ctx.lix.engine!.executeSync({ sql, parameters: [] });
	return normalizeRows(rows as Array<Record<string, unknown>>);
}

function normalizeRows(rows: Array<Record<string, unknown>>) {
	return rows
		.map((row) => {
			if (Array.isArray(row)) {
				const [pk, entity, schema] = row as unknown[];
				return {
					_pk: String(pk ?? ""),
					entity_id: String(entity ?? ""),
					schema_key: String(schema ?? TEST_SCHEMA),
				};
			}

			const entries = Object.entries(row);
			const pkEntry = entries.find(
				([key, value]) =>
					key.toLowerCase().includes("pk") ||
					(typeof value === "string" && value.includes("~"))
			);
			const entityEntry = entries.find(([key]) =>
				key.toLowerCase().includes("entity_id")
			);
			const schemaEntry = entries.find(([key]) =>
				key.toLowerCase().includes("schema_key")
			);

			return {
				_pk: String(pkEntry ? (pkEntry[1] ?? "") : (entries[0]?.[1] ?? "")),
				entity_id: String(
					entityEntry ? (entityEntry[1] ?? "") : (entries[1]?.[1] ?? "")
				),
				schema_key: String(
					schemaEntry
						? (schemaEntry[1] ?? "")
						: (entries[2]?.[1] ?? TEST_SCHEMA)
				),
			};
		})
		.sort((a, b) => (a._pk < b._pk ? -1 : a._pk > b._pk ? 1 : 0));
}

function assertPrecedence(rows: Array<{ _pk: string; entity_id: string }>) {
	const tags: Record<string, string> = {};
	for (const row of rows) {
		const tag = row._pk.split("~")[0] ?? "";
		tags[row.entity_id] = tag;
	}

	expect(tags[ENTITY_TXN] ?? "").toBe("T");
	if (tags[ENTITY_UNTRACKED] !== undefined) {
		expect(tags[ENTITY_UNTRACKED] ?? "").toBe("U");
	}
	if (tags[ENTITY_CACHE] !== undefined) {
		expect(tags[ENTITY_CACHE] ?? "").toBe("C");
	}
}

async function explainQueryPlan(sql: string): Promise<string> {
	const lix = await openLix({});
	await (lix.db as any)
		.insertInto("stored_schema")
		.values({ value: TEST_CACHE_SCHEMA_DEFINITION })
		.onConflict((oc: any) => oc.doNothing())
		.execute();
	createSchemaCacheTable({
		engine: lix.engine!,
		schema: TEST_CACHE_SCHEMA_DEFINITION,
	});
	const sanitized = sql.trim().replace(/;$/, "");
	try {
		const { rows } = lix.engine!.executeSync({
			sql: `EXPLAIN QUERY PLAN ${sanitized}`,
			parameters: [],
		});
		return rows
			.map((row) =>
				Object.values(row)
					.map((value) =>
						value === null || value === undefined ? "" : String(value)
					)
					.join("|")
			)
			.join("\n");
	} finally {
		await lix.close();
	}
}
