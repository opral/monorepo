import { describe, expect, test } from "vitest";
import { parse } from "./parse.js";
import {
	identifier,
	type RawFragmentNode,
	type CompoundSelectNode,
} from "./nodes.js";

const id = identifier;
const lit = (value: string | number | boolean | null) => ({
	node_kind: "literal" as const,
	value,
});

const parseStatements = (sql: string) => parse(sql);

function parseSingleSegment(sql: string) {
	const statements = parseStatements(sql);
	if (statements.length !== 1) {
		throw new Error("expected single statement");
	}
	const [statement] = statements;
	if (!statement || statement.node_kind !== "segmented_statement") {
		throw new Error("expected segmented statement");
	}
	if (statement.segments.length !== 1) {
		throw new Error("expected single segment");
	}
	const [segment] = statement.segments;
	if (!segment) {
		throw new Error("missing segment");
	}
	return segment;
}

function parseSelectStatement(sql: string) {
	const segment = parseSingleSegment(sql);
	if (segment.node_kind !== "select_statement") {
		throw new Error("expected select statement");
	}
	return segment;
}

function parseUpdateStatement(sql: string) {
	const segment = parseSingleSegment(sql);
	if (segment.node_kind !== "update_statement") {
		throw new Error("expected update statement");
	}
	return segment;
}

function parseDeleteStatement(sql: string) {
	const segment = parseSingleSegment(sql);
	if (segment.node_kind !== "delete_statement") {
		throw new Error("expected delete statement");
	}
	return segment;
}

function parseInsertStatement(sql: string) {
	const segment = parseSingleSegment(sql);
	if (segment.node_kind !== "insert_statement") {
		throw new Error("expected insert statement");
	}
	return segment;
}

describe("parse", () => {
	test("parses select star", () => {
		const ast = parseSelectStatement("SELECT * FROM projects");
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
			limit: null,
			offset: null,
		});
	});

	test("parses select with where and alias", () => {
		const ast = parseSelectStatement(
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
			limit: null,
			offset: null,
		});
	});

	test("parses select literal without from clause", () => {
		const ast = parseSelectStatement("SELECT 1 AS value");
		expect(ast).toEqual({
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
		const ast = parseSelectStatement("SELECT projects.id FROM projects");
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
			limit: null,
			offset: null,
		});
	});

	test("parses update with assignments", () => {
		const ast = parseUpdateStatement(
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
				right: {
					node_kind: "parameter",
					placeholder: "?",
					position: 0,
				},
			},
		});
	});

	test("parses IN predicate", () => {
		const ast = parseSelectStatement(
			"SELECT * FROM projects WHERE id IN ('a', 'b')"
		);
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
		const ast = parseSelectStatement(
			"SELECT id FROM projects ORDER BY created_at DESC LIMIT 5 OFFSET 10"
		);
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
		const ast = parseSelectStatement("SELECT * FROM files LIMIT 20");
		expect(ast.limit).toEqual({
			node_kind: "literal",
			value: 20,
		});
		expect(ast.offset).toBeNull();
	});

	test("parses parameterised limit and offset", () => {
		const ast = parseSelectStatement("SELECT * FROM logs LIMIT ? OFFSET ?2");
		expect(ast.limit).toEqual({
			node_kind: "parameter",
			placeholder: "?",
			position: 0,
		});
		expect(ast.offset).toEqual({
			node_kind: "parameter",
			placeholder: "?2",
			position: 1,
		});
	});

	test("assigns sequential positions after numbered placeholders", () => {
		const ast = parseSelectStatement(
			"SELECT * FROM logs WHERE owner_id = ?1 AND schema_key = ?"
		);
		const where = ast.where_clause;
		if (!where || where.node_kind !== "binary_expression") {
			throw new Error("expected binary expression");
		}
		const { left, right } = where;
		if (left.node_kind !== "binary_expression") {
			throw new Error("expected binary expression on left");
		}
		if (right.node_kind !== "binary_expression") {
			throw new Error("expected binary expression on right");
		}
		const leftParam = left.right;
		const rightParam = right.right;
		if (leftParam.node_kind !== "parameter") {
			throw new Error("expected parameter on left");
		}
		if (rightParam.node_kind !== "parameter") {
			throw new Error("expected parameter on right");
		}
		expect(leftParam).toEqual({
			node_kind: "parameter",
			placeholder: "?1",
			position: 0,
		});
		expect(rightParam).toEqual({
			node_kind: "parameter",
			placeholder: "?",
			position: 1,
		});
	});

	test("returns raw fragment for unsupported statement types", () => {
		const sql = "CREATE TABLE projects(id TEXT)";
		const statements = parseStatements(sql);
		expect(statements).toHaveLength(1);
		const [statement] = statements;
		if (!statement || statement.node_kind !== "segmented_statement") {
			throw new Error("expected segmented statement");
		}
		expect(statement.segments).toEqual<RawFragmentNode[]>([
			{
				node_kind: "raw_fragment",
				sql_text: sql,
			},
		]);
	});

	test("returns raw fragment when lexing fails", () => {
		const sql = "???";
		const statements = parseStatements(sql);
		expect(statements).toHaveLength(1);
		const [statement] = statements;
		if (!statement || statement.node_kind !== "segmented_statement") {
			throw new Error("expected segmented statement");
		}
		expect(statement.segments).toEqual<RawFragmentNode[]>([
			{
				node_kind: "raw_fragment",
				sql_text: sql,
			},
		]);
	});

	test("parses BETWEEN predicate", () => {
		const ast = parseSelectStatement(
			"SELECT * FROM projects WHERE revision BETWEEN 1 AND 5"
		);
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
		const ast = parseSelectStatement(
			"SELECT * FROM projects ORDER BY updated_at DESC, id"
		);
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
		const ast = parseSelectStatement(
			"SELECT * FROM projects WHERE NOT (archived = 1)"
		);
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
		const ast = parseDeleteStatement(
			"DELETE FROM projects WHERE projects.id = 'obsolete'"
		);
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
		const ast = parseInsertStatement(
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
					[lit("b"), { node_kind: "parameter", placeholder: "?", position: 0 }],
				],
			},
		});
	});

	test("parses function call expression inside update assignment", () => {
		const ast = parseUpdateStatement(
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
								position: 0,
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
				right: {
					node_kind: "parameter",
					placeholder: "?",
					position: 1,
				},
			},
		});
	});

	test("parses function call without arguments inside update assignment", () => {
		const ast = parseUpdateStatement(
			"UPDATE metrics SET touched_at = random() WHERE id = ?"
		);
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
				right: {
					node_kind: "parameter",
					placeholder: "?",
					position: 0,
				},
			},
		});
	});

	test("splits recursive CTE into raw fragments and select statements", () => {
		const sql = `
WITH RECURSIVE
  "foo" AS (
    SELECT
      "id",
      "name",
      0 AS "depth"
    FROM "items"
    WHERE "id" = 'root'

    UNION ALL

    SELECT
      "child"."id",
      "child"."name",
      "foo"."depth" + 1 AS "depth"
    FROM "items" AS "child"
    JOIN "foo" ON "child"."parent_id" = "foo"."id"
  )
SELECT *
FROM "foo";
			`.trim();

		const statements = parseStatements(sql);
		expect(statements).toHaveLength(1);
		const [statement] = statements;
		if (!statement || statement.node_kind !== "segmented_statement") {
			throw new Error("expected segmented statement");
		}

		const segments = statement.segments;
		expect(segments).toHaveLength(5);

		const prefix = segments[0];
		if (!prefix || prefix.node_kind !== "raw_fragment") {
			throw new Error("expected raw fragment prefix");
		}
		const rawPrefix = prefix as RawFragmentNode;
		expect(rawPrefix.sql_text).toContain('WITH RECURSIVE\n  "foo" AS (');

		const firstSelect = segments[1];
		if (!firstSelect || firstSelect.node_kind !== "select_statement") {
			throw new Error("expected select statement for first query");
		}

		const unionFragment = segments[2];
		if (!unionFragment || unionFragment.node_kind !== "raw_fragment") {
			throw new Error("expected raw fragment for UNION ALL separator");
		}
		const rawUnion = unionFragment as RawFragmentNode;
		expect(rawUnion.sql_text.trim()).toBe("UNION ALL");

		const secondSelect = segments[3];
		if (!secondSelect || secondSelect.node_kind !== "select_statement") {
			throw new Error("expected select statement for recursive branch");
		}

		const suffix = segments[4];
		if (!suffix || suffix.node_kind !== "raw_fragment") {
			throw new Error("expected raw fragment suffix");
		}
		const rawSuffix = suffix as RawFragmentNode;
		expect(rawSuffix.sql_text).toContain(')\nSELECT *\nFROM "foo";');
	});

	test("segments parenthesised select with trailing clause", () => {
		const sql = `(SELECT 1) LIMIT 1;`;
		const statements = parseStatements(sql);
		expect(statements).toHaveLength(1);

		const [statement] = statements;
		if (!statement || statement.node_kind !== "segmented_statement") {
			throw new Error("expected segmented statement");
		}

		expect(statement.segments).toHaveLength(3);

		const [prefix, select, suffix] = statement.segments;
		if (!prefix || prefix.node_kind !== "raw_fragment") {
			throw new Error("expected raw fragment prefix");
		}
		expect(prefix.sql_text).toBe("(");

		if (!select || select.node_kind !== "select_statement") {
			throw new Error("expected select statement segment");
		}
		expect(select.projection).toHaveLength(1);

		if (!suffix || suffix.node_kind !== "raw_fragment") {
			throw new Error("expected raw fragment suffix");
		}
		expect(suffix.sql_text).toBe(") LIMIT 1;");
	});

	test("handles mixed casing around UNION keyword", () => {
		const sql = `
SELECT * FROM foo
uNiOn
select bar FROM baz
		`.trim();

		const statements = parseStatements(sql);
		expect(statements).toHaveLength(1);
		const [statement] = statements;
		if (!statement || statement.node_kind !== "segmented_statement") {
			throw new Error("expected segmented statement");
		}

		expect(statement.segments).toHaveLength(1);

		const [segment] = statement.segments;
		if (!segment || segment.node_kind !== "compound_select") {
			throw new Error("expected compound select segment");
		}

		const compound = segment as CompoundSelectNode;
		expect(compound.compounds).toHaveLength(1);
		expect(compound.compounds[0]?.operator).toBe("union");

		const firstFrom = compound.first.from_clauses[0];
		if (!firstFrom || firstFrom.relation.node_kind !== "table_reference") {
			throw new Error("expected table reference");
		}

		const secondFrom = compound.compounds[0]?.select.from_clauses[0];
		if (!secondFrom || secondFrom.relation.node_kind !== "table_reference") {
			throw new Error("expected table reference");
		}
	});

	test("parses compound selects with INTERSECT and EXCEPT", () => {
		const sql = `
SELECT id FROM t1
INTERSECT
SELECT id FROM t2
EXCEPT
SELECT id FROM t3
		`.trim();

		const statements = parseStatements(sql);
		expect(statements).toHaveLength(1);
		const [statement] = statements;
		if (!statement || statement.node_kind !== "segmented_statement") {
			throw new Error("expected segmented statement");
		}

		expect(statement.segments).toHaveLength(1);
		const [segment] = statement.segments;
		if (!segment || segment.node_kind !== "compound_select") {
			throw new Error("expected compound select");
		}

		const compound = segment as CompoundSelectNode;
		expect(compound.compounds).toHaveLength(2);
		expect(compound.compounds[0]?.operator).toBe("intersect");
		expect(compound.compounds[1]?.operator).toBe("except");
	});

	test("applies ORDER BY/LIMIT/OFFSET to compound", () => {
		const sql = `
SELECT id FROM t1
UNION ALL
SELECT id FROM t2
ORDER BY id DESC
LIMIT 5
OFFSET 10
		`.trim();

		const statements = parseStatements(sql);
		expect(statements).toHaveLength(1);
		const [statement] = statements;
		if (!statement || statement.node_kind !== "segmented_statement") {
			throw new Error("expected segmented statement");
		}

		expect(statement.segments).toHaveLength(1);
		const [segment] = statement.segments;
		if (!segment || segment.node_kind !== "compound_select") {
			throw new Error("expected compound select");
		}

		const compound = segment as CompoundSelectNode;
		expect(compound.order_by).toHaveLength(1);
		expect(compound.limit).not.toBeNull();
		expect(compound.offset).not.toBeNull();
		expect(compound.first.order_by).toEqual([]);
		expect(compound.first.limit).toBeNull();
		expect(compound.first.offset).toBeNull();
	});

	test("compound inside CTE falls back to segmented selects", () => {
		const sql = `
WITH expr AS (
  SELECT id FROM t1
  UNION ALL
  SELECT id FROM t2
)
SELECT * FROM expr;
		`.trim();

		const statements = parseStatements(sql);
		expect(statements).toHaveLength(1);
		const [statement] = statements;
		if (!statement || statement.node_kind !== "segmented_statement") {
			throw new Error("expected segmented statement");
		}

		expect(statement.segments).toHaveLength(5);

		const [prefix, firstSelect, unionFrag, secondSelect, suffix] =
			statement.segments;

		if (!prefix || prefix.node_kind !== "raw_fragment") {
			throw new Error("expected raw prefix");
		}
		expect(prefix.sql_text.trimStart().startsWith("WITH expr AS")).toBe(true);

		if (!firstSelect || firstSelect.node_kind !== "select_statement") {
			throw new Error("expected select segment");
		}

		if (!unionFrag || unionFrag.node_kind !== "raw_fragment") {
			throw new Error("expected union fragment");
		}
		expect(unionFrag.sql_text.trim().toLowerCase()).toBe("union all");

		if (!secondSelect || secondSelect.node_kind !== "select_statement") {
			throw new Error("expected second select");
		}

		if (!suffix || suffix.node_kind !== "raw_fragment") {
			throw new Error("expected closing fragment");
		}
	});
});
