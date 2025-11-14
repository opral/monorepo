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
	TableReferenceNode,
} from "../sql-parser/nodes.js";
import {
	getIdentifierValue,
	objectNameMatches,
	normalizeIdentifierValue,
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

test("expands nested views emitted by expandView recursively", () => {
	const statements = parseStatements(`
		SELECT *
		FROM outer_view
	`);

	const rewritten = expandSqlViews({
		statements,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () =>
			new Map([
				[
					"inner_view",
					`
						SELECT core.id
						FROM core_table AS core
					`,
				],
				[
					"outer_view",
					`
						SELECT iv.id
						FROM inner_view AS iv
					`,
				],
			]),
		hasOpenTransaction: () => false,
	});

	const select = assertSingleSelect(rewritten) as SelectStatementNode;
	const firstRelation = select.from_clauses[0]?.relation;
	if (!firstRelation || firstRelation.node_kind !== "subquery") {
		throw new Error("expected outer_view expansion");
	}
	const innerRelation = (firstRelation.statement as SelectStatementNode)
		.from_clauses[0]?.relation;
	if (!innerRelation || innerRelation.node_kind !== "subquery") {
		throw new Error("expected inner_view expansion");
	}
	const innermostRelation = (innerRelation.statement as SelectStatementNode)
		.from_clauses[0]?.relation;
	if (!innermostRelation || innermostRelation.node_kind !== "table_reference") {
		throw new Error("expected base table reference");
	}
	expect(objectNameMatches(innermostRelation.name, "core_table")).toBe(true);
});

test("fully expands file view and file_by_version view definitions", () => {
	const statements = parseStatements(`
		SELECT path, data
		FROM file
		WHERE path NOT LIKE ?
	`);

	const rewritten = expandSqlViews({
		statements,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () =>
			new Map([
				[
					"file",
					`
						SELECT 
						        id,
						        directory_id,
						        name,
			                extension,
			                path,
			                data,
			                metadata,
			                hidden,
			                lixcol_entity_id,
			                lixcol_schema_key,
			                lixcol_file_id,
			                lixcol_inherited_from_version_id,
			                lixcol_change_id,
			                lixcol_created_at,
			                lixcol_updated_at,
			                lixcol_commit_id,
			                lixcol_writer_key,
			                lixcol_untracked,
			                lixcol_metadata
			        FROM file_by_version
			        WHERE lixcol_version_id IN (SELECT version_id FROM active_version)
					`,
				],
				[
					"file_by_version",
					`
						WITH file_lixcol AS (
				            SELECT
				                fd.entity_id,
				                fd.snapshot_content,
				                fd.version_id,
				                fd.inherited_from_version_id,
				                fd.untracked,
				                fd.metadata AS change_metadata,
				                select_file_lixcol(fd.entity_id, fd.version_id) AS lixcol_json
				            FROM state_by_version fd
				            WHERE fd.schema_key = 'lix_file_descriptor'
				        ),
				        directory_paths AS (
				            SELECT
				                id AS directory_id,
				                lixcol_version_id AS version_id,
				                path AS dir_path
				            FROM directory_by_version
				        ),
				        file_rows AS (
				            SELECT
				                json_extract(fl.snapshot_content, '$.id') AS id,
				                json_extract(fl.snapshot_content, '$.directory_id') AS directory_id,
				                json_extract(fl.snapshot_content, '$.name') AS name,
				                json_extract(fl.snapshot_content, '$.extension') AS extension,
				                json_extract(fl.snapshot_content, '$.metadata') AS metadata,
				                json_extract(fl.snapshot_content, '$.hidden') AS hidden,
				                fl.entity_id,
				                fl.version_id,
				                fl.inherited_from_version_id,
				                fl.untracked,
				                fl.change_metadata,
				                fl.lixcol_json,
				                dp.dir_path,
				                CASE
				                    WHEN json_extract(fl.snapshot_content, '$.directory_id') IS NULL THEN
				                        CASE
				                            WHEN json_extract(fl.snapshot_content, '$.extension') IS NULL OR json_extract(fl.snapshot_content, '$.extension') = ''
				                                THEN '/' || json_extract(fl.snapshot_content, '$.name')
				                            ELSE '/' || json_extract(fl.snapshot_content, '$.name') || '.' || json_extract(fl.snapshot_content, '$.extension')
				                        END
				                    ELSE
				                        CASE
				                            WHEN json_extract(fl.snapshot_content, '$.extension') IS NULL OR json_extract(fl.snapshot_content, '$.extension') = ''
				                                THEN COALESCE(dp.dir_path, '/') || json_extract(fl.snapshot_content, '$.name')
				                            ELSE COALESCE(dp.dir_path, '/') || json_extract(fl.snapshot_content, '$.name') || '.' || json_extract(fl.snapshot_content, '$.extension')
				                        END
				                END AS composed_path
				            FROM file_lixcol fl
				            LEFT JOIN directory_paths dp
				                ON dp.directory_id = json_extract(fl.snapshot_content, '$.directory_id')
				               AND dp.version_id = fl.version_id
				        )
				        SELECT
				                id,
				                directory_id,
				                name,
				                extension,
				                composed_path AS path,
				                select_file_data(
				                        id,
				                        composed_path,
				                        version_id,
				                        metadata,
				                        directory_id,
				                        name,
				                        extension,
				                        hidden
				                ) AS data,
				                metadata,
				                hidden,
				                entity_id AS lixcol_entity_id,
				                'lix_file_descriptor' AS lixcol_schema_key,
				                entity_id AS lixcol_file_id,
				                version_id AS lixcol_version_id,
				                inherited_from_version_id AS lixcol_inherited_from_version_id,
				                json_extract(lixcol_json, '$.latest_change_id') AS lixcol_change_id,
				                json_extract(lixcol_json, '$.created_at') AS lixcol_created_at,
				                json_extract(lixcol_json, '$.updated_at') AS lixcol_updated_at,
				                json_extract(lixcol_json, '$.latest_commit_id') AS lixcol_commit_id,
				                json_extract(lixcol_json, '$.writer_key') AS lixcol_writer_key,
				                untracked AS lixcol_untracked,
				                change_metadata AS lixcol_metadata
				        FROM file_rows
					`,
				],
			]),
		hasOpenTransaction: () => false,
	});

	expect(hasTableReference(rewritten, "file")).toBe(false);
	expect(hasTableReference(rewritten, "file_by_version")).toBe(false);
});

test("expands views when derived tables include nested WITH clauses", () => {
	const statements = parseStatements(`
		SELECT o.inner_id
		FROM outer_view AS o
	`);

	const rewritten = expandSqlViews({
		statements,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () =>
			new Map([
				[
					"outer_view",
					`
						WITH wrapped AS (
							SELECT inner_id
							FROM wrapper_view
						)
						SELECT inner_id
						FROM wrapped
					`,
				],
				[
					"wrapper_view",
					`
						SELECT nested.inner_id
						FROM (
							WITH state_rows AS (
								SELECT inner_id
								FROM base_view
							)
							SELECT inner_id
							FROM state_rows
						) AS nested
					`,
				],
				[
					"base_view",
					`
						SELECT inner_id
						FROM core_table
					`,
				],
			]),
		hasOpenTransaction: () => false,
	});

	expect(hasTableReference(rewritten, "outer_view")).toBe(false);
	expect(hasTableReference(rewritten, "wrapper_view")).toBe(false);
	expect(hasTableReference(rewritten, "base_view")).toBe(false);
	expect(hasTableReference(rewritten, "core_table")).toBe(true);
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

test("prunes view projection when parent concatenates referenced columns", () => {
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

	const select = assertSingleSelect(rewritten);
	if (select.node_kind !== "select_statement") {
		throw new Error("expected select statement");
	}
	expect(extractExpandedProjectionColumns(select, "sv")).toEqual([
		"entity_id",
		"schema_key",
	]);
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

test("drops unused joins when expanded view projection prunes joined alias", () => {
	const statements = parseStatements(`
		SELECT v.id
		FROM version AS v
	`);

	const rewritten = expandSqlViews({
		statements,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () =>
			new Map([
				[
					"version",
					`
						WITH descriptor AS (
							SELECT id
							FROM descriptor_table
						),
						tip AS (
							SELECT id, commit_id
							FROM tip_table
						)
						SELECT d.id, t.commit_id
						FROM descriptor AS d
						LEFT JOIN tip AS t ON t.id = d.id
					`,
				],
			]),
		hasOpenTransaction: () => false,
	});

	const select = assertSingleSelect(rewritten);
	const expanded = findExpandedSubquery(select, "v");
	if (!expanded || expanded.statement.node_kind !== "select_statement") {
		throw new Error("expected expanded version view");
	}

	const expandedSelect = expanded.statement;
	const [from] = expandedSelect.from_clauses;
	if (!from) {
		throw new Error("expected FROM clause");
	}
	expect(from.joins.length).toBe(0);

	const cteNames =
		expandedSelect.with_clause?.ctes
			.map((cte) => getIdentifierValue(cte.name))
			.filter((name): name is string => Boolean(name)) ?? [];
	expect(cteNames).toEqual(["descriptor"]);
	expect(readProjectionColumns(expandedSelect)).toEqual(["id"]);
});

test("drops unused joins when projection only uses json_extract over left table", () => {
	const statements = parseStatements(`
		SELECT v.id_path
		FROM version_json AS v
	`);

	const rewritten = expandSqlViews({
		statements,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () =>
			new Map([
				[
					"version_json",
					`
						SELECT json_extract(d.payload, '$.id') AS id_path
						FROM descriptor AS d
						LEFT JOIN tip AS t ON t.id = d.id
					`,
				],
			]),
		hasOpenTransaction: () => false,
	});

	const select = assertSingleSelect(rewritten);
	const expanded = findExpandedSubquery(select, "v");
	if (!expanded || expanded.statement.node_kind !== "select_statement") {
		throw new Error("expected expanded version_json view");
	}

	const [from] = expanded.statement.from_clauses;
	if (!from) {
		throw new Error("expected FROM clause");
	}
	expect(from.joins.length).toBe(0);
});

test("retains left joins when view projection includes COUNT aggregator", () => {
	const statements = parseStatements(`
		SELECT vc.total
		FROM version_counts AS vc
	`);

	const rewritten = expandSqlViews({
		statements,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () =>
			new Map([
				[
					"version_counts",
					`
						SELECT COUNT(*) AS total
						FROM descriptor AS d
						LEFT JOIN tip AS t ON t.id = d.id
					`,
				],
			]),
		hasOpenTransaction: () => false,
	});

	const select = assertSingleSelect(rewritten);
	const expanded = findExpandedSubquery(select, "vc");
	if (!expanded || expanded.statement.node_kind !== "select_statement") {
		throw new Error("expected expanded version_counts view");
	}

	const [from] = expanded.statement.from_clauses;
	if (!from) {
		throw new Error("expected FROM clause");
	}
	expect(from.joins.length).toBe(1);
});

test("preserves joins when joined alias contributes referenced columns", () => {
	const statements = parseStatements(`
		SELECT v.commit_id
		FROM version AS v
	`);

	const rewritten = expandSqlViews({
		statements,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () =>
			new Map([
				[
					"version",
					`
						WITH descriptor AS (
							SELECT id
							FROM descriptor_table
						),
						tip AS (
							SELECT id, commit_id
							FROM tip_table
						)
						SELECT d.id, t.commit_id
						FROM descriptor AS d
						LEFT JOIN tip AS t ON t.id = d.id
					`,
				],
			]),
		hasOpenTransaction: () => false,
	});

	const select = assertSingleSelect(rewritten);
	const expanded = findExpandedSubquery(select, "v");
	if (!expanded || expanded.statement.node_kind !== "select_statement") {
		throw new Error("expected expanded version view");
	}

	const expandedSelect = expanded.statement;
	const [from] = expandedSelect.from_clauses;
	if (!from) {
		throw new Error("expected FROM clause");
	}
	expect(from.joins).toHaveLength(1);

	const firstJoin = from.joins[0];
	if (!firstJoin) {
		throw new Error("expected join clause");
	}
	const joinRelation = firstJoin.relation;
	if (joinRelation.node_kind === "raw_fragment") {
		throw new Error("expected structured join relation");
	}
	const joinAlias = getIdentifierValue(joinRelation.alias);
	expect(joinAlias).toBe("t");

	const cteNames =
		expandedSelect.with_clause?.ctes
			.map((cte) => getIdentifierValue(cte.name))
			.filter((name): name is string => Boolean(name)) ?? [];
	expect(cteNames).toEqual(["descriptor", "tip"]);
	expect(readProjectionColumns(expandedSelect)).toEqual(["commit_id"]);
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

function collectTableNames(
	statements: readonly SegmentedStatementNode[]
): Set<string> {
	const names = new Set<string>();

	const recordTable = (relation: TableReferenceNode) => {
		const last = relation.name.parts.at(-1);
		if (last) {
			names.add(normalizeIdentifierValue(last.value));
		}
	};

	const visitRelation = (relation: RelationNode) => {
		if (relation.node_kind === "table_reference") {
			recordTable(relation);
			return;
		}
		if (relation.node_kind === "subquery") {
			visitStatement(relation.statement);
		}
	};

	const visitSelect = (select: SelectStatementNode) => {
		if (select.with_clause) {
			for (const cte of select.with_clause.ctes) {
				visitStatement(cte.statement);
			}
		}
		for (const clause of select.from_clauses) {
			visitRelation(clause.relation);
			for (const join of clause.joins) {
				visitRelation(join.relation);
			}
		}
	};

	const visitCompound = (compound: CompoundSelectNode) => {
		if (compound.with_clause) {
			for (const cte of compound.with_clause.ctes) {
				visitStatement(cte.statement);
			}
		}
		visitSelect(compound.first);
		for (const branch of compound.compounds) {
			visitSelect(branch.select);
		}
	};

	const visitStatement = (
		statement: SelectStatementNode | CompoundSelectNode
	) => {
		if (statement.node_kind === "select_statement") {
			visitSelect(statement);
		} else {
			visitCompound(statement);
		}
	};

	for (const segmented of statements) {
		if (!segmented || segmented.node_kind !== "segmented_statement") continue;
		for (const segment of segmented.segments) {
			if (segment.node_kind === "select_statement") {
				visitSelect(segment);
			} else if (segment.node_kind === "compound_select") {
				visitCompound(segment);
			}
		}
	}

	return names;
}

function hasTableReference(
	statements: readonly SegmentedStatementNode[],
	tableName: string
): boolean {
	const target = normalizeIdentifierValue(tableName);
	return collectTableNames(statements).has(target);
}
