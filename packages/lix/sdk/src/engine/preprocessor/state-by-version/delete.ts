import {
	identifier,
	type DeleteStatementNode,
	type ObjectNameNode,
	type SegmentedStatementNode,
	type StatementSegmentNode,
	type TableReferenceNode,
} from "../sql-parser/nodes.js";
import { normalizeIdentifierValue } from "../sql-parser/ast-helpers.js";
import { normalizeSegmentedStatement } from "../sql-parser/parse.js";
import type { PreprocessorStep, PreprocessorStepContext } from "../types.js";
import { INTERNAL_STATE_VTABLE } from "../steps/rewrite-vtable-selects.js";
import { STATE_BY_VERSION_VIEW } from "./shared.js";

export const rewriteStateByVersionDelete: PreprocessorStep = (context) => {
	let anyChanges = false;
	const rewrittenStatements = context.statements.map((statement) => {
		const rewritten = rewriteSegmentedStatement(statement);
		if (rewritten !== statement) {
			anyChanges = true;
		}
		return rewritten;
	});

	return anyChanges ? rewrittenStatements : context.statements;
};

function rewriteSegmentedStatement(
	statement: SegmentedStatementNode
): SegmentedStatementNode {
	let changed = false;
	const segments = statement.segments.map((segment) => {
		if (segment.node_kind !== "delete_statement") {
			return segment;
		}

		const rewritten = rewriteDeleteStatement(segment);
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

function rewriteDeleteStatement(
	statement: DeleteStatementNode
): StatementSegmentNode | null {
	const tableName = extractTableName(statement.target);
	if (
		!tableName ||
		normalizeIdentifierValue(tableName) !== STATE_BY_VERSION_VIEW
	) {
		return null;
	}

	const aliasNode =
		statement.target.alias ?? identifier(STATE_BY_VERSION_VIEW);
	const rewritten: DeleteStatementNode = {
		...statement,
		target: buildTableReference(INTERNAL_STATE_VTABLE, aliasNode),
	};

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
