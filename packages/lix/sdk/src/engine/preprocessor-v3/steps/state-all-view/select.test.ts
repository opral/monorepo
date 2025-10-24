import { describe, expect, test } from "vitest";
import { parse } from "../../sql-parser/parse.js";
import { compile } from "../../compile.js";
import type { PreprocessorTrace } from "../../types.js";
import { rewriteStateAllViewSelect } from "./select.js";

function run(sql: string, trace?: PreprocessorTrace) {
	const statement = parse(sql);
	const result = rewriteStateAllViewSelect({
		node: statement,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () => new Map(),
		hasOpenTransaction: () => true,
		trace,
	});
	return compile(result);
}

describe("rewriteStateAllViewSelect", () => {
	test("rewrites state_all reference into subquery", () => {
		const trace: PreprocessorTrace = [];
		const { sql } = run(
			`
				SELECT sa.*
				FROM state_all AS sa
				WHERE sa.schema_key = 'test'
			`,
			trace
		);

		const upper = sql.toUpperCase();
		expect(upper).not.toContain('FROM "STATE_ALL"');
		expect(upper).toContain('FROM "LIX_INTERNAL_STATE_VTABLE"');
		expect(sql).toContain("json(metadata)");
		expect(trace[0]?.payload).toMatchObject({
			reference_count: 1,
			bindings: ["sa"],
		});
	});

	test("rewrites nested state_all reference inside subquery", () => {
		const { sql } = run(`
		SELECT outer_alias.*
		FROM (
			SELECT *
			FROM state_all
			WHERE schema_key = 'nested'
		) AS outer_alias
	`);

		const upper = sql.toUpperCase();
		expect(upper).not.toContain('FROM "STATE_ALL"');
		expect(upper).toContain('FROM "LIX_INTERNAL_STATE_VTABLE"');
	});

	test("narrows projection to referenced columns", () => {
		const { sql } = run(`
		SELECT sa.file_id
		FROM state_all AS sa
		WHERE sa.schema_key = 'narrow'
	`);

		expect(sql).toContain('"v"."file_id" AS "file_id"');
		expect(sql).toContain('"v"."schema_key" AS "schema_key"');
		expect(sql).toContain('"v"."snapshot_content" AS "snapshot_content"');
		expect(sql).not.toContain('"v"."plugin_key" AS "plugin_key"');
		expect(sql).not.toContain('"v"."metadata"');
	});

	test("projection includes metadata when explicitly selected", () => {
		const { sql } = run(`
		SELECT sa.metadata, sa.file_id
		FROM state_all AS sa
		WHERE sa.schema_key = 'with_metadata'
	`);

		expect(sql).toContain('"v"."file_id" AS "file_id"');
		expect(sql).toContain(
			'(SELECT json(metadata) FROM "change" WHERE "change"."id" = "v"."change_id") AS "metadata"'
		);
	});

	test("prunes unused columns", () => {
		const { sql } = run(`
		SELECT sa.file_id
		FROM state_all AS sa
	`);

		expect(sql).not.toContain('"v"."plugin_key" AS "plugin_key"');
		expect(sql).not.toContain('"v"."metadata"');
		const fileIdCount = sql.match(/"v"."file_id" AS "file_id"/g)?.length ?? 0;
		expect(fileIdCount).toBe(1);
		const schemaKeyCount =
			sql.match(/"v"."schema_key" AS "schema_key"/g)?.length ?? 0;
		const snapshotCount =
			sql.match(/"v"."snapshot_content" AS "snapshot_content"/g)?.length ?? 0;
		expect(schemaKeyCount).toBe(1);
		expect(snapshotCount).toBe(1);
	});
});
