import {
	identifier,
	columnReference,
	type BinaryExpressionNode,
	type ExpressionNode,
	type UpdateStatementNode,
	type ObjectNameNode,
	type RawFragmentNode,
	type SegmentedStatementNode,
	type SetClauseNode,
	type StatementSegmentNode,
	type SubqueryExpressionNode,
} from "../sql-parser/nodes.js";
import {
	extractPrimaryKeys,
	type EntityViewVariant,
	type PrimaryKeyDescriptor,
	buildCelContext,
	buildColumnValueMap,
	buildColumnExpressionMap,
	resolveMetadataDefaults,
	normalizeOverrideValue,
	resolveEntityView,
	collectEqualityConditions,
	combineWithAnd,
	rewriteViewWhereClause,
} from "./shared.js";
import type { PreprocessorStep, PreprocessorStepContext } from "../types.js";
import type { LixSchemaDefinition } from "../../../schema-definition/definition.js";
import { expressionToSql } from "../sql-parser/compile.js";
import type { CelEnvironment } from "../../cel-environment/cel-environment.js";
import { isJsonType } from "../../../schema-definition/json-type.js";
import { normalizeSegmentedStatement } from "../sql-parser/parse.js";

export const rewriteEntityViewUpdate: PreprocessorStep = (context) => {
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
		if (segment.node_kind !== "update_statement") {
			return segment;
		}

		const rewritten = rewriteUpdateSegment({
			update: segment,
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

function rewriteUpdateSegment(args: {
	update: UpdateStatementNode;
	context: PreprocessorStepContext;
	storedSchemas: Map<string, unknown>;
}): StatementSegmentNode | null {
	const viewName = extractTableName(args.update.target);
	if (!viewName) {
		return null;
	}

	const resolved = resolveEntityView({
		storedSchemas: args.storedSchemas,
		viewName,
		rejectImmutable: true,
	});
	if (!resolved) {
		return null;
	}

	const { schema, variant, storedSchemaKey, propertyLowerToActual } = resolved;

	const rewritten = buildEntityViewUpdate({
		update: args.update,
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
		step: "rewrite_entity_view_update",
		payload: {
			view: viewName,
			schema: schema["x-lix-key"],
			variant,
		},
	});

	return rewritten;
}

type BuildUpdateArgs = {
	readonly update: UpdateStatementNode;
	readonly schema: LixSchemaDefinition;
	readonly variant: EntityViewVariant;
	readonly storedSchemaKey: string;
	readonly propertyLowerToActual: Map<string, string>;
	readonly celEnvironment: CelEnvironment | null;
};

type AssignmentInfo = {
	readonly sql: string;
};

function buildEntityViewUpdate(
	args: BuildUpdateArgs
): StatementSegmentNode | null {
	const {
		update,
		schema,
		variant,
		storedSchemaKey,
		propertyLowerToActual,
		celEnvironment,
	} = args;
	const assignments = extractAssignments(update);
	if (!assignments) {
		return null;
	}

	const primaryKeys = extractPrimaryKeys(schema);
	if (!primaryKeys || primaryKeys.length === 0) {
		return null;
	}

	const columnValueMap = buildColumnValueMap(
		assignments.normalizedColumns,
		assignments.values
	);
	const columnExpressionMap = buildColumnExpressionMap(
		assignments.normalizedColumns,
		assignments.expressions
	);
	if (!columnValueMap || !columnExpressionMap) {
		return null;
	}

	const celContext = buildCelContext({
		columnMap: columnValueMap,
		propertyLowerToActual,
	});
	const overrides = resolveMetadataDefaults({
		defaults: schema["x-lix-override-lixcols"],
		cel: celEnvironment,
		context: celContext,
	});

	const assignmentMap = new Map<string, AssignmentInfo>();
	for (let index = 0; index < assignments.normalizedColumns.length; index++) {
		const name = assignments.normalizedColumns[index];
		const expr = assignments.expressions[index];
		if (!name || !expr) continue;
		assignmentMap.set(name, { sql: expr });
	}

	const snapshotExpr = buildSnapshotExpression({
		schema,
		assignmentMap,
		columnMap: columnValueMap,
		columnExpressions: columnExpressionMap,
		propertyLowerToActual,
	});

	const overridesObject = overrides;
	const fileIdOverride = overridesObject.get("lixcol_file_id");
	const pluginKeyOverride = overridesObject.get("lixcol_plugin_key");
	const metadataOverride = overridesObject.get("lixcol_metadata");
	const untrackedOverride = overridesObject.get("lixcol_untracked");
	const versionOverride = overridesObject.get("lixcol_version_id");

	const schemaKeyLiteral = createLiteralExpression(storedSchemaKey);
	const fileIdExpr = createUpdateValueExpression({
		assignment: assignmentMap.get("lixcol_file_id"),
		override: fileIdOverride,
		fallback: "file_id",
	});
	const pluginKeyExpr = createUpdateValueExpression({
		assignment: assignmentMap.get("lixcol_plugin_key"),
		override: pluginKeyOverride,
		fallback: "plugin_key",
	});
	const metadataExpr = createUpdateValueExpression({
		assignment: assignmentMap.get("lixcol_metadata"),
		override: metadataOverride,
		fallback: "metadata",
	});
	const untrackedExpr = createUpdateValueExpression({
		assignment: assignmentMap.get("lixcol_untracked"),
		override: untrackedOverride,
		fallback: "untracked",
	});

	const schemaVersionValue = String(schema["x-lix-version"] ?? "");
	const schemaVersionExpr = createLiteralExpression(schemaVersionValue);

	const versionAssignment = resolveVersionExpression({
		variant,
		assignmentMap,
		versionOverride,
	});

	const assignmentsList: SetClauseNode[] = [
		createSetClause("schema_key", schemaKeyLiteral),
		createSetClause("file_id", fileIdExpr),
		createSetClause("plugin_key", pluginKeyExpr),
		createSetClause("snapshot_content", createRawExpression(snapshotExpr)),
		createSetClause("schema_version", schemaVersionExpr),
		createSetClause("version_id", versionAssignment.assignment),
		createSetClause("metadata", metadataExpr),
		createSetClause("untracked", untrackedExpr),
	];

	const rewrite = rewriteViewWhereClause(update.where_clause, {
		propertyLowerToActual,
	});
	if (!rewrite) {
		return null;
	}

	const whereExpression = buildWhereClause({
		update,
		primaryKeys,
		propertyLowerToActual,
		schemaKey: storedSchemaKey,
		basePredicate: rewrite.expression,
		hasVersionReference: rewrite.hasVersionReference,
		versionCondition: versionAssignment.condition,
	});
	if (!whereExpression) {
		return null;
	}

	const rewritten: UpdateStatementNode = {
		node_kind: "update_statement",
		target: buildTableReference("state_all"),
		assignments: assignmentsList,
		where_clause: whereExpression,
	};

	return rewritten;
}

function extractAssignments(update: UpdateStatementNode): {
	columns: string[];
	normalizedColumns: string[];
	values: unknown[];
	expressions: string[];
} | null {
	const columns: string[] = [];
	const normalized: string[] = [];
	const values: unknown[] = [];
	const expressions: string[] = [];

	for (const assignment of update.assignments) {
		const column = getColumnName(assignment.column);
		const normalizedName = column.toLowerCase();
		columns.push(column);
		normalized.push(normalizedName);
		const transformed = rewriteExpressionForSnapshot(assignment.value);
		const expressionSql = expressionToSql(transformed);
		values.push(null);
		expressions.push(expressionSql);
	}

	return { columns, normalizedColumns: normalized, values, expressions };
}

function buildSnapshotExpression(args: {
	schema: LixSchemaDefinition;
	assignmentMap: Map<string, AssignmentInfo>;
	columnMap: Map<string, unknown>;
	columnExpressions: Map<string, string>;
	propertyLowerToActual: Map<string, string>;
}): string {
	const entries: string[] = [];
	const properties = Object.keys(args.schema.properties ?? {});
	for (const property of properties) {
		const definition = (args.schema.properties ?? {})[property];
		const lower = property.toLowerCase();
		const assignment = args.assignmentMap.get(lower);
		let expressionSql: string;
		if (assignment) {
			expressionSql = wrapSnapshotValue(definition, assignment.sql);
		} else {
			expressionSql = wrapSnapshotValue(
				definition,
				`json_extract(snapshot_content, '$.${property}')`
			);
		}
		entries.push(`'${escapeSqlString(property)}', ${expressionSql}`);
	}
	if (entries.length === 0) {
		return "json_object()";
	}
	return `json_object(${entries.join(", ")})`;
}

function resolveVersionExpression(args: {
	variant: EntityViewVariant;
	assignmentMap: Map<string, AssignmentInfo>;
	versionOverride: unknown;
}): { assignment: ExpressionNode; condition: ExpressionNode } {
	const assignment =
		args.assignmentMap.get("lixcol_version_id") ??
		args.assignmentMap.get("version_id");
	const buildResult = (valueExpression: ExpressionNode) => {
		return {
			assignment: valueExpression,
			condition: createBinaryExpression(
				columnReference(["state_all", "version_id"]),
				valueExpression
			),
		};
	};
	if (args.variant === "all") {
		if (assignment) {
			const valueExpr = createRawExpression(assignment.sql);
			return buildResult(valueExpr);
		}
		const selfReference = columnReference(["version_id"]);
		return buildResult(selfReference);
	}
	if (args.versionOverride !== undefined) {
		const literalValue = normalizeOverrideValue(args.versionOverride);
		const valueExpr = createLiteralExpression(
			typeof literalValue === "number" ||
				typeof literalValue === "boolean" ||
				literalValue === null
				? (literalValue as number | boolean | null)
				: String(literalValue)
		);
		return buildResult(valueExpr);
	}
	if (assignment) {
		const valueExpr = createRawExpression(assignment.sql);
		return buildResult(valueExpr);
	}
	const activeVersion = createActiveVersionSubquery();
	return buildResult(activeVersion);
}

function buildWhereClause(args: {
	update: UpdateStatementNode;
	primaryKeys: readonly PrimaryKeyDescriptor[];
	propertyLowerToActual: Map<string, string>;
	schemaKey: string;
	basePredicate: ExpressionNode | null;
	hasVersionReference: boolean;
	versionCondition: ExpressionNode;
}): ExpressionNode | null {
	let finalPredicate = args.basePredicate ?? null;
	const whereConditions = collectEqualityConditions(args.update.where_clause);
	for (const descriptor of args.primaryKeys) {
		const key = descriptor.path[descriptor.path.length - 1]?.toLowerCase();
		if (!key) {
			return null;
		}
		const condition = whereConditions.find((entry) => entry.column === key);
		if (!condition) {
			return null;
		}
	}

	const schemaCondition = createBinaryExpression(
		columnReference(["state_all", "schema_key"]),
		createLiteralExpression(args.schemaKey)
	);
	finalPredicate = finalPredicate
		? combineWithAnd(finalPredicate, schemaCondition)
		: schemaCondition;

	if (!args.hasVersionReference) {
		finalPredicate = finalPredicate
			? combineWithAnd(finalPredicate, args.versionCondition)
			: args.versionCondition;
	}

	return finalPredicate;
}

function createUpdateValueExpression(args: {
	assignment: AssignmentInfo | undefined;
	override: unknown;
	fallback: string;
}): ExpressionNode {
	if (args.override !== undefined) {
		const normalized = normalizeOverrideValue(args.override);
		if (
			typeof normalized === "number" ||
			typeof normalized === "boolean" ||
			normalized === null
		) {
			return createLiteralExpression(normalized);
		}
		return createLiteralExpression(String(normalized));
	}
	if (args.assignment) {
		return createRawExpression(args.assignment.sql);
	}
	return createRawExpression(args.fallback);
}

function createSetClause(column: string, value: ExpressionNode): SetClauseNode {
	return {
		node_kind: "set_clause",
		column: columnReference([column]),
		value,
	};
}

function wrapSnapshotValue(definition: unknown, expressionSql: string): string {
	if (!definition || typeof definition !== "object") {
		return expressionSql;
	}
	const record = definition as Record<string, unknown>;
	const type = record.type;
	if (type === "number" || type === "integer" || type === "boolean") {
		return expressionSql;
	}
	if (isJsonType(definition)) {
		return expressionSql;
	}
	if (expressionSql.toLowerCase().startsWith("json_quote")) {
		return expressionSql;
	}
	if (expressionSql.toLowerCase().startsWith("case when json_valid")) {
		return expressionSql;
	}
	return `json_quote(${expressionSql})`;
}

function createBinaryExpression(
	left: ExpressionNode,
	right: ExpressionNode,
	operator: BinaryExpressionNode["operator"] = "="
): BinaryExpressionNode {
	return {
		node_kind: "binary_expression",
		left,
		operator,
		right,
	};
}

function createActiveVersionSubquery(): SubqueryExpressionNode {
	return {
		node_kind: "subquery_expression",
		statement: {
			node_kind: "select_statement",
			projection: [
				{
					node_kind: "select_expression",
					expression: columnReference(["version_id"]),
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

function createLiteralExpression(
	value: string | number | boolean | null
): ExpressionNode {
	return {
		node_kind: "literal",
		value,
	};
}

function createRawExpression(sql: string): RawFragmentNode {
	return {
		node_kind: "raw_fragment",
		sql_text: sql,
	};
}

function rewriteExpressionForSnapshot(
	expression: ExpressionNode
): ExpressionNode {
	switch (expression.node_kind) {
		case "column_reference": {
			const column = getColumnName(expression).toLowerCase();
			return createRawExpression(
				`json_extract(snapshot_content, '$.${column}')`
			);
		}
		case "binary_expression":
			return {
				node_kind: "binary_expression",
				left: rewriteExpressionForSnapshot(expression.left),
				operator: expression.operator,
				right: rewriteExpressionForSnapshot(expression.right),
			};
		case "unary_expression":
			return {
				node_kind: "unary_expression",
				operator: expression.operator,
				operand: rewriteExpressionForSnapshot(expression.operand),
			};
		case "grouped_expression":
			return {
				node_kind: "grouped_expression",
				expression: rewriteExpressionForSnapshot(expression.expression),
			};
		case "in_list_expression":
			return {
				node_kind: "in_list_expression",
				operand: rewriteExpressionForSnapshot(expression.operand),
				items: expression.items.map((item) =>
					rewriteExpressionForSnapshot(item)
				),
				negated: expression.negated,
			};
		case "between_expression":
			return {
				node_kind: "between_expression",
				operand: rewriteExpressionForSnapshot(expression.operand),
				start: rewriteExpressionForSnapshot(expression.start),
				end: rewriteExpressionForSnapshot(expression.end),
				negated: expression.negated,
			};
		case "function_call":
			return {
				node_kind: "function_call",
				name: expression.name,
				arguments: expression.arguments.map((argument) =>
					rewriteExpressionForSnapshot(argument)
				),
			};
		case "raw_fragment":
		case "parameter":
		case "literal":
		case "subquery_expression":
			return expression;
		default:
			return expression;
	}
}

function buildTableReference(name: string) {
	return {
		node_kind: "table_reference" as const,
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

function getColumnName(
	column: import("../sql-parser/nodes.js").ColumnReferenceNode
) {
	const terminal = column.path[column.path.length - 1];
	return terminal?.value ?? "";
}

function extractTableName(
	target: UpdateStatementNode["target"]
): string | null {
	const parts = target.name.parts;
	if (parts.length === 0) {
		return null;
	}
	return parts[parts.length - 1]?.value ?? null;
}

function escapeSqlString(value: string): string {
	return value.replace(/'/g, "''");
}
