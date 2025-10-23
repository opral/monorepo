import type { CstNode, IToken } from "chevrotain";
import {
	SelectQueryNode,
	SelectionNode,
	TableNode,
	AliasNode,
	IdentifierNode,
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
		return buildSelectQuery(projection, table);
	}

	public selectList(): SelectProjection {
		return { kind: "all" };
	}

	public tableReference(ctx: {
		tableIdentifier: CstNode[];
		aliasIdentifier?: CstNode[];
	}): TableReference {
		const tableIdentifier = ctx.tableIdentifier?.[0];
		if (!tableIdentifier) {
			throw new Error("table reference is missing");
		}
		const table = this.visit(tableIdentifier) as string;
		const aliasNode = ctx.aliasIdentifier?.[0];
		const alias = aliasNode ? (this.visit(aliasNode) as string) : undefined;
		return { table, alias };
	}

	public tableIdentifier(ctx: {
		Identifier?: IToken[];
		QuotedIdentifier?: IToken[];
	}): string {
		return normalizeIdentifierToken(ctx);
	}

	public aliasIdentifier(ctx: {
		Identifier?: IToken[];
		QuotedIdentifier?: IToken[];
	}): string {
		return normalizeIdentifierToken(ctx);
	}
}

const visitor = new ToKyselyVisitor();

function buildSelectQuery(
	projection: SelectProjection,
	reference: TableReference
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
	return SelectQueryNode.cloneWithSelections(baseSelect, [selectAll]);
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
