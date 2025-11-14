import {
	columnReference,
	identifier,
	type BinaryExpressionNode,
	type DeleteStatementNode,
	type ExpressionNode,
	type LiteralNode,
	type ObjectNameNode,
	type SegmentedStatementNode,
	type TableReferenceNode,
	type StatementSegmentNode,
	type SubqueryExpressionNode,
} from "../sql-parser/nodes.js";
import {
	resolveEntityView,
	type EntityViewVariant,
	resolveMetadataDefaults,
	normalizeOverrideValue,
	rewriteViewWhereClause,
	combineWithAnd,
	collectPointerColumnDescriptors,
} from "./shared.js";
import type { PreprocessorStep, PreprocessorStepContext } from "../types.js";
import type { LixSchemaDefinition } from "../../../schema-definition/definition.js";
import type { CelEnvironment } from "../../cel-environment/cel-environment.js";
import { normalizeSegmentedStatement } from "../sql-parser/parse.js";

export const rewriteEntityViewDelete: PreprocessorStep = (context) => {
	const storedSchemas = context.getStoredSchemas?.();
	if (!storedSchemas || storedSchemas.size === 0) {
		return context.statements;
	}

	let anyChanges = false;
	const rewrittenStatements = context.statements.map((statement) => {
		const rewritten = rewriteSegmentedStatement(
			statement,
			context,
			storedSchemas
		);
		if (rewritten !== statement) {
			anyChanges = true;
		}
		return rewritten;
	});

	return anyChanges ? rewrittenStatements : context.statements;
};

function rewriteSegmentedStatement(
	statement: SegmentedStatementNode,
	context: PreprocessorStepContext,
	storedSchemas: Map<string, unknown>
): SegmentedStatementNode {
	let changed = false;
	const segments = statement.segments.map((segment) => {
		if (segment.node_kind !== "delete_statement") {
			return segment;
		}

		const rewritten = rewriteDeleteSegment({
			statement: segment,
			context,
			storedSchemas,
		});

		if (!rewritten) {
			return segment;
		}

		if (rewritten !== segment) {
			changed = true;
		}

		return rewritten;
	});

	if (!changed) {
		return statement;
	}

	return normalizeSegmentedStatement({
		...statement,
		segments,
	});
}

function rewriteDeleteSegment(args: {
	statement: DeleteStatementNode;
	context: PreprocessorStepContext;
	storedSchemas: Map<string, unknown>;
}): StatementSegmentNode | null {
	const viewName = extractTableName(args.statement.target);
	if (!viewName) {
		return null;
	}

	const resolved = resolveEntityView({
		storedSchemas: args.storedSchemas,
		viewName,
	});
	if (!resolved) {
		return null;
	}

	const { schema, variant, storedSchemaKey, propertyLowerToActual } = resolved;

	const rewritten = buildEntityViewDelete({
		statement: args.statement,
		schema,
		variant,
		storedSchemaKey,
		propertyLowerToActual,
		celEnvironment: args.context.getCelEnvironment?.() ?? null,
	});
	if (!rewritten) {
		return null;
	}

	args.context.trace?.push({
		step: "rewrite_entity_view_delete",
		payload: {
			view: viewName,
			schema: schema["x-lix-key"],
			variant,
		},
	});

	return rewritten;
}

type BuildDeleteArgs = {
	readonly statement: DeleteStatementNode;
	readonly schema: LixSchemaDefinition;
	readonly variant: Exclude<EntityViewVariant, "history">;
	readonly storedSchemaKey: string;
	readonly propertyLowerToActual: Map<string, string>;
	readonly celEnvironment: CelEnvironment | null;
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

	const pointerDescriptors = collectPointerColumnDescriptors({ schema });
	const pointerAliasToPath = new Map(
		pointerDescriptors.map((descriptor) => [
			descriptor.alias.toLowerCase(),
			descriptor.path,
		])
	);
	const pointerSet = new Set(pointerAliasToPath.keys());

	const rewrite = rewriteViewWhereClause(statement.where_clause, {
		propertyLowerToActual,
		stateTableAlias: "state_by_version",
		pointerAliasToPath,
		pushdownableJsonProperties: pointerSet,
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
			columnReference(["state_by_version", "schema_key"]),
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
					columnReference(["state_by_version", "version_id"]),
					versionExpression
				)
			);
			hasVersionReference = true;
		} else if (variant === "by_version") {
			if (versionOverride === undefined) {
				throw new Error(
					`DELETE from ${storedSchemaKey}_by_version requires explicit lixcol_version_id or schema default`
				);
			}
			const versionExpression = createLiteralFromOverride(versionOverride);
			extraConditions.push(
				createBinaryExpression(
					columnReference(["state_by_version", "version_id"]),
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
		target: buildTableReference("state_by_version"),
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
			distinct: false,
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
			group_by: [],
			order_by: [],
			limit: null,
			offset: null,
			with_clause: null,
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
