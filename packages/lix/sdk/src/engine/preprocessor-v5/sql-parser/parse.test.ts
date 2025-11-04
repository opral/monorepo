import { describe, expect, test } from "vitest";
import { parse } from "./parse.js";
import {
	identifier,
	type RawFragmentNode,
	type CompoundSelectNode,
	type SelectStatementNode,
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
		expect(ast).toMatchObject({
			node_kind: "select_statement",
			distinct: false,
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
			group_by: [],
			order_by: [],
			limit: null,
			offset: null,
			with_clause: null,
		});
	});

	test("parses insert with on conflict do nothing", () => {
		const ast = parseInsertStatement(
			"INSERT INTO projects (id) VALUES ('a') ON CONFLICT DO NOTHING"
		);
		expect(ast.on_conflict).toMatchObject({
			node_kind: "on_conflict_clause",
			target: null,
			action: { node_kind: "on_conflict_do_nothing" },
		});
	});

	test("parses insert with on conflict do update", () => {
		const ast = parseInsertStatement(
			"INSERT INTO projects (id, name) VALUES ('a', 'A') ON CONFLICT(id) DO UPDATE SET name = excluded.name WHERE excluded.id = 'a'"
		);
		const clause = ast.on_conflict;
		expect(clause).not.toBeNull();
		expect(clause).toMatchObject({
			node_kind: "on_conflict_clause",
			target: {
				node_kind: "on_conflict_target",
				expressions: [
					{
						node_kind: "column_reference",
						path: [id("id")],
					},
				],
				where: null,
			},
			action: {
				node_kind: "on_conflict_do_update",
				assignments: [
					{
						node_kind: "set_clause",
						column: {
							node_kind: "column_reference",
							path: [id("name")],
						},
						value: {
							node_kind: "column_reference",
							path: [id("excluded"), id("name")],
						},
					},
				],
				where: {
					node_kind: "binary_expression",
					left: {
						node_kind: "column_reference",
						path: [id("excluded"), id("id")],
					},
					operator: "=",
					right: {
						node_kind: "literal",
						value: "a",
					},
				},
			},
		});
	});

	test("parses select with where and alias", () => {
		const ast = parseSelectStatement(
			"SELECT p.id AS project_id FROM projects AS p WHERE p.revision >= 1"
		);
		expect(ast).toMatchObject({
			node_kind: "select_statement",
			distinct: false,
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
			group_by: [],
			limit: null,
			offset: null,
			with_clause: null,
		});
	});

	test("parses select literal without from clause", () => {
		const ast = parseSelectStatement("SELECT 1 AS value");
		expect(ast).toMatchObject({
			node_kind: "select_statement",
			distinct: false,
			projection: [
				{
					node_kind: "select_expression",
					expression: { node_kind: "literal", value: 1 },
					alias: id("value"),
				},
			],
			from_clauses: [],
			where_clause: null,
			group_by: [],
			order_by: [],
			limit: null,
			offset: null,
			with_clause: null,
		});
	});

	test("parses qualified column without alias", () => {
		const ast = parseSelectStatement("SELECT projects.id FROM projects");
		expect(ast).toMatchObject({
			node_kind: "select_statement",
			distinct: false,
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
			group_by: [],
			order_by: [],
			limit: null,
			offset: null,
			with_clause: null,
		});
	});

	test("parses update with assignments", () => {
		const ast = parseUpdateStatement(
			"UPDATE projects SET name = 'new', revision = revision + 1 WHERE id = ?"
		);
		expect(ast).toMatchObject({
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
		expect(ast.where_clause).toMatchObject({
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
		expect(ast.limit).toMatchObject({
			node_kind: "literal",
			value: 5,
		});
		expect(ast.offset).toMatchObject({
			node_kind: "literal",
			value: 10,
		});
	});

	test("parses limit without offset", () => {
		const ast = parseSelectStatement("SELECT * FROM files LIMIT 20");
		expect(ast.limit).toMatchObject({
			node_kind: "literal",
			value: 20,
		});
		expect(ast.offset).toBeNull();
	});

	test("parses parameterised limit and offset", () => {
		const ast = parseSelectStatement("SELECT * FROM logs LIMIT ? OFFSET ?2");
		expect(ast.limit).toMatchObject({
			node_kind: "parameter",
			placeholder: "?",
			position: 0,
		});
		expect(ast.offset).toMatchObject({
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
		expect(leftParam).toMatchObject({
			node_kind: "parameter",
			placeholder: "?1",
			position: 0,
		});
		expect(rightParam).toMatchObject({
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
		expect(statement.segments).toMatchObject([
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
		expect(statement.segments).toMatchObject([
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
		expect(ast.where_clause).toMatchObject({
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
		expect(ast.order_by).toMatchObject([
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
		expect(ast.where_clause).toMatchObject({
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
		expect(ast).toMatchObject({
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
		expect(ast).toMatchObject({
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
			on_conflict: null,
		});
	});

	test("parses function call expression inside update assignment", () => {
		const ast = parseUpdateStatement(
			"UPDATE key_value SET value = json_set(value, '$.foo', ?) WHERE key = ?"
		);
		expect(ast).toMatchObject({
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
						over: null,
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
		expect(ast).toMatchObject({
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
						over: null,
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

	test("parses window function with partition and order", () => {
		const ast = parseSelectStatement(
			"SELECT ROW_NUMBER() OVER (PARTITION BY entity_id ORDER BY created_at) AS rn FROM change"
		);
		expect(ast).toMatchObject({
			node_kind: "select_statement",
			distinct: false,
			projection: [
				{
					node_kind: "select_expression",
					expression: {
						node_kind: "function_call",
						name: id("ROW_NUMBER"),
						arguments: [],
						over: {
							node_kind: "window_specification",
							name: null,
							partition_by: [
								{
									node_kind: "column_reference",
									path: [id("entity_id")],
								},
							],
							order_by: [
								{
									node_kind: "order_by_item",
									expression: {
										node_kind: "column_reference",
										path: [id("created_at")],
									},
									direction: null,
								},
							],
							frame: null,
						},
					},
					alias: id("rn"),
				},
			],
			from_clauses: [
				{
					node_kind: "from_clause",
					relation: {
						node_kind: "table_reference",
						name: {
							node_kind: "object_name",
							parts: [id("change")],
						},
						alias: null,
					},
					joins: [],
				},
			],
			where_clause: null,
			group_by: [],
			order_by: [],
			limit: null,
			offset: null,
			with_clause: null,
		});
	});

	test("parses json arrow operators in projection", () => {
		const ast = parseSelectStatement(
			"SELECT value ->> '$.enabled' AS enabled FROM key_value"
		);
		expect(ast).toMatchObject({
			node_kind: "select_statement",
			projection: [
				{
					expression: {
						node_kind: "binary_expression",
						operator: "->>",
						left: {
							node_kind: "column_reference",
							path: [id("value")],
						},
						right: {
							node_kind: "literal",
							value: "$.enabled",
						},
					},
					alias: id("enabled"),
				},
			],
			from_clauses: [
				{
					relation: {
						node_kind: "table_reference",
						name: {
							node_kind: "object_name",
							parts: [id("key_value")],
						},
					},
				},
			],
		});
	});

	test("parses not exists predicate", () => {
		const ast = parseSelectStatement(
			"SELECT id FROM conversation_message_all AS m1 WHERE NOT EXISTS (SELECT 1 FROM conversation_message_all AS m2 WHERE m2.parent_id = m1.id)"
		);
		expect(ast).toMatchObject({
			where_clause: {
				node_kind: "unary_expression",
				operator: "not",
				operand: {
					node_kind: "exists_expression",
					statement: {
						node_kind: "select_statement",
					},
				},
			},
		});
	});

	test("parses window function with frame bounds", () => {
		const ast = parseSelectStatement(
			"SELECT SUM(amount) OVER (PARTITION BY account ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) FROM ledger"
		);
		expect(ast).toMatchObject({
			node_kind: "select_statement",
			distinct: false,
			projection: [
				{
					node_kind: "select_expression",
					expression: {
						node_kind: "function_call",
						name: id("SUM"),
						arguments: [
							{
								node_kind: "column_reference",
								path: [id("amount")],
							},
						],
						over: {
							node_kind: "window_specification",
							name: null,
							partition_by: [
								{
									node_kind: "column_reference",
									path: [id("account")],
								},
							],
							order_by: [],
							frame: {
								node_kind: "window_frame",
								units: "rows",
								start: {
									node_kind: "window_frame_bound",
									type: "unbounded_preceding",
									offset: null,
								},
								end: {
									node_kind: "window_frame_bound",
									type: "current_row",
									offset: null,
								},
							},
						},
					},
					alias: null,
				},
			],
			from_clauses: [
				{
					node_kind: "from_clause",
					relation: {
						node_kind: "table_reference",
						name: {
							node_kind: "object_name",
							parts: [id("ledger")],
						},
						alias: null,
					},
					joins: [],
				},
			],
			where_clause: null,
			group_by: [],
			order_by: [],
			limit: null,
			offset: null,
			with_clause: null,
		});
	});

	test("parses subqueries with no alias", () => {
		const sql = `
		SELECT * FROM (SELECT 1)
		`;
		const statements = parseStatements(sql);
		expect(statements).toMatchObject([
			{
				node_kind: "segmented_statement",
				segments: [
					{
						node_kind: "select_statement",
						from_clauses: [
							{
								relation: {
									node_kind: "subquery",
								},
							},
						],
					},
				],
			},
		]);
	});

	test("handles count(*) in select projection", () => {
		const ast = parseSelectStatement("SELECT COUNT(*) AS total FROM users");

		expect(ast).toMatchObject({
			node_kind: "select_statement",
			projection: [
				{
					node_kind: "select_expression",
					expression: {
						node_kind: "function_call",
						name: id("COUNT"),
						arguments: [{ node_kind: "all_columns" }],
						over: null,
					},
					alias: id("total"),
				},
			],
			from_clauses: [
				{
					relation: {
						node_kind: "table_reference",
						name: { node_kind: "object_name", parts: [id("users")] },
					},
				},
			],
		});
	});

	test("parses recursive CTE with compound body", () => {
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

		const [segment] = statement.segments;
		if (!segment || segment.node_kind !== "select_statement") {
			throw new Error("expected select statement segment");
		}
		const select = segment;
		const withClause = select.with_clause;
		expect(withClause).not.toBeNull();
		if (!withClause) {
			throw new Error("missing with clause");
		}
		expect(withClause.recursive).toBe(true);
		expect(withClause.ctes).toHaveLength(1);
		const cte = withClause.ctes[0];
		if (!cte) {
			throw new Error("expected CTE definition");
		}
		const cteStatement = cte.statement;
		if (!cteStatement || cteStatement.node_kind !== "compound_select") {
			throw new Error("expected compound select in CTE");
		}
		expect(cteStatement.compounds).toHaveLength(1);
		expect(cteStatement.first.with_clause).toBeNull();
		expect(cteStatement.compounds[0]?.select.with_clause).toBeNull();
	});

	test("parses searched CASE expression", () => {
		const sql = `
	SELECT
	  CASE
	    WHEN foo.kind = 'alpha' THEN 'first'
	    WHEN foo.kind = 'beta' THEN 'second'
	    ELSE 'other'
	  END AS kind_label
	FROM foo
		`.trim();

		const statement = parseSelectStatement(sql);
		const projection = statement.projection[0];
		if (!projection || projection.node_kind !== "select_expression") {
			throw new Error("expected select expression");
		}
		const expression = projection.expression;
		expect(expression.node_kind).toBe("case_expression");
		if (expression.node_kind !== "case_expression") {
			throw new Error("expected case expression");
		}
		expect(expression.operand).toBeNull();
		expect(expression.branches).toHaveLength(2);
		expect(expression.branches[0]?.condition.node_kind).toBe(
			"binary_expression"
		);
		expect(expression.branches[0]?.result.node_kind).toBe("literal");
		expect(expression.branches[1]?.result.node_kind).toBe("literal");
		expect(expression.else_result?.node_kind).toBe("literal");
	});

	test("parses simple CASE expression with operand", () => {
		const sql = `
SELECT
  CASE foo.status
    WHEN 'active' THEN 1
    ELSE 0
  END AS status_flag
FROM foo
		`.trim();

		const statement = parseSelectStatement(sql);
		const projection = statement.projection[0];
		if (!projection || projection.node_kind !== "select_expression") {
			throw new Error("expected select expression");
		}
		const expression = projection.expression;
		expect(expression.node_kind).toBe("case_expression");
		if (expression.node_kind !== "case_expression") {
			throw new Error("expected case expression");
		}
		expect(expression.operand?.node_kind).toBe("column_reference");
		expect(expression.branches).toHaveLength(1);
		expect(expression.branches[0]?.condition.node_kind).toBe("literal");
		expect(expression.branches[0]?.result.node_kind).toBe("literal");
		expect(expression.else_result?.node_kind).toBe("literal");
	});

	test("parses select distinct with group by", () => {
		const ast = parseSelectStatement(
			"SELECT DISTINCT foo FROM bar GROUP BY foo"
		);
		expect(ast.distinct).toBe(true);
		expect(ast.group_by).toHaveLength(1);
		expect(ast.group_by[0]?.node_kind).toBe("column_reference");
	});

	test("parses union select", () => {
		const segment = parseSingleSegment(
			"SELECT id FROM foo UNION SELECT parent_id FROM bar"
		);
		expect(segment.node_kind).toBe("compound_select");
		if (segment.node_kind !== "compound_select") {
			throw new Error("expected compound select");
		}
		expect(segment.compounds).toHaveLength(1);
	});

	test("parses recursive union select", () => {
		const sql = `
SELECT commit_id, commit_id as root_commit_id, 0 as depth
FROM requested_commits
UNION
SELECT ce.parent_id, r.root_commit_id, r.depth + 1
FROM commit_edge_all ce
JOIN reachable_commits_from_requested r ON ce.child_id = r.id
WHERE ce.lixcol_version_id = 'global'
`.trim();
		const segment = parseSingleSegment(sql);
		expect(segment.node_kind).toBe("compound_select");
	});

	test("parses multi-cte with union", () => {
		const sql = `
WITH head AS (
  SELECT 1 AS value
),
chain AS (
  SELECT value FROM head
  UNION
  SELECT value + 1 FROM head
)
SELECT * FROM chain
`.trim();
		const segment = parseSingleSegment(sql);
		expect(
			segment.node_kind === "select_statement" ||
				segment.node_kind === "compound_select"
		).toBe(true);
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
		expect(compound.first.order_by).toMatchObject([]);
		expect(compound.first.limit).toBeNull();
		expect(compound.first.offset).toBeNull();
	});

	test("compound inside CTE parses into with clause", () => {
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
		const [segment] = statement.segments;
		if (!segment || segment.node_kind !== "select_statement") {
			throw new Error("expected select statement");
		}
		const select = segment;
		const withClause = select.with_clause;
		expect(withClause).not.toBeNull();
		if (!withClause) {
			throw new Error("missing with clause");
		}
		expect(withClause.recursive).toBe(false);
		expect(withClause.ctes).toHaveLength(1);
		const cte = withClause.ctes[0];
		if (!cte) {
			throw new Error("expected CTE definition");
		}
		expect(cte.columns).toMatchObject([]);
		if (cte.statement.node_kind !== "compound_select") {
			throw new Error("expected compound select inside CTE");
		}
		expect(cte.statement.compounds).toHaveLength(1);
	});

	test("parses recursive IN subquery with with clause", () => {
		const sql = `
SELECT c.id FROM commit AS c
WHERE c.id IN (
	WITH RECURSIVE ap(id, depth) AS (
		SELECT id, 0 AS depth FROM commit WHERE id = 'root'
		UNION ALL
		SELECT parent_id, ap.depth + 1 FROM commit_edge JOIN ap ON commit_edge.child_id = ap.id
	)
	SELECT id FROM ap
)
LIMIT 1;
		`.trim();

		const statements = parseStatements(sql);
		expect(statements).toHaveLength(1);

		const [statement] = statements;
		if (!statement || statement.node_kind !== "segmented_statement") {
			throw new Error("expected segmented statement");
		}
		const [segment] = statement.segments;
		if (!segment || segment.node_kind !== "select_statement") {
			throw new Error("expected outer select statement");
		}
		const outerSelect = segment;
		expect(outerSelect.with_clause).toBeNull();
		const whereClause = outerSelect.where_clause;
		if (!whereClause || whereClause.node_kind !== "in_list_expression") {
			throw new Error("expected IN list expression");
		}
		expect(whereClause.items).toHaveLength(1);
		const [subqueryItem] = whereClause.items;
		if (!subqueryItem || subqueryItem.node_kind !== "subquery_expression") {
			throw new Error("expected subquery expression inside IN");
		}
		const subquerySelect = subqueryItem.statement;
		if (!subquerySelect || subquerySelect.node_kind !== "select_statement") {
			throw new Error("expected select statement in subquery");
		}
		const subqueryWith = subquerySelect.with_clause;
		expect(subqueryWith).not.toBeNull();
		if (!subqueryWith) {
			throw new Error("missing with clause on subquery");
		}
		expect(subqueryWith.recursive).toBe(true);
		expect(subqueryWith.ctes).toHaveLength(1);
		const cte = subqueryWith.ctes[0];
		if (!cte) {
			throw new Error("expected CTE definition");
		}
		const cteStatement = cte.statement;
		if (!cteStatement || cteStatement.node_kind !== "compound_select") {
			throw new Error("expected compound select in CTE");
		}
		expect(cteStatement.compounds).toHaveLength(1);
		const collectedSelects: SelectStatementNode[] = [
			outerSelect,
			subquerySelect,
			cteStatement.first,
			cteStatement.compounds[0]!.select,
		];
		expect(
			collectedSelects.every((sel) => sel.node_kind === "select_statement")
		).toBe(true);
	});

	test("parses recursive IN subquery within join-heavy query", () => {
		const sql = `
select "commit"."id" from "commit"
inner join "entity_label"
  on "entity_label"."entity_id" = "commit"."id"
  and "entity_label"."schema_key" = ?
inner join "label"
  on "label"."id" = "entity_label"."label_id"
where "label"."name" = ?
  and "commit".id IN (
    WITH RECURSIVE ap(id, depth) AS (
      SELECT id, 0 AS depth
      FROM "commit"
      WHERE id = '019a4aac-b3ca-740e-a498-f54da878beda'
      UNION ALL
      SELECT commit_edge.parent_id, ap.depth + 1
      FROM commit_edge
      JOIN ap ON commit_edge.child_id = ap.id
      WHERE ap.depth < 1
    )
    -- Select based on the includeSelf flag
    SELECT id FROM ap
  )
limit ?`;

		const statements = parseStatements(sql);
		expect(statements).toHaveLength(1);
		const [statement] = statements;
		if (!statement || statement.node_kind !== "segmented_statement") {
			throw new Error("expected segmented statement");
		}

		const [segment] = statement.segments;
		if (!segment || segment.node_kind !== "select_statement") {
			throw new Error("expected root select statement");
		}

		expect(segment.with_clause).toBeNull();
		const whereClause = segment.where_clause;
		if (!whereClause || whereClause.node_kind !== "binary_expression") {
			throw new Error("expected binary where clause");
		}

		const inExpression =
			whereClause.right.node_kind === "in_list_expression"
				? whereClause.right
				: whereClause.left.node_kind === "in_list_expression"
					? whereClause.left
					: null;
		if (!inExpression) {
			throw new Error("missing IN list expression in where clause");
		}
		expect(inExpression.items).toHaveLength(1);
		const [subqueryItem] = inExpression.items;
		if (!subqueryItem || subqueryItem.node_kind !== "subquery_expression") {
			throw new Error("expected subquery expression within IN clause");
		}

		const subquerySelect = subqueryItem.statement;
		if (!subquerySelect || subquerySelect.node_kind !== "select_statement") {
			throw new Error("expected select statement inside IN clause");
		}
		const subqueryWith = subquerySelect.with_clause;
		expect(subqueryWith).not.toBeNull();
		if (!subqueryWith) {
			throw new Error("missing with clause in IN subquery");
		}
		expect(subqueryWith.recursive).toBe(true);
		expect(subqueryWith.ctes).toHaveLength(1);

		const cte = subqueryWith.ctes[0];
		if (!cte) {
			throw new Error("expected CTE definition");
		}
		const cteStatement = cte.statement;
		if (!cteStatement || cteStatement.node_kind !== "compound_select") {
			throw new Error("expected compound select in recursive CTE");
		}
		expect(cteStatement.compounds).toHaveLength(1);
	});

	test("handles count(*) in select projection", () => {
		const ast = parseSelectStatement("SELECT COUNT(*) AS total FROM users");

		expect(ast).toMatchObject({
			node_kind: "select_statement",
			distinct: false,
			projection: [
				{
					node_kind: "select_expression",
					expression: {
						node_kind: "function_call",
						name: id("COUNT"),
						arguments: [
							{
								node_kind: "all_columns",
							},
						],
						over: null,
					},
					alias: id("total"),
				},
			],
			from_clauses: [
				{
					node_kind: "from_clause",
					relation: {
						node_kind: "table_reference",
						name: { node_kind: "object_name", parts: [id("users")] },
						alias: null,
					},
					joins: [],
				},
			],
		});
	});
});

test("parses parameter predicate without operator", () => {
	const ast = parseSelectStatement(`SELECT "key" FROM "key_value" WHERE ?`);

	expect(ast).toMatchObject({
		where_clause: {
			node_kind: "parameter",
			placeholder: "?",
		},
	});
});

test("parses nested derived tables", () => {
	const ast = parseSelectStatement(
		"SELECT * FROM ((SELECT 1 AS value) AS inner_table)"
	);

	expect(ast).toMatchObject({
		node_kind: "select_statement",
		from_clauses: [
			{
				relation: {
					node_kind: "subquery",
					alias: id("inner_table"),
					statement: {
						node_kind: "select_statement",
						projection: [
							{
								node_kind: "select_expression",
								expression: {
									node_kind: "literal",
									value: 1,
								},
								alias: id("value"),
							},
						],
					},
				},
			},
		],
	});
});
