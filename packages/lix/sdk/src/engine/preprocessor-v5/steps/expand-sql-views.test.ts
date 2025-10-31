import { expect, test } from "vitest";
import { parse as parseStatements } from "../sql-parser/parse.js";
import { expandSqlViews } from "./expand-sql-views.js";
import type { PreprocessorTraceEntry } from "../types.js";
import type {
	SegmentedStatementNode,
	SelectStatementNode,
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

	const select = assertSingleSelect(rewritten);
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
						FROM state_all AS sa
					`,
				],
			]),
		hasOpenTransaction: () => false,
	});

	const select = assertSingleSelect(rewritten);
	const relation = select.from_clauses[0]?.relation;
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
	return segment;
}
