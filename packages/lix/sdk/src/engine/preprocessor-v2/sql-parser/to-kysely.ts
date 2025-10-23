import type { CstNode, IToken } from "chevrotain";
import {
	SelectQueryNode,
	SelectionNode,
	TableNode,
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
	name: string;
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
		Identifier?: IToken[];
		QuotedIdentifier?: IToken[];
	}): TableReference {
		const identifierToken = selectIdentifierToken(ctx);
		return { name: identifierToken }; // token already normalized below.
	}
}

const visitor = new ToKyselyVisitor();

function selectIdentifierToken(ctx: {
	Identifier?: IToken[];
	QuotedIdentifier?: IToken[];
}): string {
	const raw = ctx.Identifier?.[0] ?? ctx.QuotedIdentifier?.[0];
	if (!raw?.image) {
		throw new Error("table reference is missing an identifier");
	}
	if (raw.tokenType === undefined) {
		return raw.image;
	}
	const tokenName = raw.tokenType.name;
	if (tokenName === "QuotedIdentifier") {
		return raw.image.slice(1, -1).replace(/""/g, '"');
	}
	return raw.image;
}

function buildSelectQuery(
	projection: SelectProjection,
	reference: TableReference
): RootOperationNode {
	if (projection.kind !== "all") {
		throw new Error(`Unsupported projection '${projection.kind}'`);
	}
	const tableNode = TableNode.create(reference.name);
	const baseSelect = SelectQueryNode.createFrom([tableNode]);
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
