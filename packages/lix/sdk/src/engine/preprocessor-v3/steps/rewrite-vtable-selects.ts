import {
	type BetweenExpressionNode,
	type BinaryExpressionNode,
	type ExpressionNode,
	type IdentifierNode,
	type InListExpressionNode,
	type RawFragmentNode,
	type SelectItemNode,
	type SelectStatementNode,
	type StatementNode,
	type TableReferenceNode,
} from "../sql-parser/nodes.js";
import type {
	PreprocessorStep,
	PreprocessorStepContext,
	PreprocessorTraceEntry,
} from "../types.js";
import { internalQueryBuilder } from "../../internal-query-builder.js";
import {
	getColumnName,
	getColumnQualifier,
	getIdentifierValue,
	isSelectAllForTable,
	normalizeIdentifierValue,
	objectNameMatches,
} from "../sql-parser/ast-helpers.js";
import {
	visitSelectStatement,
	type AstVisitor,
} from "../sql-parser/visitor.js";

export const INTERNAL_STATE_VTABLE = "lix_internal_state_vtable";
export const REWRITTEN_STATE_VTABLE = "lix_internal_state_vtable_rewritten";

const DEFAULT_ALIAS_KEY = normalizeIdentifierValue(REWRITTEN_STATE_VTABLE);
const ORIGINAL_TABLE_KEY = normalizeIdentifierValue(INTERNAL_STATE_VTABLE);

type SelectedProjection = {
	column: string;
	alias: string | null;
};

type SchemaKeyPredicateSummary = {
	count: number;
	literals: string[];
	hasDynamic: boolean;
};

type TableReferenceInfo = {
	relation: TableReferenceNode;
	alias: string | null;
	normalizedAlias: string | null;
};

type InlineRewriteMetadata = {
	schemaKeys: readonly string[];
	selectedColumns: SelectedProjection[] | null;
};

/**
 * Rewrites internal state vtable references into inline union subqueries.
 *
 * @example
 * ```ts
 * const rewritten = rewriteVtableSelects({
 *   node: statement,
 *   getCacheTables,
 *   hasOpenTransaction,
 * });
 * ```
 */
export const rewriteVtableSelects: PreprocessorStep = (context) => {
	const node = context.node as StatementNode;

	switch (node.node_kind) {
		case "select_statement":
			return rewriteSelectStatement(node, context);
		case "update_statement":
		case "delete_statement":
			return node;
		default:
			return node;
	}
};

function rewriteSelectStatement(
	select: SelectStatementNode,
	context: PreprocessorStepContext
): SelectStatementNode {
	const withRewrittenSubqueries = visitSelectStatement(select, {
		subquery(node) {
			const rewrittenStatement = rewriteSelectStatement(
				node.statement,
				context
			);
			if (rewrittenStatement !== node.statement) {
				return {
					...node,
					statement: rewrittenStatement,
				};
			}
			return node;
		},
	});

	const references = collectInternalStateReferences(withRewrittenSubqueries);
	if (references.length === 0) {
		return withRewrittenSubqueries;
	}

	const aliasList = references
		.map((reference) => reference.alias)
		.filter((alias): alias is string => alias !== null);

	const tableNamesForTrace = new Set<string>([
		DEFAULT_ALIAS_KEY,
		ORIGINAL_TABLE_KEY,
		...references
			.map((reference) => reference.normalizedAlias)
			.filter((alias): alias is string => alias !== null),
	]);

	const schemaSummary = collectSchemaKeyPredicates(
		withRewrittenSubqueries.where_clause,
		tableNamesForTrace
	);
	if (schemaSummary.hasDynamic) {
		throw new Error(
			"rewrite_vtable_selects requires literal schema_key predicates; received ambiguous filter."
		);
	}

	const projectionKind = determineProjectionKind(
		withRewrittenSubqueries.projection,
		tableNamesForTrace
	);
	const selectedColumnsForTrace = collectSelectedColumns(
		withRewrittenSubqueries,
		tableNamesForTrace
	);

	const metadata = buildInlineMetadata(withRewrittenSubqueries, references);

	const rewritten = visitSelectStatement(
		withRewrittenSubqueries,
		createInlineVisitor(metadata, context)
	);

	if (context.trace) {
		const entry = buildTraceEntry({
			aliasList,
			projectionKind,
			schemaSummary,
			selectedColumns: selectedColumnsForTrace,
		});
		context.trace.push(entry);
	}

	return rewritten;
}

function collectInternalStateReferences(
	select: SelectStatementNode
): TableReferenceInfo[] {
	const references: TableReferenceInfo[] = [];
	for (const clause of select.from_clauses) {
		const relation = clause.relation;
		if (relation.node_kind === "table_reference") {
			if (isInternalStateTable(relation)) {
				references.push({
					relation,
					alias: getIdentifierValue(relation.alias),
					normalizedAlias: normalizeAlias(relation.alias),
				});
			}
		}
		for (const join of clause.joins) {
			const joinRelation = join.relation;
			if (
				joinRelation.node_kind === "table_reference" &&
				isInternalStateTable(joinRelation)
			) {
				references.push({
					relation: joinRelation,
					alias: getIdentifierValue(joinRelation.alias),
					normalizedAlias: normalizeAlias(joinRelation.alias),
				});
			}
		}
	}
	return references;
}

function isInternalStateTable(table: TableReferenceNode): boolean {
	return objectNameMatches(table.name, INTERNAL_STATE_VTABLE);
}

function normalizeAlias(alias: IdentifierNode | null): string | null {
	const value = getIdentifierValue(alias);
	return value ? normalizeIdentifierValue(value) : null;
}

function buildInlineMetadata(
	select: SelectStatementNode,
	references: readonly TableReferenceInfo[]
): Map<string, InlineRewriteMetadata> {
	const metadata = new Map<string, InlineRewriteMetadata>();
	for (const reference of references) {
		const aliasKey = reference.normalizedAlias ?? DEFAULT_ALIAS_KEY;
		if (metadata.has(aliasKey)) {
			continue;
		}
		const tableNames = new Set<string>([
			aliasKey,
			DEFAULT_ALIAS_KEY,
			ORIGINAL_TABLE_KEY,
		]);
		const summary = collectSchemaKeyPredicates(select.where_clause, tableNames);
		if (summary.hasDynamic) {
			throw new Error(
				"rewrite_vtable_selects requires literal schema_key predicates; received ambiguous filter."
			);
		}
		const selectedColumns = collectSelectedColumns(select, tableNames);
		metadata.set(aliasKey, {
			schemaKeys: summary.literals,
			selectedColumns,
		});
	}
	return metadata;
}

function createInlineVisitor(
	metadata: Map<string, InlineRewriteMetadata>,
	context: PreprocessorStepContext
): AstVisitor {
	return {
		table_reference(node: TableReferenceNode) {
			if (!isInternalStateTable(node)) {
				return;
			}
			const aliasValue = getIdentifierValue(node.alias);
			const aliasKey = aliasValue
				? normalizeIdentifierValue(aliasValue)
				: DEFAULT_ALIAS_KEY;
			const metadataEntry = metadata.get(aliasKey);
			if (!metadataEntry) {
				return;
			}
			const aliasForSql = aliasValue ?? REWRITTEN_STATE_VTABLE;
			const inlineSql = buildVtableSelectRewrite({
				schemaKeys: metadataEntry.schemaKeys,
				cacheTables: context.getCacheTables!(),
				selectedColumns: metadataEntry.selectedColumns,
				hasOpenTransaction: context.hasOpenTransaction!(),
			}).trimEnd();
			const fragment: RawFragmentNode = {
				node_kind: "raw_fragment",
				sql_text: `${inlineSql} AS ${quoteIdentifier(aliasForSql)}`,
			};
			return fragment;
		},
	};
}

function collectSchemaKeyPredicates(
	whereClause: SelectStatementNode["where_clause"],
	tableNames: Set<string>
): SchemaKeyPredicateSummary {
	if (!whereClause) {
		return { count: 0, literals: [], hasDynamic: false };
	}

	return visitExpression(whereClause, tableNames);
}

function visitExpression(
	expression: ExpressionNode | RawFragmentNode,
	tableNames: Set<string>
): SchemaKeyPredicateSummary {
	if ("sql_text" in expression) {
		return { count: 0, literals: [], hasDynamic: true };
	}

	switch (expression.node_kind) {
		case "grouped_expression":
			return visitExpression(expression.expression, tableNames);
		case "binary_expression":
			return visitBinaryExpression(expression, tableNames);
		case "unary_expression":
			return visitExpression(expression.operand, tableNames);
		case "in_list_expression":
			return visitInListExpression(expression, tableNames);
		case "between_expression":
			return visitBetweenExpression(expression, tableNames);
		case "column_reference":
		case "literal":
		case "parameter":
		default:
			return { count: 0, literals: [], hasDynamic: false };
	}
}

function visitBinaryExpression(
	expression: BinaryExpressionNode,
	tableNames: Set<string>
): SchemaKeyPredicateSummary {
	if (isLogicalOperator(expression.operator)) {
		return mergeSummaries(
			visitExpression(expression.left, tableNames),
			visitExpression(expression.right, tableNames)
		);
	}

	if (!isEqualityOperator(expression.operator)) {
		return { count: 0, literals: [], hasDynamic: false };
	}

	let summary: SchemaKeyPredicateSummary = {
		count: 0,
		literals: [],
		hasDynamic: false,
	};

	const leftIsSchema = isSchemaKeyReference(expression.left, tableNames);
	const rightIsSchema = isSchemaKeyReference(expression.right, tableNames);

	if (leftIsSchema) {
		summary = incrementSummaryWithOperand(summary, expression.right);
	}
	if (rightIsSchema) {
		summary = incrementSummaryWithOperand(summary, expression.left);
	}

	return summary;
}

function visitInListExpression(
	expression: InListExpressionNode,
	tableNames: Set<string>
): SchemaKeyPredicateSummary {
	if (!isSchemaKeyReference(expression.operand, tableNames)) {
		return { count: 0, literals: [], hasDynamic: false };
	}
	let summary: SchemaKeyPredicateSummary = {
		count: 1,
		literals: [],
		hasDynamic: false,
	};
	for (const item of expression.items) {
		summary = incrementSummaryWithOperand(summary, item);
	}
	return summary;
}

function visitBetweenExpression(
	expression: BetweenExpressionNode,
	tableNames: Set<string>
): SchemaKeyPredicateSummary {
	if (!isSchemaKeyReference(expression.operand, tableNames)) {
		return { count: 0, literals: [], hasDynamic: false };
	}
	let summary: SchemaKeyPredicateSummary = {
		count: 1,
		literals: [],
		hasDynamic: false,
	};
	summary = incrementSummaryWithOperand(summary, expression.start);
	summary = incrementSummaryWithOperand(summary, expression.end);
	return summary;
}

function incrementSummaryWithOperand(
	summary: SchemaKeyPredicateSummary,
	operand: ExpressionNode | RawFragmentNode
): SchemaKeyPredicateSummary {
	const next = { ...summary };
	const node = unwrapExpression(operand);
	switch (node.node_kind) {
		case "literal":
			if (typeof node.value === "string") {
				next.literals.push(node.value);
			} else {
				next.hasDynamic = true;
			}
			break;
		case "parameter":
		case "raw_fragment":
		case "column_reference":
		case "in_list_expression":
		case "between_expression":
		case "binary_expression":
		case "unary_expression":
		case "grouped_expression":
			next.hasDynamic = true;
			break;
		default:
			break;
	}
	next.count += 1;
	return next;
}

function unwrapExpression(
	expression: ExpressionNode | RawFragmentNode
): ExpressionNode | RawFragmentNode {
	if ("sql_text" in expression) {
		return expression;
	}
	if (expression.node_kind === "grouped_expression") {
		return unwrapExpression(expression.expression);
	}
	return expression;
}

function isSchemaKeyReference(
	expression: ExpressionNode | RawFragmentNode,
	tableNames: Set<string>
): boolean {
	if ("sql_text" in expression) {
		return false;
	}
	if (expression.node_kind === "column_reference") {
		const qualifier = getColumnQualifier(expression);
		const columnName = getColumnName(expression);
		if (qualifier && tableNames.has(qualifier)) {
			return columnName === "schema_key";
		}
		if (!qualifier) {
			return columnName === "schema_key";
		}
		return false;
	}
	if (expression.node_kind === "grouped_expression") {
		return isSchemaKeyReference(expression.expression, tableNames);
	}
	return false;
}

function isLogicalOperator(
	operator: BinaryExpressionNode["operator"]
): boolean {
	return operator === "and" || operator === "or";
}

function isEqualityOperator(
	operator: BinaryExpressionNode["operator"]
): boolean {
	return operator === "=" || operator === "is";
}

function mergeSummaries(
	...summaries: SchemaKeyPredicateSummary[]
): SchemaKeyPredicateSummary {
	return summaries.reduce<SchemaKeyPredicateSummary>(
		(accumulator, current) => {
			accumulator.count += current.count;
			accumulator.literals.push(...current.literals);
			accumulator.hasDynamic = accumulator.hasDynamic || current.hasDynamic;
			return accumulator;
		},
		{ count: 0, literals: [], hasDynamic: false }
	);
}

function collectSelectedColumns(
	select: SelectStatementNode,
	tableNames: Set<string>
): SelectedProjection[] | null {
	if (select.projection.length === 0) {
		return null;
	}

	for (const item of select.projection) {
		if (isSelectAllForTable(item, tableNames)) {
			return null;
		}
	}

	const order: string[] = [];
	const entries = new Map<string, SelectedProjection>();

	for (const projection of select.projection) {
		if (projection.node_kind !== "select_expression") {
			continue;
		}
		const columnName = extractColumnFromExpression(
			projection.expression,
			tableNames
		);
		if (!columnName) {
			continue;
		}
		const alias = getIdentifierValue(projection.alias);
		if (!entries.has(columnName)) {
			order.push(columnName);
			entries.set(columnName, {
				column: columnName,
				alias: alias ?? null,
			});
		} else if (alias) {
			const existing = entries.get(columnName)!;
			if (existing.alias === null) {
				entries.set(columnName, {
					column: columnName,
					alias,
				});
			}
		}
	}

	return order.map((column) => entries.get(column)!);
}

function extractColumnFromExpression(
	expression: ExpressionNode | RawFragmentNode,
	tableNames: Set<string>
): string | null {
	if ("sql_text" in expression) {
		return null;
	}
	switch (expression.node_kind) {
		case "column_reference": {
			const qualifier = getColumnQualifier(expression);
			if (qualifier && !tableNames.has(qualifier)) {
				return null;
			}
			return getColumnName(expression);
		}
		case "grouped_expression":
			return extractColumnFromExpression(expression.expression, tableNames);
		default:
			return null;
	}
}

function determineProjectionKind(
	projection: readonly SelectItemNode[],
	tableNames: Set<string>
): "selectAll" | "partial" {
	for (const item of projection) {
		if (isSelectAllForTable(item, tableNames)) {
			return "selectAll";
		}
	}
	return "partial";
}

function buildTraceEntry(args: {
	aliasList: readonly string[];
	projectionKind: "selectAll" | "partial";
	schemaSummary: SchemaKeyPredicateSummary;
	selectedColumns: SelectedProjection[] | null;
}): PreprocessorTraceEntry {
	const { aliasList, schemaSummary, projectionKind, selectedColumns } = args;
	const referenceCount = aliasList.length === 0 ? 1 : aliasList.length;
	return {
		step: "rewrite_vtable_selects",
		payload: {
			reference_count: referenceCount,
			aliases: aliasList,
			projection: projectionKind,
			schema_key_predicates: schemaSummary.count,
			schema_key_literals: schemaSummary.literals,
			schema_key_has_dynamic: schemaSummary.hasDynamic,
			selected_columns: selectedColumns
				? selectedColumns.map((entry) => entry.alias ?? entry.column)
				: null,
		},
	};
}

function buildVtableSelectRewrite(options: {
	schemaKeys: readonly string[];
	cacheTables: Map<string, unknown>;
	selectedColumns: SelectedProjection[] | null;
	hasOpenTransaction: boolean;
}): string {
	const schemaFilterList = options.schemaKeys ?? [];
	const { candidateColumns, rankedColumns } = buildProjectionColumnSet(
		options.selectedColumns
	);
	const schemaFilter = buildSchemaFilter(schemaFilterList);
	const cacheSource = buildCacheSource(
		schemaFilterList,
		options.cacheTables,
		candidateColumns
	);
	const needsWriterJoin = candidateColumns.has("writer_key");
	if (needsWriterJoin) {
		candidateColumns.add("inherited_from_version_id");
		rankedColumns.add("inherited_from_version_id");
	}
	const needsChangeJoin = candidateColumns.has("metadata");
	const projectionSql = buildRewriteProjectionSql(options.selectedColumns, {
		needsWriterJoin,
	});
	const rankingOrder = [
		"c.priority",
		"c.created_at DESC",
		"c.file_id",
		"c.schema_key",
		"c.entity_id",
		"c.version_id",
		"c.change_id",
	];
	const segments: string[] = [];
	if (options.hasOpenTransaction !== false) {
		segments.push(buildTransactionSegment(schemaFilter, candidateColumns));
	}
	segments.push(buildUntrackedSegment(schemaFilter, candidateColumns));
	const cacheSegment = buildCacheSegment(
		cacheSource,
		schemaFilter,
		candidateColumns
	);
	if (cacheSegment) {
		segments.push(cacheSegment);
	}
	const inheritedSegments: string[] = [];
	if (cacheSegment) {
		const inheritedCache = buildInheritedCacheSegment(
			cacheSource,
			schemaFilter,
			candidateColumns
		);
		if (inheritedCache) {
			inheritedSegments.push(inheritedCache);
		}
	}
	inheritedSegments.push(
		buildInheritedUntrackedSegment(schemaFilter, candidateColumns)
	);
	if (options.hasOpenTransaction !== false) {
		inheritedSegments.push(
			buildInheritedTransactionSegment(schemaFilter, candidateColumns)
		);
	}
	const allSegments = segments.concat(inheritedSegments);
	const candidates = allSegments.join(`\n\n    UNION ALL\n\n`);

	const writerJoinSql = needsWriterJoin
		? `
LEFT JOIN lix_internal_state_writer ws_dst ON
  ws_dst.file_id = w.file_id AND
  ws_dst.entity_id = w.entity_id AND
  ws_dst.schema_key = w.schema_key AND
  ws_dst.version_id = w.version_id
LEFT JOIN lix_internal_state_writer ws_src ON
  ws_src.file_id = w.file_id AND
  ws_src.entity_id = w.entity_id AND
  ws_src.schema_key = w.schema_key AND
  ws_src.version_id = w.inherited_from_version_id`
		: "";
	const changeJoinSql = needsChangeJoin
		? `
LEFT JOIN lix_internal_change chc ON chc.id = w.change_id`
		: "";
	const transactionJoinSql =
		options.hasOpenTransaction !== false
			? `
LEFT JOIN lix_internal_transaction_state itx ON itx.id = w.change_id`
			: "";
	const rankedSql = buildRankedSegment(rankedColumns, rankingOrder);
	const withClauses: string[] = [];
	if (allSegments.length > 0) {
		withClauses.push(buildVersionDescriptorCte());
		withClauses.push(buildVersionInheritanceCte());
		withClauses.push(buildVersionParentCte());
	}
	withClauses.push(
		stripIndent(`
	candidates AS (
${indent(candidates, 4)}
	)`).trim()
	);
	withClauses.push(
		stripIndent(`
	ranked AS (
${indent(rankedSql, 4)}
	)`).trim()
	);

	const body = `WITH
${withClauses.map((clause) => indent(clause, 2)).join(",\n")}
SELECT
${indent(projectionSql, 2)}
FROM ranked w
${writerJoinSql}
${changeJoinSql}
${transactionJoinSql}
WHERE w.rn = 1`;

	return `(\n${body}\n)\n`;
}

function buildRewriteProjectionSql(
	selectedColumns: SelectedProjection[] | null,
	options: { needsWriterJoin: boolean }
): string {
	const builder = internalQueryBuilder as unknown as {
		selectFrom: (table: string) => {
			selectAll: (table: string) => { compile: () => { sql: string } };
			select: (
				callback: (eb: {
					ref: (reference: string) => {
						as: (alias: string) => unknown;
					};
					fn: any;
				}) => unknown[]
			) => { compile: () => { sql: string } };
		};
	};

	const baseQuery = builder.selectFrom(`${REWRITTEN_STATE_VTABLE} as w`);
	const query =
		selectedColumns === null || selectedColumns.length === 0
			? baseQuery.selectAll("w")
			: baseQuery.select((eb) =>
					selectedColumns.map((entry) => {
						if (options.needsWriterJoin && entry.column === "writer_key") {
							return eb.fn
								.coalesce(
									eb.ref("ws_dst.writer_key"),
									eb.ref("ws_src.writer_key"),
									eb.ref("w.writer_key")
								)
								.as(entry.alias ?? entry.column) as unknown as any;
						}
						return eb.ref(`w.${entry.column}`).as(entry.alias ?? entry.column);
					})
				);

	const { sql } = query.compile();
	const match = sql.match(/^select\s+(?<projection>[\s\S]+?)\s+from\s+/i);
	return match?.groups?.projection?.trim() ?? sql;
}

function buildProjectionColumnSet(
	selectedColumns: SelectedProjection[] | null
): {
	candidateColumns: Set<string>;
	rankedColumns: Set<string>;
} {
	if (selectedColumns === null) {
		return {
			candidateColumns: new Set<string>(ALL_SEGMENT_COLUMNS),
			rankedColumns: new Set<string>(ALL_SEGMENT_COLUMNS),
		};
	}
	const candidateColumns = new Set<string>(BASE_SEGMENT_COLUMNS);
	const rankedColumns = new Set<string>(BASE_SEGMENT_COLUMNS);
	if (selectedColumns && selectedColumns.length > 0) {
		for (const entry of selectedColumns) {
			candidateColumns.add(entry.column);
			rankedColumns.add(entry.column);
		}
	}
	return { candidateColumns, rankedColumns };
}

const NEWLINE = "\n";

const ALL_SEGMENT_COLUMNS = [
	"_pk",
	"entity_id",
	"schema_key",
	"file_id",
	"plugin_key",
	"snapshot_content",
	"schema_version",
	"version_id",
	"created_at",
	"updated_at",
	"inherited_from_version_id",
	"change_id",
	"untracked",
	"commit_id",
	"metadata",
	"writer_key",
	"priority",
] as const;

const BASE_SEGMENT_COLUMNS = new Set<string>([
	"entity_id",
	"schema_key",
	"file_id",
	"version_id",
	"created_at",
	"change_id",
	"priority",
]);

const CACHE_COLUMNS = [
	"entity_id",
	"schema_key",
	"file_id",
	"plugin_key",
	"snapshot_content",
	"schema_version",
	"version_id",
	"created_at",
	"updated_at",
	"inherited_from_version_id",
	"change_id",
	"commit_id",
	"is_tombstone",
] as const;

function buildTransactionSegment(
	schemaFilter: string | null,
	projectionColumns: Set<string>
): string {
	const filterClause = schemaFilter ? `WHERE ${schemaFilter}` : "";
	const columns: Array<[string, string]> = [
		[
			"_pk",
			`'T' || '~' || lix_encode_pk_part(txn.file_id) || '~' || lix_encode_pk_part(txn.entity_id) || '~' || lix_encode_pk_part(txn.version_id) AS _pk`,
		],
		["entity_id", "txn.entity_id AS entity_id"],
		["schema_key", "txn.schema_key AS schema_key"],
		["file_id", "txn.file_id AS file_id"],
		["plugin_key", "txn.plugin_key AS plugin_key"],
		["snapshot_content", "json(txn.snapshot_content) AS snapshot_content"],
		["schema_version", "txn.schema_version AS schema_version"],
		["version_id", "txn.version_id AS version_id"],
		["created_at", "txn.created_at AS created_at"],
		["updated_at", "txn.created_at AS updated_at"],
		["inherited_from_version_id", "NULL AS inherited_from_version_id"],
		["change_id", "txn.id AS change_id"],
		["untracked", "txn.untracked AS untracked"],
		["commit_id", "'pending' AS commit_id"],
		["metadata", "json(txn.metadata) AS metadata"],
		["writer_key", "txn.writer_key AS writer_key"],
		["priority", "1 AS priority"],
	];
	const columnSql = columns
		.filter(([column]) => projectionColumns.has(column))
		.map(([, sql]) => sql)
		.join(",\n");
	return stripIndent(`
		SELECT
${indent(columnSql, 4)}
		FROM lix_internal_transaction_state txn
		${filterClause}
	`).trimEnd();
}

function buildUntrackedSegment(
	schemaFilter: string | null,
	projectionColumns: Set<string>
): string {
	const rewrittenFilter = schemaFilter
		? schemaFilter.replace(/txn\./g, "unt.")
		: null;
	const columns: Array<[string, string]> = [
		[
			"_pk",
			`'U' || '~' || lix_encode_pk_part(unt.file_id) || '~' || lix_encode_pk_part(unt.entity_id) || '~' || lix_encode_pk_part(unt.version_id) AS _pk`,
		],
		["entity_id", "unt.entity_id AS entity_id"],
		["schema_key", "unt.schema_key AS schema_key"],
		["file_id", "unt.file_id AS file_id"],
		["plugin_key", "unt.plugin_key AS plugin_key"],
		["snapshot_content", "json(unt.snapshot_content) AS snapshot_content"],
		["schema_version", "unt.schema_version AS schema_version"],
		["version_id", "unt.version_id AS version_id"],
		["created_at", "unt.created_at AS created_at"],
		["updated_at", "unt.updated_at AS updated_at"],
		["inherited_from_version_id", "NULL AS inherited_from_version_id"],
		["change_id", "'untracked' AS change_id"],
		["untracked", "1 AS untracked"],
		["commit_id", "'untracked' AS commit_id"],
		["metadata", "NULL AS metadata"],
		["writer_key", "NULL AS writer_key"],
		["priority", "2 AS priority"],
	];
	const columnSql = columns
		.filter(([column]) => projectionColumns.has(column))
		.map(([, sql]) => sql)
		.join(",\n");
	return stripIndent(`
		SELECT
${indent(columnSql, 4)}
		FROM lix_internal_state_all_untracked unt
		${rewrittenFilter ? `WHERE ${rewrittenFilter}` : ""}
	`).trimEnd();
}

function buildCacheSegment(
	cacheSource: string | null,
	schemaFilter: string | null,
	projectionColumns: Set<string>
): string | null {
	if (!cacheSource) {
		return null;
	}
	const rewrittenFilter = schemaFilter
		? schemaFilter.replace(/txn\./g, "cache.")
		: null;
	const sourceKeyword = cacheSource.trim().toLowerCase();
	const sourceSql = sourceKeyword.startsWith("select")
		? `(${cacheSource})`
		: cacheSource;
	const columns: Array<[string, string]> = [
		[
			"_pk",
			`'C' || '~' || lix_encode_pk_part(cache.file_id) || '~' || lix_encode_pk_part(cache.entity_id) || '~' || lix_encode_pk_part(cache.version_id) AS _pk`,
		],
		["entity_id", "cache.entity_id AS entity_id"],
		["schema_key", "cache.schema_key AS schema_key"],
		["file_id", "cache.file_id AS file_id"],
		["plugin_key", "cache.plugin_key AS plugin_key"],
		["snapshot_content", "json(cache.snapshot_content) AS snapshot_content"],
		["schema_version", "cache.schema_version AS schema_version"],
		["version_id", "cache.version_id AS version_id"],
		["created_at", "cache.created_at AS created_at"],
		["updated_at", "cache.updated_at AS updated_at"],
		[
			"inherited_from_version_id",
			"cache.inherited_from_version_id AS inherited_from_version_id",
		],
		["change_id", "cache.change_id AS change_id"],
		["untracked", "0 AS untracked"],
		["commit_id", "cache.commit_id AS commit_id"],
		["metadata", "NULL AS metadata"],
		["writer_key", "NULL AS writer_key"],
		["priority", "3 AS priority"],
	];
	const columnSql = columns
		.filter(([column]) => projectionColumns.has(column))
		.map(([, sql]) => sql)
		.join(",\n");
	return stripIndent(`
		SELECT
${indent(columnSql, 4)}
		FROM ${sourceSql} cache
		WHERE cache.is_tombstone = 0${rewrittenFilter ? ` AND ${rewrittenFilter}` : ""}
	`).trimEnd();
}

/**
 * Builds the base CTE extracting version descriptors for inheritance lookups.
 *
 * @returns SQL fragment for the version descriptor base CTE.
 *
 * @example
 * ```ts
 * const sql = buildVersionDescriptorCte();
 * ```
 */
function buildVersionDescriptorCte(): string {
	return stripIndent(`
	version_descriptor_base AS (
	  SELECT
	    json_extract(desc.snapshot_content, '$.id') AS version_id,
	    json_extract(desc.snapshot_content, '$.inherits_from_version_id') AS inherits_from_version_id
	  FROM "lix_internal_state_cache_v1_lix_version_descriptor" desc
	  WHERE desc.is_tombstone = 0
	    AND desc.snapshot_content IS NOT NULL
	)`).trim();
}

/**
 * Builds the recursive CTE that unfolds the full inheritance chain.
 *
 * @returns SQL fragment for the version inheritance CTE.
 *
 * @example
 * ```ts
 * const sql = buildVersionInheritanceCte();
 * ```
 */
function buildVersionInheritanceCte(): string {
	return stripIndent(`
	version_inheritance(version_id, ancestor_version_id) AS (
	  SELECT
	    vdb.version_id,
	    vdb.inherits_from_version_id
	  FROM version_descriptor_base vdb
	  WHERE vdb.inherits_from_version_id IS NOT NULL

	  UNION ALL

	  SELECT
	    vi.version_id,
	    vdb.inherits_from_version_id
	  FROM version_inheritance vi
	  JOIN version_descriptor_base vdb ON vdb.version_id = vi.ancestor_version_id
	  WHERE vdb.inherits_from_version_id IS NOT NULL
	)`).trim();
}

/**
 * Builds the CTE mapping each version to its direct parent version.
 *
 * @returns SQL fragment for the version parent CTE.
 *
 * @example
 * ```ts
 * const sql = buildVersionParentCte();
 * ```
 */
function buildVersionParentCte(): string {
	return stripIndent(`
	version_parent AS (
	  SELECT
	    vdb.version_id,
	    vdb.inherits_from_version_id AS parent_version_id
	  FROM version_descriptor_base vdb
	  WHERE vdb.inherits_from_version_id IS NOT NULL
	)`).trim();
}

/**
 * Builds the inherited cache candidate segment that maps ancestor versions onto
 * the target schema version.
 *
 * @param cacheSource - The SQL producing the cache rows.
 * @param schemaFilter - Optional schema predicate scoped to the cache alias.
 * @param projectionColumns - Columns required for the projection.
 * @returns SQL fragment or null when no cache source exists.
 *
 * @example
 * ```ts
 * const sql = buildInheritedCacheSegment('"cache_table"', "txn.schema_key = 'demo'", new Set());
 * ```
 */
function buildInheritedCacheSegment(
	cacheSource: string | null,
	schemaFilter: string | null,
	projectionColumns: Set<string>
): string | null {
	if (!cacheSource) {
		return null;
	}
	const rewrittenFilter = schemaFilter
		? schemaFilter.replace(/txn\./g, "cache.")
		: null;
	const sourceKeyword = cacheSource.trim().toLowerCase();
	const sourceSql = sourceKeyword.startsWith("select")
		? `(${cacheSource})`
		: cacheSource;
	const columns: Array<[string, string]> = [
		[
			"_pk",
			`'CI' || '~' || lix_encode_pk_part(cache.file_id) || '~' || lix_encode_pk_part(cache.entity_id) || '~' || lix_encode_pk_part(vi.version_id) AS _pk`,
		],
		["entity_id", "cache.entity_id AS entity_id"],
		["schema_key", "cache.schema_key AS schema_key"],
		["file_id", "cache.file_id AS file_id"],
		["plugin_key", "cache.plugin_key AS plugin_key"],
		["snapshot_content", "json(cache.snapshot_content) AS snapshot_content"],
		["schema_version", "cache.schema_version AS schema_version"],
		["version_id", "vi.version_id AS version_id"],
		["created_at", "cache.created_at AS created_at"],
		["updated_at", "cache.updated_at AS updated_at"],
		[
			"inherited_from_version_id",
			"cache.version_id AS inherited_from_version_id",
		],
		["change_id", "cache.change_id AS change_id"],
		["untracked", "0 AS untracked"],
		["commit_id", "cache.commit_id AS commit_id"],
		["metadata", "NULL AS metadata"],
		["writer_key", "NULL AS writer_key"],
		["priority", "4 AS priority"],
	];
	const columnSql = columns
		.filter(([column]) => projectionColumns.has(column))
		.map(([, sql]) => sql)
		.join(",\n");
	return stripIndent(`
		SELECT
${indent(columnSql, 4)}
		FROM version_inheritance vi
		JOIN ${sourceSql} cache ON cache.version_id = vi.ancestor_version_id
		WHERE cache.is_tombstone = 0
		  AND cache.snapshot_content IS NOT NULL${
				rewrittenFilter ? ` AND ${rewrittenFilter}` : ""
			}
	`).trimEnd();
}

/**
 * Builds the inherited segment sourcing data from `lix_internal_state_all_untracked`.
 *
 * @param schemaFilter - Optional schema predicate scoped to the untracked alias.
 * @param projectionColumns - Columns required for the projection.
 * @returns SQL fragment selecting inherited untracked rows.
 *
 * @example
 * ```ts
 * const sql = buildInheritedUntrackedSegment(null, new Set(["entity_id"]));
 * ```
 */
function buildInheritedUntrackedSegment(
	schemaFilter: string | null,
	projectionColumns: Set<string>
): string {
	const rewrittenFilter = schemaFilter
		? schemaFilter.replace(/txn\./g, "unt.")
		: null;
	const columns: Array<[string, string]> = [
		[
			"_pk",
			`'UI' || '~' || lix_encode_pk_part(unt.file_id) || '~' || lix_encode_pk_part(unt.entity_id) || '~' || lix_encode_pk_part(vi.version_id) AS _pk`,
		],
		["entity_id", "unt.entity_id AS entity_id"],
		["schema_key", "unt.schema_key AS schema_key"],
		["file_id", "unt.file_id AS file_id"],
		["plugin_key", "unt.plugin_key AS plugin_key"],
		["snapshot_content", "json(unt.snapshot_content) AS snapshot_content"],
		["schema_version", "unt.schema_version AS schema_version"],
		["version_id", "vi.version_id AS version_id"],
		["created_at", "unt.created_at AS created_at"],
		["updated_at", "unt.updated_at AS updated_at"],
		[
			"inherited_from_version_id",
			"unt.version_id AS inherited_from_version_id",
		],
		["change_id", "'untracked' AS change_id"],
		["untracked", "1 AS untracked"],
		["commit_id", "'untracked' AS commit_id"],
		["metadata", "NULL AS metadata"],
		["writer_key", "NULL AS writer_key"],
		["priority", "5 AS priority"],
	];
	const columnSql = columns
		.filter(([column]) => projectionColumns.has(column))
		.map(([, sql]) => sql)
		.join(",\n");
	return stripIndent(`
		SELECT
${indent(columnSql, 4)}
		FROM version_inheritance vi
		JOIN lix_internal_state_all_untracked unt ON unt.version_id = vi.ancestor_version_id
		WHERE unt.is_tombstone = 0
		  AND unt.snapshot_content IS NOT NULL${
				rewrittenFilter ? ` AND ${rewrittenFilter}` : ""
			}
	`).trimEnd();
}

/**
 * Builds the inherited segment that projects transaction rows onto descendant
 * versions.
 *
 * @param schemaFilter - Optional schema predicate scoped to the transaction alias.
 * @param projectionColumns - Columns required for the projection.
 * @returns SQL fragment selecting inherited transaction rows.
 *
 * @example
 * ```ts
 * const sql = buildInheritedTransactionSegment("txn.schema_key = 'demo'", new Set(["change_id"]));
 * ```
 */
function buildInheritedTransactionSegment(
	schemaFilter: string | null,
	projectionColumns: Set<string>
): string {
	const columns: Array<[string, string]> = [
		[
			"_pk",
			`'TI' || '~' || lix_encode_pk_part(txn.file_id) || '~' || lix_encode_pk_part(txn.entity_id) || '~' || lix_encode_pk_part(vi.version_id) AS _pk`,
		],
		["entity_id", "txn.entity_id AS entity_id"],
		["schema_key", "txn.schema_key AS schema_key"],
		["file_id", "txn.file_id AS file_id"],
		["plugin_key", "txn.plugin_key AS plugin_key"],
		["snapshot_content", "json(txn.snapshot_content) AS snapshot_content"],
		["schema_version", "txn.schema_version AS schema_version"],
		["version_id", "vi.version_id AS version_id"],
		["created_at", "txn.created_at AS created_at"],
		["updated_at", "txn.created_at AS updated_at"],
		[
			"inherited_from_version_id",
			"vi.parent_version_id AS inherited_from_version_id",
		],
		["change_id", "txn.id AS change_id"],
		["untracked", "txn.untracked AS untracked"],
		["commit_id", "'pending' AS commit_id"],
		["metadata", "json(txn.metadata) AS metadata"],
		["writer_key", "txn.writer_key AS writer_key"],
		["priority", "6 AS priority"],
	];
	const columnSql = columns
		.filter(([column]) => projectionColumns.has(column))
		.map(([, sql]) => sql)
		.join(",\n");
	const rewrittenFilter = schemaFilter ?? null;
	return stripIndent(`
		SELECT
${indent(columnSql, 4)}
		FROM version_parent vi
		JOIN lix_internal_transaction_state txn ON txn.version_id = vi.parent_version_id
		WHERE vi.parent_version_id IS NOT NULL
		  AND txn.snapshot_content IS NOT NULL${
				rewrittenFilter ? ` AND ${rewrittenFilter}` : ""
			}
	`).trimEnd();
}

function buildRankedSegment(
	projectionColumns: Set<string>,
	rankingOrder: string[]
): string {
	const columns = ALL_SEGMENT_COLUMNS.filter((column) =>
		projectionColumns.has(column)
	).map((column) => `c.${column} AS ${column}`);
	const orderClause = rankingOrder.join(", ");
	return stripIndent(`
		SELECT
${indent(columns.join(",\n"), 4)}${
		columns.length > 0 ? ",\n" : ""
	}  ROW_NUMBER() OVER (
		    PARTITION BY c.file_id, c.schema_key, c.entity_id, c.version_id
		    ORDER BY ${orderClause}
		  ) AS rn
		FROM candidates c
	`).trimEnd();
}

function buildSchemaFilter(schemaKeys: readonly string[]): string | null {
	if (!schemaKeys || schemaKeys.length === 0) {
		return null;
	}
	const values = schemaKeys.map((key) => `'${key}'`).join(", ");
	return `txn.schema_key IN (${values})`;
}

function buildCacheSource(
	schemaKeys: readonly string[],
	cacheTables: Map<string, unknown>,
	projectionColumns: Set<string>
): string | null {
	const requiredColumns = new Set(projectionColumns);
	// Always keep structural columns that power tombstone filtering and ranking.
	requiredColumns.add("is_tombstone");
	requiredColumns.add("file_id");
	requiredColumns.add("entity_id");
	requiredColumns.add("schema_key");
	requiredColumns.add("version_id");
	requiredColumns.add("change_id");
	requiredColumns.add("created_at");
	const uniqueKeys =
		schemaKeys && schemaKeys.length > 0
			? Array.from(new Set(schemaKeys))
			: Array.from(cacheTables.keys());
	const entries = uniqueKeys
		.map((key) => {
			const candidate = cacheTables.get(key);
			if (typeof candidate === "string" && candidate.length > 0) {
				return {
					tableName: candidate,
					sql: buildPhysicalCacheSelect(candidate, requiredColumns),
				};
			}
			return null;
		})
		.filter(
			(value): value is { tableName: string; sql: string } => value !== null
		);

	if (entries.length === 0) {
		return null;
	}
	if (entries.length === 1) {
		return quoteIdentifier(entries[0]!.tableName);
	}
	return entries.map((entry) => entry.sql).join(`\nUNION ALL\n`);
}

function buildPhysicalCacheSelect(
	tableName: string,
	requiredColumns: Set<string>
): string {
	const projection = CACHE_COLUMNS.filter((column) =>
		requiredColumns.has(column)
	)
		.map((column) => quoteIdentifier(column))
		.join(",\n    ");
	return `SELECT
    ${projection}
  FROM ${quoteIdentifier(tableName)}`;
}

function stripIndent(value: string): string {
	const trimmed = value.replace(/^\n+/, "").replace(/\n+$/, "");
	const lines = trimmed.split(NEWLINE);
	const indents = lines
		.filter((line) => line.trim().length > 0)
		.map((line) => line.match(/^\s*/)?.[0]?.length ?? 0);
	const minIndent = indents.length > 0 ? Math.min(...indents) : 0;
	return lines.map((line) => line.slice(minIndent)).join(NEWLINE);
}

function indent(value: string, spaces: number): string {
	const pad = " ".repeat(spaces);
	return value
		.split(NEWLINE)
		.map((line) => (line.length > 0 ? pad + line : line))
		.join(NEWLINE);
}

function quoteIdentifier(identifier: string): string {
	return `"${identifier.replace(/"/g, '""')}"`;
}
