import type {
	BinaryExpressionNode,
	CompoundSelectNode,
	ExpressionNode,
	InListExpressionNode,
	LiteralNode,
	RawFragmentNode,
	SelectExpressionNode,
	SelectStatementNode,
	SubqueryExpressionNode,
} from "../sql-parser/nodes.js";
import {
	getColumnName,
	getIdentifierValue,
	objectNameMatches,
} from "../sql-parser/ast-helpers.js";
import type { AstVisitor } from "../sql-parser/visitor.js";
import { visitStatement } from "../sql-parser/visitor.js";
import type { PreprocessorStep } from "../types.js";

/**
 * Rewrites `version_id` predicates that pull their value from the
 * `active_version` view so downstream steps can treat the filter as a literal.
 */
export const rewriteActiveVersionSubquery: PreprocessorStep = (context) => {
	const resolveActiveVersionId = context.getActiveVersionId;
	const activeVersionId = resolveActiveVersionId
		? resolveActiveVersionId()
		: null;
	if (!activeVersionId) {
		return context.statements;
	}

	let anyChanges = false;
	const rewritten = context.statements.map((statement) => {
		let statementChanged = false;
		const segments = statement.segments.map((segment) => {
			if (segment.node_kind === "raw_fragment") {
				return segment;
			}
			const visitor = createVisitor(activeVersionId, () => {
				statementChanged = true;
				anyChanges = true;
			});
			const rewrittenSegment = visitStatement(segment, visitor);
			return rewrittenSegment;
		});
		if (!statementChanged) {
			return statement;
		}
		return {
			...statement,
			segments,
		};
	});

	return anyChanges ? rewritten : context.statements;
};

function createVisitor(
	activeVersionId: string,
	onChange: () => void
): AstVisitor {
	return {
		binary_expression(node) {
			const rewritten = maybeRewriteBinaryExpression(node, activeVersionId);
			if (rewritten !== node) {
				onChange();
				return rewritten;
			}
			return node;
		},
		in_list_expression(node) {
			const rewritten = maybeRewriteInListExpression(node, activeVersionId);
			if (rewritten !== node) {
				onChange();
				return rewritten;
			}
			return node;
		},
	};
}

function maybeRewriteBinaryExpression(
	node: BinaryExpressionNode,
	activeVersionId: string
): BinaryExpressionNode {
	if (node.operator !== "=") {
		return node;
	}
	const rightLiteral = literalForActiveVersionSubquery(
		node.right,
		activeVersionId
	);
	if (rightLiteral && isVersionIdColumn(node.left)) {
		return {
			...node,
			right: rightLiteral,
		};
	}
	const leftLiteral = literalForActiveVersionSubquery(
		node.left,
		activeVersionId
	);
	if (leftLiteral && isVersionIdColumn(node.right)) {
		return {
			...node,
			left: node.right,
			right: leftLiteral,
		};
	}
	return node;
}

function maybeRewriteInListExpression(
	node: InListExpressionNode,
	activeVersionId: string
): InListExpressionNode | BinaryExpressionNode {
	if (node.negated || node.items.length !== 1) {
		return node;
	}
	if (!isVersionIdColumn(node.operand)) {
		return node;
	}
	const literal = literalForActiveVersionSubquery(
		node.items[0],
		activeVersionId
	);
	if (!literal) {
		return node;
	}
	return {
		node_kind: "binary_expression",
		left: node.operand,
		operator: "=",
		right: literal,
	};
}

function literalForActiveVersionSubquery(
	expression: ExpressionNode | RawFragmentNode,
	activeVersionId: string
): LiteralNode | null {
	const subquery = extractSubqueryExpression(expression);
	if (!subquery) {
		return null;
	}
	if (!selectReturnsActiveVersion(subquery.statement)) {
		return null;
	}
	return {
		node_kind: "literal",
		value: activeVersionId,
	};
}

function extractSubqueryExpression(
	expression: ExpressionNode | RawFragmentNode
): SubqueryExpressionNode | null {
	const node = unwrapExpression(expression);
	if (
		node &&
		!("sql_text" in node) &&
		node.node_kind === "subquery_expression"
	) {
		return node;
	}
	return null;
}

function unwrapExpression(
	expression: ExpressionNode | RawFragmentNode | null
): ExpressionNode | RawFragmentNode | null {
	if (!expression) {
		return null;
	}
	if ("sql_text" in expression) {
		return expression;
	}
	if (expression.node_kind === "grouped_expression") {
		return unwrapExpression(expression.expression);
	}
	return expression;
}

function isVersionIdColumn(
	expression: ExpressionNode | RawFragmentNode
): boolean {
	const node = unwrapExpression(expression);
	if (!node || "sql_text" in node || node.node_kind !== "column_reference") {
		return false;
	}
	return getColumnName(node)?.toLowerCase() === "version_id";
}

function selectReturnsActiveVersion(
	statement: SelectStatementNode | CompoundSelectNode
): boolean {
	if (!statement || statement.node_kind !== "select_statement") {
		return false;
	}
	if (statement.from_clauses.length !== 1) {
		return false;
	}
	const clause = statement.from_clauses[0];
	if (clause.joins.length > 0) {
		return false;
	}
	if (!relationMatchesActiveVersion(clause.relation)) {
		return false;
	}
	if (statement.projection.length !== 1) {
		return false;
	}
	const projection = statement.projection[0];
	if (projection.node_kind !== "select_expression") {
		return false;
	}
	return isVersionIdSelectExpression(projection);
}

function relationMatchesActiveVersion(
	relation: SelectStatementNode["from_clauses"][number]["relation"]
): boolean {
	if (relation.node_kind === "table_reference") {
		return objectNameMatches(relation.name, "active_version");
	}
	if (relation.node_kind === "subquery") {
		const alias = relation.alias ? getIdentifierValue(relation.alias) : null;
		return alias?.toLowerCase() === "active_version";
	}
	return false;
}

function isVersionIdSelectExpression(
	projection: SelectExpressionNode
): boolean {
	return isVersionIdColumn(projection.expression);
}
