import type { CstNode, IToken } from "chevrotain";
import {
	SelectQueryNode,
	SelectionNode,
	TableNode,
	AliasNode,
	IdentifierNode,
	WhereNode,
	RawNode,
	ReferenceNode,
	ColumnNode,
	BinaryOperationNode,
	OperatorNode,
	OrNode,
	ParensNode,
	ValueNode,
	JoinNode,
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
	table: TableReference;
	joinType: "InnerJoin";
	on: OperationNode;
};

type TableReference = {
	table: string;
	alias?: string;
};

class ToKyselyVisitor extends BaseSqlCstVisitorWithDefaults {
	public constructor() {
		super();
		this.validateVisitor();
	}

	public selectStatement(ctx: {
		selectList: CstNode[];
		from: CstNode[];
		joins?: CstNode[];
		whereClause?: CstNode[];
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
		const table = this.visit(fromNode) as TableReference;
		const joins =
			ctx.joins?.map((join) => this.visit(join) as JoinDefinition) ?? [];
		const whereNode = ctx.whereClause?.[0];
		const filter = whereNode
			? (this.visit(whereNode) as OperationNode)
			: undefined;
		return buildSelectQuery(projection, table, {
			joins,
			filter,
		});
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
	}): TableReference {
		const tableNode = ctx.table?.[0];
		if (!tableNode) {
			throw new Error("table reference is missing");
		}
		const table = this.visit(tableNode) as string;
		const aliasNode = ctx.alias?.[0];
		const alias = aliasNode ? (this.visit(aliasNode) as string) : undefined;
		return { table, alias };
	}

	public joinClause(ctx: {
		table?: CstNode[];
		left?: CstNode[];
		right?: CstNode[];
	}): JoinDefinition {
		const tableNode = ctx.table?.[0];
		if (!tableNode) {
			throw new Error("join clause is missing table reference");
		}
		const table = this.visit(tableNode) as TableReference;
		const leftNode = ctx.left?.[0];
		const rightNode = ctx.right?.[0];
		if (!leftNode || !rightNode) {
			throw new Error("join clause is missing comparison operands");
		}
		const left = this.visit(leftNode) as OperationNode;
		const right = this.visit(rightNode) as OperationNode;
		const on = BinaryOperationNode.create(
			left,
			OperatorNode.create("="),
			right
		);
		return {
			table,
			joinType: "InnerJoin",
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
		return current;
	}

	public atomicPredicate(ctx: {
		column?: CstNode[];
		value?: CstNode[];
		inner?: CstNode[];
		Equals?: IToken[];
	}): OperationNode {
		const column = ctx.column?.[0];
		if (column) {
			const value = ctx.value?.[0];
			if (!value) {
				throw new Error("comparison predicate missing right operand");
			}
			const leftOperand = this.visit(column) as OperationNode;
			const rightOperand = this.visit(value) as OperationNode;
			const operatorToken = ctx.Equals?.[0]?.image ?? "=";
			if (operatorToken !== "=") {
				throw new Error(`operator '${operatorToken}' is not supported yet`);
			}
			return BinaryOperationNode.create(
				leftOperand,
				OperatorNode.create("="),
				rightOperand
			);
		}
		const inner = ctx.inner?.[0];
		if (!inner) {
			throw new Error("predicate is neither comparison nor grouped expression");
		}
		const expression = this.visit(inner) as OperationNode;
		return ParensNode.create(expression);
	}

	public valueExpression(ctx: {
		StringLiteral?: IToken[];
		NumberLiteral?: IToken[];
		Parameter?: IToken[];
	}): OperationNode {
		const parameter = ctx.Parameter?.[0];
		if (parameter) {
			return RawNode.createWithSql(parameter.image);
		}
		const raw = ctx.StringLiteral?.[0] ?? ctx.NumberLiteral?.[0];
		if (!raw?.image) {
			throw new Error("value expression is empty");
		}
		if (raw.tokenType?.name === "StringLiteral") {
			return ValueNode.create(normalizeStringLiteral(raw.image));
		}
		return ValueNode.create(Number(raw.image));
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
	reference: TableReference,
	options?: {
		joins?: JoinDefinition[];
		filter?: OperationNode;
	}
): RootOperationNode {
	const relation = createTableRelation(reference);
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
			JoinNode.createWithOn(
				join.joinType,
				createTableRelation(join.table),
				join.on
			)
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
	return withSelections;
}

function createTableRelation(reference: TableReference): OperationNode {
	const tableNode = TableNode.create(reference.table);
	return reference.alias
		? AliasNode.create(tableNode, IdentifierNode.create(reference.alias))
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
