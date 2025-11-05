import { expect, test } from "vitest";
import { parse } from "./parse.js";
import { visitSelectStatement, visitStatement } from "./visitor.js";
import type {
	InsertStatementNode,
	LiteralNode,
	StatementNode,
	StatementSegmentNode,
	SelectStatementNode,
} from "./nodes.js";
import { identifier } from "./nodes.js";
import { getIdentifierValue } from "./ast-helpers.js";

function parseSingleSegment(sql: string): StatementSegmentNode {
	const statements = parse(sql);
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
	return statement.segments[0]!;
}

function parseSelect(sql: string): SelectStatementNode {
	const segment = parseSingleSegment(sql);
	if (segment.node_kind !== "select_statement") {
		throw new Error("expected select statement");
	}
	return segment;
}

function parseStatementNode(sql: string): StatementNode {
	const segment = parseSingleSegment(sql);
	if (segment.node_kind === "raw_fragment") {
		throw new Error("expected supported statement");
	}
	return segment;
}

test("returns the same instance when no handlers modify the tree", () => {
	const statement = parseSelect("SELECT * FROM projects");
	const result = visitSelectStatement(statement, {});
	expect(result).toBe(statement);
});

test("allows transforming table references during visitation", () => {
	const statement = parseSelect("SELECT * FROM projects");
	const rewritten = visitSelectStatement(statement, {
		table_reference(node) {
			const lastPart = node.name.parts.at(-1);
			if (lastPart?.value !== "projects") {
				return;
			}
			const nextParts = [...node.name.parts.slice(0, -1), identifier("people")];
			return {
				...node,
				name: {
					...node.name,
					parts: nextParts,
				},
			};
		},
	});

	expect(rewritten).not.toBe(statement);
	const tableReference = rewritten.from_clauses[0]?.relation;
	if (!tableReference || tableReference.node_kind !== "table_reference") {
		throw new Error("expected table reference relation");
	}
	expect(getIdentifierValue(tableReference.name.parts.at(-1))).toBe("people");
});

test("invokes generic enter and exit hooks in depth-first order", () => {
	const statement = parseSelect("SELECT name FROM projects WHERE name = 'foo'");

	const trace: string[] = [];
	visitSelectStatement(statement, {
		enter(node) {
			trace.push(`enter:${node.node_kind}`);
		},
		exit(node) {
			trace.push(`exit:${node.node_kind}`);
		},
	});

	expect(trace[0]).toBe("enter:select_statement");
	expect(trace.at(-1)).toBe("exit:select_statement");
	expect(trace).toContain("enter:select_expression");
	expect(trace).toContain("exit:select_expression");
	expect(trace).toContain("enter:column_reference");
	expect(trace).toContain("exit:column_reference");
});

test("visitStatement traverses insert targets and values", () => {
	const statement = parseStatementNode(
		"INSERT INTO projects (id, name) VALUES ('a', 'Project A'), ('b', ?)"
	);
	if (statement.node_kind !== "insert_statement") {
		throw new Error("expected insert statement");
	}

	const rewritten = visitStatement(statement, {
		insert_statement(node) {
			const parts = node.target.parts;
			const nextParts = [...parts.slice(0, -1)];
			const last = parts.at(-1);
			if (last) {
				nextParts.push({ ...last, value: `${last.value}_shadow` });
			}
			return {
				...node,
				target: {
					...node.target,
					parts: nextParts,
				},
			};
		},
		literal(node, context) {
			if (
				context.parent?.node_kind === "insert_values" &&
				context.property?.startsWith("rows.") &&
				context.index === 1 &&
				typeof node.value === "string"
			) {
				return {
					...node,
					value: `${node.value} (rewritten)`,
				} satisfies LiteralNode;
			}
			return undefined;
		},
		parameter(node, context) {
			if (
				context.parent?.node_kind === "insert_values" &&
				context.property === "rows.1" &&
				context.index === 1
			) {
				return {
					node_kind: "literal",
					value: "Project B (rewritten)",
				} satisfies LiteralNode;
			}
			return undefined;
		},
	});

	expect(rewritten).not.toBe(statement);
	const insert = rewritten as InsertStatementNode;
	expect(insert.target.parts.at(-1)?.value).toBe("projects_shadow");
	if (insert.source.node_kind !== "insert_values") {
		throw new Error("expected insert values node");
	}
	expect((insert.source.rows[0]?.[1] as LiteralNode | undefined)?.value).toBe(
		"Project A (rewritten)"
	);
	expect((insert.source.rows[1]?.[1] as LiteralNode | undefined)?.value).toBe(
		"Project B (rewritten)"
	);

	// original AST remains unchanged
	const originalInsert = statement as InsertStatementNode;
	if (originalInsert.source.node_kind !== "insert_values") {
		throw new Error("expected insert values node");
	}
	expect(
		(originalInsert.source.rows[0]?.[1] as LiteralNode | undefined)?.value
	).toBe("Project A");
});
