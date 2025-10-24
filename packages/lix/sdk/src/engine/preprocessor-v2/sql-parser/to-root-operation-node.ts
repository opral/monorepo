import type { CstNode, IToken } from "chevrotain";
import {
	SelectQueryNode,
	SelectionNode,
	TableNode,
	UpdateQueryNode,
	ColumnUpdateNode,
	QueryNode,
	DeleteQueryNode,
	AliasNode,
	IdentifierNode,
	WhereNode,
	RawNode,
	ReferenceNode,
	ColumnNode,
	BinaryOperationNode,
	OperatorNode,
	AndNode,
	OrNode,
	ParensNode,
	ValueNode,
	ValueListNode,
	PrimitiveValueListNode,
	JoinNode,
	OrderByItemNode,
	UnaryOperationNode,
	type OperationNode,
	type RootOperationNode,
} from "kysely";
import { parserInstance } from "./parser.js";

const BaseSqlCstVisitorWithDefaults: new (...args: unknown[]) => {
	visit: (node: CstNode | CstNode[]) => unknown;
	validateVisitor: () => void;
} = parserInstance.getBaseCstVisitorConstructorWithDefaults() as any;

type SelectProjection =
	| {
			kind: "all";
			table?: string;
	  }
	| {
			kind: "columns";
			items: SelectColumn[];
	  };

type SelectColumn = {
	reference: ReferenceNode;
	alias?: string;
};

type JoinDefinition = {
	relation: OperationNode;
	joinType: JoinType;
	on: OperationNode;
};

type JoinType = "InnerJoin" | "LeftJoin" | "RightJoin" | "FullJoin";

type OrderBySegment = {
	reference: ReferenceNode;
	direction?: "asc" | "desc";
};

class ToKyselyVisitor extends BaseSqlCstVisitorWithDefaults {
	public constructor() {
		super();
		this.validateVisitor();
	}

	public selectStatement(ctx: {
		core?: CstNode[];
		update?: CstNode[];
		delete?: CstNode[];
	}): RootOperationNode {
		const core = ctx.core?.[0];
		if (core) {
			return this.visit(core) as RootOperationNode;
		}
		const update = ctx.update?.[0];
		if (update) {
			return this.visit(update) as RootOperationNode;
		}
		const del = ctx.delete?.[0];
		if (del) {
			return this.visit(del) as RootOperationNode;
		}
		throw new Error("statement missing recognized root");
	}

	public selectCore(ctx: {
		selectList: CstNode[];
		from: CstNode[];
		joins?: CstNode[];
		whereClause?: CstNode[];
		orderBy?: CstNode[];
	}): RootOperationNode {
		const selectList = ctx.selectList?.[0];
		if (!selectList) {
			throw new Error("select list is missing");
		}
		const fromNode = ctx.from?.[0];
		if (!fromNode) {
			throw new Error("table reference is missing");
		}
		const projection = this.visit(selectList) as SelectProjection;
		const relation = this.visit(fromNode) as OperationNode;
		const joins =
			ctx.joins?.map((join) => this.visit(join) as JoinDefinition) ?? [];
		const whereNode = ctx.whereClause?.[0];
		const filter = whereNode
			? (this.visit(whereNode) as OperationNode)
			: undefined;
		const orderByNode = ctx.orderBy?.[0];
		const orderBy = orderByNode
			? (this.visit(orderByNode) as OrderBySegment[])
			: undefined;
		return buildSelectQuery(projection, relation, {
			joins,
			filter,
			orderBy,
		});
	}

	public updateStatement(ctx: {
		table?: CstNode[];
		assignments?: CstNode[];
		whereClause?: CstNode[];
	}): RootOperationNode {
		const tableCst = ctx.table?.[0];
		if (!tableCst) {
			throw new Error("update statement missing table reference");
		}
		const relation = this.visit(tableCst) as OperationNode;
		if (!TableNode.is(relation) && !AliasNode.is(relation)) {
			throw new Error("update statement requires a base table reference");
		}
		const assignmentsCst = ctx.assignments ?? [];
		if (assignmentsCst.length === 0) {
			throw new Error("update statement missing assignments");
		}
		const assignments = assignmentsCst.map(
			(node) => this.visit(node) as ColumnUpdateNode
		);
		let updateNode = UpdateQueryNode.create([relation]);
		updateNode = UpdateQueryNode.cloneWithUpdates(updateNode, assignments);
		const whereNode = ctx.whereClause?.[0];
		if (whereNode) {
			const predicate = this.visit(whereNode) as OperationNode;
			updateNode = QueryNode.cloneWithWhere(updateNode, predicate);
		}
		return updateNode;
	}

	public deleteStatement(ctx: {
		table?: CstNode[];
		whereClause?: CstNode[];
	}): RootOperationNode {
		const tableCst = ctx.table?.[0];
		if (!tableCst) {
			throw new Error("delete statement missing table reference");
		}
		const relation = this.visit(tableCst) as OperationNode;
		if (!TableNode.is(relation) && !AliasNode.is(relation)) {
			throw new Error("delete statement requires a base table reference");
		}
		let deleteNode = DeleteQueryNode.create([relation]);
		const whereNode = ctx.whereClause?.[0];
		if (whereNode) {
			const predicate = this.visit(whereNode) as OperationNode;
			deleteNode = QueryNode.cloneWithWhere(deleteNode, predicate);
		}
		return deleteNode;
	}

	public selectList(ctx: {
		table?: CstNode[];
		items?: CstNode[];
	}): SelectProjection {
		const tableNode = ctx.table?.[0];
		if (tableNode) {
			const qualifier = this.visit(tableNode) as string;
			return { kind: "all", table: qualifier };
		}
		const items = ctx.items ?? [];
		if (items.length > 0) {
			const references = items.map((item) => this.visit(item) as SelectColumn);
			return { kind: "columns", items: references };
		}
		return { kind: "all" };
	}

	public tableReference(ctx: {
		table?: CstNode[];
		alias?: CstNode[];
		select?: CstNode[];
	}): OperationNode {
		const selectNode = ctx.select?.[0];
		if (selectNode) {
			const aliasToken = ctx.alias?.[0];
			if (!aliasToken) {
				throw new Error("derived table requires an alias");
			}
			const alias = this.visit(aliasToken) as string;
			const subquery = this.visit(selectNode) as RootOperationNode;
			if (!SelectQueryNode.is(subquery)) {
				throw new Error("derived table is not a select query");
			}
			return AliasNode.create(subquery, IdentifierNode.create(alias));
		}
		const tableNode = ctx.table?.[0];
		if (!tableNode) {
			throw new Error("table reference is missing");
		}
		const table = this.visit(tableNode) as
			| string
			| { schema: string; table: string };
		const aliasNode = ctx.alias?.[0];
		const alias = aliasNode ? (this.visit(aliasNode) as string) : undefined;
		return createSimpleRelation(table, alias);
	}

	public tableName(ctx: {
		parts?: CstNode[];
	}): string | { schema: string; table: string } {
		const parts = ctx.parts?.map((node) => this.visit(node) as string) ?? [];
		if (parts.length === 0) {
			throw new Error("table name is missing");
		}
		if (parts.length === 1) {
			return parts[0]!;
		}
		if (parts.length === 2) {
			return { schema: parts[0]!, table: parts[1]! };
		}
		throw new Error("table names with nested paths are not supported yet");
	}

	public joinClause(ctx: {
		joinType?: IToken[];
		table?: CstNode[];
		left?: CstNode[];
		right?: CstNode[];
		extraLeft?: CstNode[];
		extraRight?: CstNode[];
	}): JoinDefinition {
		const tableNode = ctx.table?.[0];
		if (!tableNode) {
			throw new Error("join clause is missing table reference");
		}
		const relation = this.visit(tableNode) as OperationNode;
		const leftNode = ctx.left?.[0];
		const rightNode = ctx.right?.[0];
		if (!leftNode || !rightNode) {
			throw new Error("join clause is missing comparison operands");
		}
		const left = this.visit(leftNode) as OperationNode;
		const right = this.visit(rightNode) as OperationNode;
		let on: OperationNode = BinaryOperationNode.create(
			left,
			OperatorNode.create("="),
			right
		);
		const extraLeftNodes = ctx.extraLeft ?? [];
		const extraRightNodes = ctx.extraRight ?? [];
		for (let index = 0; index < extraLeftNodes.length; index += 1) {
			const extraLeft = this.visit(extraLeftNodes[index]!) as OperationNode;
			const extraRight = this.visit(extraRightNodes[index]!) as OperationNode;
			on = AndNode.create(
				on,
				BinaryOperationNode.create(
					extraLeft,
					OperatorNode.create("="),
					extraRight
				)
			);
		}
		const joinTypeToken = ctx.joinType?.[0];
		const joinType = joinTypeToken
			? normalizeJoinType(joinTypeToken.image)
			: "InnerJoin";
		return {
			relation,
			joinType,
			on,
		};
	}

	public selectItem(ctx: {
		expression: CstNode[];
		alias?: CstNode[];
	}): SelectColumn {
		const expressionNode = ctx.expression?.[0];
		if (!expressionNode) {
			throw new Error("select item missing expression");
		}
		const referenceNode = this.visit(expressionNode) as OperationNode;
		if (!ReferenceNode.is(referenceNode)) {
			throw new Error("select item must resolve to a column reference");
		}
		const aliasNode = ctx.alias?.[0];
		const alias = aliasNode ? (this.visit(aliasNode) as string) : undefined;
		return { reference: referenceNode, alias };
	}

	public columnReference(ctx: { parts?: CstNode[] }): OperationNode {
		const partsNodes = ctx.parts ?? [];
		if (partsNodes.length === 0) {
			throw new Error("column reference is missing");
		}
		const parts = partsNodes.map((node) => this.visit(node) as string);
		if (parts.length === 1) {
			return ReferenceNode.create(ColumnNode.create(parts[0]!));
		}
		if (parts.length === 2) {
			return ReferenceNode.create(
				ColumnNode.create(parts[1]!),
				TableNode.create(parts[0]!)
			);
		}
		throw new Error(
			"column references with nested paths are not supported yet"
		);
	}

	public whereClause(ctx: { expression: CstNode[] }): OperationNode {
		const expression = ctx.expression?.[0];
		if (!expression) {
			throw new Error("where clause is empty");
		}
		return this.visit(expression) as OperationNode;
	}

	public orExpression(ctx: { operands?: CstNode[] }): OperationNode {
		const operands =
			ctx.operands?.map((operand) => this.visit(operand) as OperationNode) ??
			[];
		if (operands.length === 0) {
			throw new Error("logical expression missing operands");
		}
		let current = operands[0]!;
		for (let index = 1; index < operands.length; index += 1) {
			current = OrNode.create(current, operands[index]!);
		}
		return operands.length > 1 ? ParensNode.create(current) : current;
	}

	public andExpression(ctx: { operands?: CstNode[] }): OperationNode {
		const operands =
			ctx.operands?.map((operand) => this.visit(operand) as OperationNode) ??
			[];
		if (operands.length === 0) {
			throw new Error("logical expression missing operands");
		}
		let current = operands[0]!;
		for (let index = 1; index < operands.length; index += 1) {
			current = AndNode.create(current, operands[index]!);
		}
		return operands.length > 1 ? ParensNode.create(current) : current;
	}

	public atomicPredicate(ctx: {
		comparisonColumn?: CstNode[];
		comparisonOperator?: CstNode[];
		comparisonValue?: CstNode[];
		isColumn?: CstNode[];
		isNot?: IToken[];
		betweenColumn?: CstNode[];
		betweenStart?: CstNode[];
		betweenEnd?: CstNode[];
		inColumn?: CstNode[];
		inNot?: IToken[];
		inList?: CstNode[];
		likeColumn?: CstNode[];
		likeNot?: IToken[];
		likePattern?: CstNode[];
		inner?: CstNode[];
	}): OperationNode {
		const predicateColumnNode = (ctx as any).predicateColumn?.[0] as
			| CstNode
			| undefined;
		if (predicateColumnNode) {
			const leftOperand = this.visit(predicateColumnNode) as OperationNode;
			const comparisonOperatorNode = ctx.comparisonOperator?.[0];
			if (comparisonOperatorNode) {
				const comparisonValueNode = ctx.comparisonValue?.[0];
				if (!comparisonValueNode) {
					throw new Error("comparison predicate missing right operand");
				}
				const operator = this.visit(comparisonOperatorNode) as string;
				const rightOperand = this.visit(comparisonValueNode) as OperationNode;
				return BinaryOperationNode.create(
					leftOperand,
					OperatorNode.create(operator as any),
					rightOperand
				);
			}
			const betweenStartNode = ctx.betweenStart?.[0];
			const betweenEndNode = ctx.betweenEnd?.[0];
			if (betweenStartNode && betweenEndNode) {
				const start = this.visit(betweenStartNode) as OperationNode;
				const end = this.visit(betweenEndNode) as OperationNode;
				return BinaryOperationNode.create(
					leftOperand,
					OperatorNode.create("between"),
					createValueListNode([start, end])
				);
			}
			const inListNode = ctx.inList?.[0];
			if (inListNode) {
				const list = (this.visit(inListNode) as OperationNode[]) ?? [];
				const operator = ctx.inNot?.length ? "not in" : "in";
				return BinaryOperationNode.create(
					leftOperand,
					OperatorNode.create(operator as any),
					createValueListNode(list)
				);
			}
			const likePatternNode = ctx.likePattern?.[0];
			if (likePatternNode) {
				const pattern = this.visit(likePatternNode) as OperationNode;
				const operator = ctx.likeNot?.length ? "not like" : "like";
				return BinaryOperationNode.create(
					leftOperand,
					OperatorNode.create(operator as any),
					pattern
				);
			}
			const operator = ctx.isNot?.length ? "is not" : "is";
			return BinaryOperationNode.create(
				leftOperand,
				OperatorNode.create(operator as any),
				ValueNode.createImmediate(null)
			);
		}
		const inner = ctx.inner?.[0];
		if (!inner) {
			throw new Error("predicate is neither comparison nor grouped expression");
		}
		const expression = this.visit(inner) as OperationNode;
		return ParensNode.is(expression)
			? expression
			: ParensNode.create(expression);
	}

	public orderByClause(ctx: { items?: CstNode[] }): OrderBySegment[] {
		return ctx.items?.map((item) => this.visit(item) as OrderBySegment) ?? [];
	}

	public orderByItem(ctx: {
		expression?: CstNode[];
		direction?: IToken[];
	}): OrderBySegment {
		const expressionNode = ctx.expression?.[0];
		if (!expressionNode) {
			throw new Error("order by item missing expression");
		}
		const referenceNode = this.visit(expressionNode) as OperationNode;
		if (!ReferenceNode.is(referenceNode)) {
			throw new Error("order by item must be a column reference");
		}
		const directionToken = ctx.direction?.[0];
		const direction = directionToken
			? normalizeOrderDirection(directionToken.image)
			: undefined;
		return { reference: referenceNode, direction };
	}

	public comparisonOperator(ctx: { operator?: IToken[] }): string {
		const operatorToken = ctx.operator?.[0];
		if (!operatorToken?.image) {
			throw new Error("comparison operator missing");
		}
		return operatorToken.image.toLowerCase();
	}

	public expressionList(ctx: { items?: CstNode[] }): OperationNode[] {
		return ctx.items?.map((item) => this.visit(item) as OperationNode) ?? [];
	}

	public expression(ctx: { expression?: CstNode[] }): OperationNode {
		const expression = ctx.expression?.[0];
		if (!expression) {
			throw new Error("expression is missing");
		}
		return this.visit(expression) as OperationNode;
	}

	public additiveExpression(ctx: {
		operands?: CstNode[];
		operators?: IToken[];
	}): OperationNode {
		const operands =
			ctx.operands?.map((operand) => this.visit(operand) as OperationNode) ??
			[];
		if (operands.length === 0) {
			throw new Error("additive expression missing operands");
		}
		const operators = ctx.operators ?? [];
		let current = operands[0]!;
		for (let index = 0; index < operators.length; index += 1) {
			const operatorToken = operators[index]!;
			const right = operands[index + 1]!;
			current = BinaryOperationNode.create(
				current,
				OperatorNode.create(operatorToken.image as any),
				right
			);
		}
		return current;
	}

	public multiplicativeExpression(ctx: {
		operands?: CstNode[];
		operators?: IToken[];
	}): OperationNode {
		const operands =
			ctx.operands?.map((operand) => this.visit(operand) as OperationNode) ??
			[];
		if (operands.length === 0) {
			throw new Error("multiplicative expression missing operands");
		}
		const operators = ctx.operators ?? [];
		let current = operands[0]!;
		for (let index = 0; index < operators.length; index += 1) {
			const operatorToken = operators[index]!;
			const right = operands[index + 1]!;
			current = BinaryOperationNode.create(
				current,
				OperatorNode.create(operatorToken.image as any),
				right
			);
		}
		return current;
	}

	public unaryExpression(ctx: {
		unaryOperator?: IToken[];
		operand?: CstNode[];
	}): OperationNode {
		const operandNode = ctx.operand?.[0];
		if (!operandNode) {
			throw new Error("unary expression missing operand");
		}
		const operand = this.visit(operandNode) as OperationNode;
		const operator = ctx.unaryOperator?.[0];
		if (!operator) {
			return operand;
		}
		return UnaryOperationNode.create(
			OperatorNode.create(operator.image as any),
			operand
		);
	}

	public primaryExpression(ctx: {
		parameter?: IToken[];
		string?: IToken[];
		number?: IToken[];
		reference?: CstNode[];
		inner?: CstNode[];
	}): OperationNode {
		const parameter = ctx.parameter?.[0];
		if (parameter) {
			return RawNode.createWithSql(parameter.image);
		}
		const stringLiteral = ctx.string?.[0];
		if (stringLiteral?.image) {
			return ValueNode.create(normalizeStringLiteral(stringLiteral.image));
		}
		const numberLiteral = ctx.number?.[0];
		if (numberLiteral?.image) {
			return ValueNode.create(Number(numberLiteral.image));
		}
		const reference = ctx.reference?.[0];
		if (reference) {
			return this.visit(reference) as OperationNode;
		}
		const inner = ctx.inner?.[0];
		if (!inner) {
			throw new Error("primary expression is empty");
		}
		const expression = this.visit(inner) as OperationNode;
		return ParensNode.create(expression);
	}

	public assignmentItem(ctx: {
		column?: CstNode[];
		value?: CstNode[];
	}): ColumnUpdateNode {
		const columnNode = ctx.column?.[0];
		if (!columnNode) {
			throw new Error("assignment missing column");
		}
		const valueNode = ctx.value?.[0];
		if (!valueNode) {
			throw new Error("assignment missing value");
		}
		let column = this.visit(columnNode) as OperationNode;
		if (ReferenceNode.is(column)) {
			const referenced = column.column;
			if (ColumnNode.is(referenced)) {
				const identifier = referenced.column as IdentifierNode;
				column = ColumnNode.create(identifier.name);
			} else {
				column = referenced as OperationNode;
			}
		} else if (ColumnNode.is(column)) {
			const identifier = column.column as IdentifierNode;
			column = ColumnNode.create(identifier.name);
		}
		const value = this.visit(valueNode) as OperationNode;
		return ColumnUpdateNode.create(column, value);
	}

	public identifier(ctx: {
		Identifier?: IToken[];
		QuotedIdentifier?: IToken[];
	}): string {
		return normalizeIdentifierToken(ctx);
	}
}

const visitor = new ToKyselyVisitor();

function buildSelectQuery(
	projection: SelectProjection,
	relation: OperationNode,
	options?: {
		joins?: JoinDefinition[];
		filter?: OperationNode;
		orderBy?: OrderBySegment[];
	}
): RootOperationNode {
	const baseSelect = SelectQueryNode.createFrom([relation]);
	let withSelections: SelectQueryNode;
	if (projection.kind === "all") {
		const selection = projection.table
			? SelectionNode.createSelectAllFromTable(
					TableNode.create(projection.table)
				)
			: SelectionNode.createSelectAll();
		withSelections = SelectQueryNode.cloneWithSelections(baseSelect, [
			selection,
		]);
	} else {
		const selections = projection.items.map((item) => {
			const selection = item.alias
				? AliasNode.create(item.reference, IdentifierNode.create(item.alias))
				: item.reference;
			return SelectionNode.create(selection);
		});
		withSelections = SelectQueryNode.cloneWithSelections(
			baseSelect,
			selections
		);
	}
	const joins = options?.joins ?? [];
	if (joins.length > 0) {
		const joinNodes = joins.map((join) =>
			JoinNode.createWithOn(join.joinType, join.relation, join.on)
		);
		withSelections = Object.freeze({
			...withSelections,
			joins: Object.freeze(joinNodes),
		}) as SelectQueryNode;
	}
	if (options?.filter) {
		withSelections = Object.freeze({
			...withSelections,
			where: WhereNode.create(options.filter),
		}) as SelectQueryNode;
	}
	const orderBySegments = options?.orderBy ?? [];
	if (orderBySegments.length > 0) {
		const orderByItems = orderBySegments.map((segment) =>
			OrderByItemNode.create(
				segment.reference,
				segment.direction ? RawNode.createWithSql(segment.direction) : undefined
			)
		);
		withSelections = SelectQueryNode.cloneWithOrderByItems(
			withSelections,
			orderByItems
		);
	}
	return withSelections;
}

function normalizeJoinType(value: string): JoinType {
	switch (value.toLowerCase()) {
		case "inner":
			return "InnerJoin";
		case "left":
			return "LeftJoin";
		case "right":
			return "RightJoin";
		case "full":
			return "FullJoin";
		default:
			return "InnerJoin";
	}
}

function normalizeOrderDirection(value: string): "asc" | "desc" {
	const normalized = value.toLowerCase();
	if (normalized === "asc" || normalized === "desc") {
		return normalized;
	}
	throw new Error(`unsupported order by direction '${value}'`);
}

function createSimpleRelation(
	table: string | { schema: string; table: string },
	alias?: string
): OperationNode {
	const tableNode =
		typeof table === "string"
			? TableNode.create(table)
			: TableNode.createWithSchema(table.schema, table.table);
	return alias
		? AliasNode.create(tableNode, IdentifierNode.create(alias))
		: tableNode;
}

/**
 * Transforms a Chevrotain CST into a Kysely {@link RootOperationNode}.
 *
 * @example
 * ```ts
 * const node = toRootOperationNode(parse("SELECT * FROM users"));
 * ```
 */
export function toRootOperationNode(root: CstNode): RootOperationNode {
	return visitor.visit(root) as RootOperationNode;
}

function createValueListNode(values: OperationNode[]): OperationNode {
	if (values.length > 0 && values.every((value) => ValueNode.is(value))) {
		return PrimitiveValueListNode.create(
			values.map((value) => (value as ValueNode & { value: unknown }).value)
		);
	}
	return ValueListNode.create(values);
}

function normalizeIdentifierToken(ctx: {
	Identifier?: IToken[];
	QuotedIdentifier?: IToken[];
}): string {
	const raw = ctx.Identifier?.[0] ?? ctx.QuotedIdentifier?.[0];
	if (!raw?.image) {
		throw new Error("identifier token missing");
	}
	if (raw.tokenType?.name === "QuotedIdentifier") {
		return raw.image.slice(1, -1).replace(/""/g, '"');
	}
	return raw.image;
}

function normalizeStringLiteral(image: string): string {
	const inner = image.slice(1, -1);
	return inner.replace(/''/g, "'");
}
