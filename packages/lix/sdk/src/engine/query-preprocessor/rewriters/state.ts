import { sql, type OperationNode, type RootOperationNode } from "kysely";
import {
	extractColumnName,
	extractTableName,
	extractValues,
} from "../operation-node-utils.js";
import { internalQueryBuilder } from "../../internal-query-builder.js";
import { rewriteInternalResolvedStateAll } from "./internal-resolved-state-all.js";
import { rewriteStateAllView } from "./state-all.js";

const STATE_VIEW = "state";

export function rewriteStateView(node: RootOperationNode): RootOperationNode {
	if (node.kind !== "SelectQueryNode") {
		return node;
	}

	let changed = false;

	const rewriteFromItem = (fromItem: OperationNode): OperationNode => {
		const aliasInfo = analyzeFromItem(fromItem, STATE_VIEW);
		if (!aliasInfo) {
			return fromItem;
		}

		const schemaKeys = collectSchemaFilters(
			node.where?.where,
			aliasInfo.alias,
			STATE_VIEW
		);

		changed = true;
		return buildStateSelect({
			alias: aliasInfo.alias,
			schemaKeys,
			restrictToActiveVersion: true,
		});
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

export function buildStateSelect(args: {
	alias: string;
	schemaKeys: string[];
	restrictToActiveVersion: boolean;
	rewriteStateAll?: boolean;
}): OperationNode {
	const {
		alias,
		schemaKeys,
		restrictToActiveVersion,
		rewriteStateAll = true,
	} = args;

	let builder = internalQueryBuilder
		.selectFrom("internal_resolved_state_all")
		.select([
			"entity_id",
			"schema_key",
			"file_id",
			"version_id",
			"plugin_key",
			"snapshot_content",
			"schema_version",
			"created_at",
			"updated_at",
			"inherited_from_version_id",
			"change_id",
			"untracked",
			"commit_id",
			"writer_key",
			"metadata",
		])
		.where((qb) => qb("snapshot_content", "is not", null));

	if (restrictToActiveVersion) {
		builder = builder.where(() =>
			sql`version_id IN (
				SELECT json_extract(snapshot_content, '$.version_id')
				FROM internal_state_all_untracked
				WHERE schema_key = 'lix_active_version'
				  AND entity_id = 'active'
				  AND version_id = 'global'
				  AND inheritance_delete_marker = 0
				  AND snapshot_content IS NOT NULL
			)`
		);
	}

	if (schemaKeys.length > 0) {
		builder = builder.where("schema_key", "in", schemaKeys);
	}

	const compiled = builder.compile();
	let subqueryNode = compiled.query;
	if (rewriteStateAll) {
		subqueryNode = rewriteStateAllView(subqueryNode);
	}
	subqueryNode = rewriteInternalResolvedStateAll(subqueryNode);

	return {
		kind: "AliasNode",
		node: subqueryNode,
		alias: {
			kind: "IdentifierNode",
			name: alias,
		},
	} as unknown as OperationNode;
}

function analyzeFromItem(
	node: OperationNode,
	target: string
): { alias: string } | undefined {
	if (node.kind === "AliasNode") {
		const baseTable = (node as any).node as OperationNode | undefined;
		const aliasNode = (node as any).alias as OperationNode | undefined;
		const tableName = extractTableName(baseTable);
		if (tableName !== target) {
			return undefined;
		}
		return { alias: extractIdentifier(aliasNode) ?? target };
	}

	if (node.kind === "TableNode") {
		const tableName = extractTableName(node);
		if (tableName !== target) {
			return undefined;
		}
		return { alias: target };
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

export function collectSchemaFilters(
	node: OperationNode | undefined,
	alias: string,
	defaultTable: string
): string[] {
	const values = new Set<string>();
	collectSchemaFiltersRecursive(node, alias, defaultTable, values);
	return Array.from(values);
}

function collectSchemaFiltersRecursive(
	node: OperationNode | undefined,
	alias: string,
	defaultTable: string,
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
			const matchesAlias =
				tableName === alias ||
				(tableName === undefined && alias === defaultTable);
			if (!matchesAlias) {
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
			collectSchemaFiltersRecursive(
				(node as any).left,
				alias,
				defaultTable,
				output
			);
			collectSchemaFiltersRecursive(
				(node as any).right,
				alias,
				defaultTable,
				output
			);
			return;
		}
		case "ParensNode": {
			collectSchemaFiltersRecursive(
				(node as any).node,
				alias,
				defaultTable,
				output
			);
			return;
		}
		default:
			return;
	}
}
