import { describe, expect, test } from "vitest";
import { parse } from "../../sql-parser/parse.js";
import type { PreprocessorTrace } from "../../types.js";
import { rewriteStateAllViewSelect } from "./select.js";
import type {
	SelectExpressionNode,
	SelectStatementNode,
	SqlNode,
} from "../../sql-parser/nodes.js";
import {
	getIdentifierValue,
	objectNameMatches,
} from "../../sql-parser/ast-helpers.js";

function run(sql: string, trace?: PreprocessorTrace): SelectStatementNode {
	const statement = parse(sql);
	const result = rewriteStateAllViewSelect({
		node: statement,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () => new Map(),
		hasOpenTransaction: () => true,
		trace,
	});
	return assertSelect(result);
}

describe("rewriteStateAllViewSelect", () => {
	test("rewrites state_by_version reference into subquery", () => {
		const trace: PreprocessorTrace = [];
		const node = run(
			`
				SELECT sa.*
				FROM state_by_version AS sa
				WHERE sa.schema_key = 'test'
			`,
			trace
		);

		const { alias, select: subquery } = extractStateAllSubquery(node);
		expect(alias).toBe("sa");

		const metadataProjection = findProjectionByAlias(subquery, "metadata");
		if (!metadataProjection) {
			throw new Error("expected metadata projection");
		}
		if (metadataProjection.expression.node_kind !== "raw_fragment") {
			throw new Error("expected metadata projection to be raw fragment");
		}
		expect(metadataProjection.expression.sql_text).toContain("json(metadata)");

		expect(trace[0]?.payload).toMatchObject({
			reference_count: 1,
			bindings: ["sa"],
		});
	});

	test("rewrites nested state_by_version reference inside subquery", () => {
		const node = run(`
		SELECT outer_alias.*
		FROM (
			SELECT *
			FROM state_by_version
			WHERE schema_key = 'nested'
		) AS outer_alias
	`);

		const select = node;
		const fromClause = select.from_clauses[0];
		if (!fromClause || fromClause.relation.node_kind !== "subquery") {
			throw new Error("expected subquery relation");
		}
		expect(getIdentifierValue(fromClause.relation.alias)).toBe("outer_alias");
		extractStateAllSubquery(fromClause.relation.statement);
	});

	test("narrows projection to referenced columns", () => {
		const node = run(`
		SELECT sa.file_id
		FROM state_by_version AS sa
		WHERE sa.schema_key = 'narrow'
	`);

		const subquery = extractStateAllSubquery(node).select;
		const aliases = getProjectionAliases(subquery);
		expect(aliases).toContain("file_id");
		expect(aliases).toContain("schema_key");
		expect(aliases).toContain("snapshot_content");
		expect(aliases).not.toContain("plugin_key");
		expect(aliases).not.toContain("metadata");
	});

	test("projection includes metadata when explicitly selected", () => {
		const node = run(`
		SELECT sa.metadata, sa.file_id
		FROM state_by_version AS sa
		WHERE sa.schema_key = 'with_metadata'
	`);

		const subquery = extractStateAllSubquery(node).select;
		const aliases = getProjectionAliases(subquery);
		expect(aliases).toContain("file_id");
		expect(aliases).toContain("metadata");
		const metadataProjection = findProjectionByAlias(subquery, "metadata");
		if (!metadataProjection) {
			throw new Error("expected metadata projection");
		}
		if (metadataProjection.expression.node_kind !== "raw_fragment") {
			throw new Error("expected metadata projection to be raw fragment");
		}
		expect(metadataProjection.expression.sql_text).toContain("json(metadata)");
	});

	test("prunes unused columns", () => {
		const node = run(`
		SELECT sa.file_id
		FROM state_by_version AS sa
	`);

		const subquery = extractStateAllSubquery(node).select;
		const aliases = getProjectionAliases(subquery);
		expect(aliases).not.toContain("plugin_key");
		expect(aliases).not.toContain("metadata");
		expect(countOccurrences(aliases, "file_id")).toBe(1);
		expect(countOccurrences(aliases, "schema_key")).toBe(1);
		expect(countOccurrences(aliases, "snapshot_content")).toBe(1);
	});
});

function assertSelect(node: SqlNode): SelectStatementNode {
	if (node.node_kind !== "select_statement") {
		throw new Error("expected select statement");
	}
	return node as SelectStatementNode;
}

function extractStateAllSubquery(node: SqlNode): {
	alias: string | null;
	select: SelectStatementNode;
} {
	const select = assertSelect(node);
	const fromClause = select.from_clauses[0];
	if (!fromClause || fromClause.relation.node_kind !== "subquery") {
		throw new Error("expected subquery relation for state_by_version rewrite");
	}
	const alias = getIdentifierValue(fromClause.relation.alias);
	const innerFrom = fromClause.relation.statement.from_clauses[0];
	if (!innerFrom || innerFrom.relation.node_kind !== "table_reference") {
		throw new Error("expected table reference to state vtable");
	}
	expect(
		objectNameMatches(innerFrom.relation.name, "lix_internal_state_vtable")
	).toBe(true);
	return {
		alias,
		select: fromClause.relation.statement,
	};
}

function getProjectionAliases(select: SelectStatementNode): string[] {
	return select.projection
		.filter(
			(item): item is SelectExpressionNode =>
				item.node_kind === "select_expression"
		)
		.map((item) => getIdentifierValue(item.alias))
		.filter((alias): alias is string => alias !== null);
}

function findProjectionByAlias(
	select: SelectStatementNode,
	alias: string
): SelectExpressionNode | undefined {
	return select.projection.find(
		(item): item is SelectExpressionNode =>
			item.node_kind === "select_expression" &&
			getIdentifierValue(item.alias) === alias
	);
}

function countOccurrences(list: readonly string[], value: string): number {
	return list.filter((entry) => entry === value).length;
}
