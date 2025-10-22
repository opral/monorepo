import {
	AliasNode,
	AndNode,
	BinaryOperationNode,
	ColumnNode,
	CommonTableExpressionNameNode,
	CommonTableExpressionNode,
	IdentifierNode,
	OperationNodeTransformer,
	OrNode,
	RawNode,
	ReferenceNode,
	SelectAllNode,
	SelectQueryNode,
	SelectionNode,
	TableNode,
	ValueNode,
	WithNode,
} from "kysely";
import type {
	OperationNode,
	QueryId,
	RootOperationNode,
	SchemableIdentifierNode,
} from "kysely";
import { extractCteName } from "../utils.js";
import type { PreprocessorStep, PreprocessorTraceEntry } from "../types.js";

export const INTERNAL_STATE_VTABLE = "lix_internal_state_vtable";
export const REWRITTEN_STATE_VTABLE = "lix_internal_state_vtable_rewritten";

/**
 * Prototype transform that will eventually rewrite queries targeting the
 * internal vtable into equivalent native SQLite statements.
 *
 * The initial implementation renames the underlying table reference and hoists
 * a placeholder CTE so the pipeline can be exercised while the full rewrite is
 * ported.
 *
 * @example
 * ```ts
 * const transformed = rewriteVtableSelects({
 *   node,
 *   storedSchemas,
 *   cacheTables,
 * });
 * ```
 */
export const rewriteVtableSelects: PreprocessorStep = ({
	node,
	trace,
	cacheTables,
}) => {
	const transformer = new RewriteInternalStateVtableTransformer();
	const rewritten = transformer.transformNode(node) as RootOperationNode;
	if (!transformer.touched) {
		return rewritten;
	}
	if (!SelectQueryNode.is(rewritten)) {
		return rewritten;
	}
	const schemaSummary = collectSchemaKeyPredicates(
		rewritten.where?.where,
		new Set([REWRITTEN_STATE_VTABLE, ...collectTableAliases(rewritten)])
	);
	const ensured = ensureRewriteCte(rewritten, {
		schemaKeys: schemaSummary.hasDynamic ? [] : schemaSummary.literals,
		cacheTables,
	});
	trace?.push(buildTraceEntry(ensured, schemaSummary));
	return ensured;
};

class RewriteInternalStateVtableTransformer extends OperationNodeTransformer {
	public touched = false;

	override transformTable(node: TableNode, queryId?: QueryId): TableNode {
		const transformed = super.transformTable(node, queryId);
		if (isInternalStateTable(transformed)) {
			this.touched = true;
			return {
				...transformed,
				table: rewriteIdentifier(transformed.table),
			};
		}
		return transformed;
	}
}

function isInternalStateTable(node: TableNode): boolean {
	const table = node.table;
	return (
		table.kind === "SchemableIdentifierNode" &&
		table.schema === undefined &&
		table.identifier.kind === "IdentifierNode" &&
		table.identifier.name === INTERNAL_STATE_VTABLE
	);
}

function rewriteIdentifier(
	node: SchemableIdentifierNode
): SchemableIdentifierNode {
	return {
		...node,
		identifier: IdentifierNode.create(REWRITTEN_STATE_VTABLE),
	};
}

function ensureRewriteCte(
	select: SelectQueryNode,
	options: {
		schemaKeys: readonly string[];
		cacheTables: Map<string, unknown>;
	}
): SelectQueryNode {
	const expressions = select.with?.expressions ?? [];
	const alreadyPresent = expressions.some(
		(cte) => extractCteName(cte) === REWRITTEN_STATE_VTABLE
	);
	if (alreadyPresent) {
		return select;
	}

	const name = CommonTableExpressionNameNode.create(REWRITTEN_STATE_VTABLE);
	const rewriteSql = buildInternalStateRewriteSql({
		schemaKeys: options.schemaKeys,
		cacheTables: options.cacheTables,
	});
	const rewriteCte = CommonTableExpressionNode.create(
		name,
		RawNode.createWithSql(rewriteSql)
	);
	const withNode = select.with
		? WithNode.cloneWithExpression(select.with, rewriteCte)
		: WithNode.create(rewriteCte);

	return {
		...select,
		with: withNode,
	};
}

function buildTraceEntry(
	select: SelectQueryNode,
	schemaSummary: SchemaKeyPredicateSummary
): PreprocessorTraceEntry {
	const aliases = collectTableAliases(select);
	const projection = determineProjectionKind(select.selections ?? []);

	return {
		step: "rewriteVtableSelects",
		payload: {
			reference_count: aliases.length === 0 ? 1 : aliases.length,
			aliases,
			projection,
			schema_key_predicates: schemaSummary.count,
			schema_key_literals: schemaSummary.literals,
			schema_key_has_dynamic: schemaSummary.hasDynamic,
		},
	};
}

function collectTableAliases(select: SelectQueryNode): string[] {
	const aliasSet = new Set<string>();
	if (select.from?.froms) {
		for (const from of select.from.froms) {
			collectAliasFromOperation(from, aliasSet);
		}
	}
	if (select.joins) {
		for (const join of select.joins) {
			collectAliasFromOperation(join.table, aliasSet);
		}
	}
	return Array.from(aliasSet);
}

function collectAliasFromOperation(
	node: OperationNode,
	aliases: Set<string>
): void {
	if (AliasNode.is(node)) {
		const aliasName = extractIdentifier(node.alias);
		if (aliasName && TableNode.is(node.node) && isRewrittenTable(node.node)) {
			aliases.add(aliasName);
		}
		return;
	}
	if (TableNode.is(node) && isRewrittenTable(node)) {
		aliases.add(REWRITTEN_STATE_VTABLE);
	}
}

function isRewrittenTable(node: TableNode): boolean {
	const identifier = node.table.identifier;
	return (
		identifier.kind === "IdentifierNode" &&
		identifier.name === REWRITTEN_STATE_VTABLE
	);
}

type SchemaKeyPredicateSummary = {
	count: number;
	literals: string[];
	hasDynamic: boolean;
};

function collectSchemaKeyPredicates(
	node: OperationNode | undefined,
	tableNames: Set<string>
): SchemaKeyPredicateSummary {
	const base: SchemaKeyPredicateSummary = {
		count: 0,
		literals: [],
		hasDynamic: false,
	};
	if (!node) {
		return base;
	}
	if (BinaryOperationNode.is(node)) {
		return mergeSummaries(
			evaluateBinaryPredicate(node, tableNames),
			collectSchemaKeyPredicates(node.leftOperand, tableNames),
			collectSchemaKeyPredicates(node.rightOperand, tableNames)
		);
	}
	if (AndNode.is(node) || OrNode.is(node)) {
		return mergeSummaries(
			collectSchemaKeyPredicates(node.left, tableNames),
			collectSchemaKeyPredicates(node.right, tableNames)
		);
	}
	return base;
}

function evaluateBinaryPredicate(
	node: BinaryOperationNode,
	tableNames: Set<string>
): SchemaKeyPredicateSummary {
	const summary: SchemaKeyPredicateSummary = {
		count: 0,
		literals: [],
		hasDynamic: false,
	};
	const leftRef =
		ReferenceNode.is(node.leftOperand) &&
		isSchemaKeyReference(node.leftOperand, tableNames);
	const rightRef =
		ReferenceNode.is(node.rightOperand) &&
		isSchemaKeyReference(node.rightOperand, tableNames);

	if (leftRef) {
		summary.count += 1;
		summaryHasValue(summary, node.rightOperand);
	}
	if (rightRef) {
		summary.count += 1;
		summaryHasValue(summary, node.leftOperand);
	}
	return summary;
}

function summaryHasValue(
	summary: SchemaKeyPredicateSummary,
	operand: OperationNode
): void {
	if (ValueNode.is(operand)) {
		if (typeof operand.value === "string") {
			summary.literals.push(operand.value);
		} else {
			summary.hasDynamic = true;
		}
		return;
	}
	if (RawNode.is(operand) || AliasNode.is(operand)) {
		summary.hasDynamic = true;
		return;
	}
	if (ReferenceNode.is(operand) || ColumnNode.is(operand)) {
		summary.hasDynamic = true;
	}
}

function mergeSummaries(
	...summaries: SchemaKeyPredicateSummary[]
): SchemaKeyPredicateSummary {
	return summaries.reduce<SchemaKeyPredicateSummary>(
		(acc, current) => {
			acc.count += current.count;
			acc.literals.push(...current.literals);
			acc.hasDynamic = acc.hasDynamic || current.hasDynamic;
			return acc;
		},
		{ count: 0, literals: [], hasDynamic: false }
	);
}

function isSchemaKeyReference(
	reference: ReferenceNode,
	tableNames: Set<string>
): boolean {
	const tableIdentifier = extractTableIdentifier(reference.table);
	if (!tableIdentifier || !tableNames.has(tableIdentifier)) {
		return false;
	}
	if (!isSchemaKeyColumn(reference.column)) {
		return false;
	}
	return true;
}

function extractTableIdentifier(table: TableNode | undefined): string | null {
	if (!table) {
		return null;
	}
	const identifier = table.table.identifier;
	return identifier.kind === "IdentifierNode" ? identifier.name : null;
}

function isSchemaKeyColumn(column: OperationNode): boolean {
	if (!ColumnNode.is(column)) {
		return false;
	}
	return (
		column.column.kind === "IdentifierNode" &&
		column.column.name === "schema_key"
	);
}

function determineProjectionKind(
	selections: readonly SelectionNode[]
): "selectAll" | "partial" {
	for (const selection of selections) {
		const node = selection.selection;
		if (ReferenceNode.is(node) && SelectAllNode.is(node.column)) {
			return "selectAll";
		}
	}
	return "partial";
}

function extractIdentifier(node: OperationNode): string | null {
	return IdentifierNode.is(node) ? node.name : null;
}

const BASE_COLUMNS = `
    w._pk AS _pk,
    w.entity_id AS entity_id,
    w.schema_key AS schema_key,
    w.file_id AS file_id,
    w.plugin_key AS plugin_key,
    w.snapshot_content AS snapshot_content,
    w.schema_version AS schema_version,
    w.version_id AS version_id,
    w.created_at AS created_at,
    w.updated_at AS updated_at,
    w.inherited_from_version_id AS inherited_from_version_id,
    w.change_id AS change_id,
    w.untracked AS untracked,
    w.commit_id AS commit_id,
    w.metadata AS metadata,
    w.writer_key AS writer_key
`;

const NEWLINE = "\n";

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

function buildInternalStateRewriteSql(options: {
	schemaKeys: readonly string[];
	cacheTables: Map<string, unknown>;
}): string {
	const schemaFilterList = options.schemaKeys ?? [];
	const schemaFilter = buildSchemaFilter(schemaFilterList);
	const cacheSource = buildCacheSource(schemaFilterList, options.cacheTables);

	const segments: string[] = [
		buildTransactionSegment(schemaFilter),
		buildUntrackedSegment(schemaFilter),
	];
	const cacheSegment = buildCacheSegment(cacheSource, schemaFilter);
	if (cacheSegment) {
		segments.push(cacheSegment);
	}
	const candidates = segments.join(`\n\n    UNION ALL\n\n`);

	const body = `WITH
  candidates AS (
${indent(candidates, 4)}
  ),
  ranked AS (
${indent(buildRankedSegment(), 4)}
  )
SELECT
${indent(BASE_COLUMNS, 2)}
FROM ranked w
LEFT JOIN lix_internal_state_writer ws_dst ON
  ws_dst.file_id = w.file_id AND
  ws_dst.entity_id = w.entity_id AND
  ws_dst.schema_key = w.schema_key AND
  ws_dst.version_id = w.version_id
LEFT JOIN lix_internal_state_writer ws_src ON
  ws_src.file_id = w.file_id AND
  ws_src.entity_id = w.entity_id AND
  ws_src.schema_key = w.schema_key AND
  ws_src.version_id = w.inherited_from_version_id
LEFT JOIN lix_internal_change chc ON chc.id = w.change_id
LEFT JOIN lix_internal_transaction_state itx ON itx.id = w.change_id
WHERE w.rn = 1`;

	return `(-- hoisted_lix_internal_state_vtable_rewrite\n${body}\n)\n`;
}

function buildTransactionSegment(schemaFilter: string | null): string {
	const filterClause = schemaFilter ? `WHERE ${schemaFilter}` : "";
	return stripIndent(`
		SELECT
		  'T' || '~' || lix_encode_pk_part(txn.file_id) || '~' || lix_encode_pk_part(txn.entity_id) || '~' || lix_encode_pk_part(txn.version_id) AS _pk,
		  txn.entity_id AS entity_id,
		  txn.schema_key AS schema_key,
		  txn.file_id AS file_id,
		  txn.plugin_key AS plugin_key,
		  json(txn.snapshot_content) AS snapshot_content,
		  txn.schema_version AS schema_version,
		  txn.version_id AS version_id,
		  txn.created_at AS created_at,
		  txn.created_at AS updated_at,
		  NULL AS inherited_from_version_id,
		  txn.id AS change_id,
		  txn.untracked AS untracked,
		  'pending' AS commit_id,
		  json(txn.metadata) AS metadata,
		  txn.writer_key AS writer_key,
		  1 AS priority
		FROM lix_internal_transaction_state txn
		${filterClause}
	`).trimEnd();
}

function buildUntrackedSegment(schemaFilter: string | null): string {
	const rewrittenFilter = schemaFilter
		? schemaFilter.replace(/txn\./g, "unt.")
		: null;
	return stripIndent(`
		SELECT
		  'U' || '~' || lix_encode_pk_part(unt.file_id) || '~' || lix_encode_pk_part(unt.entity_id) || '~' || lix_encode_pk_part(unt.version_id) AS _pk,
		  unt.entity_id AS entity_id,
		  unt.schema_key AS schema_key,
		  unt.file_id AS file_id,
		  unt.plugin_key AS plugin_key,
		  json(unt.snapshot_content) AS snapshot_content,
		  unt.schema_version AS schema_version,
		  unt.version_id AS version_id,
		  unt.created_at AS created_at,
		  unt.updated_at AS updated_at,
		  NULL AS inherited_from_version_id,
		  'untracked' AS change_id,
		  1 AS untracked,
		  'untracked' AS commit_id,
		  NULL AS metadata,
		  NULL AS writer_key,
		  2 AS priority
		FROM lix_internal_state_all_untracked unt
		WHERE unt.is_tombstone = 0${rewrittenFilter ? ` AND ${rewrittenFilter}` : ""}
	`).trimEnd();
}

function buildCacheSegment(
	cacheSource: string | null,
	schemaFilter: string | null
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
	return stripIndent(`
		SELECT
		  'C' || '~' || lix_encode_pk_part(cache.file_id) || '~' || lix_encode_pk_part(cache.entity_id) || '~' || lix_encode_pk_part(cache.version_id) AS _pk,
		  cache.entity_id AS entity_id,
		  cache.schema_key AS schema_key,
		  cache.file_id AS file_id,
		  cache.plugin_key AS plugin_key,
		  json(cache.snapshot_content) AS snapshot_content,
		  cache.schema_version AS schema_version,
		  cache.version_id AS version_id,
		  cache.created_at AS created_at,
		  cache.updated_at AS updated_at,
		  cache.inherited_from_version_id AS inherited_from_version_id,
		  cache.change_id AS change_id,
		  0 AS untracked,
		  cache.commit_id AS commit_id,
		  NULL AS metadata,
		  NULL AS writer_key,
		  3 AS priority
		FROM ${sourceSql} cache
		WHERE cache.is_tombstone = 0${rewrittenFilter ? ` AND ${rewrittenFilter}` : ""}
	`).trimEnd();
}

function buildRankedSegment(): string {
	return stripIndent(`
		SELECT
		  c._pk AS _pk,
		  c.entity_id AS entity_id,
		  c.schema_key AS schema_key,
		  c.file_id AS file_id,
		  c.plugin_key AS plugin_key,
		  c.snapshot_content AS snapshot_content,
		  c.schema_version AS schema_version,
		  c.version_id AS version_id,
		  c.created_at AS created_at,
		  c.updated_at AS updated_at,
		  c.inherited_from_version_id AS inherited_from_version_id,
		  c.change_id AS change_id,
		  c.untracked AS untracked,
		  c.commit_id AS commit_id,
		  c.metadata AS metadata,
		  c.writer_key AS writer_key,
		  ROW_NUMBER() OVER (
		    PARTITION BY c.file_id, c.schema_key, c.entity_id, c.version_id
		    ORDER BY c.priority, c.created_at DESC, c._pk
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
	cacheTables: Map<string, unknown>
): string | null {
	if (schemaKeys && schemaKeys.length === 1) {
		const candidate = cacheTables.get(schemaKeys[0]!);
		if (typeof candidate === "string" && candidate.length > 0) {
			return buildPhysicalCacheSelect(candidate);
		}
	}
	return null;
}

function buildPhysicalCacheSelect(tableName: string): string {
	const projection = CACHE_COLUMNS.map((column) =>
		quoteIdentifier(column)
	).join(",\n    ");
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
