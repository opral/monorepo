import { sql, type OperationNode, type RootOperationNode } from "kysely";
import { schemaKeyToCacheTableName } from "../../../state/cache/create-schema-cache-table.js";
import {
	extractColumnName,
	extractTableName,
	extractValues,
} from "../operation-node-utils.js";

const TARGET_TABLE = "internal_state_cache";

export function rewriteInternalStateCache(
	node: RootOperationNode
): RootOperationNode {
	if (node.kind !== "SelectQueryNode") {
		return node;
	}

	let changed = false;

	const rewriteFromItem = (fromItem: OperationNode): OperationNode => {
		const analysis = analyzeFromItem(fromItem);
		if (!analysis) {
			return fromItem;
		}

		const schemaKeys = collectSchemaFilters(node.where?.where, analysis.alias);

		if (schemaKeys.length !== 1) {
			return fromItem;
		}

		changed = true;
		return buildCacheSubquery(schemaKeys[0]!, analysis.alias);
	};

	const rewrittenFroms = node.from?.froms?.map(rewriteFromItem);

	const rewrittenJoins = node.joins?.map((joinNode: any) => {
		const rewritten = rewriteFromItem(joinNode.table);
		if (rewritten !== joinNode.table) {
			changed = true;
			return {
				...joinNode,
				table: rewritten,
			};
		}
		return joinNode;
	});

	if (!changed) {
		return node;
	}

	return {
		...node,
		from:
			rewrittenFroms && node.from
				? {
						kind: "FromNode",
						froms: rewrittenFroms,
					}
				: node.from,
		joins: rewrittenJoins ?? node.joins,
	};
}

function analyzeFromItem(node: OperationNode): { alias: string } | undefined {
	if (node.kind === "AliasNode") {
		const baseTable = (node as any).node as OperationNode | undefined;
		const aliasNode = (node as any).alias as OperationNode | undefined;
		const tableName = extractTableName(baseTable);
		if (tableName !== TARGET_TABLE) {
			return undefined;
		}
		const alias = extractIdentifier(aliasNode) ?? TARGET_TABLE;
		return { alias };
	}

	if (node.kind === "TableNode") {
		const tableName = extractTableName(node);
		if (tableName !== TARGET_TABLE) {
			return undefined;
		}
		return { alias: TARGET_TABLE };
	}

	return undefined;
}

function extractIdentifier(
	node: OperationNode | undefined
): string | undefined {
	if (!node) return undefined;

	switch (node.kind) {
		case "IdentifierNode":
			return (node as any).name;
		case "SchemableIdentifierNode":
			return (node as any).identifier?.name;
		default:
			return undefined;
	}
}

function collectSchemaFilters(
	node: OperationNode | undefined,
	alias: string
): string[] {
	const values = new Set<string>();
	collectSchemaFiltersRecursive(node, alias, values);
	return Array.from(values);
}

function collectSchemaFiltersRecursive(
	node: OperationNode | undefined,
	alias: string,
	output: Set<string>
): void {
	if (!node) return;

	switch (node.kind) {
		case "BinaryOperationNode": {
			const leftOperand = (node as any).leftOperand as
				| OperationNode
				| undefined;
			if (!leftOperand || leftOperand.kind !== "ReferenceNode") {
				return;
			}

			const tableName = extractTableName((leftOperand as any).table);
			if (tableName !== alias) {
				return;
			}

			const columnName = extractColumnName((leftOperand as any).column);
			if (columnName !== "schema_key") {
				return;
			}

			for (const value of extractValues((node as any).rightOperand)) {
				if (typeof value === "string" && value.length > 0) {
					output.add(value);
				}
			}
			return;
		}
		case "AndNode":
		case "OrNode": {
			collectSchemaFiltersRecursive((node as any).left, alias, output);
			collectSchemaFiltersRecursive((node as any).right, alias, output);
			return;
		}
		case "ParensNode": {
			collectSchemaFiltersRecursive((node as any).node, alias, output);
			return;
		}
		default:
			return;
	}
}

function buildCacheSubquery(schemaKey: string, alias: string): OperationNode {
	const tableName = schemaKeyToCacheTableName(schemaKey);

	const columns = [
		sql`c.entity_id || '|' || c.schema_key || '|' || c.file_id || '|' || c.version_id AS _pk`,
		sql`c.entity_id`,
		sql`c.schema_key`,
		sql`c.file_id`,
		sql`c.version_id`,
		sql`c.plugin_key`,
		sql`c.snapshot_content`,
		sql`c.schema_version`,
		sql`c.created_at`,
		sql`c.updated_at`,
		sql`c.inherited_from_version_id`,
		sql`c.inheritance_delete_marker`,
		sql`c.change_id`,
		sql`c.commit_id`,
	];

	const subquery = sql`
		(SELECT ${sql.join(columns, sql`, `)}
		 FROM ${sql.id(tableName)} AS c
		) AS ${sql.id(alias)}
	`;

	return subquery.toOperationNode();
}
