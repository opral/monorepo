import { expect, test } from "vitest";
import { parse as parseStatements } from "../sql-parser/parse.js";
import { expandSqlViews } from "./expand-sql-views.js";
import type { PreprocessorTraceEntry } from "../types.js";
import type {
	SegmentedStatementNode,
	SelectStatementNode,
	CompoundSelectNode,
} from "../sql-parser/nodes.js";
import {
	getIdentifierValue,
	objectNameMatches,
} from "../sql-parser/ast-helpers.js";

test("expands referenced view into a subquery", () => {
	const trace: PreprocessorTraceEntry[] = [];
	const statements = parseStatements(`
		SELECT av.schema_key
		FROM active_version AS av
	`);

	const rewritten = expandSqlViews({
		statements,
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

	const select = assertSingleSelect(rewritten) as
		| SelectStatementNode
		| CompoundSelectNode;
	if (!("from_clauses" in select)) {
		throw new Error("expected select statement segment");
	}
	const selectStatement = select as SelectStatementNode;
	const fromClause = selectStatement.from_clauses[0];
	if (!fromClause) {
		throw new Error("expected FROM clause");
	}
	const relation = fromClause.relation;
	if (relation.node_kind !== "subquery") {
		throw new Error("expected subquery relation");
	}
	expect(getIdentifierValue(relation.alias)).toBe("av");
	const relationStatement = relation.statement;
	if (relationStatement.node_kind !== "select_statement") {
		throw new Error("expected select statement inside view");
	}
	const innerFrom = relationStatement.from_clauses[0];
	if (!innerFrom || innerFrom.relation.node_kind !== "table_reference") {
		throw new Error("expected table reference");
	}
	expect(objectNameMatches(innerFrom.relation.name, "state")).toBe(true);
	expect(getIdentifierValue(innerFrom.relation.alias)).toBe("st");

	expect(trace[0]?.step).toBe("expand_sql_views");
	expect(trace[0]?.payload?.views).toEqual(["active_version"]);
});

test("keeps view name as alias when none provided", () => {
	const statements = parseStatements(`
		SELECT *
		FROM only_view
	`);

	const rewritten = expandSqlViews({
		statements,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () =>
			new Map([
				[
					"only_view",
					`
						SELECT sa.file_id
						FROM state_by_version AS sa
					`,
				],
			]),
		hasOpenTransaction: () => false,
	});

	const select = assertSingleSelect(rewritten) as
		| SelectStatementNode
		| CompoundSelectNode;
	if (!("from_clauses" in select)) {
		throw new Error("expected select statement segment");
	}
	const selectStatement = select as SelectStatementNode;
	const relation = selectStatement.from_clauses[0]?.relation;
	if (!relation || relation.node_kind !== "subquery") {
		throw new Error("expected subquery relation");
	}
	expect(getIdentifierValue(relation.alias)).toBe("only_view");
});

test("expands compound select branches independently", () => {
	const trace: PreprocessorTraceEntry[] = [];
	const statements = parseStatements(`
		SELECT av.schema_key
		FROM active_version AS av
		UNION ALL
		SELECT v.schema_key
		FROM lix_internal_state_vtable AS v
	`);

	const rewritten = expandSqlViews({
		statements,
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

	expect(trace).toHaveLength(1);
	const [statement] = rewritten;
	if (!statement || statement.node_kind !== "segmented_statement") {
		throw new Error("expected segmented statement");
	}

	const [segment] = statement.segments;
	if (!segment || segment.node_kind !== "compound_select") {
		throw new Error("expected compound select");
	}

	const firstFrom = segment.first.from_clauses[0];
	if (!firstFrom || firstFrom.relation.node_kind !== "subquery") {
		throw new Error("expected first branch to expand view");
	}

	const secondFrom = segment.compounds[0]?.select.from_clauses[0];
	if (!secondFrom || secondFrom.relation.node_kind !== "table_reference") {
		throw new Error("expected second branch to stay as table reference");
	}
	const lastPart = secondFrom.relation.name.parts.at(-1);
	if (!lastPart) {
		throw new Error("missing table name in second branch");
	}
	expect(lastPart.value.toLowerCase()).toBe("lix_internal_state_vtable");
});

test("expands views defined by compound selects with nested view references", () => {
	const statements = parseStatements(`
		SELECT *
		FROM complex_history
	`);

	const rewritten = expandSqlViews({
		statements,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () =>
			new Map([
				[
					"complex_history",
					`
						WITH base AS (
							SELECT aux.value
							FROM aux_view AS aux
						)
						SELECT value FROM base
						UNION ALL
						SELECT value FROM base;
					`,
				],
				[
					"aux_view",
					`
						SELECT source.value
						FROM source_table AS source
					`,
				],
			]),
		hasOpenTransaction: () => false,
	});

	const select = assertSingleSelect(rewritten);
	const relation = select.from_clauses[0]?.relation;
	if (!relation || relation.node_kind !== "subquery") {
		throw new Error("expected complex_history to expand into subquery");
	}
	expect(getIdentifierValue(relation.alias)).toBe("complex_history");

	const subqueryStatement = relation.statement;
	if (subqueryStatement.node_kind !== "compound_select") {
		throw new Error("expected compound select inside complex_history view");
	}

	const withClause = subqueryStatement.with_clause;
	if (!withClause) {
		throw new Error("expected WITH clause to be preserved");
	}
	const [cte] = withClause.ctes;
	if (!cte) {
		throw new Error("expected base CTE");
	}
	const cteStatement = cte.statement;
	if (cteStatement.node_kind !== "select_statement") {
		throw new Error("expected base CTE to compile into select statement");
	}
	const cteFrom = cteStatement.from_clauses[0];
	if (!cteFrom || cteFrom.relation.node_kind !== "subquery") {
		throw new Error("expected aux_view to expand within CTE");
	}
	expect(getIdentifierValue(cteFrom.relation.alias)).toBe("aux");

	const firstBranchFrom = subqueryStatement.first.from_clauses[0];
	if (
		!firstBranchFrom ||
		firstBranchFrom.relation.node_kind !== "table_reference"
	) {
		throw new Error("expected base CTE reference in first branch");
	}
	expect(objectNameMatches(firstBranchFrom.relation.name, "base")).toBe(true);

	const secondBranch = subqueryStatement.compounds[0];
	if (!secondBranch) {
		throw new Error("expected UNION ALL branch");
	}
	const secondFrom = secondBranch.select.from_clauses[0];
	if (!secondFrom || secondFrom.relation.node_kind !== "table_reference") {
		throw new Error("expected base CTE reference in second branch");
	}
	expect(objectNameMatches(secondFrom.relation.name, "base")).toBe(true);
});

test("expands views referenced inside NOT EXISTS predicates", () => {
	const statements = parseStatements(`
		SELECT m1.id
		FROM conversation_message_by_version AS m1
		WHERE NOT EXISTS (
			SELECT 1
			FROM conversation_message_by_version AS m2
			WHERE m2.parent_id = m1.id
		)
	`);

	const rewritten = expandSqlViews({
		statements,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () =>
			new Map([
				[
					"conversation_message_by_version",
					`
						SELECT sa.id, sa.parent_id
						FROM state_by_version AS sa
					`,
				],
			]),
		hasOpenTransaction: () => false,
	});

	const select = assertSingleSelect(rewritten);
	const outerRelation = select.from_clauses[0]?.relation;
	if (!outerRelation || outerRelation.node_kind !== "subquery") {
		throw new Error("expected outer view to expand to subquery");
	}

	const whereClause = select.where_clause;
	if (!whereClause || whereClause.node_kind !== "unary_expression") {
		throw new Error("expected unary expression where clause");
	}
	const exists = whereClause.operand;
	if (!exists || exists.node_kind !== "exists_expression") {
		throw new Error("expected exists expression operand");
	}
	if (exists.statement.node_kind !== "select_statement") {
		throw new Error("expected exists statement to be select");
	}
	const innerFrom = exists.statement.from_clauses[0]?.relation;
	if (!innerFrom || innerFrom.node_kind !== "subquery") {
		throw new Error("expected inner view to expand to subquery");
	}
	const alias = innerFrom.alias;
	if (!alias) {
		throw new Error("expected inner subquery alias");
	}
	expect(getIdentifierValue(alias)).toBe("m2");
});

function assertSingleSelect(
	statements: readonly SegmentedStatementNode[]
): SelectStatementNode {
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
	if (!segment || segment.node_kind !== "select_statement") {
		throw new Error("expected select statement");
	}
	return segment as SelectStatementNode;
}
