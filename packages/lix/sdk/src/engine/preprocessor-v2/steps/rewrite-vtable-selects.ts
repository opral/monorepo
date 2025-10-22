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
import { buildInternalStateRewriteSql } from "./internal-state-rewrite-sql.js";

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
