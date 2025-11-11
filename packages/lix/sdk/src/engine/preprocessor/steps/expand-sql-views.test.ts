import { expect, test } from "vitest";
import { parse as parseStatements } from "../sql-parser/parse.js";
import { expandSqlViews } from "./expand-sql-views.js";
import type { PreprocessorTraceEntry } from "../types.js";
import type {
	SegmentedStatementNode,
	SelectStatementNode,
	CompoundSelectNode,
	RelationNode,
	SubqueryNode,
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

test("prunes expanded view projection to referenced parent columns", () => {
	const statements = parseStatements(`
		SELECT sv.entity_id
		FROM state_by_version AS sv
	`);

	const rewritten = expandSqlViews({
		statements,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () =>
			new Map([
				[
					"state_by_version",
					`
						SELECT entity_id, schema_key, writer_key
						FROM lix_internal_state_vtable
					`,
				],
			]),
		hasOpenTransaction: () => false,
	});

	const select = assertSingleSelect(rewritten);
	const projectionColumns = extractExpandedProjectionColumns(select);
	expect(projectionColumns).toEqual(["entity_id"]);
});

test("includes columns referenced in parent predicates when pruning view projection", () => {
	const statements = parseStatements(`
		SELECT sv.entity_id
		FROM state_by_version AS sv
		WHERE sv.writer_key IS NOT NULL
	`);

	const rewritten = expandSqlViews({
		statements,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () =>
			new Map([
				[
					"state_by_version",
					`
						SELECT entity_id, schema_key, writer_key
						FROM lix_internal_state_vtable
					`,
				],
			]),
		hasOpenTransaction: () => false,
	});

	const select = assertSingleSelect(rewritten);
	const projectionColumns = extractExpandedProjectionColumns(select);
	expect(projectionColumns).toEqual(["entity_id", "writer_key"]);
});

test("skips projection pruning when parent selects all columns from the view", () => {
	const statements = parseStatements(`
		SELECT sv.*
		FROM state_by_version AS sv
	`);

	const rewritten = expandSqlViews({
		statements,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () =>
			new Map([
				[
					"state_by_version",
					`
						SELECT entity_id, schema_key, writer_key
						FROM lix_internal_state_vtable
					`,
				],
			]),
		hasOpenTransaction: () => false,
	});

	const select = assertSingleSelect(rewritten);
	const projectionColumns = extractExpandedProjectionColumns(select);
	expect(projectionColumns).toEqual(["entity_id", "schema_key", "writer_key"]);
});

test("prunes each expanded view reference independently", () => {
	const statements = parseStatements(`
		SELECT old.entity_id, cur.writer_key
		FROM state_by_version AS old
		JOIN state_by_version AS cur ON cur.schema_key = old.schema_key
	`);

	const rewritten = expandSqlViews({
		statements,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () =>
			new Map([
				[
					"state_by_version",
					`
						SELECT entity_id, schema_key, writer_key
						FROM lix_internal_state_vtable
					`,
				],
			]),
		hasOpenTransaction: () => false,
	});

	const select = assertSingleSelect(rewritten);
	expect(extractExpandedProjectionColumns(select, "old")).toEqual([
		"entity_id",
		"schema_key",
	]);
	expect(extractExpandedProjectionColumns(select, "cur")).toEqual([
		"schema_key",
		"writer_key",
	]);
});

test("includes columns referenced in join and order clauses", () => {
	const statements = parseStatements(`
		SELECT sv.entity_id
		FROM state_by_version AS sv
		JOIN other_table AS ot ON ot.writer_key = sv.writer_key
		ORDER BY sv.schema_key
	`);

	const rewritten = expandSqlViews({
		statements,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () =>
			new Map([
				[
					"state_by_version",
					`
						SELECT entity_id, schema_key, writer_key
						FROM lix_internal_state_vtable
					`,
				],
			]),
		hasOpenTransaction: () => false,
	});

	const select = assertSingleSelect(rewritten);
	expect(extractExpandedProjectionColumns(select)).toEqual([
		"entity_id",
		"schema_key",
		"writer_key",
	]);
});

test("does not prune views whose definitions use DISTINCT", () => {
	const statements = parseStatements(`
		SELECT sv.entity_id
		FROM distinct_state AS sv
	`);

	const rewritten = expandSqlViews({
		statements,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () =>
			new Map([
				[
					"distinct_state",
					`
						SELECT DISTINCT entity_id, writer_key
						FROM lix_internal_state_vtable
					`,
				],
			]),
		hasOpenTransaction: () => false,
	});

	const select = assertSingleSelect(rewritten);
	expect(extractExpandedProjectionColumns(select)).toEqual([
		"entity_id",
		"writer_key",
	]);
});

test("skips pruning when parent projection cannot be resolved precisely", () => {
	const statements = parseStatements(`
		SELECT sv.entity_id || sv.schema_key AS composite
		FROM state_by_version AS sv
	`);

	const rewritten = expandSqlViews({
		statements,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () =>
			new Map([
				[
					"state_by_version",
					`
						SELECT entity_id, schema_key, writer_key
						FROM lix_internal_state_vtable
					`,
				],
			]),
		hasOpenTransaction: () => false,
	});

	expect(rewritten).toBe(statements);
});

test("prunes nested view dependencies transitively", () => {
	const statements = parseStatements(`
		SELECT sp.entity_id
		FROM state_projection AS sp
	`);

	const rewritten = expandSqlViews({
		statements,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () =>
			new Map([
				[
					"state_projection",
					`
						SELECT sv.entity_id, sv.writer_key
						FROM state_by_version AS sv
					`,
				],
				[
					"state_by_version",
					`
						SELECT entity_id, schema_key, writer_key
						FROM lix_internal_state_vtable
					`,
				],
			]),
		hasOpenTransaction: () => false,
	});

	const rootSelect = assertSingleSelect(rewritten);
	expect(extractExpandedProjectionColumns(rootSelect, "sp")).toEqual([
		"entity_id",
	]);

	const outerSubquery = findExpandedSubquery(rootSelect, "sp");
	if (!outerSubquery) {
		throw new Error("expected outer view subquery");
	}
	if (outerSubquery.statement.node_kind !== "select_statement") {
		throw new Error("expected select statement for outer view");
	}
	expect(
		extractExpandedProjectionColumns(outerSubquery.statement, "sv")
	).toEqual(["entity_id"]);
});

test("prunes nested views when parent predicate uses subquery filters", () => {
	const statements = parseStatements(`
		SELECT st.writer_key
		FROM state AS st
	`);

	const rewritten = expandSqlViews({
		statements,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () =>
			new Map([
				[
					"state",
					`
						SELECT sv.writer_key
						FROM state_by_version AS sv
						WHERE sv.version_id IN (
							SELECT av.version_id
							FROM active_version AS av
						)
					`,
				],
				[
					"state_by_version",
					`
						SELECT writer_key, version_id
						FROM lix_internal_state_vtable
					`,
				],
			]),
		hasOpenTransaction: () => false,
	});

	const select = assertSingleSelect(rewritten);
	expect(extractExpandedProjectionColumns(select, "st")).toEqual([
		"writer_key",
	]);

	const stateSubquery = findExpandedSubquery(select, "st");
	if (
		!stateSubquery ||
		stateSubquery.statement.node_kind !== "select_statement"
	) {
		throw new Error("expected expanded state view subquery");
	}
	const nested = findExpandedSubquery(stateSubquery.statement, "sv");
	if (!nested || nested.statement.node_kind !== "select_statement") {
		throw new Error("expected expanded state_by_version view");
	}
	expect(readProjectionColumns(nested.statement)).toEqual([
		"writer_key",
		"version_id",
	]);
});

test("tracks correlated subquery column usage when pruning projections", () => {
	const statements = parseStatements(`
		SELECT old.writer_key
		FROM state_by_version AS old
		WHERE EXISTS (
			SELECT 1
			FROM state_by_version AS cur
			WHERE cur.version_id = old.version_id
				AND cur.writer_key = old.writer_key
		)
	`);

	const rewritten = expandSqlViews({
		statements,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () =>
			new Map([
				[
					"state_by_version",
					`
						SELECT writer_key, version_id
						FROM lix_internal_state_vtable
					`,
				],
			]),
		hasOpenTransaction: () => false,
	});

	const select = assertSingleSelect(rewritten);
	expect(extractExpandedProjectionColumns(select, "old")).toEqual([
		"writer_key",
		"version_id",
	]);
});

test("prunes view defined with CTEs while preserving structure", () => {
	const statements = parseStatements(`
		SELECT sl.writer_key
		FROM state_latest AS sl
		WHERE sl.entity_id = 'abc'
	`);

	const rewritten = expandSqlViews({
		statements,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () =>
			new Map([
				[
					"state_latest",
					`
						WITH base AS (
							SELECT entity_id, writer_key, schema_key
							FROM lix_internal_state_vtable
						)
						SELECT entity_id, writer_key
						FROM base
					`,
				],
			]),
		hasOpenTransaction: () => false,
	});

	const select = assertSingleSelect(rewritten);
	expect(extractExpandedProjectionColumns(select)).toEqual([
		"entity_id",
		"writer_key",
	]);

	const relation = findExpandedSubquery(select);
	if (!relation || relation.statement.node_kind !== "select_statement") {
		throw new Error("expected select statement inside CTE view");
	}
	const innerSelect = relation.statement;
	if (!innerSelect.with_clause) {
		throw new Error("expected WITH clause to be present");
	}
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
	const selectSegments = statement.segments.filter(
		(segment): segment is SelectStatementNode =>
			segment.node_kind === "select_statement"
	);
	if (selectSegments.length === 0) {
		const compound = statement.segments.find(
			(segment): segment is CompoundSelectNode =>
				segment.node_kind === "compound_select"
		);
		if (compound) {
			return compound.first;
		}
		throw new Error("expected select statement");
	}
	const first = selectSegments[0];
	if (!first) {
		throw new Error("expected select statement");
	}
	return first;
}

function findFirstSelectStatement(
	statements: readonly SegmentedStatementNode[]
): SelectStatementNode | null {
	for (const statement of statements) {
		if (statement.node_kind !== "segmented_statement") {
			continue;
		}
		for (const segment of statement.segments) {
			if (segment.node_kind === "select_statement") {
				return segment;
			}
			if (segment.node_kind === "compound_select") {
				return segment.first;
			}
		}
	}
	return null;
}

function extractExpandedProjectionColumns(
	select: SelectStatementNode,
	targetAlias?: string
): string[] {
	const relation = findExpandedSubquery(select, targetAlias);
	if (!relation) {
		throw new Error("expected expanded view subquery");
	}
	const statement = relation.statement;
	if (statement.node_kind !== "select_statement") {
		throw new Error("expected select statement body");
	}
	return readProjectionColumns(statement);
}

function findExpandedSubquery(
	select: SelectStatementNode,
	targetAlias?: string
): SubqueryNode | null {
	const availableRelations = collectSelectableRelations(select);
	if (targetAlias === undefined) {
		return (
			(availableRelations.find(
				(entry) => entry.relation.node_kind === "subquery"
			)?.relation as SubqueryNode | undefined) ?? null
		);
	}
	for (const entry of availableRelations) {
		if (entry.relation.node_kind !== "subquery") {
			continue;
		}
		const aliasValue = getIdentifierValue(entry.relation.alias);
		if (aliasValue && aliasValue === targetAlias) {
			return entry.relation;
		}
	}
	return null;
}

function collectSelectableRelations(select: SelectStatementNode): {
	relation: RelationNode;
}[] {
	const relations: { relation: RelationNode }[] = [];
	for (const clause of select.from_clauses) {
		relations.push({ relation: clause.relation });
		for (const join of clause.joins) {
			relations.push({ relation: join.relation });
		}
	}
	return relations;
}

function readProjectionColumns(statement: SelectStatementNode): string[] {
	return statement.projection
		.flatMap((item) => {
			if (item.node_kind !== "select_expression") {
				return [];
			}
			const expression = item.expression;
			if ("sql_text" in expression) {
				return [];
			}
			if (expression.node_kind !== "column_reference") {
				return [];
			}
			const identifier = expression.path.at(-1);
			return identifier ? [identifier.value] : [];
		})
		.filter((value, index, array) => array.indexOf(value) === index);
}
