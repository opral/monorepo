import { expect, test } from "vitest";
import { parse } from "../sql-parser/parse.js";
import { compile } from "../compile.js";
import { expandSqlViews } from "./expand-sql-views.js";
import type { PreprocessorTraceEntry } from "../types.js";

test("expands referenced view into a subquery", () => {
	const trace: PreprocessorTraceEntry[] = [];
	const statement = parse(`
		SELECT av.schema_key
		FROM active_version AS av
	`);

	const rewritten = expandSqlViews({
		node: statement,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () =>
			new Map([
				[
					"active_version",
					`
						SELECT st.schema_key
						FROM state AS st
					`,
				],
			]),
		hasOpenTransaction: () => false,
		trace,
	});

	const { sql } = compile(rewritten);
	const upper = sql.toUpperCase();
	expect(upper).toContain('FROM (SELECT "ST"."SCHEMA_KEY"');
	expect(upper).toContain('FROM "STATE" AS "ST") AS "AV"');
	expect(trace[0]?.step).toBe("expand_sql_views");
	expect(trace[0]?.payload?.views).toEqual(["active_version"]);
});

test("keeps view name as alias when none provided", () => {
	const statement = parse(`
		SELECT *
		FROM only_view
	`);

	const rewritten = expandSqlViews({
		node: statement,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () =>
			new Map([
				[
					"only_view",
					`
						SELECT sa.file_id
						FROM state_all AS sa
					`,
				],
			]),
		hasOpenTransaction: () => false,
	});

	const { sql } = compile(rewritten);
	expect(sql.toUpperCase()).toContain('AS "ONLY_VIEW"');
});
