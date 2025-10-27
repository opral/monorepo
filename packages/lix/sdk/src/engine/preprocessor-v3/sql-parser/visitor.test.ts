import { expect, test } from "vitest";
import { parse } from "./parse.js";
import { visitSelectStatement, visitStatement } from "./visitor.js";
import type {
	InsertStatementNode,
	LiteralNode,
	StatementNode,
	SelectStatementNode,
} from "./nodes.js";
import { identifier } from "./nodes.js";
import { compile } from "../compile.js";

test("returns the same instance when no handlers modify the tree", () => {
	const statement = parse("SELECT * FROM projects") as SelectStatementNode;
	const result = visitSelectStatement(statement, {});
	expect(result).toBe(statement);
});

test("allows transforming table references during visitation", () => {
	const statement = parse("SELECT * FROM projects") as SelectStatementNode;
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
	const { sql } = compile(rewritten);
	expect(sql).toContain('"people"');
});

test("invokes generic enter and exit hooks in depth-first order", () => {
	const statement = parse(
		"SELECT name FROM projects WHERE name = 'foo'"
	) as SelectStatementNode;

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
	const statement = parse(
		"INSERT INTO projects (id, name) VALUES ('a', 'Project A'), ('b', ?)"
	) as StatementNode;
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
	expect((insert.source.rows[0]?.[1] as LiteralNode | undefined)?.value).toBe(
		"Project A (rewritten)"
	);
	expect((insert.source.rows[1]?.[1] as LiteralNode | undefined)?.value).toBe(
		"Project B (rewritten)"
	);

	// original AST remains unchanged
	const originalInsert = statement as InsertStatementNode;
	expect(
		(originalInsert.source.rows[0]?.[1] as LiteralNode | undefined)?.value
	).toBe("Project A");

	const { sql } = compile(insert);
	expect(sql).toContain('"projects_shadow"');
	expect(sql).toContain("'Project A (rewritten)'");
	expect(sql).toContain("'Project B (rewritten)'");
});
