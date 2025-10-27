import { describe, expect, test } from "vitest";
import { parse } from "./parse.js";
import { identifier } from "./nodes.js";

const id = identifier;
const lit = (value: string | number | boolean | null) => ({
	node_kind: "literal" as const,
	value,
});

describe("parse", () => {
	test("parses select star", () => {
		const ast = parse("SELECT * FROM projects");
		expect(ast).toEqual({
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
		});
	});

	test("parses select with where and alias", () => {
		const ast = parse(
			"SELECT p.id AS project_id FROM projects AS p WHERE p.revision >= 1"
		);
		expect(ast).toEqual({
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
		});
	});

	test("parses qualified column without alias", () => {
		const ast = parse("SELECT projects.id FROM projects");
		expect(ast).toEqual({
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
		});
	});

	test("parses update with assignments", () => {
		const ast = parse(
			"UPDATE projects SET name = 'new', revision = revision + 1 WHERE id = ?"
		);
		expect(ast).toEqual({
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
		expect(ast).toEqual({
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
		expect(ast).toEqual({
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
		expect(ast).toEqual({
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
		expect(ast).toEqual({
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
});
