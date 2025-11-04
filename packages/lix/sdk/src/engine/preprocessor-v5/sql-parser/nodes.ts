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

export type SegmentedStatementNode = SqlNode & {
	readonly node_kind: "segmented_statement";
	readonly segments: readonly StatementSegmentNode[];
};

export type CompoundOperator = "union" | "union_all" | "intersect" | "except";

export type CompoundSelectBranch = {
	readonly operator: CompoundOperator;
	readonly select: SelectStatementNode;
};

export type CommonTableExpressionNode = SqlNode & {
	readonly node_kind: "common_table_expression";
	readonly name: IdentifierNode;
	readonly columns: readonly IdentifierNode[];
	readonly statement: SelectStatementNode | CompoundSelectNode;
};

export type WithClauseNode = SqlNode & {
	readonly node_kind: "with_clause";
	readonly recursive: boolean;
	readonly ctes: readonly CommonTableExpressionNode[];
};

export type CompoundSelectNode = SqlNode & {
	readonly node_kind: "compound_select";
	readonly first: SelectStatementNode;
	readonly compounds: readonly CompoundSelectBranch[];
	readonly order_by: readonly OrderByItemNode[];
	readonly limit: ExpressionNode | RawFragmentNode | null;
	readonly offset: ExpressionNode | RawFragmentNode | null;
	readonly with_clause: WithClauseNode | null;
};

export type StatementNode =
	| SelectStatementNode
	| InsertStatementNode
	| UpdateStatementNode
	| DeleteStatementNode
	| CompoundSelectNode;

export type StatementSegmentNode = RawFragmentNode | StatementNode;

export type SelectStatementNode = SqlNode & {
	readonly node_kind: "select_statement";
	readonly distinct: boolean;
	readonly projection: readonly SelectItemNode[];
	readonly from_clauses: readonly FromClauseNode[];
	readonly where_clause: ExpressionNode | RawFragmentNode | null;
	readonly group_by: readonly ExpressionNode[];
	readonly order_by: readonly OrderByItemNode[];
	readonly limit: ExpressionNode | RawFragmentNode | null;
	readonly offset: ExpressionNode | RawFragmentNode | null;
	readonly with_clause: WithClauseNode | null;
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
	readonly qualifier: readonly IdentifierNode[];
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

export type RelationNode = TableReferenceNode | SubqueryNode | RawFragmentNode;

export type TableReferenceNode = SqlNode & {
	readonly node_kind: "table_reference";
	readonly name: ObjectNameNode;
	readonly alias: IdentifierNode | null;
};

export type SubqueryNode = SqlNode & {
	readonly node_kind: "subquery";
	readonly statement: SelectStatementNode | CompoundSelectNode;
	readonly alias: IdentifierNode | null;
};

export type JoinClauseNode = SqlNode & {
	readonly node_kind: "join_clause";
	readonly join_type: JoinType;
	readonly relation: RelationNode;
	readonly on_expression: ExpressionNode | RawFragmentNode | null;
};

export type OrderByItemNode = SqlNode & {
	readonly node_kind: "order_by_item";
	readonly expression: ExpressionNode;
	readonly direction: "asc" | "desc" | null;
};

export type JoinType = "inner" | "left" | "right" | "full";

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

export type OnConflictDoNothingNode = SqlNode & {
	readonly node_kind: "on_conflict_do_nothing";
};

export type OnConflictDoUpdateNode = SqlNode & {
	readonly node_kind: "on_conflict_do_update";
	readonly assignments: readonly SetClauseNode[];
	readonly where: ExpressionNode | RawFragmentNode | null;
};

export type OnConflictActionNode =
	| OnConflictDoNothingNode
	| OnConflictDoUpdateNode;

export type OnConflictTargetNode = SqlNode & {
	readonly node_kind: "on_conflict_target";
	readonly expressions: readonly (ExpressionNode | RawFragmentNode)[];
	readonly where: ExpressionNode | RawFragmentNode | null;
};

export type OnConflictClauseNode = SqlNode & {
	readonly node_kind: "on_conflict_clause";
	readonly target: OnConflictTargetNode | null;
	readonly action: OnConflictActionNode;
};

export type InsertStatementNode = SqlNode & {
	readonly node_kind: "insert_statement";
	readonly target: ObjectNameNode;
	readonly columns: readonly IdentifierNode[];
	readonly source: InsertValuesNode;
	readonly on_conflict: OnConflictClauseNode | null;
};

export type InsertValuesNode = SqlNode & {
	readonly node_kind: "insert_values";
	readonly rows: readonly (readonly ExpressionNode[])[];
};

export type ExpressionNode =
	| ColumnReferenceNode
	| LiteralNode
	| BinaryExpressionNode
	| UnaryExpressionNode
	| ParameterExpressionNode
	| GroupedExpressionNode
	| InListExpressionNode
	| BetweenExpressionNode
	| FunctionCallExpressionNode
	| SubqueryExpressionNode
	| CaseExpressionNode
	| RawFragmentNode;

export type ColumnReferenceNode = SqlNode & {
	readonly node_kind: "column_reference";
	readonly path: readonly IdentifierNode[];
};

export type LiteralNode = SqlNode & {
	readonly node_kind: "literal";
	readonly value: string | number | boolean | null;
};

export type ParameterExpressionNode = SqlNode & {
	readonly node_kind: "parameter";
	readonly placeholder: string;
	readonly position: number;
};

export type FunctionCallExpressionNode = SqlNode & {
	readonly node_kind: "function_call";
	readonly name: IdentifierNode;
	readonly arguments: readonly FunctionCallArgumentNode[];
	readonly over: WindowSpecificationNode | WindowReferenceNode | null;
};

export type SubqueryExpressionNode = SqlNode & {
	readonly node_kind: "subquery_expression";
	readonly statement: SelectStatementNode | CompoundSelectNode;
};

export type GroupedExpressionNode = SqlNode & {
	readonly node_kind: "grouped_expression";
	readonly expression: ExpressionNode;
};

export type AllColumnsNode = SqlNode & {
	readonly node_kind: "all_columns";
};

export type FunctionCallArgumentNode = ExpressionNode | AllColumnsNode;

export type WindowReferenceNode = SqlNode & {
	readonly node_kind: "window_reference";
	readonly name: IdentifierNode;
};

export type WindowSpecificationNode = SqlNode & {
	readonly node_kind: "window_specification";
	readonly name: IdentifierNode | null;
	readonly partition_by: readonly ExpressionNode[];
	readonly order_by: readonly OrderByItemNode[];
	readonly frame: WindowFrameNode | null;
};

export type WindowFrameNode = SqlNode & {
	readonly node_kind: "window_frame";
	readonly units: "rows" | "range" | "groups";
	readonly start: WindowFrameBoundNode;
	readonly end: WindowFrameBoundNode | null;
};

export type WindowFrameBoundNode = SqlNode & {
	readonly node_kind: "window_frame_bound";
	readonly type:
		| "unbounded_preceding"
		| "unbounded_following"
		| "current_row"
		| "preceding"
		| "following";
	readonly offset: ExpressionNode | null;
};

export type InListExpressionNode = SqlNode & {
	readonly node_kind: "in_list_expression";
	readonly operand: ExpressionNode;
	readonly items: readonly ExpressionNode[];
	readonly negated: boolean;
};

export type BetweenExpressionNode = SqlNode & {
	readonly node_kind: "between_expression";
	readonly operand: ExpressionNode;
	readonly start: ExpressionNode;
	readonly end: ExpressionNode;
	readonly negated: boolean;
};

export type CaseWhenNode = {
	readonly condition: ExpressionNode;
	readonly result: ExpressionNode;
};

export type CaseExpressionNode = SqlNode & {
	readonly node_kind: "case_expression";
	readonly operand: ExpressionNode | null;
	readonly branches: readonly CaseWhenNode[];
	readonly else_result: ExpressionNode | null;
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
	| "is"
	| "is_not"
	| "+"
	| "-"
	| "*"
	| "/"
	| "%"
	| "->"
	| "->>";

export type IdentifierNode = SqlNode & {
	readonly node_kind: "identifier";
	readonly value: string;
	readonly quoted: boolean;
};

export type ObjectNameNode = SqlNode & {
	readonly node_kind: "object_name";
	readonly parts: readonly IdentifierNode[];
};

/**
 * Creates an identifier node.
 */
export function identifier(value: string, quoted = false): IdentifierNode {
	return {
		node_kind: "identifier",
		value,
		quoted,
	};
}

export function columnReference(parts: readonly string[]): ColumnReferenceNode {
	if (parts.length === 0) {
		throw new Error("columnReference requires at least one part");
	}
	return {
		node_kind: "column_reference",
		path: parts.map((part) => identifier(part)),
	};
}
