import type {
	BetweenExpressionNode,
	BinaryExpressionNode,
	ColumnReferenceNode,
	DeleteStatementNode,
	InsertStatementNode,
	InsertValuesNode,
	ExpressionNode,
	FromClauseNode,
	GroupedExpressionNode,
	IdentifierNode,
	InListExpressionNode,
	JoinClauseNode,
	LiteralNode,
	ObjectNameNode,
	OrderByItemNode,
	ParameterExpressionNode,
	RawFragmentNode,
	SelectExpressionNode,
	SelectItemNode,
	SelectQualifiedStarNode,
	SelectStarNode,
	SelectStatementNode,
	CompoundSelectNode,
	SegmentedStatementNode,
	SetClauseNode,
	SqlNode,
	StatementSegmentNode,
	StatementNode,
	SubqueryNode,
	TableReferenceNode,
	UnaryExpressionNode,
	UpdateStatementNode,
} from "./nodes.js";

export type VisitContext = {
	readonly parent: SqlNode | null;
	readonly property: string | null;
	readonly index?: number;
};

type NodeKindMap = {
	readonly raw_fragment: RawFragmentNode;
	readonly select_statement: SelectStatementNode;
	readonly compound_select: CompoundSelectNode;
	readonly insert_statement: InsertStatementNode;
	readonly update_statement: UpdateStatementNode;
	readonly delete_statement: DeleteStatementNode;
	readonly segmented_statement: SegmentedStatementNode;
	readonly select_star: SelectStarNode;
	readonly select_qualified_star: SelectQualifiedStarNode;
	readonly select_expression: SelectExpressionNode;
	readonly from_clause: FromClauseNode;
	readonly join_clause: JoinClauseNode;
	readonly table_reference: TableReferenceNode;
	readonly subquery: SubqueryNode;
	readonly order_by_item: OrderByItemNode;
	readonly set_clause: SetClauseNode;
	readonly column_reference: ColumnReferenceNode;
	readonly literal: LiteralNode;
	readonly parameter: ParameterExpressionNode;
	readonly grouped_expression: GroupedExpressionNode;
	readonly binary_expression: BinaryExpressionNode;
	readonly unary_expression: UnaryExpressionNode;
	readonly in_list_expression: InListExpressionNode;
	readonly between_expression: BetweenExpressionNode;
	readonly identifier: IdentifierNode;
	readonly object_name: ObjectNameNode;
	readonly insert_values: InsertValuesNode;
};

type NodeKind = keyof NodeKindMap;

type NodeTransformResult<T extends SqlNode> = SqlNode | T | void;

export type AstVisitor = {
	readonly enter?: (node: SqlNode, context: VisitContext) => SqlNode | void;
	readonly exit?: (node: SqlNode, context: VisitContext) => SqlNode | void;
} & {
	readonly [K in NodeKind]?: (
		node: NodeKindMap[K],
		context: VisitContext
	) => NodeTransformResult<NodeKindMap[K]>;
} & {
	readonly [K in NodeKind as `${K}_exit`]?: (
		node: NodeKindMap[K],
		context: VisitContext
	) => NodeTransformResult<NodeKindMap[K]>;
};

/**
 * Traverses and optionally transforms a statement node.
 *
 * @example
 * ```ts
 * const rewritten = visitStatement(statement, visitor);
 * ```
 */
export function visitStatement<T extends StatementNode>(
	statement: T,
	visitor: AstVisitor
): T {
	return visitNode(statement, visitor, {
		parent: null,
		property: null,
	}) as T;
}

/**
 * Specialised helper for visiting select statements.
 *
 * @example
 * ```ts
 * const rewritten = visitSelectStatement(select, visitor);
 * ```
 */
export function visitSelectStatement(
	statement: SelectStatementNode,
	visitor: AstVisitor
): SelectStatementNode {
	return visitStatement(statement, visitor) as SelectStatementNode;
}

function visitNode<T extends SqlNode>(
	node: T,
	visitor: AstVisitor,
	context: VisitContext
): T {
	let current: SqlNode = applyEnterHandlers(node, visitor, context);
	current = traverseNode(current, visitor, context);
	current = applyExitHandlers(current, visitor, context);
	return current as T;
}

function applyEnterHandlers(
	node: SqlNode,
	visitor: AstVisitor,
	context: VisitContext
): SqlNode {
	let current: SqlNode = node;
	const genericResult = visitor.enter?.(current, context);
	if (genericResult) {
		current = genericResult;
	}
	const specific = getHandler(visitor, current.node_kind);
	if (specific) {
		const result = specific(current, context);
		if (result) {
			current = result;
		}
	}
	return current;
}

function applyExitHandlers(
	node: SqlNode,
	visitor: AstVisitor,
	context: VisitContext
): SqlNode {
	let current: SqlNode = node;
	const specific = getExitHandler(visitor, current.node_kind);
	if (specific) {
		const result = specific(current, context);
		if (result) {
			current = result;
		}
	}
	const genericResult = visitor.exit?.(current, context);
	if (genericResult) {
		current = genericResult;
	}
	return current;
}

function getHandler(
	visitor: AstVisitor,
	kind: string
): ((node: SqlNode, context: VisitContext) => SqlNode | void) | undefined {
	return (
		visitor as Record<
			string,
			((node: SqlNode, context: VisitContext) => SqlNode | void) | undefined
		>
	)[kind];
}

function getExitHandler(
	visitor: AstVisitor,
	kind: string
): ((node: SqlNode, context: VisitContext) => SqlNode | void) | undefined {
	return (
		visitor as Record<
			string,
			((node: SqlNode, context: VisitContext) => SqlNode | void) | undefined
		>
	)[`${kind}_exit`];
}

function traverseNode(
	node: SqlNode,
	visitor: AstVisitor,
	context: VisitContext
): SqlNode {
	switch (node.node_kind) {
		case "segmented_statement":
			return traverseSegmentedStatement(
				node as SegmentedStatementNode,
				visitor
			);
		case "compound_select":
			return traverseCompoundSelect(node as CompoundSelectNode, visitor);
		case "select_statement":
			return traverseSelectStatement(node as SelectStatementNode, visitor);
		case "insert_statement":
			return traverseInsertStatement(node as InsertStatementNode, visitor);
		case "update_statement":
			return traverseUpdateStatement(node as UpdateStatementNode, visitor);
		case "delete_statement":
			return traverseDeleteStatement(node as DeleteStatementNode, visitor);
		case "from_clause":
			return traverseFromClause(node as FromClauseNode, visitor);
		case "join_clause":
			return traverseJoinClause(node as JoinClauseNode, visitor);
		case "table_reference":
			return traverseTableReference(node as TableReferenceNode, visitor);
		case "subquery":
			return traverseSubquery(node as SubqueryNode, visitor);
		case "order_by_item":
			return traverseOrderByItem(node as OrderByItemNode, visitor);
		case "set_clause":
			return traverseSetClause(node as SetClauseNode, visitor);
		case "select_expression":
			return traverseSelectExpression(node as SelectExpressionNode, visitor);
		case "select_qualified_star":
			return traverseSelectQualifiedStar(
				node as SelectQualifiedStarNode,
				visitor
			);
		case "column_reference":
			return traverseColumnReference(node as ColumnReferenceNode, visitor);
		case "grouped_expression":
			return traverseGroupedExpression(node as GroupedExpressionNode, visitor);
		case "binary_expression":
			return traverseBinaryExpression(node as BinaryExpressionNode, visitor);
		case "unary_expression":
			return traverseUnaryExpression(node as UnaryExpressionNode, visitor);
		case "in_list_expression":
			return traverseInListExpression(node as InListExpressionNode, visitor);
		case "between_expression":
			return traverseBetweenExpression(node as BetweenExpressionNode, visitor);
		case "insert_values":
			return traverseInsertValues(node as InsertValuesNode, visitor);
		case "object_name":
			return traverseObjectName(node as ObjectNameNode, visitor);
		case "select_star":
		case "literal":
		case "parameter":
		case "identifier":
		case "raw_fragment":
			return node;
		default:
			return node;
	}
}

/**
 * Visits each segment in a statement sequence.
 *
 * @example
 * ```ts
 * const rewritten = traverseStatementSequence(node, visitor);
 * ```
 */
function traverseSegmentedStatement(
	node: SegmentedStatementNode,
	visitor: AstVisitor
): SegmentedStatementNode {
	const segments = visitArray(node.segments, node, "segments", visitor);
	if (segments === node.segments) {
		return node;
	}
	return {
		...node,
		segments: segments as readonly StatementSegmentNode[],
	};
}

function traverseCompoundSelect(
	node: CompoundSelectNode,
	visitor: AstVisitor
): CompoundSelectNode {
	let changed = false;
	const first = visitNode(node.first, visitor, {
		parent: node,
		property: "first",
	}) as SelectStatementNode;
	if (first !== node.first) {
		changed = true;
	}

	const compounds = node.compounds.map((branch, index) => {
		const visited = visitNode(branch.select, visitor, {
			parent: node,
			property: "compounds",
			index,
		}) as SelectStatementNode;
		if (visited !== branch.select) {
			changed = true;
			return {
				...branch,
				select: visited,
			};
		}
		return branch;
	});

	if (!changed) {
		return node;
	}

	return {
		...node,
		first,
		compounds,
	};
}

function traverseSelectStatement(
	node: SelectStatementNode,
	visitor: AstVisitor
): SelectStatementNode {
	let changed = false;

	const projection = visitArray(node.projection, node, "projection", visitor);
	if (projection !== node.projection) {
		changed = true;
	}

	const fromClauses = visitArray(
		node.from_clauses,
		node,
		"from_clauses",
		visitor
	);
	if (fromClauses !== node.from_clauses) {
		changed = true;
	}

	const whereClause = visitOptional(
		node.where_clause,
		node,
		"where_clause",
		visitor
	);
	if (whereClause !== node.where_clause) {
		changed = true;
	}

	const orderBy = visitArray(node.order_by, node, "order_by", visitor);
	if (orderBy !== node.order_by) {
		changed = true;
	}

	const limit = visitOptional(node.limit, node, "limit", visitor);
	if (limit !== node.limit) {
		changed = true;
	}

	const offset = visitOptional(node.offset, node, "offset", visitor);
	if (offset !== node.offset) {
		changed = true;
	}

	if (!changed) {
		return node;
	}

	return {
		...node,
		projection: projection as readonly SelectItemNode[],
		from_clauses: fromClauses as readonly FromClauseNode[],
		where_clause: whereClause as ExpressionNode | RawFragmentNode | null,
		order_by: orderBy as readonly OrderByItemNode[],
		limit: limit as ExpressionNode | RawFragmentNode | null,
		offset: offset as ExpressionNode | RawFragmentNode | null,
	};
}

function traverseInsertStatement(
	node: InsertStatementNode,
	visitor: AstVisitor
): InsertStatementNode {
	let changed = false;

	const target = visitNode(node.target, visitor, createContext(node, "target"));
	if (target !== node.target) {
		changed = true;
	}

	const columns = visitArray(node.columns, node, "columns", visitor);
	if (columns !== node.columns) {
		changed = true;
	}

	const source = visitNode(node.source, visitor, createContext(node, "source"));
	if (source !== node.source) {
		changed = true;
	}

	if (!changed) {
		return node;
	}

	return {
		...node,
		target: target as ObjectNameNode,
		columns: columns as readonly IdentifierNode[],
		source: source as InsertValuesNode,
	};
}

function traverseUpdateStatement(
	node: UpdateStatementNode,
	visitor: AstVisitor
): UpdateStatementNode {
	let changed = false;

	const target = visitNode(node.target, visitor, createContext(node, "target"));
	if (target !== node.target) {
		changed = true;
	}

	const assignments = visitArray(
		node.assignments,
		node,
		"assignments",
		visitor
	);
	if (assignments !== node.assignments) {
		changed = true;
	}

	const whereClause = visitOptional(
		node.where_clause,
		node,
		"where_clause",
		visitor
	);
	if (whereClause !== node.where_clause) {
		changed = true;
	}

	if (!changed) {
		return node;
	}

	return {
		...node,
		target: target as TableReferenceNode,
		assignments: assignments as readonly SetClauseNode[],
		where_clause: whereClause as ExpressionNode | RawFragmentNode | null,
	};
}

function traverseDeleteStatement(
	node: DeleteStatementNode,
	visitor: AstVisitor
): DeleteStatementNode {
	let changed = false;
	const target = visitNode(node.target, visitor, createContext(node, "target"));
	if (target !== node.target) {
		changed = true;
	}
	const whereClause = visitOptional(
		node.where_clause,
		node,
		"where_clause",
		visitor
	);
	if (whereClause !== node.where_clause) {
		changed = true;
	}
	if (!changed) {
		return node;
	}
	return {
		...node,
		target: target as TableReferenceNode,
		where_clause: whereClause as ExpressionNode | RawFragmentNode | null,
	};
}

function traverseInsertValues(
	node: InsertValuesNode,
	visitor: AstVisitor
): InsertValuesNode {
	let changed = false;
	const rows: (readonly ExpressionNode[])[] = [];

	for (let rowIndex = 0; rowIndex < node.rows.length; rowIndex += 1) {
		const row = node.rows[rowIndex]!;
		let rowChanged = false;
		const nextRow: ExpressionNode[] = [];

		for (let valueIndex = 0; valueIndex < row.length; valueIndex += 1) {
			const value = row[valueIndex]!;
			const nextValue = visitNode(
				value,
				visitor,
				createContext(node, `rows.${rowIndex}`, valueIndex)
			) as ExpressionNode;
			if (nextValue !== value) {
				rowChanged = true;
			}
			nextRow.push(nextValue);
		}

		if (rowChanged) {
			changed = true;
			rows.push(nextRow);
		} else {
			rows.push(row);
		}
	}

	if (!changed) {
		return node;
	}

	return {
		...node,
		rows: rows as readonly (readonly ExpressionNode[])[],
	};
}

function traverseFromClause(
	node: FromClauseNode,
	visitor: AstVisitor
): FromClauseNode {
	let changed = false;
	const relation = visitNode(
		node.relation,
		visitor,
		createContext(node, "relation")
	);
	if (relation !== node.relation) {
		changed = true;
	}
	const joins = visitArray(node.joins, node, "joins", visitor);
	if (joins !== node.joins) {
		changed = true;
	}
	if (!changed) {
		return node;
	}
	return {
		...node,
		relation: relation as typeof node.relation,
		joins: joins as readonly JoinClauseNode[],
	};
}

function traverseJoinClause(
	node: JoinClauseNode,
	visitor: AstVisitor
): JoinClauseNode {
	let changed = false;
	const relation = visitNode(
		node.relation,
		visitor,
		createContext(node, "relation")
	);
	if (relation !== node.relation) {
		changed = true;
	}
	const onExpression = visitOptional(
		node.on_expression,
		node,
		"on_expression",
		visitor
	);
	if (onExpression !== node.on_expression) {
		changed = true;
	}
	if (!changed) {
		return node;
	}
	return {
		...node,
		relation: relation as typeof node.relation,
		on_expression: onExpression as ExpressionNode | RawFragmentNode | null,
	};
}

function traverseTableReference(
	node: TableReferenceNode,
	visitor: AstVisitor
): TableReferenceNode {
	let changed = false;
	const name = visitNode(node.name, visitor, createContext(node, "name"));
	if (name !== node.name) {
		changed = true;
	}
	const alias = visitOptional(node.alias, node, "alias", visitor);
	if (alias !== node.alias) {
		changed = true;
	}
	if (!changed) {
		return node;
	}
	return {
		...node,
		name: name as ObjectNameNode,
		alias: alias as IdentifierNode | null,
	};
}

function traverseSubquery(
	node: SubqueryNode,
	visitor: AstVisitor
): SubqueryNode {
	let changed = false;
	const statement = visitNode(
		node.statement,
		visitor,
		createContext(node, "statement")
	);
	if (statement !== node.statement) {
		changed = true;
	}
	const alias = visitNode(node.alias, visitor, createContext(node, "alias"));
	if (alias !== node.alias) {
		changed = true;
	}
	if (!changed) {
		return node;
	}
	return {
		...node,
		statement: statement as SelectStatementNode,
		alias: alias as IdentifierNode,
	};
}

function traverseOrderByItem(
	node: OrderByItemNode,
	visitor: AstVisitor
): OrderByItemNode {
	const expression = visitNode(
		node.expression,
		visitor,
		createContext(node, "expression")
	);
	if (expression === node.expression) {
		return node;
	}
	return {
		...node,
		expression: expression as ExpressionNode,
	};
}

function traverseSetClause(
	node: SetClauseNode,
	visitor: AstVisitor
): SetClauseNode {
	let changed = false;
	const column = visitNode(node.column, visitor, createContext(node, "column"));
	if (column !== node.column) {
		changed = true;
	}
	const value = visitNode(node.value, visitor, createContext(node, "value"));
	if (value !== node.value) {
		changed = true;
	}
	if (!changed) {
		return node;
	}
	return {
		...node,
		column: column as ColumnReferenceNode,
		value: value as ExpressionNode,
	};
}

function traverseSelectExpression(
	node: SelectExpressionNode,
	visitor: AstVisitor
): SelectExpressionNode {
	let changed = false;
	const expression = visitNode(
		node.expression,
		visitor,
		createContext(node, "expression")
	);
	if (expression !== node.expression) {
		changed = true;
	}
	const alias = visitOptional(node.alias, node, "alias", visitor);
	if (alias !== node.alias) {
		changed = true;
	}
	if (!changed) {
		return node;
	}
	return {
		...node,
		expression: expression as ExpressionNode,
		alias: alias as IdentifierNode | null,
	};
}

function traverseSelectQualifiedStar(
	node: SelectQualifiedStarNode,
	visitor: AstVisitor
): SelectQualifiedStarNode {
	const qualifier = visitArray(node.qualifier, node, "qualifier", visitor);
	if (qualifier === node.qualifier) {
		return node;
	}
	return {
		...node,
		qualifier: qualifier as readonly IdentifierNode[],
	};
}

function traverseColumnReference(
	node: ColumnReferenceNode,
	visitor: AstVisitor
): ColumnReferenceNode {
	const path = visitArray(node.path, node, "path", visitor);
	if (path === node.path) {
		return node;
	}
	return {
		...node,
		path: path as readonly IdentifierNode[],
	};
}

function traverseGroupedExpression(
	node: GroupedExpressionNode,
	visitor: AstVisitor
): GroupedExpressionNode {
	const expression = visitNode(
		node.expression,
		visitor,
		createContext(node, "expression")
	);
	if (expression === node.expression) {
		return node;
	}
	return {
		...node,
		expression: expression as ExpressionNode,
	};
}

function traverseBinaryExpression(
	node: BinaryExpressionNode,
	visitor: AstVisitor
): BinaryExpressionNode {
	let changed = false;
	const left = visitNode(node.left, visitor, createContext(node, "left"));
	if (left !== node.left) {
		changed = true;
	}
	const right = visitNode(node.right, visitor, createContext(node, "right"));
	if (right !== node.right) {
		changed = true;
	}
	if (!changed) {
		return node;
	}
	return {
		...node,
		left: left as ExpressionNode,
		right: right as ExpressionNode,
	};
}

function traverseUnaryExpression(
	node: UnaryExpressionNode,
	visitor: AstVisitor
): UnaryExpressionNode {
	const operand = visitNode(
		node.operand,
		visitor,
		createContext(node, "operand")
	);
	if (operand === node.operand) {
		return node;
	}
	return {
		...node,
		operand: operand as ExpressionNode,
	};
}

function traverseInListExpression(
	node: InListExpressionNode,
	visitor: AstVisitor
): InListExpressionNode {
	let changed = false;
	const operand = visitNode(
		node.operand,
		visitor,
		createContext(node, "operand")
	);
	if (operand !== node.operand) {
		changed = true;
	}
	const items = visitArray(node.items, node, "items", visitor);
	if (items !== node.items) {
		changed = true;
	}
	if (!changed) {
		return node;
	}
	return {
		...node,
		operand: operand as ExpressionNode,
		items: items as readonly ExpressionNode[],
	};
}

function traverseBetweenExpression(
	node: BetweenExpressionNode,
	visitor: AstVisitor
): BetweenExpressionNode {
	let changed = false;
	const operand = visitNode(
		node.operand,
		visitor,
		createContext(node, "operand")
	);
	if (operand !== node.operand) {
		changed = true;
	}
	const start = visitNode(node.start, visitor, createContext(node, "start"));
	if (start !== node.start) {
		changed = true;
	}
	const end = visitNode(node.end, visitor, createContext(node, "end"));
	if (end !== node.end) {
		changed = true;
	}
	if (!changed) {
		return node;
	}
	return {
		...node,
		operand: operand as ExpressionNode,
		start: start as ExpressionNode,
		end: end as ExpressionNode,
	};
}

function traverseObjectName(
	node: ObjectNameNode,
	visitor: AstVisitor
): ObjectNameNode {
	const parts = visitArray(node.parts, node, "parts", visitor);
	if (parts === node.parts) {
		return node;
	}
	return {
		...node,
		parts: parts as readonly IdentifierNode[],
	};
}

function visitOptional<T extends SqlNode | null>(
	child: T,
	parent: SqlNode,
	property: string,
	visitor: AstVisitor
): T {
	if (child === null) {
		return child;
	}
	return visitNode(child, visitor, createContext(parent, property)) as T;
}

function visitArray<T extends SqlNode>(
	items: readonly T[],
	parent: SqlNode,
	property: string,
	visitor: AstVisitor
): readonly T[] {
	let changed = false;
	const result: T[] = [];
	for (let index = 0; index < items.length; index += 1) {
		const item = items[index]!;
		const next = visitNode(
			item,
			visitor,
			createContext(parent, property, index)
		) as T;
		if (next !== item) {
			changed = true;
		}
		result.push(next);
	}
	return changed ? (result as readonly T[]) : items;
}

function createContext(
	parent: SqlNode,
	property: string,
	index?: number
): VisitContext {
	return { parent, property, index };
}
