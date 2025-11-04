import { describe, expect, test } from "vitest";
import { parse } from "../../sql-parser/parse.js";
import { compile } from "../../compile.js";
import { rewriteEntityViewSelect } from "./select.js";
import type { PreprocessorTraceEntry } from "../../types.js";
import type { LixSchemaDefinition } from "../../../../schema-definition/definition.js";
import type {
	SelectStatementNode,
	SubqueryNode,
	TableReferenceNode,
} from "../../sql-parser/nodes.js";
import { openLix } from "../../../../lix/open-lix.js";
import { createPreprocessor } from "../../create-preprocessor.js";

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
		const { rewritten, trace } = run(`
		SELECT ev.id
		FROM demo_entity AS ev
	`);

		const select = rewritten as SelectStatementNode;
		const fromClause = select.from_clauses[0]!;
		const relation = fromClause.relation;
		expect(relation.node_kind).toBe("subquery");
		const subquery = relation as SubqueryNode;
		expect(subquery.alias?.value).toBe("ev");
		const innerFrom = subquery.statement.from_clauses[0]!;
		expect(innerFrom.relation.node_kind).toBe("table_reference");
		const table = innerFrom.relation as TableReferenceNode;
		expect(table.name.parts.at(-1)?.value.toLowerCase()).toBe("state");
		expect(trace[0]?.step).toBe("rewrite_entity_view_select");
	});

	test("rewrites _all variant", () => {
		const { rewritten } = run(`
		SELECT *
		FROM demo_entity_by_version
	`);

		const select = rewritten as SelectStatementNode;
		const relation = select.from_clauses[0]!.relation;
		expect(relation.node_kind).toBe("subquery");
		const subquery = relation as SubqueryNode;
		const innerFrom = subquery.statement.from_clauses[0]!;
		expect(innerFrom.relation.node_kind).toBe("table_reference");
		const table = innerFrom.relation as TableReferenceNode;
		expect(table.name.parts.at(-1)?.value.toLowerCase()).toBe(
			"state_by_version"
		);
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

	test("selecting from stored schema view returns rows via preprocessor", async () => {
		const lix = await openLix({});
		const schema: LixSchemaDefinition = {
			"x-lix-key": "e2e_schema",
			"x-lix-version": "1.0",
			"x-lix-primary-key": ["/id"],
			type: "object",
			properties: {
				id: { type: "string" },
				name: { type: "string" },
			},
			required: ["id"],
			additionalProperties: false,
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: schema })
			.execute();

		const preprocess = createPreprocessor({ engine: lix.engine! });

		await lix.db
			.insertInto("state")
			.values({
				entity_id: "row-1",
				schema_key: "e2e_schema",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: { id: "row-1", name: "Entity 1" },
				schema_version: "1.0",
				metadata: null,
				untracked: false,
			})
			.execute();

		const selectResult = preprocess({
			sql: "SELECT name FROM e2e_schema WHERE id = ?",
			parameters: ["row-1"],
		});

		expect(selectResult.sql).not.toMatch(/FROM\s+e2e_schema\b/i);
		expect(selectResult.sql.toLowerCase()).toContain(
			"schema_key = 'e2e_schema'"
		);

		const executed = lix.engine!.sqlite.exec({
			sql: selectResult.sql,
			bind: selectResult.parameters as any[],
			returnValue: "resultRows",
			rowMode: "object",
			columnNames: [],
		});

		expect(executed).toEqual([{ name: "Entity 1" }]);
	});

	test("base view exposes inherited rows", async () => {
		const lix = await openLix({});
		const schemaKey = "inherited_version_schema";
		const schema: LixSchemaDefinition = {
			"x-lix-key": schemaKey,
			"x-lix-version": "1.0",
			"x-lix-primary-key": ["/id"],
			type: "object",
			properties: {
				id: { type: "string" },
				name: { type: "string" },
			},
			required: ["id"],
			additionalProperties: false,
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: schema })
			.execute();

		await lix.db
			.insertInto("state_by_version")
			.values({
				entity_id: "entity-1",
				schema_key: schemaKey,
				file_id: "lix",
				version_id: "global",
				plugin_key: "lix_own_entity",
				schema_version: "1.0",
				snapshot_content: { id: "entity-1", name: "Entity" },
				inherited_from_version_id: "global",
				metadata: null,
				untracked: false,
			})
			.execute();

		const preprocess = createPreprocessor({ engine: lix.engine! });
		const rewritten = preprocess({
			sql: `
			  SELECT 
			      id,
						name, 
						lixcol_inherited_from_version_id 
						FROM inherited_version_schema 
						WHERE id = ?
			`,
			parameters: ["entity-1"],
		});

		const rows = lix.engine!.sqlite.exec({
			sql: rewritten.sql,
			bind: rewritten.parameters as any[],
			returnValue: "resultRows",
			rowMode: "object",
			columnNames: [],
		});

		expect(rows).toEqual([
			{
				id: "entity-1",
				name: "Entity",
				lixcol_inherited_from_version_id: "global",
			},
		]);
	});

	test("rewrites only when stored schema exists", async () => {
		const lix = await openLix({});
		const preprocess = createPreprocessor({ engine: lix.engine! });
		const sql = "SELECT name FROM transient_schema WHERE id = ?";
		const initial = preprocess({ sql, parameters: ["row-1"] });
		expect(initial.sql.toLowerCase()).toContain("from transient_schema");
		expect(initial.sql.toLowerCase()).not.toContain(
			"lix_internal_transaction_state"
		);

		expect(() =>
			lix.engine!.sqlite.exec({
				sql: initial.sql,
				bind: initial.parameters as any[],
				returnValue: "resultRows",
				rowMode: "object",
				columnNames: [],
			})
		).toThrow(/no such table/i);

		const schema: LixSchemaDefinition = {
			"x-lix-key": "transient_schema",
			"x-lix-version": "1.0",
			"x-lix-primary-key": ["/id"],
			type: "object",
			properties: {
				id: { type: "string" },
				name: { type: "string" },
			},
			required: ["id"],
			additionalProperties: false,
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: schema })
			.execute();

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.select("version_id")
			.executeTakeFirstOrThrow();

		await lix.db
			.insertInto("state_by_version")
			.values({
				entity_id: "row-1",
				schema_key: "transient_schema",
				file_id: "lix",
				version_id: activeVersion.version_id,
				plugin_key: "lix_own_entity",
				snapshot_content: { id: "row-1", name: "Entity 1" },
				schema_version: "1.0",
				metadata: null,
				untracked: false,
			})
			.execute();

		const rewritten = preprocess({ sql, parameters: ["row-1"] });
		expect(rewritten.sql).not.toBe(sql);
		expect(rewritten.sql.toLowerCase()).toContain(
			"lix_internal_state_all_untracked"
		);

		const rows = lix.engine!.sqlite.exec({
			sql: rewritten.sql,
			bind: rewritten.parameters as any[],
			returnValue: "resultRows",
			rowMode: "object",
			columnNames: [],
		});
		expect(rows).toEqual([{ name: "Entity 1" }]);
	});
});
