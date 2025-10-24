import { expect, test } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { preprocessStatement } from "./preprocess-statement.js";
import { parse } from "./sql-parser/parse.js";
import { compile } from "./compile.js";
import type { PreprocessorTraceEntry, PreprocessorContext } from "./types.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";

function createContext(trace: PreprocessorTraceEntry[]): PreprocessorContext {
	return {
		getStoredSchemas: () => new Map<string, unknown>(),
		getCacheTables: () => new Map<string, unknown>(),
		hasOpenTransaction: () => true,
		trace,
	};
}

test("state_all query flows through state_all and vtable rewrites", async () => {
	const lix = await openLix({});
	const trace: PreprocessorTraceEntry[] = [];

	const statement = parse(`
		SELECT sa.file_id
		FROM state_all AS sa
		WHERE sa.schema_key = 'demo'
	`);

	const rewritten = preprocessStatement(statement, createContext(trace));
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

function createSchemaContext(
	trace: PreprocessorTraceEntry[],
	schema: LixSchemaDefinition
): PreprocessorContext {
	const storedSchemas = buildStoredSchemaMap(schema);
	return {
		getStoredSchemas: () => new Map(storedSchemas),
		getCacheTables: () => new Map<string, unknown>(),
		hasOpenTransaction: () => true,
		trace,
	};
}

function buildStoredSchemaMap(schema: LixSchemaDefinition): Map<string, unknown> {
	const key = schema["x-lix-key"]!;
	const map = new Map<string, unknown>();
	const keys = new Set<string>([key]);
	if (key.startsWith("lix_")) {
		const alias = key.slice(4);
		if (alias.length > 0) {
			keys.add(alias);
		}
	}
	for (const baseKey of keys) {
		map.set(baseKey, schema);
		map.set(`${baseKey}_all`, schema);
		map.set(`${baseKey}_history`, schema);
	}
	return map;
}

test("entity view query rewrites to state-backed subquery", () => {
	const trace: PreprocessorTraceEntry[] = [];
	const schema: LixSchemaDefinition = {
		"x-lix-key": "demo_entity",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		type: "object",
		properties: {
			id: { type: "string" },
			label: { type: "string" },
		},
		additionalProperties: false,
	};

	const statement = parse(`
		SELECT ev.id
		FROM demo_entity AS ev
	`);

	const context = createSchemaContext(trace, schema);
	const rewritten = preprocessStatement(statement, context);
	const { sql } = compile(rewritten);

	const upper = sql.toUpperCase();
	expect(upper).toContain('FROM "STATE" AS "ST"');
	expect(sql).toContain("= 'demo_entity'");
	expect(sql).toContain(
		`json_extract("st"."snapshot_content", '$.id')`
	);
	expect(sql).not.toContain(
		`json_extract("st"."snapshot_content", '$.label')`
	);
	expect(trace).toHaveLength(1);
	expect(trace[0]?.step).toBe("rewrite_entity_view_select");
});
