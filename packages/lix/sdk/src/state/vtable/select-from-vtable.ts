import {
	sql,
	type KyselyPlugin,
	type PluginTransformQueryArgs,
	type PluginTransformResultArgs,
	type QueryResult,
	type RootOperationNode,
	type SelectQueryBuilder,
	type UnknownRow,
} from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import { internalQueryBuilder } from "../../engine/internal-query-builder.js";
import { schemaKeyToCacheTableName } from "../cache/create-schema-cache-table.js";
import { compileVtableSelectSql } from "./compile-vtable-select.js";

export { compileVtableSelectSql } from "./compile-vtable-select.js";
export type { InlineVtableSqlOptions } from "./compile-vtable-select.js";

const TARGET_TABLE = "lix_internal_state_vtable";

type SelectFromVtablePluginOptions = {
	existingCacheTables?: ReadonlySet<string>;
};
export type SelectFromVtableContext = {
	existingCacheTables?: ReadonlySet<string>;
};

/**
 * Returns a query builder that targets the internal state vtable.
 *
 * The builder is pre-wired with a rewrite plugin so future optimisations
 * can transparently shape the query through the Kysely AST.
 *
 * @example
 * ```ts
 * const compiled = selectFromVtable({ existingCacheTables })
 *   .where("schema_key", "=", "lix_key_value")
 *   .select(["entity_id", "snapshot_content"])
 *   .compile();
 * ```
 */
export const selectFromVtable: (
	context?: SelectFromVtableContext
) => SelectQueryBuilder<LixInternalDatabaseSchema, typeof TARGET_TABLE, {}> = (
	context
) => {
	const pluginOptions: SelectFromVtablePluginOptions =
		context?.existingCacheTables
			? { existingCacheTables: context.existingCacheTables }
			: {};

	return internalQueryBuilder
		.withPlugin(new InlineSelectFromVtablePlugin(pluginOptions))
		.selectFrom(TARGET_TABLE);
};

class InlineSelectFromVtablePlugin implements KyselyPlugin {
	constructor(private readonly options: SelectFromVtablePluginOptions = {}) {}

	transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
		return rewriteRootNode(args.node, this.options);
	}

	async transformResult(
		args: PluginTransformResultArgs
	): Promise<QueryResult<UnknownRow>> {
		return args.result;
	}
}

function rewriteRootNode(
	node: RootOperationNode,
	options: SelectFromVtablePluginOptions
): RootOperationNode {
	if (node.kind === "SelectQueryNode") {
		return rewriteSelectQuery(node, options);
	}
	return node;
}

function rewriteSelectQuery(
	node: any,
	options: SelectFromVtablePluginOptions
): any {
	if (!node.from || node.from.froms.length === 0) {
		return node;
	}

	const cacheTables = options.existingCacheTables;
	if (!cacheTables || cacheTables.size === 0) {
		return node;
	}

	const rewrites: Array<{ index: number; alias: string }> = [];

	node.from.froms.forEach((fromNode: any, index: number) => {
		const alias = extractVtableAlias(fromNode);
		if (alias) {
			rewrites.push({ index, alias });
		}
	});

	if (rewrites.length === 0) {
		return node;
	}

	const rewriteAliases = rewrites.map((entry) => entry.alias);

	const schemaKeys = collectSchemaKeyFilters(
		node.where?.where ?? null,
		rewriteAliases
	);

	const filteredSchemaKeys = schemaKeys.filter((key) =>
		hasCacheTableForSchema(key, cacheTables)
	);

	if (filteredSchemaKeys.length === 0) {
		return node;
	}

	if (!hasCacheTableForSchema("lix_version_descriptor", cacheTables)) {
		return node;
	}

	const requiredColumns = collectRequiredColumns(node, rewriteAliases);

	const inlineSql = compileVtableSelectSql({
		filteredSchemaKeys,
		requiredColumns,
	});
	const newFroms = [...node.from.froms];

	for (const { index, alias } of rewrites) {
		const derived = sql`(${sql.raw(inlineSql)})`.as(alias);
		newFroms[index] = derived.toOperationNode();
	}

	return {
		...node,
		from: {
			...node.from,
			froms: newFroms,
		},
	};
}

function extractVtableAlias(node: any): string | null {
	if (node.kind === "TableNode") {
		const tableName = node.table?.identifier?.name;
		return tableName === TARGET_TABLE ? TARGET_TABLE : null;
	}

	if (node.kind === "AliasNode") {
		const inner = node.node;
		const tableName = inner?.table?.identifier?.name;
		if (tableName === TARGET_TABLE) {
			const alias = node.alias;
			if (alias?.name) {
				return alias.name;
			}
			return TARGET_TABLE;
		}
	}

	return null;
}

function collectSchemaKeyFilters(
	where: any,
	aliases: readonly string[]
): string[] {
	if (!where) {
		return [];
	}

	const result = new Set<string>();
	const aliasSet = new Set(aliases);

	const visit = (expr: any): void => {
		if (!expr) return;
		switch (expr.kind) {
			case "BinaryOperationNode":
				handleBinary(expr);
				break;
			case "AndNode":
			case "OrNode":
				visit(expr.left);
				visit(expr.right);
				break;
			case "ParensNode":
				visit(expr.node);
				break;
			default:
				break;
		}
	};

	const handleBinary = (binaryNode: any): void => {
		if (binaryNode.leftOperand?.kind !== "ReferenceNode") {
			return;
		}
		if (!isSchemaKeyReference(binaryNode.leftOperand, aliasSet)) {
			return;
		}

		if (binaryNode.operator?.operator === "=") {
			if (binaryNode.rightOperand?.kind === "ValueNode") {
				const value = binaryNode.rightOperand.value;
				if (typeof value === "string" && value.length > 0) {
					result.add(value);
				}
			}
			return;
		}

		if (binaryNode.operator?.operator === "in") {
			const list = binaryNode.rightOperand;
			if (!list) return;
			if (
				list.kind === "PrimitiveValueListNode" &&
				Array.isArray(list.values)
			) {
				for (const value of list.values) {
					if (typeof value === "string" && value.length > 0) {
						result.add(value);
					}
				}
				return;
			}
			if (list.kind === "ValueListNode" && Array.isArray(list.values)) {
				for (const item of list.values) {
					if (item?.kind === "ValueNode") {
						const value = item.value;
						if (typeof value === "string" && value.length > 0) {
							result.add(value);
						}
					}
				}
			}
		}
	};

	visit(where);

	return [...result];
}

type ColumnCollectionResult = {
	columns: Set<string>;
	requiresAll: boolean;
};

function collectRequiredColumns(
	node: any,
	aliases: readonly string[]
): readonly string[] | null {
	if (!node) {
		return null;
	}

	const aliasSet = new Set<string>(aliases);
	aliasSet.add(TARGET_TABLE);

	const selectionResult = collectSelectionColumns(node.selections, aliasSet);
	if (selectionResult.requiresAll) {
		return null;
	}

	const collected = new Set<string>(selectionResult.columns);

	const whereResult = collectColumnsFromWhere(
		node.where?.where ?? null,
		aliasSet
	);
	if (whereResult.requiresAll) {
		return null;
	}
	whereResult.columns.forEach((column) => collected.add(column));

	const orderByResult = collectColumnsFromOrderBy(node.orderBy, aliasSet);
	if (orderByResult.requiresAll) {
		return null;
	}
	orderByResult.columns.forEach((column) => collected.add(column));

	const groupByResult = collectColumnsFromGroupBy(node.groupBy, aliasSet);
	if (groupByResult.requiresAll) {
		return null;
	}
	groupByResult.columns.forEach((column) => collected.add(column));

	if (collected.size === 0) {
		return null;
	}

	return [...collected];
}

function collectSelectionColumns(
	selections: readonly any[] | undefined,
	aliases: ReadonlySet<string>
): ColumnCollectionResult {
	if (!selections || selections.length === 0) {
		return { columns: new Set(), requiresAll: true };
	}

	const columns = new Set<string>();

	for (const selection of selections) {
		const selectionNode = selection?.selection;
		if (!selectionNode) {
			return { columns: new Set(), requiresAll: true };
		}
		const { column, requiresAll } = extractColumnReference(
			selectionNode,
			aliases
		);
		if (requiresAll) {
			return { columns: new Set(), requiresAll: true };
		}
		if (column) {
			columns.add(column);
			continue;
		}
		return { columns: new Set(), requiresAll: true };
	}

	return { columns, requiresAll: false };
}

function collectColumnsFromWhere(
	where: any,
	aliases: ReadonlySet<string>
): ColumnCollectionResult {
	const columns = new Set<string>();
	if (!where) {
		return { columns, requiresAll: false };
	}

	let requiresAll = false;

	const visit = (value: any): void => {
		if (requiresAll || value === null || value === undefined) {
			return;
		}
		if (Array.isArray(value)) {
			for (const item of value) {
				visit(item);
				if (requiresAll) {
					return;
				}
			}
			return;
		}
		if (typeof value !== "object") {
			return;
		}

		const { column, requiresAll: columnRequiresAll } = extractColumnReference(
			value,
			aliases
		);
		if (columnRequiresAll) {
			requiresAll = true;
			return;
		}
		if (column) {
			columns.add(column);
		}

		for (const nested of Object.values(value)) {
			visit(nested);
			if (requiresAll) {
				return;
			}
		}
	};

	visit(where);

	return { columns, requiresAll };
}

function collectColumnsFromOrderBy(
	orderBy: any,
	aliases: ReadonlySet<string>
): ColumnCollectionResult {
	const columns = new Set<string>();
	if (!orderBy || !Array.isArray(orderBy.items)) {
		return { columns, requiresAll: false };
	}

	let requiresAll = false;

	for (const item of orderBy.items) {
		const target = item?.orderBy;
		if (!target) {
			continue;
		}
		const { column, requiresAll: columnRequiresAll } = extractColumnReference(
			target,
			aliases
		);
		if (columnRequiresAll) {
			requiresAll = true;
			break;
		}
		if (column) {
			columns.add(column);
		}
	}

	return { columns, requiresAll };
}

function collectColumnsFromGroupBy(
	groupBy: any,
	aliases: ReadonlySet<string>
): ColumnCollectionResult {
	const columns = new Set<string>();
	if (!groupBy || !Array.isArray(groupBy.items)) {
		return { columns, requiresAll: false };
	}

	let requiresAll = false;

	for (const item of groupBy.items) {
		const target = item?.groupBy;
		if (!target) {
			continue;
		}
		const { column, requiresAll: columnRequiresAll } = extractColumnReference(
			target,
			aliases
		);
		if (columnRequiresAll) {
			requiresAll = true;
			break;
		}
		if (column) {
			columns.add(column);
		}
	}

	return { columns, requiresAll };
}

function extractColumnReference(
	node: any,
	aliases: ReadonlySet<string>
): { column: string | null; requiresAll: boolean } {
	if (!node) {
		return { column: null, requiresAll: false };
	}

	if (node.kind === "AliasNode") {
		return extractColumnReference(node.node, aliases);
	}

	if (node.kind === "ReferenceNode") {
		const tableName = extractTableIdentifierName(node.table);
		if (tableName && aliases.size > 0 && !aliases.has(tableName)) {
			return { column: null, requiresAll: false };
		}
		const columnNode = node.column;
		if (!columnNode) {
			return { column: null, requiresAll: false };
		}
		if (columnNode.kind === "SelectAllNode") {
			return { column: null, requiresAll: true };
		}
		if (columnNode.kind === "ColumnNode") {
			const identifier = columnNode.column;
			const name = identifier?.name;
			return typeof name === "string"
				? { column: name, requiresAll: false }
				: { column: null, requiresAll: false };
		}
		return { column: null, requiresAll: false };
	}

	if (node.kind === "ColumnNode") {
		const identifier = node.column;
		const name = identifier?.name;
		return typeof name === "string"
			? { column: name, requiresAll: false }
			: { column: null, requiresAll: false };
	}

	return { column: null, requiresAll: false };
}

function extractTableIdentifierName(tableNode: any): string | null {
	const identifier = tableNode?.table?.identifier?.name;
	return typeof identifier === "string" ? identifier : null;
}

function isSchemaKeyReference(
	reference: any,
	aliases: ReadonlySet<string>
): boolean {
	if (!reference.column || reference.column.kind !== "ColumnNode") {
		return false;
	}

	const column = reference.column.column;
	if (!column || column.kind !== "IdentifierNode") {
		return false;
	}
	if (column.name !== "schema_key") {
		return false;
	}

	const tableIdentifier = reference.table?.table?.identifier;
	if (!tableIdentifier || tableIdentifier.kind !== "IdentifierNode") {
		return true;
	}

	return aliases.has(tableIdentifier.name);
}

function hasCacheTableForSchema(
	schemaKey: string,
	cacheTables: ReadonlySet<string>
): boolean {
	const tableName = schemaKeyToCacheTableName(schemaKey);
	return cacheTables.has(tableName);
}
