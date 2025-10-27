import { expect, test } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { preprocessStatement } from "./preprocess-statement.js";
import { parse } from "./sql-parser/parse.js";
import { compile } from "./compile.js";
import type { PreprocessorTraceEntry, PreprocessorContext } from "./types.js";

test("state_all query flows through state_all and vtable rewrites", async () => {
	const lix = await openLix({});
	const trace: PreprocessorTraceEntry[] = [];

	const statement = parse(`
		SELECT sa.file_id
		FROM state_all AS sa
		WHERE sa.schema_key = 'demo'
	`);

	const rewritten = preprocessStatement(statement, {
		getStoredSchemas: () => new Map<string, unknown>(),
		getCacheTables: () => new Map<string, unknown>(),
		getSqlViews: () => new Map<string, string>(),
		hasOpenTransaction: () => true,
		trace,
	});
	const { sql, parameters } = compile(rewritten);

	const upper = sql.toUpperCase();
	expect(upper).toContain("LIX_INTERNAL_TRANSACTION_STATE");
	expect(upper).not.toContain('FROM "STATE_ALL"');
	expect(trace.map((entry) => entry.step)).toEqual([
		"rewrite_state_all_view_select",
		"rewrite_vtable_selects",
	]);

	expect(() =>
		lix.engine!.sqlite.exec({
			sql,
			bind: parameters as any[],
			returnValue: "resultRows",
			rowMode: "object",
		})
	).not.toThrow();
});

test("sql view expansion feeds subsequent rewrites", () => {
	const trace: PreprocessorTraceEntry[] = [];
	const statement = parse(`
		SELECT fv.file_id
		FROM foo_view AS fv
	`);

	const context: PreprocessorContext = {
		getStoredSchemas: () => new Map<string, unknown>(),
		getCacheTables: () => new Map<string, unknown>(),
		getSqlViews: () =>
			new Map([
				[
					"foo_view",
					`
						SELECT sa.file_id
						FROM state_all AS sa
					`,
				],
			]),
		hasOpenTransaction: () => true,
		trace,
	};

	const rewritten = preprocessStatement(statement, context);
	const { sql } = compile(rewritten);

	const upper = sql.toUpperCase();
	expect(upper).toContain("LIX_INTERNAL_TRANSACTION_STATE");
	expect(trace.map((entry) => entry.step)).toEqual([
		"expand_sql_views",
		"rewrite_state_all_view_select",
		"rewrite_vtable_selects",
	]);
});
