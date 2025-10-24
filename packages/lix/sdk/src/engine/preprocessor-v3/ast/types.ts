/**
 * Base shape shared by all v3 AST nodes.
 *
 * @example
 * ```ts
 * const node: SqlNode = { node_kind: "raw_fragment", sql_text: "SELECT 1" };
 * ```
 */
export type SqlNode = {
	readonly node_kind: string;
};

/**
 * Represents an SQL snippet that the parser does not model yet.
 *
 * @example
 * ```ts
 * const fragment: RawFragmentNode = {
 *   node_kind: "raw_fragment",
 *   sql_text: "SELECT * FROM projects",
 * };
 * ```
 */
export type RawFragmentNode = SqlNode & {
	readonly node_kind: "raw_fragment";
	readonly sql_text: string;
};

export type StatementNode =
	| SelectStatementNode
	| UpdateStatementNode
	| DeleteStatementNode
	| RawFragmentNode;

export type SelectStatementNode = SqlNode & {
	readonly node_kind: "select_statement";
	readonly projection: readonly SelectItemNode[];
	readonly from_clauses: readonly FromClauseNode[];
	readonly where_clause: ExpressionNode | RawFragmentNode | null;
};

export type SelectItemNode =
	| SelectStarNode
	| SelectQualifiedStarNode
	| SelectExpressionNode;

export type SelectStarNode = SqlNode & {
	readonly node_kind: "select_star";
};

export type SelectQualifiedStarNode = SqlNode & {
	readonly node_kind: "select_qualified_star";
	readonly qualifier: IdentifierNode;
};

export type SelectExpressionNode = SqlNode & {
	readonly node_kind: "select_expression";
	readonly expression: ExpressionNode;
	readonly alias: IdentifierNode | null;
};

export type FromClauseNode = SqlNode & {
	readonly node_kind: "from_clause";
	readonly relation: RelationNode;
	readonly joins: readonly JoinClauseNode[];
};

export type RelationNode =
	| TableReferenceNode
	| SubqueryNode
	| RawFragmentNode;

export type TableReferenceNode = SqlNode & {
	readonly node_kind: "table_reference";
	readonly name: ObjectNameNode;
	readonly alias: IdentifierNode | null;
};

export type SubqueryNode = SqlNode & {
	readonly node_kind: "subquery";
	readonly statement: SelectStatementNode;
	readonly alias: IdentifierNode;
};

export type JoinClauseNode = SqlNode & {
	readonly node_kind: "join_clause";
	readonly join_type: JoinType;
	readonly relation: RelationNode;
	readonly on_expression: ExpressionNode | RawFragmentNode | null;
};

export type JoinType =
	| "inner"
	| "left"
	| "right"
	| "full";

export type UpdateStatementNode = SqlNode & {
	readonly node_kind: "update_statement";
	readonly target: TableReferenceNode;
	readonly assignments: readonly SetClauseNode[];
	readonly where_clause: ExpressionNode | RawFragmentNode | null;
};

export type SetClauseNode = SqlNode & {
	readonly node_kind: "set_clause";
	readonly column: ColumnReferenceNode;
	readonly value: ExpressionNode;
};

export type DeleteStatementNode = SqlNode & {
	readonly node_kind: "delete_statement";
	readonly target: TableReferenceNode;
	readonly where_clause: ExpressionNode | RawFragmentNode | null;
};

export type ExpressionNode =
	| ColumnReferenceNode
	| LiteralNode
	| BinaryExpressionNode
	| UnaryExpressionNode
	| ParameterExpressionNode
	| RawFragmentNode;

export type ColumnReferenceNode = SqlNode & {
	readonly node_kind: "column_reference";
	readonly table: IdentifierNode | null;
	readonly column: IdentifierNode;
};

export type LiteralNode = SqlNode & {
	readonly node_kind: "literal";
	readonly value: string | number | boolean | null;
};

export type ParameterExpressionNode = SqlNode & {
	readonly node_kind: "parameter";
	readonly placeholder: string;
};

export type UnaryExpressionNode = SqlNode & {
	readonly node_kind: "unary_expression";
	readonly operator: UnaryOperator;
	readonly operand: ExpressionNode;
};

export type BinaryExpressionNode = SqlNode & {
	readonly node_kind: "binary_expression";
	readonly left: ExpressionNode;
	readonly operator: BinaryOperator;
	readonly right: ExpressionNode;
};

export type UnaryOperator = "not" | "minus";

export type BinaryOperator =
	| "="
	| "!="
	| "<>"
	| ">"
	| ">="
	| "<"
	| "<="
	| "and"
	| "or"
	| "like"
	| "not_like"
	| "in"
	| "not_in"
	| "+"
	| "-"
	| "*"
	| "/";

export type IdentifierNode = SqlNode & {
	readonly node_kind: "identifier";
	readonly value: string;
};

export type ObjectNameNode = SqlNode & {
	readonly node_kind: "object_name";
	readonly parts: readonly IdentifierNode[];
};
