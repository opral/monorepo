import { describe, expect, test } from "vitest";
import { parse } from "../../sql-parser/parse.js";
import { compile } from "../../compile.js";
import { rewriteEntityViewSelect } from "./select.js";
import type { PreprocessorTraceEntry } from "../../types.js";
import type { LixSchemaDefinition } from "../../../../schema-definition/definition.js";

const baseSchema: LixSchemaDefinition = {
	"x-lix-key": "demo_entity",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
	type: "object",
	properties: {
		id: { type: "string" },
		label: { type: "string" },
		count: { type: "number" },
	},
	additionalProperties: false,
};

function createStoredSchemaMap(schema: LixSchemaDefinition) {
	const key = schema["x-lix-key"]!;
	const entries = new Map<string, unknown>();
	const keys = new Set<string>([key]);
	if (key.startsWith("lix_")) {
		const alias = key.slice(4);
		if (alias.length > 0) {
			keys.add(alias);
		}
	}
	for (const baseKey of keys) {
		entries.set(baseKey, schema);
		entries.set(`${baseKey}_all`, schema);
		entries.set(`${baseKey}_history`, schema);
	}
	return entries;
}

const storedSchemas = createStoredSchemaMap(baseSchema);

function run(sql: string) {
	const trace: PreprocessorTraceEntry[] = [];
	const statement = parse(sql);
	const rewritten = rewriteEntityViewSelect({
		node: statement,
		getStoredSchemas: () => new Map(storedSchemas),
		getCacheTables: () => new Map(),
		getSqlViews: () => new Map(),
		hasOpenTransaction: () => true,
		trace,
	});
	return {
		trace,
		rewritten,
		compiled: compile(rewritten),
	};
}

describe("rewriteEntityViewSelect", () => {
	test("rewrites base entity view into state-backed subquery", () => {
		const { compiled, trace } = run(`
			SELECT ev.id
			FROM demo_entity AS ev
		`);

		const sql = compiled.sql;
		expect(sql.toUpperCase()).toContain('FROM "STATE" AS "ST"');
		expect(sql).toContain("= 'demo_entity'");
		expect(trace[0]?.step).toBe("rewrite_entity_view_select");
	});

	test("rewrites _all variant", () => {
		const { compiled } = run(`
			SELECT *
			FROM demo_entity_all
		`);

		const sql = compiled.sql.toUpperCase();
		expect(sql).toContain('FROM "STATE_ALL" AS "SA"');
		expect(sql).toContain('COALESCE("SA"."INHERITED_FROM_VERSION_ID"');
	});

	test("prunes unused properties", () => {
		const { compiled } = run(`
			SELECT ev.id
			FROM demo_entity AS ev
		`);

		const sql = compiled.sql;
		expect(sql).toContain(`json_extract("st"."snapshot_content", '$.id')`);
		expect(sql).not.toContain(
			`json_extract("st"."snapshot_content", '$.label')`
		);
		expect(sql).not.toContain(
			`json_extract("st"."snapshot_content", '$.count')`
		);
	});
});
