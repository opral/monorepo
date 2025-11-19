import {
	type ExpressionNode,
	identifier,
	type IdentifierNode,
	type InsertStatementNode,
	type ObjectNameNode,
	type SegmentedStatementNode,
	type StatementSegmentNode,
} from "../sql-parser/nodes.js";
import { normalizeIdentifierValue } from "../sql-parser/ast-helpers.js";
import { normalizeSegmentedStatement } from "../sql-parser/parse.js";
import type { PreprocessorStep, PreprocessorStepContext } from "../types.js";
import { INTERNAL_STATE_VTABLE } from "../steps/rewrite-vtable-selects.js";
import {
	ALLOWED_COLUMNS,
	OPTIONAL_INSERT_COLUMNS,
	REQUIRED_WRITABLE_COLUMNS,
	STATE_BY_VERSION_VIEW,
} from "./shared.js";

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

	for (
		let columnIndex = 0;
		columnIndex < insert.columns.length;
		columnIndex++
	) {
		const column = insert.columns[columnIndex]!;
		const normalized = normalizeIdentifierValue(column.value);
		if (!ALLOWED_COLUMNS.has(normalized)) {
			throw new Error(
				`Unsupported column '${normalized}' in INSERT INTO state_by_version`
			);
		}

		for (let rowIndex = 0; rowIndex < insert.source.rows.length; rowIndex++) {
			const expression = insert.source.rows[rowIndex]?.[columnIndex];
			if (!expression) {
				return null;
			}
			filteredRows[rowIndex]!.push(expression);
		}

		keptColumns.push(column);
		keptColumnNames.push(normalized);
	}

	const finalColumns: IdentifierNode[] = [...keptColumns];
	const finalColumnNames: string[] = [...keptColumnNames];

	for (const optional of OPTIONAL_INSERT_COLUMNS) {
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
			if (!column || expression === undefined) {
				return null;
			}
			map.set(column, expression);
		}

		for (const required of REQUIRED_WRITABLE_COLUMNS) {
			if (!map.has(required)) {
				return null;
			}
		}

		const expressions: ExpressionNode[] = [];
		for (let i = 0; i < targetColumns.length; i++) {
			const column = targetColumns[i];
			if (!column) {
				return null;
			}
			let resolved = map.get(column);
			if (resolved === undefined) {
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

function defaultExpressionFor(column: string): ExpressionNode | undefined {
	if (column === "metadata" || column === "inherited_from_version_id") {
		return createLiteralNode(null);
	}
	if (column === "untracked") {
		return createLiteralNode(0);
	}
	return undefined;
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
