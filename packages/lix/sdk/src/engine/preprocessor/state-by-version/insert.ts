import {
	type BinaryExpressionNode,
	type ExpressionNode,
	type FunctionCallArgumentNode,
	type FunctionCallExpressionNode,
	identifier,
	type InsertStatementNode,
	type ObjectNameNode,
	type ParameterExpressionNode,
	type SegmentedStatementNode,
	type StatementSegmentNode,
} from "../sql-parser/nodes.js";
import { normalizeIdentifierValue } from "../sql-parser/ast-helpers.js";
import { normalizeSegmentedStatement } from "../sql-parser/parse.js";
import type { PreprocessorStep, PreprocessorStepContext } from "../types.js";
import { INTERNAL_STATE_VTABLE } from "../steps/rewrite-vtable-selects.js";

const STATE_BY_VERSION_VIEW = "state_by_version";
const WRITABLE_COLUMNS: readonly string[] = [
	"entity_id",
	"schema_key",
	"file_id",
	"version_id",
	"plugin_key",
	"snapshot_content",
	"schema_version",
	"inherited_from_version_id",
	"metadata",
	"untracked",
];
const REQUIRED_COLUMNS = new Set(
	WRITABLE_COLUMNS.slice(0, 7 /* required subset */)
);
const WRITABLE_COLUMN_SET = new Set(WRITABLE_COLUMNS);
const SKIPPABLE_COLUMNS = new Set([
	"created_at",
	"updated_at",
	"change_id",
	"commit_id",
	"writer_key",
	"source_tag",
]);

/**
 * Rewrites INSERT statements targeting the state_by_version view to write
 * directly into the internal state vtable. This bypasses SQLite's INSTEAD OF
 * triggers and keeps write routing fully within the preprocessor pipeline.
 *
 * @example
 * ```ts
 * const rewritten = rewriteStateByVersionInsert({ statements, parameters: [] });
 * ```
 */
export const rewriteStateByVersionInsert: PreprocessorStep = (context) => {
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
		if (segment.node_kind === "insert_statement") {
			const rewritten = rewriteInsertStatement(segment, context);
			if (rewritten) {
				if (rewritten !== segment) {
					changed = true;
				}
				return rewritten;
			}
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

function rewriteInsertStatement(
	insert: InsertStatementNode,
	context: PreprocessorStepContext
): StatementSegmentNode | null {
	const targetName = extractTableName(insert.target);
	if (
		!targetName ||
		normalizeIdentifierValue(targetName) !== STATE_BY_VERSION_VIEW
	) {
		return null;
	}

	if (insert.columns.length === 0) {
		return null;
	}

	if (insert.on_conflict) {
		return null;
	}

	if (insert.source.node_kind !== "insert_values") {
		return null;
	}

	const keptColumns: IdentifierNode[] = [];
	const keptColumnNames: string[] = [];
	const filteredRows = insert.source.rows.map(() => [] as ExpressionNode[]);
	const parameterSource = context.parameters ?? [];
	let sequentialCursor = 0;
	const reorderedParameters: unknown[] = [];

	for (let columnIndex = 0; columnIndex < insert.columns.length; columnIndex++) {
		const column = insert.columns[columnIndex]!;
		const normalized = normalizeIdentifierValue(column.value);
		const isWritable = WRITABLE_COLUMN_SET.has(normalized);
		const isSkippable = SKIPPABLE_COLUMNS.has(normalized);

		if (!isWritable && !isSkippable) {
			throw new Error(
				`Unsupported column '${normalized}' in INSERT INTO state_by_version`
			);
		}

		for (let rowIndex = 0; rowIndex < insert.source.rows.length; rowIndex++) {
			const expression = insert.source.rows[rowIndex]?.[columnIndex];
			if (!expression) {
				return null;
			}
			const values = extractParameterValues(expression, parameterSource, {
				sequentialCursorRef: () => sequentialCursor,
				setSequentialCursor: (value) => {
					sequentialCursor = value;
				},
			});
			if (isWritable) {
				filteredRows[rowIndex]!.push(expression);
				if (values.length > 0) {
					reorderedParameters.push(...values);
				}
			}
		}

		if (isWritable) {
			keptColumns.push(column);
			keptColumnNames.push(normalized);
		}
	}

	const finalColumns: IdentifierNode[] = [...keptColumns];
	const finalColumnNames: string[] = [...keptColumnNames];

	for (const optional of [
		"inherited_from_version_id",
		"metadata",
		"untracked",
	] as const) {
		if (!finalColumnNames.includes(optional)) {
			finalColumns.push(identifier(optional));
			finalColumnNames.push(optional);
		}
	}

	const rewrittenRows = rewriteRows(
		keptColumnNames,
		finalColumnNames,
		filteredRows
	);
	if (!rewrittenRows) {
		return null;
	}

	if (reorderedParameters.length > 0 || sequentialCursor > 0) {
		const remaining =
			sequentialCursor < parameterSource.length
				? parameterSource.slice(sequentialCursor)
				: [];
		context.setParameters?.([...reorderedParameters, ...remaining]);
	}

	context.trace?.push({
		step: "rewrite_state_by_version_insert",
		payload: {
			rows: rewrittenRows.length,
		},
	});

	return {
		...insert,
		target: buildObjectName(INTERNAL_STATE_VTABLE),
		columns: finalColumns,
		source: {
			node_kind: "insert_values",
			rows: rewrittenRows,
		},
	};
}

function rewriteRows(
	sourceColumns: readonly string[],
	targetColumns: readonly string[],
	rows: readonly (readonly ExpressionNode[])[]
): ExpressionNode[][] | null {
	const rewritten: ExpressionNode[][] = [];
	for (const row of rows) {
		if (row.length !== sourceColumns.length) {
			return null;
		}
		const map = new Map<string, ExpressionNode>();
		for (let i = 0; i < row.length; i++) {
			const column = sourceColumns[i];
			const expression = row[i];
			if (!column || !expression) {
				return null;
			}
			map.set(column, expression);
		}

		for (const required of REQUIRED_COLUMNS) {
			if (!map.has(required)) {
				return null;
			}
		}

		const expressions: ExpressionNode[] = [];
		for (let i = 0; i < targetColumns.length; i++) {
			const column = targetColumns[i];
			let resolved = map.get(column);
			if (!resolved) {
				resolved = defaultExpressionFor(column);
				if (!resolved) {
					return null;
				}
			}
			expressions.push(resolved);
		}

		rewritten.push(expressions);
	}

	return rewritten;
}

function defaultExpressionFor(column: string): ExpressionNode | null {
	if (column === "metadata" || column === "inherited_from_version_id") {
		return createLiteralNode(null);
	}
	if (column === "untracked") {
		return createLiteralNode(0);
	}
	return null;
}

function createLiteralNode(
	value: string | number | boolean | null
): ExpressionNode {
	return {
		node_kind: "literal",
		value,
	};
}

function buildObjectName(name: string): ObjectNameNode {
	return {
		node_kind: "object_name",
		parts: [identifier(name)],
	};
}

function extractTableName(name: ObjectNameNode): string | null {
	if (name.parts.length === 0) {
		return null;
	}
	const last = name.parts[name.parts.length - 1];
	return last?.value ?? null;
}

function extractParameterValues(
	node: ExpressionNode,
	source: ReadonlyArray<unknown>,
	cursor: {
		sequentialCursorRef: () => number;
		setSequentialCursor: (value: number) => void;
	}
): unknown[] {
	const values: unknown[] = [];
	const visit = (expression: ExpressionNode | null | undefined): void => {
		if (!expression) return;
		switch (expression.node_kind) {
			case "parameter": {
				const value = consumeParameterValue(expression, source, cursor);
				if (value !== undefined) {
					values.push(value);
				}
				break;
			}
			case "binary_expression":
				visit(expression.left);
				visit(expression.right);
				break;
			case "unary_expression":
				visit(expression.operand);
				break;
			case "function_call_expression":
				for (const arg of expression.arguments as FunctionCallArgumentNode[]) {
					if (arg.kind === "expression") {
						visit(arg.expression);
					}
				}
				break;
			case "grouped_expression":
				visit(expression.expression);
				break;
			case "case_expression":
				for (const whenThen of expression.cases) {
					visit(whenThen.when);
					visit(whenThen.then);
				}
				visit(expression.else);
				break;
			default:
				break;
		}
	};
	visit(node);
	return values;
}

function consumeParameterValue(
	_node: ParameterExpressionNode,
	source: ReadonlyArray<unknown>,
	cursor: {
		sequentialCursorRef: () => number;
		setSequentialCursor: (value: number) => void;
	}
): unknown {
	const index = cursor.sequentialCursorRef();
	const value = source[index];
	cursor.setSequentialCursor(index + 1);
	return value;
}
