import { expect, test } from "vitest";
import { parse } from "../sql-parser/parse.js";
import { expandSqlViews } from "./expand-sql-views.js";
import type { PreprocessorTraceEntry } from "../types.js";
import type { SqlNode, SelectStatementNode } from "../sql-parser/nodes.js";
import {
	getIdentifierValue,
	objectNameMatches,
} from "../sql-parser/ast-helpers.js";

test("expands referenced view into a subquery", () => {
	const trace: PreprocessorTraceEntry[] = [];
	const statement = parse(`
		SELECT av.schema_key
		FROM active_version AS av
	`);

	const rewritten = expandSqlViews({
		node: statement,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () =>
			new Map([
				[
					"active_version",
					`
						SELECT st.schema_key
						FROM state AS st
					`,
				],
			]),
		hasOpenTransaction: () => false,
		trace,
	});

	const select = assertSelectStatement(rewritten);
	const fromClause = select.from_clauses[0];
	if (!fromClause) {
		throw new Error("expected FROM clause");
	}
	const relation = fromClause.relation;
	if (relation.node_kind !== "subquery") {
		throw new Error("expected subquery relation");
	}
	expect(getIdentifierValue(relation.alias)).toBe("av");
	const innerFrom = relation.statement.from_clauses[0];
	if (!innerFrom || innerFrom.relation.node_kind !== "table_reference") {
		throw new Error("expected table reference");
	}
	expect(objectNameMatches(innerFrom.relation.name, "state")).toBe(true);
	expect(getIdentifierValue(innerFrom.relation.alias)).toBe("st");

	expect(trace[0]?.step).toBe("expand_sql_views");
	expect(trace[0]?.payload?.views).toEqual(["active_version"]);
});

test("keeps view name as alias when none provided", () => {
	const statement = parse(`
		SELECT *
		FROM only_view
	`);

	const rewritten = expandSqlViews({
		node: statement,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () =>
			new Map([
				[
					"only_view",
					`
						SELECT sa.file_id
						FROM state_all AS sa
					`,
				],
			]),
		hasOpenTransaction: () => false,
	});

	const select = assertSelectStatement(rewritten);
	const relation = select.from_clauses[0]?.relation;
	if (!relation || relation.node_kind !== "subquery") {
		throw new Error("expected subquery relation");
	}
	expect(getIdentifierValue(relation.alias)).toBe("only_view");
});

function assertSelectStatement(node: SqlNode): SelectStatementNode {
	if (node.node_kind !== "select_statement") {
		throw new Error("expected select statement");
	}
	return node as SelectStatementNode;
}
