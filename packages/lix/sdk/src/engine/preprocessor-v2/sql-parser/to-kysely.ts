import type { CstNode, IToken } from "chevrotain";
import {
	SelectQueryNode,
	SelectionNode,
	TableNode,
	AliasNode,
	IdentifierNode,
	WhereNode,
	ReferenceNode,
	ColumnNode,
	BinaryOperationNode,
	OperatorNode,
	ValueNode,
	type OperationNode,
	type RootOperationNode,
} from "kysely";
import { parserInstance } from "./parser.js";

const BaseSqlCstVisitorWithDefaults: new (...args: unknown[]) => {
	visit: (node: CstNode | CstNode[]) => unknown;
	validateVisitor: () => void;
} = parserInstance.getBaseCstVisitorConstructorWithDefaults() as any;

type SelectProjection = {
	kind: "all";
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
		tableReference: CstNode[];
		whereClause?: CstNode[];
	}): RootOperationNode {
		const selectList = ctx.selectList?.[0];
		if (!selectList) {
			throw new Error("select list is missing");
		}
		const tableNode = ctx.tableReference?.[0];
		if (!tableNode) {
			throw new Error("table reference is missing");
		}
		const projection = this.visit(selectList) as SelectProjection;
		const table = this.visit(tableNode) as TableReference;
		const whereNode = ctx.whereClause?.[0];
		const filter = whereNode ? (this.visit(whereNode) as OperationNode) : undefined;
		return buildSelectQuery(projection, table, filter);
	}

	public selectList(): SelectProjection {
		return { kind: "all" };
	}

	public tableReference(ctx: { identifier?: CstNode[] }): TableReference {
		const identifiers = ctx.identifier ?? [];
		if (identifiers.length === 0) {
			throw new Error("table reference is missing");
		}
		const table = this.visit(identifiers[0]!) as string;
		const alias = identifiers[1]
			? (this.visit(identifiers[1]!) as string)
			: undefined;
		return { table, alias };
	}

	public columnReference(ctx: { identifier?: CstNode[] }): OperationNode {
		const identifiers = ctx.identifier ?? [];
		if (identifiers.length === 0) {
			throw new Error("column reference is missing");
		}
		const parts = identifiers.map((node) => this.visit(node) as string);
		if (parts.length === 1) {
			return ReferenceNode.create(ColumnNode.create(parts[0]!));
		}
		if (parts.length === 2) {
			return ReferenceNode.create(
				ColumnNode.create(parts[1]!),
				TableNode.create(parts[0]!)
			);
		}
		throw new Error("column references with nested paths are not supported yet");
	}

	public whereClause(ctx: {
		columnReference: CstNode[];
		valueExpression: CstNode[];
		Equals: IToken[];
	}): OperationNode {
		const column = ctx.columnReference?.[0];
		if (!column) {
			throw new Error("where clause is missing left operand");
		}
		const value = ctx.valueExpression?.[0];
		if (!value) {
			throw new Error("where clause is missing right operand");
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

	public valueExpression(ctx: {
		StringLiteral?: IToken[];
		NumberLiteral?: IToken[];
	}): OperationNode {
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
	filter?: OperationNode
): RootOperationNode {
	if (projection.kind !== "all") {
		throw new Error(`Unsupported projection '${projection.kind}'`);
	}
	const tableNode = TableNode.create(reference.table);
	const relation = reference.alias
		? AliasNode.create(
			tableNode,
			IdentifierNode.create(reference.alias)
		)
		: tableNode;
	const baseSelect = SelectQueryNode.createFrom([relation]);
	const selectAll = SelectionNode.createSelectAll();
	const withSelections = SelectQueryNode.cloneWithSelections(baseSelect, [selectAll]);
	if (!filter) {
		return withSelections;
	}
	return Object.freeze({
		...withSelections,
		where: WhereNode.create(filter),
	});
}

/**
 * Transforms a Chevrotain CST into a Kysely {@link RootOperationNode}.
 *
 * @example
 * ```ts
 * const node = toKysely(parse("SELECT * FROM users"));
 * ```
 */
export function toKysely(root: CstNode): RootOperationNode {
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
