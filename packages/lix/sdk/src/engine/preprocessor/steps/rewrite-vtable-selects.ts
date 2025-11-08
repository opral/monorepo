import {
	type BetweenExpressionNode,
	type BinaryExpressionNode,
	type CompoundSelectNode,
	type ExpressionNode,
	type IdentifierNode,
	type InListExpressionNode,
	type ParameterExpressionNode,
	type RawFragmentNode,
	type SegmentedStatementNode,
	type SelectItemNode,
	type SelectStatementNode,
	type TableReferenceNode,
	type RelationNode,
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
import { normalizeSegmentedStatement } from "../sql-parser/parse.js";
import {
	cacheTableNameToSchemaKey,
	schemaKeyToCacheTableName,
} from "../../../state/cache/create-schema-cache-table.js";
import type {
	VersionInheritanceMap,
	VersionInheritanceNode,
} from "../inheritance/version-inheritance-cache.js";

export const INTERNAL_STATE_VTABLE = "lix_internal_state_vtable";
const DEFAULT_ALIAS_KEY = normalizeIdentifierValue(INTERNAL_STATE_VTABLE);
const ORIGINAL_TABLE_KEY = DEFAULT_ALIAS_KEY;
const HIDDEN_SEGMENT_COLUMNS = ["_pk"] as const;
const HIDDEN_SEGMENT_COLUMN_SET = new Set<string>(HIDDEN_SEGMENT_COLUMNS);

type SelectedProjection = {
	column: string;
	alias: string | null;
};

type ColumnSelectionSummary = {
	selectedColumns: SelectedProjection[] | null;
	requestedHiddenColumns: ReadonlySet<string>;
	supportColumns: ReadonlySet<string>;
};

type ColumnPredicateSummary = {
	count: number;
	literals: string[];
};

type PredicateVisitContext = {
	tableNames: Set<string>;
	parameters: ReadonlyArray<unknown>;
	allowUnqualified: boolean;
};

type TableReferenceInfo = {
	relation: TableReferenceNode;
	alias: string | null;
	normalizedAlias: string | null;
};

type InlineRewriteMetadata = {
	schemaKeys: readonly string[];
	fileIds: readonly string[];
	versionIds: readonly string[];
	selectedColumns: SelectedProjection[] | null;
	hiddenColumns: ReadonlySet<string>;
	supportColumns: ReadonlySet<string>;
	pruneInheritance: boolean;
};

type SubqueryPredicateMetadata = {
	schemaKeys: readonly string[];
	fileIds: readonly string[];
	versionIds: readonly string[];
	pruneInheritance: boolean;
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
	let anyChanges = false;
	const rewrittenStatements = context.statements.map((statement) => {
		const rewritten = rewriteSegmentedStatement(statement, context);
		if (rewritten !== statement) {
			anyChanges = true;
		}
		return rewritten;
	});

	return anyChanges ? rewrittenStatements : context.statements;
};

function rewriteSegmentedStatement(
	statement: SegmentedStatementNode,
	context: PreprocessorStepContext
): SegmentedStatementNode {
	let changed = false;
	const segments = statement.segments.map((segment) => {
		if (segment.node_kind === "select_statement") {
			const rewritten = rewriteSelectStatement(segment, context);
			if (rewritten !== segment) {
				changed = true;
			}
			return rewritten;
		}
		if (segment.node_kind === "compound_select") {
			const rewritten = rewriteCompoundSelect(segment, context);
			if (rewritten !== segment) {
				changed = true;
			}
			return rewritten;
		}
		return segment;
	});

	if (!changed) {
		return statement;
	}

	return normalizeSegmentedStatement({
		...statement,
		segments,
	});
}

function rewriteSelectStatement(
	select: SelectStatementNode,
	context: PreprocessorStepContext,
	pushdownSchemaKeys: readonly string[] = [],
	pushdownPruneInheritance = false,
	pushdownFileIds: readonly string[] = [],
	pushdownVersionIds: readonly string[] = []
): SelectStatementNode {
	const parameters = context.parameters ?? [];
	const subqueryPredicateMap = collectSubqueryPredicateMap(
		select,
		parameters,
		pushdownSchemaKeys,
		pushdownPruneInheritance,
		pushdownFileIds,
		pushdownVersionIds
	);
	const withRewrittenSubqueries = visitSelectStatement(select, {
		subquery(node, visitContext) {
			const parentKind = visitContext.parent?.node_kind;
			const aliasValue = getIdentifierValue(node.alias);
			const normalizedAlias = aliasValue
				? normalizeIdentifierValue(aliasValue)
				: DEFAULT_ALIAS_KEY;
			const predicateMetadata =
				parentKind === "from_clause" || parentKind === "join_clause"
					? subqueryPredicateMap.get(normalizedAlias)
					: undefined;
			const nextSchemaKeys =
				predicateMetadata?.schemaKeys ?? pushdownSchemaKeys;
			const nextPrune =
				predicateMetadata?.pruneInheritance ?? pushdownPruneInheritance;
			const nextFileIds = predicateMetadata?.fileIds ?? pushdownFileIds;
			const nextVersionIds =
				predicateMetadata?.versionIds ?? pushdownVersionIds;
			const rewrittenStatement =
				node.statement.node_kind === "compound_select"
					? rewriteCompoundSelect(
							node.statement,
							context,
							nextSchemaKeys,
							nextPrune,
							nextFileIds,
							nextVersionIds
						)
					: rewriteSelectStatement(
							node.statement,
							context,
							nextSchemaKeys,
							nextPrune,
							nextFileIds,
							nextVersionIds
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
		tableNamesForTrace,
		parameters
	);
	const mergedSchemaKeys = mergeStringLiterals(
		pushdownSchemaKeys,
		schemaSummary.literals
	);
	const schemaSummaryForTrace: ColumnPredicateSummary = {
		count: schemaSummary.count,
		literals: mergedSchemaKeys,
	};

	const projectionKind = determineProjectionKind(
		withRewrittenSubqueries.projection,
		tableNamesForTrace
	);
	const selectedColumnsSummaryForTrace = collectSelectedColumns(
		withRewrittenSubqueries,
		tableNamesForTrace
	);

	const metadata = buildInlineMetadata(
		withRewrittenSubqueries,
		references,
		parameters,
		pushdownSchemaKeys,
		pushdownPruneInheritance,
		pushdownFileIds,
		pushdownVersionIds
	);

	const rewritten = visitSelectStatement(
		withRewrittenSubqueries,
		createInlineVisitor(metadata, context)
	);

	if (context.trace) {
		const entry = buildTraceEntry({
			aliasList,
			projectionKind,
			schemaSummary: schemaSummaryForTrace,
			selectedColumns: selectedColumnsSummaryForTrace.selectedColumns,
		});
		context.trace.push(entry);
	}

	return rewritten;
}

function rewriteCompoundSelect(
	compound: CompoundSelectNode,
	context: PreprocessorStepContext,
	pushdownSchemaKeys: readonly string[] = [],
	pushdownPruneInheritance = false,
	pushdownFileIds: readonly string[] = [],
	pushdownVersionIds: readonly string[] = []
): CompoundSelectNode {
	let changed = false;
	const first = rewriteSelectStatement(
		compound.first,
		context,
		pushdownSchemaKeys,
		pushdownPruneInheritance,
		pushdownFileIds,
		pushdownVersionIds
	);
	if (first !== compound.first) {
		changed = true;
	}

	const branches = compound.compounds.map((branch) => {
		const rewritten = rewriteSelectStatement(
			branch.select,
			context,
			pushdownSchemaKeys,
			pushdownPruneInheritance,
			pushdownFileIds,
			pushdownVersionIds
		);
		if (rewritten !== branch.select) {
			changed = true;
			return {
				...branch,
				select: rewritten,
			};
		}
		return branch;
	});

	if (!changed) {
		return compound;
	}

	return {
		...compound,
		first,
		compounds: branches,
	};
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

function collectSubqueryPredicateMap(
	select: SelectStatementNode,
	parameters: ReadonlyArray<unknown>,
	pushdownSchemaKeys: readonly string[],
	pushdownPruneInheritance: boolean,
	pushdownFileIds: readonly string[],
	pushdownVersionIds: readonly string[]
): Map<string, SubqueryPredicateMetadata> {
	const map = new Map<string, SubqueryPredicateMetadata>();
	const register = (
		relation: RelationNode,
		joinFilter: ExpressionNode | RawFragmentNode | null
	) => {
		if (relation.node_kind !== "subquery") {
			return;
		}
		const aliasValue = getIdentifierValue(relation.alias);
		if (!aliasValue) {
			return;
		}
		const normalizedAlias = normalizeIdentifierValue(aliasValue);
		const tableNames = new Set<string>([
			normalizedAlias,
			DEFAULT_ALIAS_KEY,
			ORIGINAL_TABLE_KEY,
		]);
		const whereSummary = collectSchemaKeyPredicates(
			select.where_clause,
			tableNames,
			parameters
		);
		const joinSummary = collectSchemaKeyPredicatesFromExpression(
			joinFilter,
			tableNames,
			parameters,
			false
		);
		const localKeys = mergeStringLiterals(
			whereSummary.literals,
			joinSummary.literals
		);
		const fileWhereSummary = collectFileIdPredicates(
			select.where_clause,
			tableNames,
			parameters
		);
		const fileJoinSummary = collectFileIdPredicatesFromExpression(
			joinFilter,
			tableNames,
			parameters,
			false
		);
		const localFileIds = mergeStringLiterals(
			fileWhereSummary.literals,
			fileJoinSummary.literals
		);

		const versionWhereSummary = collectVersionIdPredicates(
			select.where_clause,
			tableNames,
			parameters
		);
		const versionJoinSummary = collectVersionIdPredicatesFromExpression(
			joinFilter,
			tableNames,
			parameters,
			false
		);
		const localVersionIds = mergeStringLiterals(
			versionWhereSummary.literals,
			versionJoinSummary.literals
		);

		const existing = map.get(normalizedAlias);
		const merged = mergeStringLiterals(
			existing?.schemaKeys ?? [],
			pushdownSchemaKeys,
			localKeys
		);
		const mergedFileIds = mergeStringLiterals(
			existing?.fileIds ?? [],
			pushdownFileIds,
			localFileIds
		);
		const mergedVersionIds = mergeStringLiterals(
			existing?.versionIds ?? [],
			pushdownVersionIds,
			localVersionIds
		);
		const pruneFromWhere = requiresNullPredicateForColumn(
			select.where_clause,
			tableNames,
			parameters,
			true
		);
		const pruneFromJoin = requiresNullPredicateForColumn(
			joinFilter,
			tableNames,
			parameters,
			false
		);
		const combinedPrune =
			(existing?.pruneInheritance ?? false) ||
			pushdownPruneInheritance ||
			pruneFromWhere ||
			pruneFromJoin;
		const finalFileIds = shouldPushFileFilter(merged, mergedFileIds)
			? mergedFileIds
			: [];
		if (
			merged.length > 0 ||
			finalFileIds.length > 0 ||
			mergedVersionIds.length > 0 ||
			combinedPrune
		) {
			map.set(normalizedAlias, {
				schemaKeys: merged,
				fileIds: finalFileIds,
				versionIds: mergedVersionIds,
				pruneInheritance: combinedPrune,
			});
		}
	};

	for (const clause of select.from_clauses) {
		register(clause.relation, null);
		for (const join of clause.joins) {
			register(join.relation, join.on_expression);
		}
	}

	return map;
}

function buildInlineMetadata(
	select: SelectStatementNode,
	references: readonly TableReferenceInfo[],
	parameters: ReadonlyArray<unknown>,
	pushdownSchemaKeys: readonly string[],
	pushdownPruneInheritance: boolean,
	pushdownFileIds: readonly string[],
	pushdownVersionIds: readonly string[]
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
		const summary = collectSchemaKeyPredicates(
			select.where_clause,
			tableNames,
			parameters
		);
		const schemaKeys = mergeStringLiterals(
			pushdownSchemaKeys,
			summary.literals
		);
		const fileSummary = collectFileIdPredicates(
			select.where_clause,
			tableNames,
			parameters
		);
		const mergedFileIds = mergeStringLiterals(
			pushdownFileIds,
			fileSummary.literals
		);
		const versionSummary = collectVersionIdPredicates(
			select.where_clause,
			tableNames,
			parameters
		);
		const mergedVersionIds = mergeStringLiterals(
			pushdownVersionIds,
			versionSummary.literals
		);
		const fileIds = shouldPushFileFilter(schemaKeys, mergedFileIds)
			? mergedFileIds
			: [];
		const columnSummary = collectSelectedColumns(select, tableNames);
		const pruneInheritance =
			pushdownPruneInheritance ||
			shouldPruneInheritance(select.where_clause, tableNames, parameters);
		metadata.set(aliasKey, {
			schemaKeys,
			fileIds,
			versionIds: mergedVersionIds,
			selectedColumns: columnSummary.selectedColumns,
			hiddenColumns: new Set(columnSummary.requestedHiddenColumns),
			supportColumns: new Set(columnSummary.supportColumns),
			pruneInheritance,
		});
	}
	return metadata;
}

function shouldPruneInheritance(
	whereClause: SelectStatementNode["where_clause"],
	tableNames: Set<string>,
	parameters: ReadonlyArray<unknown>
): boolean {
	return requiresNullPredicateForColumn(
		whereClause,
		tableNames,
		parameters,
		true
	);
}

function requiresNullPredicateForColumn(
	expression: ExpressionNode | RawFragmentNode | null,
	tableNames: Set<string>,
	parameters: ReadonlyArray<unknown>,
	allowUnqualified: boolean
): boolean {
	if (!expression) {
		return false;
	}
	const context: PredicateVisitContext = {
		tableNames,
		parameters,
		allowUnqualified,
	};
	return expressionRequiresNullForColumn(
		expression,
		"inherited_from_version_id",
		context
	);
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
			const aliasForSql =
				aliasValue ??
				getIdentifierValue(node.name.parts.at(-1) ?? null) ??
				INTERNAL_STATE_VTABLE;
			const inlineSql = buildVtableSelectRewrite({
				schemaKeys: metadataEntry.schemaKeys,
				fileIds: metadataEntry.fileIds,
				versionIds: metadataEntry.versionIds,
				cacheTables: context.getCacheTables!(),
				selectedColumns: metadataEntry.selectedColumns,
				hiddenColumns: metadataEntry.hiddenColumns,
				supportColumns: metadataEntry.supportColumns,
				hasOpenTransaction: context.hasOpenTransaction!(),
				pruneInheritance: metadataEntry.pruneInheritance,
				versionInheritance: context.getVersionInheritance
					? context.getVersionInheritance()
					: undefined,
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
	tableNames: Set<string>,
	parameters: ReadonlyArray<unknown>,
	allowUnqualified = true
): ColumnPredicateSummary {
	return collectColumnPredicates(
		whereClause,
		tableNames,
		parameters,
		"schema_key",
		allowUnqualified
	);
}

function collectSchemaKeyPredicatesFromExpression(
	expression: ExpressionNode | RawFragmentNode | null,
	tableNames: Set<string>,
	parameters: ReadonlyArray<unknown>,
	allowUnqualified: boolean
): ColumnPredicateSummary {
	return collectColumnPredicatesFromExpression(
		expression,
		tableNames,
		parameters,
		"schema_key",
		allowUnqualified
	);
}

function collectFileIdPredicates(
	whereClause: SelectStatementNode["where_clause"],
	tableNames: Set<string>,
	parameters: ReadonlyArray<unknown>,
	allowUnqualified = true
): ColumnPredicateSummary {
	return collectColumnPredicates(
		whereClause,
		tableNames,
		parameters,
		"file_id",
		allowUnqualified
	);
}

function collectFileIdPredicatesFromExpression(
	expression: ExpressionNode | RawFragmentNode | null,
	tableNames: Set<string>,
	parameters: ReadonlyArray<unknown>,
	allowUnqualified: boolean
): ColumnPredicateSummary {
	return collectColumnPredicatesFromExpression(
		expression,
		tableNames,
		parameters,
		"file_id",
		allowUnqualified
	);
}

function collectVersionIdPredicates(
	whereClause: SelectStatementNode["where_clause"],
	tableNames: Set<string>,
	parameters: ReadonlyArray<unknown>,
	allowUnqualified = true
): ColumnPredicateSummary {
	return collectColumnPredicates(
		whereClause,
		tableNames,
		parameters,
		"version_id",
		allowUnqualified
	);
}

function collectVersionIdPredicatesFromExpression(
	expression: ExpressionNode | RawFragmentNode | null,
	tableNames: Set<string>,
	parameters: ReadonlyArray<unknown>,
	allowUnqualified: boolean
): ColumnPredicateSummary {
	return collectColumnPredicatesFromExpression(
		expression,
		tableNames,
		parameters,
		"version_id",
		allowUnqualified
	);
}

function collectColumnPredicates(
	whereClause: SelectStatementNode["where_clause"],
	tableNames: Set<string>,
	parameters: ReadonlyArray<unknown>,
	columnName: string,
	allowUnqualified = true
): ColumnPredicateSummary {
	if (!whereClause) {
		return { count: 0, literals: [] };
	}
	const context: PredicateVisitContext = {
		tableNames,
		parameters,
		allowUnqualified,
	};
	return visitExpression(whereClause, context, columnName);
}

function collectColumnPredicatesFromExpression(
	expression: ExpressionNode | RawFragmentNode | null,
	tableNames: Set<string>,
	parameters: ReadonlyArray<unknown>,
	columnName: string,
	allowUnqualified: boolean
): ColumnPredicateSummary {
	if (!expression) {
		return { count: 0, literals: [] };
	}
	const context: PredicateVisitContext = {
		tableNames,
		parameters,
		allowUnqualified,
	};
	return visitExpression(expression, context, columnName);
}

function expressionRequiresNullForColumn(
	expression: ExpressionNode | RawFragmentNode,
	columnName: string,
	context: PredicateVisitContext
): boolean {
	if ("sql_text" in expression) {
		return false;
	}
	switch (expression.node_kind) {
		case "grouped_expression":
			return expressionRequiresNullForColumn(
				expression.expression,
				columnName,
				context
			);
		case "binary_expression":
			if (expression.operator === "and") {
				return (
					expressionRequiresNullForColumn(
						expression.left,
						columnName,
						context
					) ||
					expressionRequiresNullForColumn(expression.right, columnName, context)
				);
			}
			if (expression.operator === "or") {
				return (
					expressionRequiresNullForColumn(
						expression.left,
						columnName,
						context
					) &&
					expressionRequiresNullForColumn(expression.right, columnName, context)
				);
			}
			if (expression.operator === "is") {
				const leftMatches = isColumnReference(
					expression.left,
					context,
					columnName
				);
				const rightMatches = isColumnReference(
					expression.right,
					context,
					columnName
				);
				if (
					(leftMatches &&
						isNullLiteralExpression(expression.right, context.parameters)) ||
					(rightMatches &&
						isNullLiteralExpression(expression.left, context.parameters))
				) {
					return true;
				}
			}
			return false;
		default:
			return false;
	}
}

function visitExpression(
	expression: ExpressionNode | RawFragmentNode,
	context: PredicateVisitContext,
	columnName: string
): ColumnPredicateSummary {
	if ("sql_text" in expression) {
		return { count: 0, literals: [] };
	}

	switch (expression.node_kind) {
		case "grouped_expression":
			return visitExpression(expression.expression, context, columnName);
		case "binary_expression":
			return visitBinaryExpression(expression, context, columnName);
		case "unary_expression":
			return visitExpression(expression.operand, context, columnName);
		case "in_list_expression":
			return visitInListExpression(expression, context, columnName);
		case "between_expression":
			return visitBetweenExpression(expression, context, columnName);
		case "column_reference":
		case "literal":
		case "parameter":
		default:
			return { count: 0, literals: [] };
	}
}

function visitBinaryExpression(
	expression: BinaryExpressionNode,
	context: PredicateVisitContext,
	columnName: string
): ColumnPredicateSummary {
	if (isLogicalOperator(expression.operator)) {
		return mergeSummaries(
			visitExpression(expression.left, context, columnName),
			visitExpression(expression.right, context, columnName)
		);
	}

	if (!isEqualityOperator(expression.operator)) {
		return { count: 0, literals: [] };
	}

	let summary: ColumnPredicateSummary = {
		count: 0,
		literals: [],
	};

	const leftMatches = isColumnReference(expression.left, context, columnName);
	const rightMatches = isColumnReference(expression.right, context, columnName);

	if (leftMatches) {
		summary = incrementSummaryWithOperand(summary, expression.right, context);
	}
	if (rightMatches) {
		summary = incrementSummaryWithOperand(summary, expression.left, context);
	}

	return summary;
}

function visitInListExpression(
	expression: InListExpressionNode,
	context: PredicateVisitContext,
	columnName: string
): ColumnPredicateSummary {
	if (!isColumnReference(expression.operand, context, columnName)) {
		return { count: 0, literals: [] };
	}
	let summary: ColumnPredicateSummary = {
		count: 1,
		literals: [],
	};
	for (const item of expression.items) {
		summary = incrementSummaryWithOperand(summary, item, context);
	}
	return summary;
}

function visitBetweenExpression(
	expression: BetweenExpressionNode,
	context: PredicateVisitContext,
	columnName: string
): ColumnPredicateSummary {
	if (!isColumnReference(expression.operand, context, columnName)) {
		return { count: 0, literals: [] };
	}
	let summary: ColumnPredicateSummary = {
		count: 1,
		literals: [],
	};
	summary = incrementSummaryWithOperand(summary, expression.start, context);
	summary = incrementSummaryWithOperand(summary, expression.end, context);
	return summary;
}

function incrementSummaryWithOperand(
	summary: ColumnPredicateSummary,
	operand: ExpressionNode | RawFragmentNode,
	context: PredicateVisitContext
): ColumnPredicateSummary {
	const next = { ...summary };
	const node = unwrapExpression(operand);
	switch (node.node_kind) {
		case "literal":
			if (typeof node.value === "string") {
				next.literals.push(node.value);
			}
			break;
		case "parameter": {
			const resolved = resolveParameterSchemaLiteral(node, context.parameters);
			if (typeof resolved === "string") {
				next.literals.push(resolved);
			}
			break;
		}
		default:
			break;
	}
	next.count += 1;
	return next;
}

function isNullLiteralExpression(
	expression: ExpressionNode | RawFragmentNode,
	parameters: ReadonlyArray<unknown>
): boolean {
	const node = unwrapExpression(expression);
	if ("sql_text" in node) {
		return false;
	}
	if (node.node_kind === "literal") {
		return node.value === null;
	}
	if (node.node_kind === "parameter") {
		return resolveParameterValue(node, parameters) === null;
	}
	return false;
}

function resolveParameterSchemaLiteral(
	parameter: ParameterExpressionNode,
	parameters: ReadonlyArray<unknown>
): string | null {
	const value = resolveParameterValue(parameter, parameters);
	return typeof value === "string" ? value : null;
}

function resolveParameterValue(
	parameter: ParameterExpressionNode,
	parameters: ReadonlyArray<unknown>
): unknown {
	const index = parameter.position;
	if (typeof index === "number" && index >= 0 && index < parameters.length) {
		return parameters[index];
	}
	return undefined;
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

function isColumnReference(
	expression: ExpressionNode | RawFragmentNode,
	context: PredicateVisitContext,
	expectedColumn: string
): boolean {
	if ("sql_text" in expression) {
		return false;
	}
	if (expression.node_kind === "column_reference") {
		const qualifier = getColumnQualifier(expression);
		const columnName = getColumnName(expression);
		if (qualifier && context.tableNames.has(qualifier)) {
			return columnName === expectedColumn;
		}
		if (!qualifier && context.allowUnqualified) {
			return columnName === expectedColumn;
		}
		return false;
	}
	if (expression.node_kind === "grouped_expression") {
		return isColumnReference(expression.expression, context, expectedColumn);
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
	...summaries: ColumnPredicateSummary[]
): ColumnPredicateSummary {
	return summaries.reduce<ColumnPredicateSummary>(
		(accumulator, current) => {
			accumulator.count += current.count;
			accumulator.literals.push(...current.literals);
			return accumulator;
		},
		{ count: 0, literals: [] }
	);
}

function mergeStringLiterals(
	...lists: readonly (readonly string[])[]
): string[] {
	const seen = new Set<string>();
	const merged: string[] = [];
	for (const list of lists) {
		for (const item of list) {
			if (typeof item !== "string") {
				continue;
			}
			if (!seen.has(item)) {
				seen.add(item);
				merged.push(item);
			}
		}
	}
	return merged;
}

function collectSelectedColumns(
	select: SelectStatementNode,
	tableNames: Set<string>
): ColumnSelectionSummary {
	const hiddenSelections = new Set<string>();
	const supportColumns = new Set<string>();

	if (select.projection.length === 0) {
		return {
			selectedColumns: null,
			requestedHiddenColumns: hiddenSelections,
			supportColumns,
		};
	}

	const order: string[] = [];
	const entries = new Map<string, SelectedProjection>();
	let hasUnresolvedProjection = false;
	let selectsAll = false;

	for (const item of select.projection) {
		if (isSelectAllForTable(item, tableNames)) {
			selectsAll = true;
			continue;
		}
		if (item.node_kind !== "select_expression") {
			hasUnresolvedProjection = true;
			continue;
		}
		const columnName = extractColumnFromExpression(item.expression, tableNames);
		if (!columnName) {
			hasUnresolvedProjection = true;
			continue;
		}
		if (HIDDEN_SEGMENT_COLUMN_SET.has(columnName)) {
			hiddenSelections.add(columnName);
		}
		const alias = getIdentifierValue(item.alias);
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

	const referenced = collectReferencedColumnSummary(select, tableNames);
	if (referenced.hasUnknownReferences) {
		hasUnresolvedProjection = true;
	}

	for (const column of referenced.columns) {
		if (HIDDEN_SEGMENT_COLUMN_SET.has(column)) {
			hiddenSelections.add(column);
		}
		if (!entries.has(column)) {
			supportColumns.add(column);
		}
	}

	if (hasUnresolvedProjection || selectsAll) {
		return {
			selectedColumns: null,
			requestedHiddenColumns: hiddenSelections,
			supportColumns,
		};
	}

	return {
		selectedColumns: order.map((column) => entries.get(column)!),
		requestedHiddenColumns: hiddenSelections,
		supportColumns,
	};
}

function collectReferencedColumnSummary(
	select: SelectStatementNode,
	tableNames: Set<string>
): {
	columns: Set<string>;
	hasUnknownReferences: boolean;
} {
	const columns = new Set<string>();
	let hasUnknownReferences = false;

	const visit = (expression: ExpressionNode | RawFragmentNode | null) => {
		if (hasUnknownReferences || !expression) {
			return;
		}
		if ("sql_text" in expression) {
			hasUnknownReferences = true;
			return;
		}
		switch (expression.node_kind) {
			case "column_reference": {
				const qualifier = getColumnQualifier(expression);
				if (qualifier && !tableNames.has(qualifier)) {
					return;
				}
				const columnName = getColumnName(expression);
				if (columnName) {
					columns.add(columnName);
				}
				return;
			}
			case "binary_expression":
				visit(expression.left);
				visit(expression.right);
				return;
			case "unary_expression":
				visit(expression.operand);
				return;
			case "grouped_expression":
				visit(expression.expression);
				return;
			case "function_call":
				for (const argument of expression.arguments) {
					if (argument.node_kind === "all_columns") {
						continue;
					}
					visit(argument);
				}
				return;
			case "in_list_expression":
				visit(expression.operand);
				for (const item of expression.items) {
					visit(item);
				}
				return;
			case "between_expression":
				visit(expression.operand);
				visit(expression.start);
				visit(expression.end);
				return;
			case "subquery_expression":
				hasUnknownReferences = true;
				return;
			case "literal":
			case "parameter":
				return;
			default:
				return;
		}
	};

	visit(select.where_clause);
	for (const clause of select.from_clauses) {
		for (const join of clause.joins) {
			visit(join.on_expression);
		}
	}
	for (const order of select.order_by) {
		visit(order.expression);
	}

	return { columns, hasUnknownReferences };
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
	schemaSummary: ColumnPredicateSummary;
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
			selected_columns: selectedColumns
				? selectedColumns.map((entry) => entry.alias ?? entry.column)
				: null,
		},
	};
}

function buildVtableSelectRewrite(options: {
	schemaKeys: readonly string[];
	fileIds: readonly string[];
	versionIds: readonly string[];
	cacheTables: Map<string, unknown>;
	selectedColumns: SelectedProjection[] | null;
	hiddenColumns: ReadonlySet<string>;
	supportColumns: ReadonlySet<string>;
	hasOpenTransaction: boolean;
	pruneInheritance: boolean;
	versionInheritance?: VersionInheritanceMap;
}): string {
	const schemaFilterList = options.schemaKeys ?? [];
	const { candidateColumns, rankedColumns } = buildProjectionColumnSet(
		options.selectedColumns,
		options.hiddenColumns,
		options.supportColumns
	);
	candidateColumns.add("priority");
	rankedColumns.add("priority");
	const inheritancePlan = determineInheritancePlan({
		requestedVersionIds: options.versionIds,
		versionInheritance: options.versionInheritance,
		forcedPrune: options.pruneInheritance,
	});
	const schemaFilter = buildSchemaFilter(schemaFilterList);
	const fileFilter =
		options.fileIds && options.fileIds.length > 0
			? buildFileFilter(options.fileIds)
			: null;
	const versionFilter = buildVersionFilter(inheritancePlan.versionFilterIds);
	const txnFilter = combineFilters(schemaFilter, fileFilter, versionFilter);
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
		supportColumns: options.supportColumns,
		needsWriterJoin,
		candidateColumns,
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
		segments.push(buildTransactionSegment(txnFilter, candidateColumns));
	}
	segments.push(buildUntrackedSegment(txnFilter, candidateColumns));
	const cacheSegment = buildCacheSegment(
		cacheSource,
		txnFilter,
		candidateColumns
	);
	if (cacheSegment) {
		segments.push(cacheSegment);
	}
	const shouldPruneInheritance = inheritancePlan.mode === "pruned";
	let inheritanceJoinSource = "version_inheritance vi";
	let parentJoinSource = "version_parent vi";
	if (inheritancePlan.mode === "inline") {
		inheritanceJoinSource = buildInlineInheritanceSource(
			inheritancePlan.versionAncestorPairs
		);
		parentJoinSource = buildInlineParentSource(inheritancePlan.parentPairs);
	}
	let allSegments = segments;
	if (!shouldPruneInheritance) {
		const inheritedSegments: string[] = [];
		if (cacheSegment) {
			const inheritedCache = buildInheritedCacheSegment(
				cacheSource,
				txnFilter,
				candidateColumns,
				inheritanceJoinSource
			);
			if (inheritedCache) {
				inheritedSegments.push(inheritedCache);
			}
		}
		inheritedSegments.push(
			buildInheritedUntrackedSegment(
				txnFilter,
				candidateColumns,
				inheritanceJoinSource
			)
		);
		if (options.hasOpenTransaction !== false) {
			inheritedSegments.push(
				buildInheritedTransactionSegment(
					txnFilter,
					candidateColumns,
					parentJoinSource
				)
			);
		}
		allSegments = segments.concat(inheritedSegments);
	}
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
	const rankedSql = buildRankedSegment({
		projectionColumns: rankedColumns,
		rankingOrder,
		candidatesSql: candidates,
	});
	const withClauses: string[] = [];
	if (inheritancePlan.mode === "recursive") {
		withClauses.push(buildVersionDescriptorCte());
		withClauses.push(buildVersionInheritanceCte());
		withClauses.push(buildVersionParentCte());
	}
	const withPrefix =
		withClauses.length > 0
			? `WITH
${withClauses.map((clause) => indent(clause, 2)).join(",\n")}
`
			: "";

	const body = `${withPrefix}SELECT
${indent(projectionSql, 2)}
FROM (
${indent(rankedSql, 2)}
) AS w
${writerJoinSql}
${changeJoinSql}
${transactionJoinSql}
WHERE w.rn = 1`;

	return `(\n${body}\n)\n`;
}

function buildRewriteProjectionSql(
	selectedColumns: SelectedProjection[] | null,
	options: {
		needsWriterJoin: boolean;
		supportColumns: ReadonlySet<string>;
		candidateColumns: ReadonlySet<string>;
	}
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

	const baseQuery = builder.selectFrom(`${INTERNAL_STATE_VTABLE} as w`);
	const supportEntries =
		selectedColumns === null
			? []
			: Array.from(options.supportColumns)
					.filter(
						(column) =>
							!selectedColumns.some((entry) => entry.column === column) &&
							!INTERNAL_ONLY_COLUMN_SET.has(column)
					)
					.map<SelectedProjection>((column) => ({
						column,
						alias: null,
					}));
	const combinedEntries =
		selectedColumns === null ? null : [...selectedColumns, ...supportEntries];
	const query =
		combinedEntries === null || combinedEntries.length === 0
			? undefined
			: baseQuery.select((eb) =>
					combinedEntries.map((entry) => {
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

	if (!query) {
		const defaultColumns = buildDefaultProjectionColumns(
			options.candidateColumns
		);
		return defaultColumns
			.map((column) =>
				options.needsWriterJoin && column === "writer_key"
					? `COALESCE(ws_dst.writer_key, ws_src.writer_key, w.writer_key) AS ${quoteIdentifier(
							column
						)}`
					: `w.${quoteIdentifier(column)} AS ${quoteIdentifier(column)}`
			)
			.join(",\n");
	}

	const { sql } = query.compile();
	const match = sql.match(/^select\s+(?<projection>[\s\S]+?)\s+from\s+/i);
	return match?.groups?.projection?.trim() ?? sql;
}

function buildDefaultProjectionColumns(
	candidateColumns: ReadonlySet<string>
): string[] {
	const ordered = PROJECTION_COLUMN_ORDER.filter(
		(column) =>
			!INTERNAL_ONLY_COLUMN_SET.has(column) && candidateColumns.has(column)
	) as string[];
	const additional = Array.from(candidateColumns).filter(
		(column) =>
			!INTERNAL_ONLY_COLUMN_SET.has(column) && !ordered.includes(column)
	);
	return ordered.concat(additional.sort());
}

function buildProjectionColumnSet(
	selectedColumns: SelectedProjection[] | null,
	hiddenColumns: ReadonlySet<string>,
	supportColumns: ReadonlySet<string>
): {
	candidateColumns: Set<string>;
	rankedColumns: Set<string>;
} {
	const requestedHiddenColumns = new Set(hiddenColumns);
	const seedColumns =
		selectedColumns === null
			? ALL_SEGMENT_COLUMNS
			: Array.from(BASE_SEGMENT_COLUMNS);
	const candidateColumns = new Set<string>();
	const rankedColumns = new Set<string>();

	for (const column of seedColumns) {
		if (
			HIDDEN_SEGMENT_COLUMN_SET.has(column) &&
			!requestedHiddenColumns.has(column)
		) {
			continue;
		}
		candidateColumns.add(column);
		rankedColumns.add(column);
	}

	if (selectedColumns && selectedColumns.length > 0) {
		for (const entry of selectedColumns) {
			candidateColumns.add(entry.column);
			rankedColumns.add(entry.column);
		}
	}

	for (const column of supportColumns) {
		candidateColumns.add(column);
		rankedColumns.add(column);
	}

	for (const hiddenColumn of requestedHiddenColumns) {
		candidateColumns.add(hiddenColumn);
		rankedColumns.add(hiddenColumn);
	}

	for (const hiddenColumn of HIDDEN_SEGMENT_COLUMN_SET) {
		if (!requestedHiddenColumns.has(hiddenColumn)) {
			candidateColumns.delete(hiddenColumn);
			rankedColumns.delete(hiddenColumn);
		}
	}

	// Internal rewrites rely on snapshot_content for JSON decoding and cache filtering.
	candidateColumns.add("snapshot_content");
	rankedColumns.add("snapshot_content");

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

const PROJECTION_COLUMN_ORDER = ALL_SEGMENT_COLUMNS.filter(
	(column) => column !== "priority"
);

const INTERNAL_ONLY_COLUMN_SET = new Set<string>(["priority", "rn"]);

function buildTransactionSegment(
	schemaFilter: string | null,
	projectionColumns: Set<string>
): string {
	const rewrittenFilter = rewriteFilterForAlias(schemaFilter, "txn");
	const filterClause = rewrittenFilter ? `WHERE ${rewrittenFilter}` : "";
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
	const rewrittenFilter = rewriteFilterForAlias(schemaFilter, "unt");
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
	const rewrittenFilter = rewriteFilterForAlias(schemaFilter, "cache");
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
	const whereClause = rewrittenFilter ? `\n\t\tWHERE ${rewrittenFilter}` : "";
	return stripIndent(`
		SELECT
${indent(columnSql, 4)}
		FROM ${sourceSql} cache${whereClause}
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
	projectionColumns: Set<string>,
	inheritanceJoin: string
): string | null {
	if (!cacheSource) {
		return null;
	}
	const rewrittenFilter = rewriteFilterForAlias(schemaFilter, "cache");
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
		FROM ${inheritanceJoin}
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
	projectionColumns: Set<string>,
	inheritanceJoin: string
): string {
	const rewrittenFilter = rewriteFilterForAlias(schemaFilter, "unt");
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
		FROM ${inheritanceJoin}
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
	projectionColumns: Set<string>,
	parentJoinSource: string
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
	const rewrittenFilter = rewriteFilterForAlias(schemaFilter, "txn");
	return stripIndent(`
		SELECT
${indent(columnSql, 4)}
		FROM ${parentJoinSource}
		JOIN lix_internal_transaction_state txn ON txn.version_id = vi.parent_version_id
		WHERE vi.parent_version_id IS NOT NULL
		  AND txn.snapshot_content IS NOT NULL${
				rewrittenFilter ? ` AND ${rewrittenFilter}` : ""
			}
	`).trimEnd();
}

function buildRankedSegment(options: {
	projectionColumns: Set<string>;
	rankingOrder: string[];
	candidatesSql: string;
}): string {
	const columns = ALL_SEGMENT_COLUMNS.filter((column) =>
		options.projectionColumns.has(column)
	).map((column) => `c.${column} AS ${column}`);
	const orderClause = options.rankingOrder.join(", ");
	const selectEntries = [
		...columns,
		`ROW_NUMBER() OVER (
        PARTITION BY c.file_id, c.schema_key, c.entity_id, c.version_id
        ORDER BY ${orderClause}
      ) AS rn`,
	];
	return stripIndent(`
		SELECT
${indent(selectEntries.join(",\n"), 4)}
		FROM (
${indent(options.candidatesSql, 6)}
		) AS c
	`).trimEnd();
}

function buildSchemaFilter(schemaKeys: readonly string[]): string | null {
	if (!schemaKeys || schemaKeys.length === 0) {
		return null;
	}
	const values = schemaKeys.map((key) => `'${key}'`).join(", ");
	return `txn.schema_key IN (${values})`;
}

function buildFileFilter(fileIds: readonly string[]): string | null {
	if (!fileIds || fileIds.length === 0) {
		return null;
	}
	const values = fileIds
		.map((fileId) => `'${escapeSqlLiteral(fileId)}'`)
		.join(", ");
	return `txn.file_id IN (${values})`;
}

function buildVersionFilter(versionIds: readonly string[]): string | null {
	if (!versionIds || versionIds.length === 0) {
		return null;
	}
	const values = versionIds
		.map((versionId) => `'${escapeSqlLiteral(versionId)}'`)
		.join(",");
	return `txn.version_id IN (${values})`;
}

function buildCacheSource(
	schemaKeys: readonly string[],
	cacheTables: Map<string, unknown>,
	projectionColumns: Set<string>
): string | null {
	const requiredColumns = new Set(projectionColumns);
	// Always keep structural columns that power tombstone filtering and ranking.
	requiredColumns.add("snapshot_content");
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
	const seenTables = new Set<string>();
	const entries = uniqueKeys
		.map((key) => {
			const lookupKeys = new Set<string>([key]);
			const sanitizedKey = cacheTableNameToSchemaKey(
				schemaKeyToCacheTableName(key)
			);
			if (sanitizedKey !== key) {
				lookupKeys.add(sanitizedKey);
			}
			for (const lookupKey of lookupKeys) {
				const tableName = cacheTables.get(lookupKey);
				if (
					typeof tableName === "string" &&
					tableName.length > 0 &&
					!seenTables.has(tableName)
				) {
					seenTables.add(tableName);
					return {
						tableName,
						sql: buildPhysicalCacheSelect(tableName, requiredColumns),
					};
				}
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

/**
 * Resolves the cache table name for the provided schema key, falling back to its sanitized form.
 *
 * @example
 * ```ts
 * resolveCacheTableName(new Map([["delete_cache_schema", "cache_table"]]), "delete-cache-schema");
 * // "cache_table"
 * ```
 */
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

function shouldPushFileFilter(
	schemaKeys: readonly string[],
	fileIds: readonly string[]
): boolean {
	if (!schemaKeys || schemaKeys.length === 0) return false;
	if (!fileIds || fileIds.length === 0) return false;
	return schemaKeys.every(
		(key) => typeof key === "string" && !key.startsWith("lix_")
	);
}

function combineFilters(
	...filters: Array<string | null | undefined>
): string | null {
	const active = filters.filter(
		(filter): filter is string =>
			typeof filter === "string" && filter.length > 0
	);
	if (active.length === 0) {
		return null;
	}
	if (active.length === 1) {
		return active[0]!;
	}
	return active.map((filter) => `(${filter})`).join(" AND ");
}

function rewriteFilterForAlias(
	filter: string | null,
	alias: string
): string | null {
	if (!filter) {
		return null;
	}
	return filter.replace(/txn\./g, `${alias}.`);
}

function escapeSqlLiteral(value: string): string {
	return value.replace(/'/g, "''");
}

type InheritancePlan =
	| { mode: "pruned"; versionFilterIds: readonly string[] }
	| { mode: "recursive"; versionFilterIds: readonly string[] }
	| {
			mode: "inline";
			versionAncestorPairs: Array<{ versionId: string; ancestorId: string }>;
			parentPairs: Array<{ versionId: string; parentId: string }>;
			versionFilterIds: readonly string[];
	  };

function determineInheritancePlan(args: {
	requestedVersionIds: readonly string[];
	versionInheritance?: VersionInheritanceMap;
	forcedPrune: boolean;
}): InheritancePlan {
	const requested = Array.from(new Set(args.requestedVersionIds ?? []));

	if (args.forcedPrune) {
		return { mode: "pruned", versionFilterIds: requested };
	}

	if (requested.length === 0) {
		return args.versionInheritance
			? { mode: "recursive", versionFilterIds: [] }
			: { mode: "pruned", versionFilterIds: [] };
	}

	if (!args.versionInheritance || args.versionInheritance.size === 0) {
		return { mode: "pruned", versionFilterIds: requested };
	}

	const ancestorPairs: Array<{ versionId: string; ancestorId: string }> = [];
	const parentPairs: Array<{ versionId: string; parentId: string }> = [];
	const ancestorSeen = new Set<string>();
	const parentSeen = new Set<string>();
	const versionFilterSet = new Set(requested);

	for (const versionId of requested) {
		let current = versionId;
		const chainVisited = new Set<string>([current]);
		while (true) {
			const node = args.versionInheritance.get(current);
			if (!node) {
				return {
					mode: "recursive",
					versionFilterIds: Array.from(versionFilterSet),
				};
			}
			const parentId = node.inheritsFromVersionId;
			if (!parentId) {
				break;
			}
			if (chainVisited.has(parentId)) {
				return {
					mode: "recursive",
					versionFilterIds: Array.from(versionFilterSet),
				};
			}
			chainVisited.add(parentId);
			versionFilterSet.add(parentId);

			const ancestorKey = `${versionId}::${parentId}`;
			if (!ancestorSeen.has(ancestorKey)) {
				ancestorSeen.add(ancestorKey);
				ancestorPairs.push({ versionId, ancestorId: parentId });
			}

			const parentKey = `${current}::${parentId}`;
			if (!parentSeen.has(parentKey)) {
				parentSeen.add(parentKey);
				parentPairs.push({ versionId: current, parentId });
			}

			current = parentId;
		}
	}

	if (ancestorPairs.length === 0) {
		return { mode: "pruned", versionFilterIds: requested };
	}

	return {
		mode: "inline",
		versionAncestorPairs: ancestorPairs,
		parentPairs,
		versionFilterIds: Array.from(versionFilterSet),
	};
}

function buildInlineInheritanceSource(
	pairs: Array<{ versionId: string; ancestorId: string }>
): string {
	return buildInlineValueSource(
		pairs.map(({ versionId, ancestorId }) => [versionId, ancestorId]),
		["version_id", "ancestor_version_id"]
	);
}

function buildInlineParentSource(
	pairs: Array<{ versionId: string; parentId: string }>
): string {
	return buildInlineValueSource(
		pairs.map(({ versionId, parentId }) => [versionId, parentId]),
		["version_id", "parent_version_id"]
	);
}

function buildInlineValueSource(
	rows: Array<[string, string]>,
	columns: [string, string]
): string {
	const selects = rows
		.map(
			([left, right]) =>
				`SELECT '${escapeSqlLiteral(left)}' AS ${columns[0]}, '${escapeSqlLiteral(right)}' AS ${columns[1]}`
		)
		.join("\nUNION ALL\n");
	return `(\n${selects}\n) AS vi`;
}
