import { describe, expect, test } from "vitest";
import { parse } from "../../sql-parser/parse.js";
import { rewriteStateViewSelect } from "./select.js";
import type { PreprocessorTraceEntry } from "../../types.js";
import type {
	ExpressionNode,
	RawFragmentNode,
	SelectStatementNode,
	SqlNode,
} from "../../sql-parser/nodes.js";
import {
	getIdentifierValue,
	objectNameMatches,
} from "../../sql-parser/ast-helpers.js";

function run(sql: string) {
	const trace: PreprocessorTraceEntry[] = [];
	const statement = parse(sql);
	const rewritten = rewriteStateViewSelect({
		node: statement,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () => new Map(),
		hasOpenTransaction: () => true,
		trace,
	});
	return {
		trace,
		node: assertSelectStatement(rewritten),
	};
}

describe("rewriteStateViewSelect", () => {
	test("rewrites state view into state_all subquery", () => {
		const { node, trace } = run(`
			SELECT s.entity_id
			FROM state AS s
		`);

		const { alias, select } = extractStateSubquery(node);
		expect(alias).toBe("s");
		expectStateAllRelation(select);
		expectStateActiveVersionFilter(select);
		expect(trace[0]?.payload).toMatchObject({
			reference_count: 1,
			bindings: ["s"],
		});
	});

	test("supports unaliased state reference", () => {
		const { node } = run(`
			SELECT *
			FROM state
		`);

		const { alias, select } = extractStateSubquery(node);
		expect(alias).toBe("state");
		expectStateAllRelation(select);
		expectStateActiveVersionFilter(select);
	});
});

function assertSelectStatement(node: SqlNode): SelectStatementNode {
	if (node.node_kind !== "select_statement") {
		throw new Error("expected select statement");
	}
	return node as SelectStatementNode;
}

function extractStateSubquery(select: SelectStatementNode): {
	alias: string | null;
	select: SelectStatementNode;
} {
	const fromClause = select.from_clauses[0];
	if (!fromClause || fromClause.relation.node_kind !== "subquery") {
		throw new Error("expected subquery relation for state view");
	}
	return {
		alias: getIdentifierValue(fromClause.relation.alias),
		select: fromClause.relation.statement,
	};
}

function expectStateAllRelation(select: SelectStatementNode): void {
	const fromClause = select.from_clauses[0];
	if (!fromClause || fromClause.relation.node_kind !== "table_reference") {
		throw new Error("expected table reference to state_all");
	}
	expect(objectNameMatches(fromClause.relation.name, "state_all")).toBe(true);
	expect(getIdentifierValue(fromClause.relation.alias)).toBe("sa");
}

function expectStateActiveVersionFilter(select: SelectStatementNode): void {
	const whereClause = select.where_clause;
	if (!whereClause) {
		throw new Error("expected active version filter");
	}
	expect(expressionContainsActiveVersion(whereClause)).toBe(true);
}

function expressionContainsActiveVersion(
	expression: ExpressionNode | RawFragmentNode
): boolean {
	if ("sql_text" in expression) {
		return expression.sql_text.toLowerCase().includes("active_version");
	}
	switch (expression.node_kind) {
		case "binary_expression":
			return (
				expressionContainsActiveVersion(expression.left) ||
				expressionContainsActiveVersion(expression.right)
			);
		case "grouped_expression":
			return expressionContainsActiveVersion(expression.expression);
		case "unary_expression":
			return expressionContainsActiveVersion(expression.operand);
		default:
			return false;
	}
}
