import {
	type BinaryExpressionNode,
	type ColumnReferenceNode,
	type ExpressionNode,
	type FunctionCallExpressionNode,
	type IdentifierNode,
	type InsertStatementNode,
	type LiteralNode,
	type OnConflictDoUpdateNode,
	type OnConflictTargetNode,
	type ParameterExpressionNode,
	type SetClauseNode,
	type SegmentedStatementNode,
	type StatementSegmentNode,
	type SelectStatementNode,
	type TableReferenceNode,
	type UnaryExpressionNode,
} from "../sql-parser/nodes.js";
import { normalizeIdentifierValue } from "../sql-parser/ast-helpers.js";
import { normalizeSegmentedStatement } from "../sql-parser/parse.js";
import type { PreprocessorStep, PreprocessorStepContext } from "../types.js";
import { INTERNAL_STATE_VTABLE } from "./rewrite-vtable-selects.js";

const REQUIRED_UPDATE_COLUMNS = [
	"entity_id",
	"schema_key",
	"file_id",
	"version_id",
	"plugin_key",
] as const;

/**
 * Rewrites INSERT ... ON CONFLICT DO UPDATE targeting the vtable into a two-step
 * sequence:
 *
 * 1) INSERT ... ON CONFLICT DO NOTHING
 * 2) UPDATE ... WHERE changes() = 0 AND <conflict predicate>
 *
 * This avoids the SQLite vtable UPSERT limitation while keeping a single
 * JS<->WASM round trip.
 */
export const rewriteVtableInsertOnConflict: PreprocessorStep = (context) => {
	let changed = false;
	const rewrittenStatements: SegmentedStatementNode[] = [];

	for (const statement of context.statements) {
		const replacements = rewriteSegmentedStatement(statement, context);
		if (replacements.length !== 1 || replacements[0] !== statement) {
			changed = true;
		}
		rewrittenStatements.push(...replacements);
	}

	return changed ? rewrittenStatements : context.statements;
};

function rewriteSegmentedStatement(
	statement: SegmentedStatementNode,
	context: PreprocessorStepContext
): SegmentedStatementNode[] {
	if (statement.segments.length !== 1) {
		return [statement];
	}
	const segment = statement.segments[0]!;
	if (segment.node_kind !== "insert_statement") {
		return [statement];
	}

	const rewritten = rewriteInsert(segment, context);
	if (!rewritten) {
		return [statement];
	}

	context.trace?.push({
		step: "rewrite_vtable_insert_on_conflict",
		payload: null,
	});

	const insertStatement = normalizeSegmentedStatement({
		...statement,
		segments: [rewritten.insertSegment],
	});
	const updateStatement = normalizeSegmentedStatement({
		...statement,
		segments: [rewritten.updateSegment],
	});

	return [insertStatement, updateStatement];
}

type PreprocessorRewriteResult = {
	insertSegment: StatementSegmentNode;
	updateSegment: StatementSegmentNode;
};

function rewriteInsert(
	insert: InsertStatementNode,
	context: PreprocessorStepContext
): PreprocessorRewriteResult | null {
	if (!insert.on_conflict) return null;
	const targetName = extractTableName(insert.target);
	if (!targetName || targetName !== INTERNAL_STATE_VTABLE) return null;
	if (insert.source.node_kind !== "insert_values") return null;
	if (insert.source.rows.length !== 1) return null;

	const action = insert.on_conflict.action;
	if (action.node_kind !== "on_conflict_do_update") return null;

	const conflictTarget = insert.on_conflict.target;
	const keyColumns = extractConflictColumns(conflictTarget);
	if (!keyColumns) return null;

	const row = insert.source.rows[0]!;
	const columnMap = buildColumnValueMap(insert.columns, row);
	if (!columnMap) return null;

	const transformedAssignments = transformAssignments(action, columnMap);
	if (!transformedAssignments) return null;
	const assignments = ensureRequiredAssignments(
		transformedAssignments,
		columnMap
	);
	if (!assignments) return null;

	const transformedWhere = transformExpression(action.where, columnMap);
	const conflictPredicate = buildConflictPredicate(keyColumns, columnMap);
	if (!conflictPredicate) return null;

	const updateWhere =
		transformedWhere && conflictPredicate
			? binaryExpression(
					groupedExpression(conflictPredicate),
					"and",
					groupedExpression(transformedWhere)
				)
			: transformedWhere ?? conflictPredicate;

	const updateStatement: StatementSegmentNode = {
		node_kind: "update_statement",
		target: tableReference(insert.target),
		assignments,
		where_clause: updateWhere,
	};

	const insertSelectWhere = unaryExpression("not", {
		node_kind: "exists_expression",
		statement: buildExistsSubquery(conflictPredicate),
	});

	const insertSelect: StatementSegmentNode = {
		node_kind: "insert_statement",
		target: insert.target,
		columns: insert.columns,
		on_conflict: null,
		source: buildInsertSelectSource(insert.columns, columnMap, insertSelectWhere),
	};

	const inlinedAssignments = inlineParametersInAssignments(
		assignments,
		context.parameters ?? []
	);
	const inlinedWhere = inlineParameters(updateWhere, context.parameters ?? []);
	if (!inlinedAssignments || inlinedWhere === undefined) return null;

	return {
		insertSegment: insertSelect,
		updateSegment: {
			...updateStatement,
			assignments: inlinedAssignments,
			where_clause: inlinedWhere,
		},
	};
}

function tableReference(name: InsertStatementNode["target"]): TableReferenceNode {
	return {
		node_kind: "table_reference",
		name,
		alias: null,
	};
}

function ensureRequiredAssignments(
	assignments: readonly SetClauseNode[],
	columnMap: Map<string, ExpressionNode>
): readonly SetClauseNode[] | null {
	const existing = new Set(
		assignments.map(
			(assignment) =>
				assignment.column.path.at(-1)?.value &&
				normalizeIdentifierValue(String(assignment.column.path.at(-1)!.value))
		)
	);

	const augmented: SetClauseNode[] = [...assignments];

	for (const column of REQUIRED_UPDATE_COLUMNS) {
		if (existing.has(column)) continue;
		const value = columnMap.get(column);
		if (!value) return null;
		augmented.push({
			node_kind: "set_clause",
			column: columnReference([column]),
			value,
		});
		existing.add(column);
	}

	for (const [column, value] of columnMap.entries()) {
		if (existing.has(column)) continue;
		augmented.push({
			node_kind: "set_clause",
			column: columnReference([column]),
			value,
		});
	}

	return augmented;
}

function inlineParameters(
	expression: ExpressionNode | null,
	parameters: ReadonlyArray<unknown>
): ExpressionNode | null {
	if (!expression) return null;
	switch (expression.node_kind) {
		case "parameter": {
			const value = parameters[expression.position];
			return value === undefined ? expression : literal(value as any);
		}
		case "grouped_expression": {
			const expr = inlineParameters(expression.expression, parameters);
			return expr ? groupedExpression(expr) : null;
		}
		case "unary_expression": {
			const operand = inlineParameters(expression.operand, parameters);
			return operand ? { ...expression, operand } : null;
		}
		case "binary_expression": {
			const left = inlineParameters(expression.left, parameters);
			const right = inlineParameters(expression.right, parameters);
			return left && right
				? ({ ...expression, left, right } satisfies BinaryExpressionNode)
				: null;
		}
		case "function_call": {
			const args: Array<FunctionCallExpressionNode["arguments"][number]> = [];
			for (const arg of expression.arguments) {
				if (arg.node_kind === "all_columns") {
					args.push(arg);
					continue;
				}
				const transformed = inlineParameters(arg, parameters);
				if (transformed) {
					args.push(transformed);
				}
			}
			return { ...expression, arguments: args };
		}
		case "column_reference":
		case "literal":
		case "raw_fragment":
			return expression;
		default:
			return expression;
	}
}

function inlineParametersInAssignments(
	assignments: readonly SetClauseNode[],
	parameters: ReadonlyArray<unknown>
): readonly SetClauseNode[] | null {
	const result: SetClauseNode[] = [];
	for (const assignment of assignments) {
		const value = inlineParameters(assignment.value, parameters);
		result.push({
			...assignment,
			value: value ?? assignment.value,
		});
	}
	return result;
}

function extractConflictColumns(
	target: OnConflictTargetNode | null
): string[] | null {
	if (!target) return null;
	const columns: string[] = [];
	for (const expr of target.expressions) {
		if (expr.node_kind !== "column_reference") {
			return null;
		}
		const part = expr.path[expr.path.length - 1];
		if (!part || typeof part.value !== "string") return null;
		columns.push(normalizeIdentifierValue(part.value));
	}
	return columns;
}

function buildColumnValueMap(
	columns: readonly IdentifierNode[],
	row: readonly ExpressionNode[]
): Map<string, ExpressionNode> | null {
	if (columns.length !== row.length) return null;
	const map = new Map<string, ExpressionNode>();
	for (let i = 0; i < columns.length; i++) {
		const column = columns[i];
		if (!column || typeof column.value !== "string") return null;
		const name = normalizeIdentifierValue(column.value);
		const value = normalizeExpressionParameters(row[i]!);
		if (!name || value === undefined) return null;
		map.set(name, value);
	}
	return map;
}

function transformAssignments(
	action: OnConflictDoUpdateNode,
	columnMap: Map<string, ExpressionNode>
): readonly SetClauseNode[] | null {
	const result: SetClauseNode[] = [];
	for (const assignment of action.assignments) {
		const column = assignment.column.path.at(-1);
		if (!column) return null;
		const transformedValue = transformExpression(assignment.value, columnMap);
		if (!transformedValue) return null;
		result.push({
			node_kind: "set_clause",
			column: assignment.column,
			value: transformedValue,
		});
	}
	return result;
}

function transformExpression(
	expression: ExpressionNode | null,
	columnMap: Map<string, ExpressionNode>
): ExpressionNode | null {
	if (!expression) return null;
	switch (expression.node_kind) {
		case "column_reference": {
			const [first, second] = expression.path;
			if (
				first &&
				typeof first.value === "string" &&
				normalizeIdentifierValue(first.value) === "excluded" &&
				second &&
				typeof second.value === "string"
			) {
				const replacement = columnMap.get(
					normalizeIdentifierValue(second.value)
				);
				return replacement ?? null;
			}
			return expression;
		}
	case "literal":
	case "raw_fragment":
		return expression;
	case "parameter":
		return normalizeParameterNode(expression);
		case "grouped_expression": {
			const inner = transformExpression(expression.expression, columnMap);
			return inner ? groupedExpression(inner) : null;
		}
		case "unary_expression": {
			const operand = transformExpression(expression.operand, columnMap);
			return operand
				? { ...expression, operand }
				: null;
		}
		case "binary_expression": {
			const left = transformExpression(expression.left, columnMap);
			const right = transformExpression(expression.right, columnMap);
			return left && right
				? ({ ...expression, left, right } satisfies BinaryExpressionNode)
				: null;
		}
		case "function_call": {
			const args: Array<FunctionCallExpressionNode["arguments"][number]> = [];
			for (const arg of expression.arguments) {
				if (arg.node_kind === "all_columns") {
					args.push(arg);
					continue;
				}
				const transformed = transformExpression(arg, columnMap);
				if (!transformed) return null;
				args.push(transformed);
			}
			return { ...expression, arguments: args };
		}
		default:
			return null;
	}
}

function normalizeExpressionParameters(expression: ExpressionNode): ExpressionNode {
	switch (expression.node_kind) {
		case "parameter":
			return normalizeParameterNode(expression);
		case "literal":
		case "raw_fragment":
		case "column_reference":
			return expression;
		case "grouped_expression":
			return groupedExpression(
				normalizeExpressionParameters(expression.expression)
			);
		case "unary_expression":
			return {
				...expression,
				operand: normalizeExpressionParameters(expression.operand),
			};
		case "binary_expression":
			return {
				...expression,
				left: normalizeExpressionParameters(expression.left),
				right: normalizeExpressionParameters(expression.right),
			};
		case "function_call":
			return {
				...expression,
				arguments: expression.arguments.map((arg) =>
					arg.node_kind === "all_columns"
						? arg
						: normalizeExpressionParameters(arg)
				),
			};
		default:
			return expression;
	}
}

function normalizeParameterNode(
	parameter: ParameterExpressionNode
): ParameterExpressionNode {
	if (parameter.placeholder === "" || parameter.placeholder === "?") {
		return {
			...parameter,
			placeholder: `?${parameter.position + 1}`,
		};
	}
	return parameter;
}

function buildConflictPredicate(
	columns: readonly string[],
	columnMap: Map<string, ExpressionNode>
): ExpressionNode | null {
	if (columns.length === 0) return null;

	let predicate: ExpressionNode | null = null;
	for (const name of columns) {
		const value = columnMap.get(name);
		if (!value) return null;
		const clause = binaryExpression(columnReference([name]), "=", value);
		predicate = predicate
			? binaryExpression(groupedExpression(predicate), "and", groupedExpression(clause))
			: clause;
	}
	return predicate;
}

function buildInsertSelectSource(
	columns: readonly IdentifierNode[],
	columnMap: Map<string, ExpressionNode>,
	where_clause: ExpressionNode
): SelectStatementNode {
	const projection = columns.map((col) => {
		const value = columnMap.get(normalizeIdentifierValue(col.value));
		if (!value) {
			throw new Error("Missing value for column in insert select");
		}
		return {
			node_kind: "select_expression",
			expression: value,
			alias: null,
		} as const;
	});
	return {
		node_kind: "select_statement",
		distinct: false,
		projection,
		from_clauses: [],
		where_clause,
		group_by: [],
		order_by: [],
		limit: null,
		offset: null,
		with_clause: null,
	};
}

function buildExistsSubquery(predicate: ExpressionNode): SelectStatementNode {
	return {
		node_kind: "select_statement",
		distinct: false,
		projection: [
			{
				node_kind: "select_expression",
				expression: literal(1),
				alias: null,
			},
		],
		from_clauses: [
			{
				node_kind: "from_clause",
				relation: tableReference({
					node_kind: "object_name",
					parts: [identifier(INTERNAL_STATE_VTABLE)],
				}),
				joins: [],
			},
		],
		where_clause: predicate,
		group_by: [],
		order_by: [],
		limit: null,
		offset: null,
		with_clause: null,
	};
}

function extractTableName(name: InsertStatementNode["target"]): string | null {
	const last = name.parts[name.parts.length - 1];
	if (!last) return null;
	return normalizeIdentifierValue(last.value);
}

function columnReference(path: readonly string[]): ColumnReferenceNode {
	return {
		node_kind: "column_reference",
		path: path.map((part) => identifier(part)),
	};
}

function identifier(value: string): IdentifierNode {
	return { node_kind: "identifier", value, quoted: false };
}

function literal(value: string | number | boolean | null): LiteralNode {
	return { node_kind: "literal", value };
}

function functionCall(
	name: IdentifierNode,
	args: readonly ExpressionNode[]
): FunctionCallExpressionNode {
	return {
		node_kind: "function_call",
		name,
		arguments: [...args],
		over: null,
	};
}

function unaryExpression(
	operator: UnaryExpressionNode["operator"],
	operand: ExpressionNode
): UnaryExpressionNode {
	return { node_kind: "unary_expression", operator, operand };
}

function groupedExpression(expression: ExpressionNode): ExpressionNode {
	return { node_kind: "grouped_expression", expression };
}

function binaryExpression(
	left: ExpressionNode,
	operator: BinaryExpressionNode["operator"],
	right: ExpressionNode
): BinaryExpressionNode {
	return { node_kind: "binary_expression", left, operator, right };
}
