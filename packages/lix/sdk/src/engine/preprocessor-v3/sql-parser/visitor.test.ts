import { expect, test } from "vitest";
import { parse } from "./parse.js";
import { visitSelectStatement } from "./visitor.js";
import type { SelectStatementNode } from "./nodes.js";
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
