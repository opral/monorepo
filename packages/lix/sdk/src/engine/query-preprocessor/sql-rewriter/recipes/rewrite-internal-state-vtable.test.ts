import { expect, test } from "vitest";
import { tokenize } from "../tokenizer.js";
import { analyzeShape } from "../microparser/analyze-shape.js";
import { rewriteInternalStateVtableQuery } from "./rewrite-internal-state-vtable.js";
import { openLix } from "../../../../lix/open-lix.js";
import { insertTransactionState } from "../../../../state/transaction/insert-transaction-state.js";
import { updateStateCache } from "../../../../state/cache/update-state-cache.js";
import { getTimestamp } from "../../../../engine/functions/timestamp.js";
import { internalQueryBuilder } from "../../../../engine/internal-query-builder.js";
import { rewriteSql } from "../rewrite-sql.js";
import { sql } from "kysely";

test("fast path includes writer join when writer_key selected", () => {
	const sql = `SELECT v.writer_key FROM internal_state_vtable v WHERE v.schema_key = 'lix_key_value' LIMIT 1;`;
	const shape = analyzeShape(tokenize(sql));
	expect(shape).not.toBeNull();
	expect(shape?.selectsWriterKey).toBe(true);

	const rewritten = rewriteInternalStateVtableQuery(shape!);
	expect(rewritten).toBeTruthy();
	const limitCount = (rewritten!.match(/LIMIT 1/g) ?? []).length;
	expect(limitCount).toBe(4);
	expect(rewritten).toContain("internal_state_writer");
});

test("rewrites a simple internal_state_vtable select", () => {
	const sql = `SELECT * FROM internal_state_vtable;`;
	const tokens = tokenize(sql);
	const shape = analyzeShape(tokens);
	expect(shape).not.toBeNull();

	const rewritten = rewriteInternalStateVtableQuery(shape!);
	expect(rewritten).toBeTruthy();
	expect(rewritten).toContain("WITH RECURSIVE");
	expect(rewritten).toContain("internal_state_cache");
});

test("passes literal schema key into cache routing", () => {
	const sql = `SELECT * FROM internal_state_vtable v WHERE v.schema_key = 'lix_key_value';`;
	const tokens = tokenize(sql);
	const shape = analyzeShape(tokens);

	expect(shape).not.toBeNull();

	const rewritten = rewriteInternalStateVtableQuery(shape!);
	expect(rewritten).toBeTruthy();
	expect(rewritten).toContain("lix_key_value");
});

test("state_all metadata projection rewrites away internal_state_vtable", () => {
	const sql = `
		SELECT
			(
				SELECT json(metadata)
				FROM change
				WHERE change.id = internal_state_vtable.change_id
			) AS metadata
		FROM internal_state_vtable
		WHERE schema_key = 'lix_directory_descriptor';
	`;

	const rewritten = rewriteSql(sql);

	// Expected rewrite: the expanded query should no longer reference the raw view name.
	expect(/\binternal_state_vtable\b/i.test(rewritten)).toBe(false);
});

test("correlated metadata subquery honours alias after rewrite", () => {
	const sql = `
		SELECT
			(
				SELECT json(metadata)
				FROM change
				WHERE change.id = internal_state_vtable.change_id
			) AS metadata
		FROM internal_state_vtable AS state
		WHERE state.schema_key = 'lix_directory_descriptor';
	`;

	const rewritten = rewriteSql(sql);

	// Alias should replace correlated reference too.
	expect(/\binternal_state_vtable\b/i.test(rewritten)).toBe(false);
	expect(rewritten).toContain("state.change_id");
});

test("uses fast path for limit 1 queries", async () => {
	const sql = `SELECT * FROM internal_state_vtable v WHERE v.schema_key = 'lix_key_value' LIMIT 1;`;
	const tokens = tokenize(sql);
	const shape = analyzeShape(tokens);
	expect(shape).not.toBeNull();

	const rewritten = rewriteInternalStateVtableQuery(shape!);
	expect(rewritten).toBeTruthy();
	const limitCount = (rewritten!.match(/LIMIT 1/g) ?? []).length;
	expect(limitCount).toBe(4);
	expect(rewritten).toContain("internal_transaction_state");
	expect(rewritten).not.toContain("WITH RECURSIVE");
	expect(rewritten).not.toContain("internal_state_writer");

	const rewrittenQuery = `SELECT * FROM (${rewritten}) AS v;`;
	const plan = await explainQueryPlan(rewrittenQuery);

	expect(plan).not.toContain("internal_state_vtable");
	expect(plan).toMatchSnapshot();
});

test("matrix of queries preserves precedence across rewrites", async () => {
	await withSeededFixture(async (ctx) => {
		const baseSql = `SELECT v._pk AS pk_tag, v.entity_id, v.schema_key FROM internal_state_vtable v WHERE v.schema_key = '${TEST_SCHEMA}' AND v.version_id = '${VERSION_GLOBAL}' ORDER BY pk_tag;`;
		const limitSql = `SELECT v._pk AS pk_tag, v.entity_id, v.schema_key FROM internal_state_vtable v WHERE v.schema_key = '${TEST_SCHEMA}' AND v.version_id = '${VERSION_GLOBAL}' AND v.entity_id = '${ENTITY_TXN}' LIMIT 1;`;

		const variants: Array<{
			name: string;
			originalSql: string;
			rewrite: boolean;
			planSnapshot?: string;
			expectLimitCount?: number;
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
				planSnapshot: "matrix fast limit plan",
				expectLimitCount: 4,
			},
		];

		for (const variant of variants) {
			const baselineRows = await executeQuery(ctx, variant.originalSql, {
				rewrite: false,
			});
			const rewrittenRows = await executeQuery(ctx, variant.originalSql, {
				rewrite: variant.rewrite,
			});

			if (variant.expectLimitCount !== undefined && variant.rewrite) {
				const rewrittenSql = rewriteSql(variant.originalSql);
				const limitCount = (rewrittenSql.match(/LIMIT 1/g) ?? []).length;
				expect(limitCount).toBeGreaterThanOrEqual(variant.expectLimitCount);
			}

			expect(rewrittenRows).toEqual(baselineRows);
			assertPrecedence(baselineRows);

			if (variant.planSnapshot && variant.rewrite) {
				const plan = await explainQueryPlan(rewriteSql(variant.originalSql));
				expect(plan).toMatchSnapshot(variant.planSnapshot);
			}
		}
	});
});

const TEST_SCHEMA = "rewrite_matrix_schema";
const FILE_ID = "matrix-file";
const VERSION_GLOBAL = "global";
const SCHEMA_VERSION = "1.0";
const PLUGIN_KEY = "lix_own_entity";

const ENTITY_TXN = "priority_shared";
const ENTITY_UNTRACKED = "priority_untracked";
const ENTITY_CACHE = "priority_cache";

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
		.insertInto("internal_state_all_untracked")
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
			inheritance_delete_marker: 0,
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
