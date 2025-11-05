import { bench, describe } from "vitest";
import { parse as parseStatements } from "../sql-parser/parse.js";
import { rewriteVtableSelects } from "./rewrite-vtable-selects.js";
import { compile } from "../sql-parser/compile.js";

const baseContext = {
	getStoredSchemas: () => new Map(),
	getCacheTables: () => new Map(),
	getSqlViews: () => new Map(),
	hasOpenTransaction: () => true,
	trace: undefined,
} as const;

const scenarios = [
	{
		name: "simple select",
		sql: `
			SELECT *
			FROM lix_internal_state_vtable
		`,
	},
	{
		name: "schema filter",
		sql: `
			SELECT v.*
			FROM lix_internal_state_vtable AS v
			WHERE v.schema_key = 'test_schema_key'
		`,
	},
	{
		name: "joined aliases",
		sql: `
			SELECT a.schema_key, b.writer_key
			FROM lix_internal_state_vtable AS a
			INNER JOIN lix_internal_state_vtable AS b
				ON a.schema_key = b.schema_key
		`,
	},
	{
		name: "compound union",
		sql: `
			SELECT v.schema_key
			FROM lix_internal_state_vtable AS v
			UNION ALL
			SELECT w.schema_key
			FROM lix_internal_state_vtable AS w
		`,
	},
] as const;

const runRewrite = (sql: string) =>
	rewriteVtableSelects({
		statements: parseStatements(sql),
		parameters: [],
		...baseContext,
	});

for (const scenario of scenarios) {
	describe(`[rewrite_vtable_select.js] ${scenario.name}`, () => {
		bench("rewrite", () => {
			const statements = runRewrite(scenario.sql);
			const rendered = compile(statements).sql.toLowerCase();
			if (rendered.includes('from "lix_internal_state_vtable"')) {
				throw new Error("vtable reference should be rewritten");
			}
		});
	});
}
