import {
	columnReference,
	identifier,
	type BinaryExpressionNode,
	type DeleteStatementNode,
	type ExpressionNode,
	type LiteralNode,
	type ObjectNameNode,
	type StatementNode,
	type TableReferenceNode,
	type SubqueryExpressionNode,
} from "../../sql-parser/nodes.js";
import {
	resolveEntityView,
	type EntityViewVariant,
	resolveMetadataDefaults,
	normalizeOverrideValue,
	rewriteViewWhereClause,
	combineWithAnd,
} from "./shared.js";
import type { PreprocessorStep } from "../../types.js";
import type { LixSchemaDefinition } from "../../../../schema-definition/definition.js";
import type { CelEnvironment } from "./cel-environment.js";

export const rewriteEntityViewDelete: PreprocessorStep = (context) => {
	const node = context.node as StatementNode;
	if (node.node_kind !== "delete_statement") {
		return node;
	}

	const storedSchemas = context.getStoredSchemas?.();
	if (!storedSchemas || storedSchemas.size === 0) {
		return node;
	}

	const statement = node as DeleteStatementNode;
	const viewName = extractTableName(statement.target);
	if (!viewName) {
		return node;
	}

	const resolved = resolveEntityView({ storedSchemas, viewName });
	if (!resolved) {
		return node;
	}

	const { schema, variant, storedSchemaKey, propertyLowerToActual } = resolved;

	const rewritten = buildEntityViewDelete({
		statement,
		schema,
		variant,
		storedSchemaKey,
		propertyLowerToActual,
		celEnvironment: context.getCelEnvironment?.() ?? null,
	});
	if (!rewritten) {
		return node;
	}

	context.trace?.push({
		step: "rewrite_entity_view_delete",
		payload: {
			view: viewName,
			schema: schema["x-lix-key"],
			variant,
		},
	});

	return rewritten;
};

type BuildDeleteArgs = {
	readonly statement: DeleteStatementNode;
	readonly schema: LixSchemaDefinition;
	readonly variant: Exclude<EntityViewVariant, "history">;
	readonly storedSchemaKey: string;
	readonly propertyLowerToActual: Map<string, string>;
	readonly celEnvironment: CelEnvironment | null;
};

type EqualityCondition = {
	readonly column: string;
	readonly path: readonly string[];
	readonly expression: ExpressionNode;
};

function buildEntityViewDelete(
	args: BuildDeleteArgs
): DeleteStatementNode | null {
	const {
		statement,
		schema,
		variant,
		storedSchemaKey,
		propertyLowerToActual,
		celEnvironment,
	} = args;

	const rewrite = rewriteViewWhereClause(statement.where_clause, {
		propertyLowerToActual,
	});
	if (!rewrite) {
		return null;
	}
	let { expression: rewrittenWhere, hasVersionReference } = rewrite;

	const overrides = resolveMetadataDefaults({
		defaults: schema["x-lix-override-lixcols"],
		cel: celEnvironment,
		context: {},
	});
	const extraConditions: ExpressionNode[] = [
		createBinaryExpression(
			columnReference(["state_all", "schema_key"]),
			createLiteralExpression(storedSchemaKey)
		),
	];

	const versionOverride = overrides.has("lixcol_version_id")
		? overrides.get("lixcol_version_id")
		: undefined;

	if (!hasVersionReference) {
		if (variant === "base") {
			const versionExpression =
				versionOverride !== undefined
					? createLiteralFromOverride(versionOverride)
					: createActiveVersionSubquery();
			extraConditions.push(
				createBinaryExpression(
					columnReference(["state_all", "version_id"]),
					versionExpression
				)
			);
			hasVersionReference = true;
		} else if (variant === "all") {
			if (versionOverride === undefined) {
				throw new Error(
					`DELETE from ${storedSchemaKey}_all requires explicit lixcol_version_id or schema default`
				);
			}
			const versionExpression = createLiteralFromOverride(versionOverride);
			extraConditions.push(
				createBinaryExpression(
					columnReference(["state_all", "version_id"]),
					versionExpression
				)
			);
		}
	}

	let finalWhere = rewrittenWhere;
	for (const condition of extraConditions) {
		finalWhere = finalWhere ? combineWithAnd(finalWhere, condition) : condition;
	}

	return {
		node_kind: "delete_statement",
		target: buildTableReference("state_all"),
		where_clause: finalWhere ?? null,
	};
}

function buildTableReference(name: string): TableReferenceNode {
	return {
		node_kind: "table_reference",
		name: buildObjectName(name),
		alias: null,
	};
}

function buildObjectName(name: string): ObjectNameNode {
	return {
		node_kind: "object_name",
		parts: [identifier(name)],
	};
}

function createBinaryExpression(
	left: ExpressionNode,
	right: ExpressionNode
): BinaryExpressionNode {
	return {
		node_kind: "binary_expression",
		left,
		operator: "=",
		right,
	};
}

function createLiteralExpression(
	value: string | number | boolean | null
): LiteralNode {
	return {
		node_kind: "literal",
		value,
	};
}

function createLiteralFromOverride(value: unknown): ExpressionNode {
	const normalized = normalizeOverrideValue(value);
	if (
		typeof normalized === "string" ||
		typeof normalized === "number" ||
		typeof normalized === "boolean" ||
		normalized === null
	) {
		return createLiteralExpression(normalized);
	}
	return createLiteralExpression(String(normalized));
}

function createActiveVersionSubquery(): SubqueryExpressionNode {
	const versionColumn = columnReference(["version_id"]);
	return {
		node_kind: "subquery_expression",
		statement: {
			node_kind: "select_statement",
			projection: [
				{
					node_kind: "select_expression",
					expression: versionColumn,
					alias: null,
				},
			],
			from_clauses: [
				{
					node_kind: "from_clause",
					relation: {
						node_kind: "table_reference",
						name: buildObjectName("active_version"),
						alias: null,
					},
					joins: [],
				},
			],
			where_clause: null,
			order_by: [],
			limit: null,
			offset: null,
		},
	};
}

function extractTableName(target: TableReferenceNode): string | null {
	const parts = target.name.parts;
	if (parts.length === 0) {
		return null;
	}
	return parts[parts.length - 1]?.value ?? null;
}
