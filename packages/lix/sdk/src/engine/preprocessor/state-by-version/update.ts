import {
	identifier,
	type ColumnReferenceNode,
	type ObjectNameNode,
	type SegmentedStatementNode,
	type SetClauseNode,
	type StatementSegmentNode,
	type TableReferenceNode,
	type UpdateStatementNode,
} from "../sql-parser/nodes.js";
import { normalizeIdentifierValue } from "../sql-parser/ast-helpers.js";
import { normalizeSegmentedStatement } from "../sql-parser/parse.js";
import type { PreprocessorStep, PreprocessorStepContext } from "../types.js";
import { INTERNAL_STATE_VTABLE } from "../steps/rewrite-vtable-selects.js";
import { ALLOWED_COLUMNS, STATE_BY_VERSION_VIEW } from "./shared.js";

export const rewriteStateByVersionUpdate: PreprocessorStep = (context) => {
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
		if (segment.node_kind !== "update_statement") {
			return segment;
		}

		const rewritten = rewriteUpdateStatement(segment, context);
		if (!rewritten) {
			return segment;
		}

		if (rewritten !== segment) {
			changed = true;
		}

		return rewritten;
	});

	if (!changed) {
		return statement;
	}

	return normalizeSegmentedStatement({
		...statement,
		segments,
	});
}

function rewriteUpdateStatement(
	update: UpdateStatementNode,
	context: PreprocessorStepContext
): StatementSegmentNode | null {
	const tableName = extractTableName(update.target);
	if (
		!tableName ||
		normalizeIdentifierValue(tableName) !== STATE_BY_VERSION_VIEW
	) {
		return null;
	}

	if (update.assignments.length === 0) {
		return null;
	}

	const normalizedAssignments = update.assignments.map((assignment) =>
		normalizeAssignment(assignment)
	);

	const alias =
		update.target.alias ??
		update.target.name.parts[update.target.name.parts.length - 1] ??
		null;

	const rewritten: UpdateStatementNode = {
		...update,
		assignments: normalizedAssignments,
		target: buildTableReference(INTERNAL_STATE_VTABLE, alias),
	};

	context.trace?.push({
		step: "rewrite_state_by_version_update",
		payload: {
			assignments: update.assignments.length,
		},
	});

	return rewritten;
}

function buildTableReference(
	name: string,
	alias: TableReferenceNode["alias"]
): TableReferenceNode {
	return {
		node_kind: "table_reference",
		name: buildObjectName(name),
		alias,
	};
}

function buildObjectName(name: string): ObjectNameNode {
	return {
		node_kind: "object_name",
		parts: [identifier(name)],
	};
}

function extractTableName(target: TableReferenceNode): string | null {
	const parts = target.name.parts;
	if (parts.length === 0) {
		return null;
	}
	return parts[parts.length - 1]?.value ?? null;
}

function getColumnName(column: ColumnReferenceNode): string {
	const last = column.path[column.path.length - 1];
	return last?.value ?? "";
}

function normalizeAssignment(assignment: SetClauseNode): SetClauseNode {
	const columnName = getColumnName(assignment.column);
	const normalized = normalizeIdentifierValue(columnName);
	if (!ALLOWED_COLUMNS.has(normalized)) {
		throw new Error(
			`Unsupported column '${normalized}' in UPDATE state_by_version`
		);
	}

	const lastSegment = assignment.column.path[assignment.column.path.length - 1];
	const simplifiedColumn: ColumnReferenceNode =
		assignment.column.path.length === 1 || !lastSegment
			? assignment.column
			: {
					...assignment.column,
					path: [lastSegment],
				};

	return {
		...assignment,
		column: simplifiedColumn,
	};
}
