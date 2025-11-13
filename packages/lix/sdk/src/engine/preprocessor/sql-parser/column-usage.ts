import {
	getColumnName,
	getColumnQualifier,
	getIdentifierValue,
	isSelectAllForTable,
	normalizeIdentifierValue,
} from "./ast-helpers.js";
import type {
	CompoundSelectNode,
	ExpressionNode,
	RawFragmentNode,
	RelationNode,
	SelectStatementNode,
	WindowFrameBoundNode,
	WindowFrameNode,
	WindowSpecificationNode,
} from "./nodes.js";

export type ColumnUsageSummary = {
	readonly columns: Set<string>;
	requiresAllColumns: boolean;
};

export type TableColumnUsageMap = Map<string, ColumnUsageSummary>;

type RelationAliasEntry = {
	readonly normalized: string;
};

type ColumnUsageVisitorOptions = {
	readonly handleSubquery?: (
		statement: SelectStatementNode | CompoundSelectNode
	) => void;
};

/**
 * Collects the column-level requirements for each relation referenced within a
 * select statement. Results are keyed by normalized alias/table names so that
 * callers can align usage with table references discovered elsewhere.
 */
export function collectTableColumnUsage(
	select: SelectStatementNode
): TableColumnUsageMap {
	const relations = collectRelationAliases(select);
	const map: TableColumnUsageMap = new Map();
	if (relations.length === 0) {
		return map;
	}
	for (const entry of relations) {
		ensureSummary(map, entry.normalized);
	}
	const markAllRelations = () => {
		for (const summary of map.values()) {
			summary.requiresAllColumns = true;
		}
	};
	const recordColumn = (aliasKey: string, column: string) => {
		const summary = ensureSummary(map, aliasKey);
		if (summary.requiresAllColumns) {
			return;
		}
		summary.columns.add(column);
	};
	const recordUnqualifiedColumn = (column: string) => {
		if (relations.length === 1) {
			recordColumn(relations[0]!.normalized, column);
			return;
		}
		markAllRelations();
	};
	const handleColumnReference = (
		column: string | null,
		qualifier: string | null
	) => {
		if (!column) {
			return;
		}
		if (qualifier) {
			const aliasKey = normalizeIdentifierValue(qualifier);
			if (map.has(aliasKey)) {
				recordColumn(aliasKey, column);
				return;
			}
			return;
		}
		recordUnqualifiedColumn(column);
	};
	const relationAliasSet = new Set(relations.map((entry) => entry.normalized));
	const collectFromExpression = (
		expression: ExpressionNode | RawFragmentNode | null
	) => {
		collectExpressionColumnUsage(
			expression,
			handleColumnReference,
			markAllRelations,
			{
				handleSubquery(statement) {
					collectCorrelatedSubqueryColumnUsage(
						statement,
						relationAliasSet,
						handleColumnReference,
						markAllRelations
					);
				},
			}
		);
	};
	for (const item of select.projection) {
		if (item.node_kind === "select_star") {
			markAllRelations();
			break;
		}
		if (item.node_kind === "select_qualified_star") {
			if (item.qualifier.length === 0) {
				continue;
			}
			const qualifier = item.qualifier[item.qualifier.length - 1];
			if (!qualifier) {
				continue;
			}
			const key = normalizeIdentifierValue(qualifier.value);
			const summary = ensureSummary(map, key);
			summary.requiresAllColumns = true;
			continue;
		}
		if (
			isSelectAllForTable(
				item,
				new Set(relations.map((entry) => entry.normalized))
			)
		) {
			markAllRelations();
			break;
		}
		collectFromExpression(item.expression);
	}
	collectFromExpression(select.where_clause);
	for (const clause of select.from_clauses) {
		for (const join of clause.joins) {
			collectFromExpression(join.on_expression);
		}
	}
	for (const group of select.group_by) {
		collectFromExpression(group);
	}
	for (const order of select.order_by) {
		collectFromExpression(order.expression);
	}
	return map;
}

export function resolveRelationAlias(relation: RelationNode): string | null {
	if (relation.node_kind === "raw_fragment") {
		return null;
	}
	const aliasValue = getIdentifierValue(relation.alias);
	if (aliasValue) {
		return normalizeIdentifierValue(aliasValue);
	}
	if (relation.node_kind === "table_reference") {
		const last = relation.name.parts.at(-1);
		if (!last) {
			return null;
		}
		return normalizeIdentifierValue(last.value);
	}
	return null;
}

function collectExpressionColumnUsage(
	expression: ExpressionNode | RawFragmentNode | null,
	handleColumn: (column: string | null, qualifier: string | null) => void,
	markAllRelations: () => void,
	options?: ColumnUsageVisitorOptions
): void {
	if (!expression) {
		return;
	}
	if ("sql_text" in expression) {
		markAllRelations();
		return;
	}
	switch (expression.node_kind) {
		case "column_reference": {
			const qualifier = getColumnQualifier(expression);
			handleColumn(getColumnName(expression), qualifier);
			return;
		}
		case "binary_expression":
			collectExpressionColumnUsage(
				expression.left,
				handleColumn,
				markAllRelations,
				options
			);
			collectExpressionColumnUsage(
				expression.right,
				handleColumn,
				markAllRelations,
				options
			);
			return;
		case "unary_expression":
			collectExpressionColumnUsage(
				expression.operand,
				handleColumn,
				markAllRelations,
				options
			);
			return;
		case "grouped_expression":
			collectExpressionColumnUsage(
				expression.expression,
				handleColumn,
				markAllRelations,
				options
			);
			return;
		case "function_call":
			for (const argument of expression.arguments) {
				if (argument.node_kind === "all_columns") {
					markAllRelations();
					return;
				}
				collectExpressionColumnUsage(
					argument,
					handleColumn,
					markAllRelations,
					options
				);
			}
			const windowTarget = expression.over;
			if (windowTarget) {
				if (windowTarget.node_kind === "window_specification") {
					collectWindowSpecificationUsage(
						windowTarget,
						handleColumn,
						markAllRelations,
						options
					);
				} else {
					markAllRelations();
				}
			}
			return;
		case "in_list_expression":
			collectExpressionColumnUsage(
				expression.operand,
				handleColumn,
				markAllRelations,
				options
			);
			for (const item of expression.items) {
				collectExpressionColumnUsage(
					item,
					handleColumn,
					markAllRelations,
					options
				);
			}
			return;
		case "between_expression":
			collectExpressionColumnUsage(
				expression.operand,
				handleColumn,
				markAllRelations,
				options
			);
			collectExpressionColumnUsage(
				expression.start,
				handleColumn,
				markAllRelations,
				options
			);
			collectExpressionColumnUsage(
				expression.end,
				handleColumn,
				markAllRelations,
				options
			);
			return;
		case "case_expression":
			if (expression.operand) {
				collectExpressionColumnUsage(
					expression.operand,
					handleColumn,
					markAllRelations,
					options
				);
			}
			for (const branch of expression.branches) {
				collectExpressionColumnUsage(
					branch.condition,
					handleColumn,
					markAllRelations,
					options
				);
				collectExpressionColumnUsage(
					branch.result,
					handleColumn,
					markAllRelations,
					options
				);
			}
			collectExpressionColumnUsage(
				expression.else_result,
				handleColumn,
				markAllRelations,
				options
			);
			return;
		case "exists_expression":
		case "subquery_expression":
			if (options?.handleSubquery) {
				options.handleSubquery(expression.statement);
				return;
			}
			markAllRelations();
			return;
		case "parameter":
		case "literal":
			return;
		default:
			markAllRelations();
			return;
	}
}

function ensureSummary(
	map: TableColumnUsageMap,
	aliasKey: string
): ColumnUsageSummary {
	let summary = map.get(aliasKey);
	if (!summary) {
		summary = {
			columns: new Set<string>(),
			requiresAllColumns: false,
		};
		map.set(aliasKey, summary);
	}
	return summary;
}

function collectRelationAliases(
	select: SelectStatementNode
): RelationAliasEntry[] {
	const relations: RelationAliasEntry[] = [];
	for (const clause of select.from_clauses) {
		const relationAlias = resolveRelationAlias(clause.relation);
		if (relationAlias) {
			relations.push({ normalized: relationAlias });
		}
		for (const join of clause.joins) {
			const joinAlias = resolveRelationAlias(join.relation);
			if (joinAlias) {
				relations.push({ normalized: joinAlias });
			}
		}
	}
	return relations;
}

function collectCorrelatedSubqueryColumnUsage(
	statement: SelectStatementNode | CompoundSelectNode,
	parentAliases: ReadonlySet<string>,
	handleColumn: (column: string | null, qualifier: string | null) => void,
	markAllRelations: () => void
): void {
	let encounteredAmbiguousReference = false;

	const visitExpression = (
		expression: ExpressionNode | RawFragmentNode | null,
		localAliases: ReadonlySet<string>
	) => {
		collectExpressionColumnUsage(
			expression,
			(column, qualifier) => {
				if (!qualifier) {
					return;
				}
				if (localAliases.has(qualifier)) {
					return;
				}
				if (parentAliases.has(qualifier)) {
					handleColumn(column, qualifier);
				}
			},
			() => {
				encounteredAmbiguousReference = true;
			},
			{
				handleSubquery(nested) {
					collectCorrelatedSubqueryColumnUsage(
						nested,
						parentAliases,
						handleColumn,
						markAllRelations
					);
				},
			}
		);
	};

	const visitSelect = (select: SelectStatementNode) => {
		const localRelations = collectRelationAliases(select);
		const localAliasSet = new Set(
			localRelations.map((entry) => entry.normalized)
		);
		for (const item of select.projection) {
			if (item.node_kind !== "select_expression") {
				continue;
			}
			visitExpression(item.expression, localAliasSet);
		}
		visitExpression(select.where_clause, localAliasSet);
		for (const clause of select.from_clauses) {
			for (const join of clause.joins) {
				visitExpression(join.on_expression, localAliasSet);
			}
		}
		for (const group of select.group_by) {
			visitExpression(group, localAliasSet);
		}
		for (const order of select.order_by) {
			visitExpression(order.expression, localAliasSet);
		}
		visitExpression(select.limit, localAliasSet);
		visitExpression(select.offset, localAliasSet);
	};

	if (statement.node_kind === "select_statement") {
		visitSelect(statement);
	} else {
		visitSelect(statement.first);
		for (const branch of statement.compounds) {
			visitSelect(branch.select);
		}
	}

	if (encounteredAmbiguousReference) {
		markAllRelations();
	}
}

function collectWindowSpecificationUsage(
	specification: WindowSpecificationNode | null,
	handleColumn: (column: string | null, qualifier: string | null) => void,
	markAllRelations: () => void,
	options?: ColumnUsageVisitorOptions
): void {
	if (!specification || specification.node_kind !== "window_specification") {
		return;
	}
	for (const partition of specification.partition_by) {
		collectExpressionColumnUsage(
			partition,
			handleColumn,
			markAllRelations,
			options
		);
	}
	for (const order of specification.order_by) {
		collectExpressionColumnUsage(
			order.expression,
			handleColumn,
			markAllRelations,
			options
		);
	}
	const frame = specification.frame as WindowFrameNode | null;
	if (frame) {
		collectWindowFrameBoundUsage(
			frame.start,
			handleColumn,
			markAllRelations,
			options
		);
		if (frame.end) {
			collectWindowFrameBoundUsage(
				frame.end,
				handleColumn,
				markAllRelations,
				options
			);
		}
	}
}

function collectWindowFrameBoundUsage(
	bound: WindowFrameBoundNode | null,
	handleColumn: (column: string | null, qualifier: string | null) => void,
	markAllRelations: () => void,
	options?: ColumnUsageVisitorOptions
): void {
	if (!bound || !bound.offset) {
		return;
	}
	collectExpressionColumnUsage(
		bound.offset,
		handleColumn,
		markAllRelations,
		options
	);
}
