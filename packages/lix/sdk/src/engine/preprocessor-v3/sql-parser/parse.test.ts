import { describe, expect, test } from "vitest";
import { parse } from "./parse.js";
import { identifier } from "./nodes.js";

const id = identifier;
const lit = (value: string | number | boolean | null) => ({
	node_kind: "literal" as const,
	value,
});

const stripOptionalFields = (value: unknown): unknown => {
	if (Array.isArray(value)) {
		return value.map(stripOptionalFields);
	}
	if (value && typeof value === "object") {
		const entries = Object.entries(value as Record<string, unknown>);
		const result: Record<string, unknown> = {};
		for (const [key, nested] of entries) {
			if (key === "with" && nested === null) {
				continue;
			}
			if (
				key === "set_operations" &&
				Array.isArray(nested) &&
				nested.length === 0
			) {
				continue;
			}
			result[key] = stripOptionalFields(nested);
		}
		return result;
	}
	return value;
};

describe("parse", () => {
	test("parses select star", () => {
		const ast = parse("SELECT * FROM projects");
		expect(stripOptionalFields(ast)).toEqual({
			node_kind: "select_statement",
			projection: [{ node_kind: "select_star" }],
			from_clauses: [
				{
					node_kind: "from_clause",
					relation: {
						node_kind: "table_reference",
						name: { node_kind: "object_name", parts: [id("projects")] },
						alias: null,
					},
					joins: [],
				},
			],
			where_clause: null,
			order_by: [],
			limit: null,
			offset: null,
		});
	});

	test("parses select with where and alias", () => {
		const ast = parse(
			"SELECT p.id AS project_id FROM projects AS p WHERE p.revision >= 1"
		);
		expect(stripOptionalFields(ast)).toEqual({
			node_kind: "select_statement",
			projection: [
				{
					node_kind: "select_expression",
					expression: {
						node_kind: "column_reference",
						path: [id("p"), id("id")],
					},
					alias: id("project_id"),
				},
			],
			from_clauses: [
				{
					node_kind: "from_clause",
					relation: {
						node_kind: "table_reference",
						name: { node_kind: "object_name", parts: [id("projects")] },
						alias: id("p"),
					},
					joins: [],
				},
			],
			where_clause: {
				node_kind: "binary_expression",
				left: {
					node_kind: "column_reference",
					path: [id("p"), id("revision")],
				},
				operator: ">=",
				right: { node_kind: "literal", value: 1 },
			},
			order_by: [],
			limit: null,
			offset: null,
		});
	});

	test("parses select literal without from clause", () => {
		const ast = parse("SELECT 1 AS value");
		expect(stripOptionalFields(ast)).toEqual({
			node_kind: "select_statement",
			projection: [
				{
					node_kind: "select_expression",
					expression: { node_kind: "literal", value: 1 },
					alias: id("value"),
				},
			],
			from_clauses: [],
			where_clause: null,
			order_by: [],
			limit: null,
			offset: null,
		});
	});

	test("parses qualified column without alias", () => {
		const ast = parse("SELECT projects.id FROM projects");
		expect(stripOptionalFields(ast)).toEqual({
			node_kind: "select_statement",
			projection: [
				{
					node_kind: "select_expression",
					expression: {
						node_kind: "column_reference",
						path: [id("projects"), id("id")],
					},
					alias: null,
				},
			],
			from_clauses: [
				{
					node_kind: "from_clause",
					relation: {
						node_kind: "table_reference",
						name: { node_kind: "object_name", parts: [id("projects")] },
						alias: null,
					},
					joins: [],
				},
			],
			where_clause: null,
			order_by: [],
			limit: null,
			offset: null,
		});
	});

	test("parses update with assignments", () => {
		const ast = parse(
			"UPDATE projects SET name = 'new', revision = revision + 1 WHERE id = ?"
		);
		expect(stripOptionalFields(ast)).toEqual({
			node_kind: "update_statement",
			target: {
				node_kind: "table_reference",
				name: { node_kind: "object_name", parts: [id("projects")] },
				alias: null,
			},
			assignments: [
				{
					node_kind: "set_clause",
					column: {
						node_kind: "column_reference",
						path: [id("name")],
					},
					value: { node_kind: "literal", value: "new" },
				},
				{
					node_kind: "set_clause",
					column: {
						node_kind: "column_reference",
						path: [id("revision")],
					},
					value: {
						node_kind: "binary_expression",
						left: {
							node_kind: "column_reference",
							path: [id("revision")],
						},
						operator: "+",
						right: { node_kind: "literal", value: 1 },
					},
				},
			],
			where_clause: {
				node_kind: "binary_expression",
				left: {
					node_kind: "column_reference",
					path: [id("id")],
				},
				operator: "=",
				right: { node_kind: "parameter", placeholder: "?" },
			},
		});
	});

	test("parses IN predicate", () => {
		const ast = parse("SELECT * FROM projects WHERE id IN ('a', 'b')");
		if (ast.node_kind !== "select_statement") {
			throw new Error("expected select statement");
		}
		expect(ast.where_clause).toEqual({
			node_kind: "in_list_expression",
			operand: {
				node_kind: "column_reference",
				path: [id("id")],
			},
			items: [lit("a"), lit("b")],
			negated: false,
		});
	});

	test("parses limit and offset clauses", () => {
		const ast = parse(
			"SELECT id FROM projects ORDER BY created_at DESC LIMIT 5 OFFSET 10"
		);
		if (ast.node_kind !== "select_statement") {
			throw new Error("expected select statement");
		}
		expect(ast.limit).toEqual({
			node_kind: "literal",
			value: 5,
		});
		expect(ast.offset).toEqual({
			node_kind: "literal",
			value: 10,
		});
	});

	test("parses limit without offset", () => {
		const ast = parse("SELECT * FROM files LIMIT 20");
		if (ast.node_kind !== "select_statement") {
			throw new Error("expected select statement");
		}
		expect(ast.limit).toEqual({
			node_kind: "literal",
			value: 20,
		});
		expect(ast.offset).toBeNull();
	});

	test("parses parameterised limit and offset", () => {
		const ast = parse("SELECT * FROM logs LIMIT ? OFFSET ?2");
		if (ast.node_kind !== "select_statement") {
			throw new Error("expected select statement");
		}
		expect(ast.limit).toEqual({
			node_kind: "parameter",
			placeholder: "?",
		});
		expect(ast.offset).toEqual({
			node_kind: "parameter",
			placeholder: "?2",
		});
	});

	test("returns raw fragment for unsupported statement types", () => {
		const sql = "CREATE TABLE projects(id TEXT)";
		const ast = parse(sql);
		expect(stripOptionalFields(ast)).toEqual({
			node_kind: "raw_fragment",
			sql_text: sql,
		});
	});

	test("returns raw fragment when lexing fails", () => {
		const sql = "???";
		const ast = parse(sql);
		expect(stripOptionalFields(ast)).toEqual({
			node_kind: "raw_fragment",
			sql_text: sql,
		});
	});

	test("parses BETWEEN predicate", () => {
		const ast = parse("SELECT * FROM projects WHERE revision BETWEEN 1 AND 5");
		if (ast.node_kind !== "select_statement") {
			throw new Error("expected select statement");
		}
		expect(ast.where_clause).toEqual({
			node_kind: "between_expression",
			operand: {
				node_kind: "column_reference",
				path: [id("revision")],
			},
			start: lit(1),
			end: lit(5),
			negated: false,
		});
	});

	test("parses ORDER BY clause", () => {
		const ast = parse("SELECT * FROM projects ORDER BY updated_at DESC, id");
		if (ast.node_kind !== "select_statement") {
			throw new Error("expected select statement");
		}
		expect(ast.order_by).toEqual([
			{
				node_kind: "order_by_item",
				expression: {
					node_kind: "column_reference",
					path: [id("updated_at")],
				},
				direction: "desc",
			},
			{
				node_kind: "order_by_item",
				expression: {
					node_kind: "column_reference",
					path: [id("id")],
				},
				direction: null,
			},
		]);
	});

	test("parses NOT predicate", () => {
		const ast = parse("SELECT * FROM projects WHERE NOT (archived = 1)");
		if (ast.node_kind !== "select_statement") {
			throw new Error("expected select statement");
		}
		expect(ast.where_clause).toEqual({
			node_kind: "unary_expression",
			operator: "not",
			operand: {
				node_kind: "grouped_expression",
				expression: {
					node_kind: "binary_expression",
					left: {
						node_kind: "column_reference",
						path: [id("archived")],
					},
					operator: "=",
					right: lit(1),
				},
			},
		});
	});

	test("parses delete", () => {
		const ast = parse("DELETE FROM projects WHERE projects.id = 'obsolete'");
		expect(stripOptionalFields(ast)).toEqual({
			node_kind: "delete_statement",
			target: {
				node_kind: "table_reference",
				name: { node_kind: "object_name", parts: [id("projects")] },
				alias: null,
			},
			where_clause: {
				node_kind: "binary_expression",
				left: {
					node_kind: "column_reference",
					path: [id("projects"), id("id")],
				},
				operator: "=",
				right: { node_kind: "literal", value: "obsolete" },
			},
		});
	});

	test("parses insert with column list and multiple rows", () => {
		const ast = parse(
			"INSERT INTO projects (id, name) VALUES ('a', 'Project A'), ('b', ?)"
		);
		expect(stripOptionalFields(ast)).toEqual({
			node_kind: "insert_statement",
			target: {
				node_kind: "object_name",
				parts: [id("projects")],
			},
			columns: [id("id"), id("name")],
			source: {
				node_kind: "insert_values",
				rows: [
					[lit("a"), lit("Project A")],
					[lit("b"), { node_kind: "parameter", placeholder: "?" }],
				],
			},
		});
	});

	test("parses function call expression inside update assignment", () => {
		const ast = parse(
			"UPDATE key_value SET value = json_set(value, '$.foo', ?) WHERE key = ?"
		);
		expect(stripOptionalFields(ast)).toEqual({
			node_kind: "update_statement",
			target: {
				node_kind: "table_reference",
				name: { node_kind: "object_name", parts: [id("key_value")] },
				alias: null,
			},
			assignments: [
				{
					node_kind: "set_clause",
					column: {
						node_kind: "column_reference",
						path: [id("value")],
					},
					value: {
						node_kind: "function_call",
						name: id("json_set"),
						arguments: [
							{
								node_kind: "column_reference",
								path: [id("value")],
							},
							{
								node_kind: "literal",
								value: "$.foo",
							},
							{
								node_kind: "parameter",
								placeholder: "?",
							},
						],
					},
				},
			],
			where_clause: {
				node_kind: "binary_expression",
				left: {
					node_kind: "column_reference",
					path: [id("key")],
				},
				operator: "=",
				right: { node_kind: "parameter", placeholder: "?" },
			},
		});
	});

	test("parses function call without arguments inside update assignment", () => {
		const ast = parse("UPDATE metrics SET touched_at = random() WHERE id = ?");
		expect(stripOptionalFields(ast)).toEqual({
			node_kind: "update_statement",
			target: {
				node_kind: "table_reference",
				name: { node_kind: "object_name", parts: [id("metrics")] },
				alias: null,
			},
			assignments: [
				{
					node_kind: "set_clause",
					column: {
						node_kind: "column_reference",
						path: [id("touched_at")],
					},
					value: {
						node_kind: "function_call",
						name: id("random"),
						arguments: [],
					},
				},
			],
			where_clause: {
				node_kind: "binary_expression",
				left: {
					node_kind: "column_reference",
					path: [id("id")],
				},
				operator: "=",
				right: { node_kind: "parameter", placeholder: "?" },
			},
		});
	});

	test("parses select with recursive cte using union", () => {
		const sql = `
			WITH RECURSIVE chain(id, depth) AS (
				SELECT id, 0 FROM commit
				UNION ALL
				SELECT commit_edge.parent_id, chain.depth + 1
				FROM commit_edge
				JOIN chain ON commit_edge.child_id = chain.id
			)
			SELECT id FROM chain
		`;
		const ast = parse(sql);
		if (ast.node_kind !== "select_statement") {
			throw new Error("expected select statement");
		}
		const withClause = ast.with;
		expect(withClause).not.toBeNull();
		expect(withClause?.recursive).toBe(true);
		const binding = withClause?.bindings[0];
		if (!binding) {
			throw new Error("expected with binding");
		}
		expect(binding.name.value).toBe("chain");
		expect(binding.statement.set_operations).toHaveLength(1);
		const operation = binding.statement.set_operations[0];
		expect(operation.operator).toBe("union");
		expect(operation.quantifier).toBe("all");
		const baseFrom = binding.statement.from_clauses[0]?.relation;
		if (!baseFrom || baseFrom.node_kind !== "table_reference") {
			throw new Error("expected base table reference");
		}
		expect(baseFrom.name.parts[0]?.value).toBe("commit");
		const unionFrom = operation.select.from_clauses[0]?.relation;
		if (!unionFrom || unionFrom.node_kind !== "table_reference") {
			throw new Error("expected union table reference");
		}
		expect(unionFrom.name.parts[0]?.value).toBe("commit_edge");
	});

	test("returns raw fragment for unsupported statements", () => {
		const sql = "CREATE TABLE example(id TEXT)";
		const ast = parse(sql);
		expect(stripOptionalFields(ast)).toEqual({
			node_kind: "raw_fragment",
			sql_text: sql,
		});
	});
});
