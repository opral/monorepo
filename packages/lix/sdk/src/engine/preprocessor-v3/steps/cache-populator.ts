import {
	type BinaryExpressionNode,
	type ExpressionNode,
	type IdentifierNode,
	type InListExpressionNode,
	type ParameterExpressionNode,
	type RawFragmentNode,
	type RelationNode,
	type SelectStatementNode,
	type StatementNode,
	type TableReferenceNode,
} from "../sql-parser/nodes.js";
import type { PreprocessorStep } from "../types.js";
import {
	getColumnName,
	getColumnQualifier,
	getIdentifierValue,
	normalizeIdentifierValue,
	objectNameMatches,
} from "../sql-parser/ast-helpers.js";
import {
	INTERNAL_STATE_VTABLE,
	REWRITTEN_STATE_VTABLE,
} from "./rewrite-vtable-selects.js";
import { populateStateCache } from "../../../state/cache/populate-state-cache.js";
import { isStaleStateCache } from "../../../state/cache/is-stale-state-cache.js";
import { markStateCacheAsFresh } from "../../../state/cache/mark-state-cache-as-stale.js";
import {
	createSchemaCacheTable,
	schemaKeyToCacheTableName,
} from "../../../state/cache/create-schema-cache-table.js";
import { getStateCacheTables } from "../../../state/cache/schema.js";
import { resolveCacheSchemaDefinition } from "../../../state/cache/schema-resolver.js";
import type { LixEngine } from "../../boot.js";

const DEFAULT_ALIAS_KEY = normalizeIdentifierValue(REWRITTEN_STATE_VTABLE);
const ORIGINAL_TABLE_KEY = normalizeIdentifierValue(INTERNAL_STATE_VTABLE);

type CacheAggregation = {
	foundReference: boolean;
	schemaKeys: Set<string>;
	schemaDynamic: boolean;
	versionIds: Set<string>;
	versionDynamic: boolean;
};

type PredicateAnalysis = {
	schemaKeys: Set<string>;
	schemaDynamic: boolean;
	versionIds: Set<string>;
	versionDynamic: boolean;
};

type ParameterState = { position: number };

/**
 * Ensures the state cache is populated when a query targets
 * `lix_internal_state_vtable`.
 *
 * @example
 * ```ts
 * const node = cachePopulator(context);
 * ```
 */
export const cachePopulator: PreprocessorStep = (context) => {
	const engine = context.getEngine?.();
	if (!engine) {
		return context.node;
	}

	const parameters = context.parameters ?? [];
	const aggregation: CacheAggregation = {
		foundReference: false,
		schemaKeys: new Set<string>(),
		schemaDynamic: false,
		versionIds: new Set<string>(),
		versionDynamic: false,
	};

	const state: ParameterState = { position: 0 };
	const node = context.node as StatementNode;
	collectCacheTargets(node, {
		parameters,
		state,
		aggregation,
	});

	if (!aggregation.foundReference) {
		return node;
	}

	if (aggregation.schemaDynamic) {
		throw new Error(
			"rewrite_vtable_selects requires literal schema_key predicates; received ambiguous filter."
		);
	}

	const schemaKeyHints = Array.from(aggregation.schemaKeys);
	const versionId =
		aggregation.versionDynamic || aggregation.versionIds.size !== 1
			? undefined
			: Array.from(aggregation.versionIds)[0];

	ensureFreshStateCache({
		engine,
		schemaKeys: aggregation.schemaKeys,
		schemaKeyHints,
		versionId,
	});

	return node;
};

function collectCacheTargets(
	node: StatementNode,
	args: {
		parameters: ReadonlyArray<unknown>;
		state: ParameterState;
		aggregation: CacheAggregation;
	}
): void {
	switch (node.node_kind) {
		case "select_statement":
			collectFromSelect(node, args);
			return;
		case "update_statement":
			for (const assignment of node.assignments) {
				consumeExpression(assignment.value, args);
			}
			consumeExpression(node.where_clause, args);
			return;
		case "delete_statement":
			consumeExpression(node.where_clause, args);
			return;
		case "insert_statement":
		case "raw_fragment":
		default:
			return;
	}
}

function collectFromSelect(
	select: SelectStatementNode,
	args: {
		parameters: ReadonlyArray<unknown>;
		state: ParameterState;
		aggregation: CacheAggregation;
	}
): void {
	const { aggregation } = args;

	for (const item of select.projection) {
		if (item.node_kind === "select_expression") {
			consumeExpression(item.expression, args);
		}
	}

	for (const clause of select.from_clauses) {
		consumeRelation(clause.relation, args);
		for (const join of clause.joins) {
			consumeRelation(join.relation, args);
			consumeExpression(join.on_expression, args);
		}
	}

	const references = collectInternalStateReferences(select);
	if (references.length > 0) {
		aggregation.foundReference = true;
		const aliasKeys = new Set<string>([
			DEFAULT_ALIAS_KEY,
			ORIGINAL_TABLE_KEY,
			...references
				.map((reference) => reference.normalizedAlias)
				.filter((alias): alias is string => alias !== null),
		]);

		const summary = analyzePredicate(select.where_clause, {
			parameters: args.parameters,
			state: args.state,
			aliasKeys,
			aggregation,
		});

		if (summary.schemaDynamic) {
			aggregation.schemaDynamic = true;
		}

		for (const key of summary.schemaKeys) {
			aggregation.schemaKeys.add(key);
		}

		if (summary.versionDynamic) {
			aggregation.versionDynamic = true;
			aggregation.versionIds.clear();
		} else if (!aggregation.versionDynamic) {
			for (const versionId of summary.versionIds) {
				aggregation.versionIds.add(versionId);
			}
		}
	} else if (select.where_clause) {
		consumeExpression(select.where_clause, args);
	}

	for (const order of select.order_by) {
		consumeExpression(order.expression, args);
	}
}

type ReferenceInfo = {
	alias: string | null;
	normalizedAlias: string | null;
};

function collectInternalStateReferences(
	select: SelectStatementNode
): ReferenceInfo[] {
	const references: ReferenceInfo[] = [];
	for (const clause of select.from_clauses) {
		const relation = clause.relation;
		if (relation.node_kind === "table_reference") {
			if (isInternalStateTable(relation)) {
				references.push({
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
					alias: getIdentifierValue(joinRelation.alias),
					normalizedAlias: normalizeAlias(joinRelation.alias),
				});
			}
		}
	}
	return references;
}

function normalizeAlias(alias: IdentifierNode | null): string | null {
	const value = getIdentifierValue(alias);
	return value ? normalizeIdentifierValue(value) : null;
}

function isInternalStateTable(table: TableReferenceNode): boolean {
	return objectNameMatches(table.name, INTERNAL_STATE_VTABLE);
}

function consumeRelation(
	relation: RelationNode,
	args: {
		parameters: ReadonlyArray<unknown>;
		state: ParameterState;
		aggregation: CacheAggregation;
	}
): void {
	switch (relation.node_kind) {
		case "table_reference":
			return;
		case "subquery":
			collectFromSelect(relation.statement, args);
			return;
		case "raw_fragment":
		default:
			return;
	}
}

function consumeExpression(
	expression: ExpressionNode | RawFragmentNode | null | undefined,
	args: {
		parameters: ReadonlyArray<unknown>;
		state: ParameterState;
		aggregation: CacheAggregation;
	}
): void {
	if (!expression) {
		return;
	}
	if ("sql_text" in expression) {
		return;
	}
	switch (expression.node_kind) {
		case "grouped_expression":
			consumeExpression(expression.expression, args);
			return;
		case "binary_expression":
			consumeExpression(expression.left, args);
			consumeExpression(expression.right, args);
			return;
		case "unary_expression":
			consumeExpression(expression.operand, args);
			return;
		case "parameter":
			resolveParameter(expression, args.state, args.parameters);
			return;
		case "in_list_expression":
			consumeExpression(expression.operand, args);
			for (const item of expression.items) {
				consumeExpression(item, args);
			}
			return;
		case "between_expression":
			consumeExpression(expression.operand, args);
			consumeExpression(expression.start, args);
			consumeExpression(expression.end, args);
			return;
		case "function_call":
			for (const argument of expression.arguments) {
				consumeExpression(argument, args);
			}
			return;
		case "subquery_expression":
			collectFromSelect(expression.statement, args);
			return;
		default:
			return;
	}
}

function analyzePredicate(
	expression: ExpressionNode | RawFragmentNode | null,
	args: {
		parameters: ReadonlyArray<unknown>;
		state: ParameterState;
		aliasKeys: Set<string>;
		aggregation: CacheAggregation;
	}
): PredicateAnalysis {
	const initial: PredicateAnalysis = {
		schemaKeys: new Set(),
		schemaDynamic: false,
		versionIds: new Set(),
		versionDynamic: false,
	};
	if (!expression) {
		return initial;
	}
	if ("sql_text" in expression) {
		return { ...initial, schemaDynamic: true, versionDynamic: true };
	}

	switch (expression.node_kind) {
		case "grouped_expression":
			return analyzePredicate(expression.expression, args);
		case "unary_expression": {
			const result = analyzePredicate(expression.operand, args);
			return result;
		}
		case "binary_expression":
			return analyzeBinaryExpression(expression, args);
		case "in_list_expression":
			return analyzeInListExpression(expression, args);
		case "between_expression": {
			consumeExpression(expression.operand, args);
			consumeExpression(expression.start, args);
			consumeExpression(expression.end, args);
			return { ...initial, schemaDynamic: true, versionDynamic: true };
		}
		case "subquery_expression":
			collectFromSelect(expression.statement, args);
			return { ...initial, schemaDynamic: true, versionDynamic: true };
		case "parameter":
			resolveParameter(expression, args.state, args.parameters);
			return { ...initial, schemaDynamic: true, versionDynamic: true };
		default:
			return initial;
	}
}

function analyzeBinaryExpression(
	expression: BinaryExpressionNode,
	args: {
		parameters: ReadonlyArray<unknown>;
		state: ParameterState;
		aliasKeys: Set<string>;
		aggregation: CacheAggregation;
	}
): PredicateAnalysis {
	const logical = expression.operator === "and" || expression.operator === "or";
	if (logical) {
		const left = analyzePredicate(expression.left, args);
		const right = analyzePredicate(expression.right, args);
		return mergeAnalyses(left, right);
	}

	const analysis: PredicateAnalysis = {
		schemaKeys: new Set(),
		schemaDynamic: false,
		versionIds: new Set(),
		versionDynamic: false,
	};

	const leftColumn = getColumnTarget(expression.left, args.aliasKeys);
	const rightColumn = getColumnTarget(expression.right, args.aliasKeys);

	const isEquality =
		expression.operator === "=" || expression.operator === "is";

	if (!isEquality) {
		if (leftColumn === "schema_key" || rightColumn === "schema_key") {
			analysis.schemaDynamic = true;
		}
		if (leftColumn === "version_id" || rightColumn === "version_id") {
			analysis.versionDynamic = true;
		}
		consumeExpression(expression.left, args);
		consumeExpression(expression.right, args);
		return analysis;
	}

	if (leftColumn === "schema_key") {
		const resolved = resolveStringOperand(expression.right, args);
		if (resolved.dynamic) {
			analysis.schemaDynamic = true;
		} else if (resolved.value !== null) {
			analysis.schemaKeys.add(resolved.value);
		}
	} else if (leftColumn === "version_id") {
		const resolved = resolveStringOperand(expression.right, args);
		if (resolved.dynamic) {
			analysis.versionDynamic = true;
		} else if (resolved.value !== null) {
			analysis.versionIds.add(resolved.value);
		}
	} else {
		consumeExpression(expression.left, args);
	}

	if (rightColumn === "schema_key") {
		const resolved = resolveStringOperand(expression.left, args);
		if (resolved.dynamic) {
			analysis.schemaDynamic = true;
		} else if (resolved.value !== null) {
			analysis.schemaKeys.add(resolved.value);
		}
	} else if (rightColumn === "version_id") {
		const resolved = resolveStringOperand(expression.left, args);
		if (resolved.dynamic) {
			analysis.versionDynamic = true;
		} else if (resolved.value !== null) {
			analysis.versionIds.add(resolved.value);
		}
	} else {
		consumeExpression(expression.right, args);
	}

	return analysis;
}

function analyzeInListExpression(
	expression: InListExpressionNode,
	args: {
		parameters: ReadonlyArray<unknown>;
		state: ParameterState;
		aliasKeys: Set<string>;
		aggregation: CacheAggregation;
	}
): PredicateAnalysis {
	const analysis: PredicateAnalysis = {
		schemaKeys: new Set(),
		schemaDynamic: false,
		versionIds: new Set(),
		versionDynamic: false,
	};

	const target = getColumnTarget(expression.operand, args.aliasKeys);
	if (!target) {
		consumeExpression(expression.operand, args);
		for (const item of expression.items) {
			consumeExpression(item, args);
		}
		return analysis;
	}

	for (const item of expression.items) {
		const resolved = resolveStringOperand(item, args);
		if (resolved.dynamic) {
			if (target === "schema_key") {
				analysis.schemaDynamic = true;
			} else if (target === "version_id") {
				analysis.versionDynamic = true;
			}
		} else if (resolved.value !== null) {
			if (target === "schema_key") {
				analysis.schemaKeys.add(resolved.value);
			} else if (target === "version_id") {
				analysis.versionIds.add(resolved.value);
			}
		}
	}

	return analysis;
}

function mergeAnalyses(...analyses: PredicateAnalysis[]): PredicateAnalysis {
	return analyses.reduce<PredicateAnalysis>(
		(accumulator, current) => {
			current.schemaKeys.forEach((key) => accumulator.schemaKeys.add(key));
			current.versionIds.forEach((id) => accumulator.versionIds.add(id));
			accumulator.schemaDynamic =
				accumulator.schemaDynamic || current.schemaDynamic;
			accumulator.versionDynamic =
				accumulator.versionDynamic || current.versionDynamic;
			return accumulator;
		},
		{
			schemaKeys: new Set(),
			schemaDynamic: false,
			versionIds: new Set(),
			versionDynamic: false,
		}
	);
}

function getColumnTarget(
	expression: ExpressionNode | RawFragmentNode,
	aliasKeys: Set<string>
): "schema_key" | "version_id" | null {
	if ("sql_text" in expression) {
		return null;
	}
	const target = unwrapExpression(expression);
	if (target.node_kind !== "column_reference") {
		return null;
	}
	const qualifier = getColumnQualifier(target);
	const column = getColumnName(target);
	if (qualifier && aliasKeys.has(qualifier)) {
		return column === "schema_key" || column === "version_id" ? column : null;
	}
	if (!qualifier && (column === "schema_key" || column === "version_id")) {
		return column;
	}
	return null;
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

function resolveStringOperand(
	expression: ExpressionNode | RawFragmentNode,
	args: {
		parameters: ReadonlyArray<unknown>;
		state: ParameterState;
		aliasKeys: Set<string>;
		aggregation: CacheAggregation;
	}
): { value: string | null; dynamic: boolean } {
	if ("sql_text" in expression) {
		return { value: null, dynamic: true };
	}

	const unwrapped = unwrapExpression(expression);
	switch (unwrapped.node_kind) {
		case "literal":
			if (typeof unwrapped.value === "string") {
				return { value: unwrapped.value, dynamic: false };
			}
			return { value: null, dynamic: true };
		case "parameter": {
			const resolved = resolveParameter(unwrapped, args.state, args.parameters);
			if (typeof resolved === "string") {
				return { value: resolved, dynamic: false };
			}
			return { value: null, dynamic: true };
		}
		default:
			consumeExpression(unwrapped, args);
			return { value: null, dynamic: true };
	}
}

function resolveParameter(
	parameter: ParameterExpressionNode,
	state: ParameterState,
	parameters: ReadonlyArray<unknown>
): unknown {
	const placeholder = parameter.placeholder ?? "?";
	if (placeholder === "?" || placeholder === "") {
		const index = state.position;
		state.position += 1;
		return index < parameters.length ? parameters[index] : undefined;
	}
	if (/^\?\d+$/.test(placeholder)) {
		const numeric = Number(placeholder.slice(1)) - 1;
		if (
			Number.isInteger(numeric) &&
			numeric >= 0 &&
			numeric < parameters.length
		) {
			return parameters[numeric];
		}
		return undefined;
	}
	// Named placeholders default to sequential behaviour.
	const index = state.position;
	state.position += 1;
	return index < parameters.length ? parameters[index] : undefined;
}

const guardDepth = new WeakMap<object, number>();

function ensureFreshStateCache(args: {
	engine: LixEngine;
	schemaKeys: Set<string>;
	schemaKeyHints: readonly string[];
	versionId: string | undefined;
}): void {
	const token = args.engine.runtimeCacheRef;
	if (!enterGuard(token)) {
		exitGuard(token);
		return;
	}
	try {
		if (!hasInternalStateVtable(args.engine)) {
			return;
		}

		ensureCacheTablesForSchemaKeys({
			engine: args.engine,
			schemaKeys: args.schemaKeys,
			schemaKeyHints: args.schemaKeyHints,
		});

		const needsRefresh = safeIsStaleStateCache(args.engine);
		if (!needsRefresh) {
			return;
		}

		safePopulateStateCache(args.engine, args.versionId);
	} finally {
		exitGuard(token);
	}
}

function enterGuard(token: object): boolean {
	const depth = guardDepth.get(token) ?? 0;
	guardDepth.set(token, depth + 1);
	return depth === 0;
}

function exitGuard(token: object): void {
	const depth = guardDepth.get(token);
	if (depth === undefined) {
		return;
	}
	if (depth <= 1) {
		guardDepth.delete(token);
		return;
	}
	guardDepth.set(token, depth - 1);
}

function hasInternalStateVtable(engine: Pick<LixEngine, "sqlite">): boolean {
	try {
		const result = engine.sqlite.exec({
			sql: `SELECT 1 FROM sqlite_schema WHERE type = 'table' AND name = 'lix_internal_state_vtable'`,
			returnValue: "resultRows",
			rowMode: "array",
		});
		return Array.isArray(result) && result.length > 0;
	} catch {
		return false;
	}
}

function safeIsStaleStateCache(
	engine: Pick<LixEngine, "hooks" | "executeSync">
): boolean {
	try {
		return isStaleStateCache({ engine });
	} catch (error) {
		if (isMissingInternalStateVtableError(error)) {
			return false;
		}
		throw error;
	}
}

function safePopulateStateCache(
	engine: Pick<
		LixEngine,
		"sqlite" | "runtimeCacheRef" | "hooks" | "executeSync"
	>,
	versionId: string | undefined
): void {
	try {
		populateStateCache({
			engine,
			options: versionId ? { version_id: versionId } : undefined,
		});
		markStateCacheAsFresh({ engine });
	} catch (error) {
		if (isMissingInternalStateVtableError(error)) {
			return;
		}
		throw error;
	}
}

function ensureCacheTablesForSchemaKeys(args: {
	engine: Pick<LixEngine, "executeSync" | "runtimeCacheRef" | "hooks">;
	schemaKeys: Set<string>;
	schemaKeyHints: readonly string[];
}): void {
	const keys = new Set<string>(args.schemaKeyHints);
	for (const key of args.schemaKeys) {
		keys.add(key);
	}
	if (keys.size === 0) {
		return;
	}

	const tableCache = getStateCacheTables({ engine: args.engine });
	for (const schemaKey of keys) {
		const tableName = schemaKeyToCacheTableName(schemaKey);
		if (tableCache.has(tableName)) {
			continue;
		}
		const schemaDefinition = resolveCacheSchemaDefinition({
			engine: args.engine,
			schemaKey,
		});
		if (!schemaDefinition) {
			continue;
		}
		const created = createSchemaCacheTable({
			engine: args.engine,
			schema: schemaDefinition,
		});
		tableCache.add(created);
	}
}

function isMissingInternalStateVtableError(error: unknown): boolean {
	if (!error || typeof error !== "object") {
		return false;
	}
	const message = String((error as any).message ?? "");
	return (
		message.includes("no such table: lix_internal_state_vtable") ||
		message.includes("no such module: lix_internal_state_vtable")
	);
}
