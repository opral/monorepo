import {
	AliasNode,
	AndNode,
	BinaryOperationNode,
	ColumnNode,
	FromNode,
	IdentifierNode,
	ParensNode,
	OperationNodeTransformer,
	OrNode,
	RawNode,
	ReferenceNode,
	SelectAllNode,
	SelectQueryNode,
	SelectionNode,
	SetOperationNode,
	TableNode,
	ValueNode,
} from "kysely";
import type {
	OperationNode,
	QueryId,
	RootOperationNode,
	SchemableIdentifierNode,
} from "kysely";
import type { PreprocessorStep, PreprocessorTraceEntry } from "../types.js";
import { internalQueryBuilder } from "../../internal-query-builder.js";

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
	hasOpenTransaction = true,
}) => {
	const renameTransformer = new RewriteInternalStateVtableTransformer();
	const renamed = renameTransformer.transformNode(node) as RootOperationNode;
	if (!renameTransformer.touched) {
		return renamed;
	}

	let traceEntry: PreprocessorTraceEntry | null = null;
	if (SelectQueryNode.is(renamed)) {
		const aliases = collectTableAliases(renamed);
		const tableSet = new Set([REWRITTEN_STATE_VTABLE, ...aliases]);
		const schemaSummary = collectSchemaKeyPredicates(
			renamed.where?.where,
			tableSet
		);
		if (schemaSummary.hasDynamic) {
			throw new Error(
				"rewrite_vtable_selects requires literal schema_key predicates; received ambiguous filter."
			);
		}
		const selectedColumns: SelectedProjection[] | null = collectSelectedColumns(
			renamed,
			tableSet
		);
		traceEntry = buildTraceEntry(
			renamed,
			schemaSummary,
			selectedColumns,
			aliases
		);
	}

	const inlineTransformer = new InlineInternalStateVtableTransformer(
		cacheTables,
		hasOpenTransaction
	);
	const inlined = inlineTransformer.transformNode(renamed) as RootOperationNode;
	if (traceEntry && trace) {
		trace.push(traceEntry);
	}
	return inlined;
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

class InlineInternalStateVtableTransformer extends OperationNodeTransformer {
	constructor(
		private readonly cacheTables: Map<string, unknown>,
		private readonly hasOpenTransaction: boolean
	) {
		super();
	}

	override transformSelectQuery(
		node: SelectQueryNode,
		queryId?: QueryId
	): SelectQueryNode {
		const transformed = super.transformSelectQuery(
			node,
			queryId
		) as SelectQueryNode;
		const references = collectRewrittenTableReferences(transformed);
		if (references.length === 0) {
			return transformed;
		}

		const metadata = buildInlineMetadata(transformed, references);
		return applyInlineRewrites(
			transformed,
			metadata,
			this.cacheTables,
			this.hasOpenTransaction
		);
	}
}

type TableReference = {
	alias: string | null;
};

type InlineRewriteMetadata = {
	schemaKeys: readonly string[];
	selectedColumns: SelectedProjection[] | null;
};

function collectRewrittenTableReferences(
	select: SelectQueryNode
): TableReference[] {
	const references: TableReference[] = [];
	if (select.from?.froms) {
		for (const from of select.from.froms) {
			collectRewrittenTableReferenceFromOperation(from, references, null);
		}
	}
	if (select.joins) {
		for (const join of select.joins) {
			collectRewrittenTableReferenceFromOperation(join.table, references, null);
		}
	}
	return references;
}

function collectRewrittenTableReferenceFromOperation(
	node: OperationNode,
	references: TableReference[],
	aliasOverride: string | null
): void {
	if (AliasNode.is(node)) {
		const aliasName = extractIdentifier(node.alias);
		collectRewrittenTableReferenceFromOperation(
			node.node as OperationNode,
			references,
			aliasName ?? null
		);
		return;
	}
	if (ParensNode.is(node)) {
		collectRewrittenTableReferenceFromOperation(
			node.node,
			references,
			aliasOverride
		);
		return;
	}
	if (TableNode.is(node) && isRewrittenTable(node)) {
		references.push({ alias: aliasOverride });
		return;
	}
	if (SelectQueryNode.is(node)) {
		return;
	}
	if (SetOperationNode.is(node)) {
		return;
	}
}

function buildInlineMetadata(
	select: SelectQueryNode,
	references: readonly TableReference[]
): Map<string, InlineRewriteMetadata> {
	const metadata = new Map<string, InlineRewriteMetadata>();
	for (const reference of references) {
		const key = reference.alias ?? REWRITTEN_STATE_VTABLE;
		if (metadata.has(key)) {
			continue;
		}
		const tableNames = new Set<string>([
			reference.alias ?? REWRITTEN_STATE_VTABLE,
		]);
		const summary = collectSchemaKeyPredicates(select.where?.where, tableNames);
		if (summary.hasDynamic) {
			throw new Error(
				"rewrite_vtable_selects requires literal schema_key predicates; received ambiguous filter."
			);
		}
		const selectedColumns = collectSelectedColumns(select, tableNames);
		metadata.set(key, {
			schemaKeys: summary.literals,
			selectedColumns,
		});
	}
	return metadata;
}

function applyInlineRewrites(
	select: SelectQueryNode,
	metadata: Map<string, InlineRewriteMetadata>,
	cacheTables: Map<string, unknown>,
	hasOpenTransaction: boolean
): SelectQueryNode {
	const froms = select.from?.froms
		? select.from.froms.map((from) =>
				inlineTableReference(
					from,
					metadata,
					cacheTables,
					null,
					hasOpenTransaction
				)
			)
		: undefined;
	const joins = select.joins
		? select.joins.map((join) =>
				Object.freeze({
					...join,
					table: inlineTableReference(
						join.table,
						metadata,
						cacheTables,
						null,
						hasOpenTransaction
					),
				})
			)
		: undefined;

	return {
		...select,
		from: froms ? FromNode.create(froms) : select.from,
		joins: joins ? Object.freeze(joins) : undefined,
	};
}

function inlineTableReference(
	node: OperationNode,
	metadata: Map<string, InlineRewriteMetadata>,
	cacheTables: Map<string, unknown>,
	aliasName: string | null,
	hasOpenTransaction: boolean
): OperationNode {
	if (AliasNode.is(node)) {
		const identifier = extractIdentifier(node.alias);
		const inner = inlineTableReference(
			node.node as OperationNode,
			metadata,
			cacheTables,
			identifier ?? null,
			hasOpenTransaction
		);
		if (inner === node.node) {
			return node;
		}
		return AliasNode.create(inner, node.alias);
	}
	if (ParensNode.is(node)) {
		const inner = inlineTableReference(
			node.node,
			metadata,
			cacheTables,
			aliasName,
			hasOpenTransaction
		);
		if (inner === node.node) {
			return node;
		}
		return ParensNode.create(inner);
	}
	if (TableNode.is(node) && isRewrittenTable(node)) {
		const key = aliasName ?? REWRITTEN_STATE_VTABLE;
		const info = metadata.get(key);
		if (!info) {
			return node;
		}
		const rewriteSql = buildInternalStateRewriteSql({
			schemaKeys: info.schemaKeys,
			cacheTables,
			selectedColumns: info.selectedColumns,
			hasOpenTransaction,
		});
		const subquery = ParensNode.create(RawNode.createWithSql(rewriteSql));
		if (aliasName) {
			return subquery;
		}
		return AliasNode.create(
			subquery,
			IdentifierNode.create(REWRITTEN_STATE_VTABLE)
		);
	}
	return node;
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

function buildTraceEntry(
	select: SelectQueryNode,
	schemaSummary: SchemaKeyPredicateSummary,
	selectedColumns: SelectedProjection[] | null,
	aliases: string[]
): PreprocessorTraceEntry {
	const projection = determineProjectionKind(select.selections ?? []);

	return {
		step: "rewrite_vtable_selects",
		payload: {
			reference_count: aliases.length === 0 ? 1 : aliases.length,
			aliases,
			projection,
			schema_key_predicates: schemaSummary.count,
			schema_key_literals: schemaSummary.literals,
			schema_key_has_dynamic: schemaSummary.hasDynamic,
			selected_columns: selectedColumns
				? selectedColumns.map((entry) => entry.alias ?? entry.column)
				: null,
		},
	};
}

function collectTableAliases(select: SelectQueryNode): string[] {
	const aliasSet = new Set<string>();
	collectTableAliasesInto(select, aliasSet);
	return Array.from(aliasSet);
}

function collectTableAliasesInto(
	select: SelectQueryNode,
	aliasSet: Set<string>
): void {
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
	if (select.setOperations) {
		for (const operation of select.setOperations) {
			collectAliasFromOperation(operation.expression, aliasSet);
		}
	}
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
		collectAliasFromOperation(node.node as OperationNode, aliases);
		return;
	}
	if (SelectQueryNode.is(node)) {
		collectTableAliasesInto(node, aliases);
		return;
	}
	if (SetOperationNode.is(node)) {
		collectAliasFromOperation(node.expression, aliases);
		return;
	}
	if (TableNode.is(node) && isRewrittenTable(node)) {
		return;
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
	if (ParensNode.is(node)) {
		return collectSchemaKeyPredicates(node.node, tableNames);
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

type SelectedProjection = {
	column: string;
	alias?: string;
};

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

function collectSelectedColumns(
	select: SelectQueryNode,
	tableNames: Set<string>
): SelectedProjection[] | null {
	const collector = new VtableProjectionCollector(tableNames);
	const aliases = collectSelectionAliases(select, tableNames);
	collector.transformNode(select);
	if (collector.selectAll) {
		return null;
	}
	return Array.from(collector.columns, (column) => ({
		column,
		alias: aliases.get(column) ?? undefined,
	}));
}

function collectSelectionAliases(
	select: SelectQueryNode,
	tableNames: Set<string>
): Map<string, string> {
	const aliasMap = new Map<string, string>();
	if (!select.selections) {
		return aliasMap;
	}
	for (const selection of select.selections) {
		const selectionNode = selection.selection;
		if (!AliasNode.is(selectionNode)) {
			continue;
		}
		const aliasIdentifier = selectionNode.alias;
		if (!IdentifierNode.is(aliasIdentifier)) {
			continue;
		}
		const node = selectionNode.node;
		if (!ReferenceNode.is(node)) {
			continue;
		}
		const tableIdentifier = extractTableIdentifier(node.table);
		if (!tableIdentifier || !tableNames.has(tableIdentifier)) {
			continue;
		}
		if (!ColumnNode.is(node.column) || !IdentifierNode.is(node.column.column)) {
			continue;
		}
		aliasMap.set(node.column.column.name, aliasIdentifier.name);
	}
	return aliasMap;
}

class VtableProjectionCollector extends OperationNodeTransformer {
	public readonly columns = new Set<string>();
	public selectAll = false;

	constructor(private readonly tableNames: Set<string>) {
		super();
	}

	override transformReference(
		node: ReferenceNode,
		queryId?: QueryId
	): ReferenceNode {
		const tableIdentifier = extractTableIdentifier(node.table);
		if (tableIdentifier && this.tableNames.has(tableIdentifier)) {
			if (SelectAllNode.is(node.column)) {
				this.selectAll = true;
			} else if (
				ColumnNode.is(node.column) &&
				IdentifierNode.is(node.column.column)
			) {
				this.columns.add(node.column.column.name);
			}
		}
		return super.transformReference(node, queryId);
	}
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
	selectedColumns: SelectedProjection[] | null;
	hasOpenTransaction: boolean;
}): string {
	const schemaFilterList = options.schemaKeys ?? [];
	const schemaFilter = buildSchemaFilter(schemaFilterList);
	const cacheSource = buildCacheSource(schemaFilterList, options.cacheTables);
	const { candidateColumns, rankedColumns } = buildProjectionColumnSet(
		options.selectedColumns
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
	const candidates = segments.join(`\n\n    UNION ALL\n\n`);

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

	const body = `WITH
  candidates AS (
${indent(candidates, 4)}
  ),
  ranked AS (
${indent(buildRankedSegment(rankedColumns, rankingOrder), 4)}
  )
SELECT
${indent(projectionSql, 2)}
FROM ranked w
${writerJoinSql}
${changeJoinSql}
${transactionJoinSql}
WHERE w.rn = 1`;

	return `(\n${body}\n)\n`;
}

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
		WHERE unt.is_tombstone = 0${rewrittenFilter ? ` AND ${rewrittenFilter}` : ""}
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
	cacheTables: Map<string, unknown>
): string | null {
	const uniqueKeys =
		schemaKeys && schemaKeys.length > 0
			? Array.from(new Set(schemaKeys))
			: Array.from(cacheTables.keys());
	const selects = uniqueKeys
		.map((key) => {
			const candidate = cacheTables.get(key);
			if (typeof candidate === "string" && candidate.length > 0) {
				return buildPhysicalCacheSelect(candidate);
			}
			return null;
		})
		.filter((value): value is string => value !== null);

	if (selects.length === 0) {
		return null;
	}
	if (selects.length === 1) {
		return selects[0]!;
	}
	return selects.join(`\nUNION ALL\n`);
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
