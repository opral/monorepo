import {
	identifier,
	type ExpressionNode,
	type InsertStatementNode,
	type ObjectNameNode,
	type ParameterExpressionNode,
	type RawFragmentNode,
	type SegmentedStatementNode,
	type StatementSegmentNode,
} from "../sql-parser/nodes.js";
import { normalizeIdentifierValue } from "../sql-parser/ast-helpers.js";
import { expressionToSql } from "../sql-parser/compile.js";
import type { PreprocessorStep, PreprocessorStepContext } from "../types.js";
import type { LixSchemaDefinition } from "../../../schema-definition/definition.js";
import type { CelEnvironment } from "../../cel-environment/cel-environment.js";
import {
	buildCelContext,
	buildColumnExpressionMap,
	buildColumnValueMap,
	buildSnapshotObjectExpression,
	classifyViewVariant,
	baseSchemaKey,
	deserializeJsonParameter,
	extractPrimaryKeys,
	getColumnOrDefault,
	isEntityViewVariantEnabled,
	isExpressionValue,
	literal,
	normalizeOverrideValue,
	renderDefaultSnapshotValue,
	renderPointerExpression,
	resolveMetadataDefaults,
	resolveStoredSchemaKey,
	resolveSchemaDefinition,
	type EntityViewVariant,
	type PrimaryKeyDescriptor,
} from "./shared.js";
import { expandSqlViews as expandSqlViewsStep } from "../steps/expand-sql-views.js";
import { normalizeSegmentedStatement } from "../sql-parser/parse.js";

const STATE_ALL_COLUMNS: readonly string[] = [
	"entity_id",
	"schema_key",
	"file_id",
	"version_id",
	"plugin_key",
	"snapshot_content",
	"schema_version",
	"metadata",
	"untracked",
];

export const rewriteEntityViewInsert: PreprocessorStep = (context) => {
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
		if (segment.node_kind !== "insert_statement") {
			return segment;
		}

		const rewritten = rewriteInsertSegment({
			insert: segment,
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

function rewriteInsertSegment(args: {
	insert: InsertStatementNode;
	context: PreprocessorStepContext;
	storedSchemas: Map<string, unknown>;
}): StatementSegmentNode | null {
	const viewName = extractTableName(args.insert.target);
	if (!viewName) {
		return null;
	}

	const variant = classifyViewVariant(viewName);
	if (variant === "history") {
		return null;
	}

	const schema = resolveSchemaDefinition(args.storedSchemas, viewName);
	if (!schema) {
		return null;
	}

	if (!isEntityViewVariantEnabled(schema, variant)) {
		return null;
	}

	const parameters = args.context.parameters ?? [];
	const celEnvironment = args.context.getCelEnvironment?.() ?? null;

	const rewritten = buildEntityViewInsert({
		insert: args.insert,
		schema,
		variant,
		viewName,
		parameters,
		celEnvironment,
		getSqlViews: args.context.getSqlViews,
	});

	if (!rewritten) {
		return null;
	}

	const finalSegment = args.context.getSqlViews
		? expandSqlViewsForSegment(rewritten, args.context)
		: rewritten;

	args.context.trace?.push({
		step: "rewrite_entity_view_insert",
		payload: {
			view: viewName,
			schema: schema["x-lix-key"],
			variant,
		},
	});

	return finalSegment;
}

function expandSqlViewsForSegment(
	segment: StatementSegmentNode,
	context: PreprocessorStepContext
): StatementSegmentNode {
	const sqlViews = context.getSqlViews?.();
	if (!sqlViews || sqlViews.size === 0) {
		return segment;
	}

	const [expanded] = expandSqlViewsStep({
		...context,
		statements: [
			{
				node_kind: "segmented_statement",
				segments: [segment],
			},
		],
	});

	if (!expanded || expanded.segments.length === 0) {
		return segment;
	}

	const [firstSegment] = expanded.segments;
	return firstSegment ?? segment;
}

type BuildInsertArgs = {
	readonly insert: InsertStatementNode;
	readonly schema: LixSchemaDefinition;
	readonly variant: EntityViewVariant;
	readonly viewName: string;
	readonly parameters: ReadonlyArray<unknown>;
	readonly celEnvironment: CelEnvironment | null;
	readonly getSqlViews?: () => Map<string, string> | undefined;
};

type EvaluatedRow = {
	readonly values: readonly unknown[];
	readonly expressions: readonly string[];
};

type StateRowResult = {
	readonly expressions: readonly string[];
};

function buildEntityViewInsert(
	args: BuildInsertArgs
): StatementSegmentNode | null {
	const columns = args.insert.columns;
	if (columns.length === 0) {
		return null;
	}

	const rows = args.insert.source.rows;
	if (rows.length === 0) {
		return null;
	}

	const columnNames = columns.map((column) => column.value);
	const normalizedColumnNames = columnNames.map((name) =>
		normalizeIdentifierValue(name)
	);

	const evaluatedRows = evaluateRows({
		rows,
		parameters: args.parameters,
	});
	if (!evaluatedRows) {
		return null;
	}

	const primaryKeys = extractPrimaryKeys(args.schema);
	if (!primaryKeys || primaryKeys.length === 0) {
		return null;
	}

	const baseKey = baseSchemaKey(args.viewName) ?? args.viewName;
	const storedSchemaKey = resolveStoredSchemaKey(args.schema, baseKey);
	const propertyLowerToActual = new Map<string, string>();
	for (const property of Object.keys(args.schema.properties ?? {})) {
		propertyLowerToActual.set(property.toLowerCase(), property);
	}

	const rewrittenRows: ExpressionNode[][] = [];

	for (const row of evaluatedRows) {
		const columnValueMap = buildColumnValueMap(
			normalizedColumnNames,
			row.values as unknown[]
		);
		const columnExpressionMap = buildColumnExpressionMap(
			normalizedColumnNames,
			row.expressions as string[]
		);
		if (!columnValueMap || !columnExpressionMap) {
			return null;
		}

		const celContext = buildCelContext({
			columnMap: columnValueMap,
			propertyLowerToActual,
		});
		const overrides = resolveMetadataDefaults({
			defaults: args.schema["x-lix-override-lixcols"],
			cel: args.celEnvironment,
			context: celContext,
		});

		const rowResult = buildStateRowExpressions({
			schema: args.schema,
			schemaKey: storedSchemaKey,
			schemaVersion: String(args.schema["x-lix-version"] ?? ""),
			variant: args.variant,
			viewName: args.viewName,
			primaryKeys,
			columnMap: columnValueMap,
			columnExpressions: columnExpressionMap,
			overrides,
			propertyLowerToActual,
			celEnvironment: args.celEnvironment,
			celContext,
		});
		if (!rowResult) {
			return null;
		}
		rewrittenRows.push(rowResult.expressions.map(expressionStringToAst));
	}

	const rewritten: InsertStatementNode = {
		node_kind: "insert_statement",
		target: buildObjectName("state_all"),
		columns: STATE_ALL_COLUMNS.map((column) => identifier(column)),
		source: {
			node_kind: "insert_values",
			rows: rewrittenRows,
		},
	};

	return rewritten;
}

function evaluateRows(args: {
	readonly rows: readonly (readonly ExpressionNode[])[];
	readonly parameters: ReadonlyArray<unknown>;
}): EvaluatedRow[] | null {
	const result: EvaluatedRow[] = [];
	const state: { position: number } = { position: 0 };

	for (const row of args.rows) {
		const values: unknown[] = [];
		const expressions: string[] = [];

		for (const expression of row) {
			const evaluated = evaluateExpression({
				expression,
				parameters: args.parameters,
				state,
			});
			if (!evaluated) {
				return null;
			}
			values.push(evaluated.value);
			expressions.push(evaluated.expression);
		}

		result.push({ values, expressions });
	}

	return result;
}

function evaluateExpression(args: {
	readonly expression: ExpressionNode;
	readonly parameters: ReadonlyArray<unknown>;
	readonly state: { position: number };
}): { value: unknown; expression: string } | null {
	const { expression } = args;
	switch (expression.node_kind) {
		case "parameter":
			return evaluateParameterExpression({
				node: expression,
				parameters: args.parameters,
				state: args.state,
			});
		case "literal":
			return {
				value: expression.value,
				expression: expressionToSql(expression),
			};
		case "raw_fragment":
			return evaluateRawFragment({
				sql: expression.sql_text,
				parameters: args.parameters,
				state: args.state,
			});
		case "function_call": {
			const functionName = expression.name.value.toLowerCase();
			if (
				(functionName === "json" || functionName === "json_quote") &&
				expression.arguments.length === 1
			) {
				const argument = expression.arguments[0];
				if (argument?.node_kind === "parameter") {
					const evaluated = evaluateParameterExpression({
						node: argument,
						parameters: args.parameters,
						state: args.state,
					});
					if (!evaluated) {
						return null;
					}
					const parameterExpression = createParameterExpression(
						evaluated.expression
					);
					const normalizedCall = {
						...expression,
						arguments: [parameterExpression],
					};
					const expressionSql = expressionToSql(normalizedCall);
					const value =
						functionName === "json"
							? deserializeJsonParameter(evaluated.value)
							: evaluated.value;
					return {
						value,
						expression: expressionSql,
					};
				}
			}
			break;
		}
		default: {
			const sql = expressionToSql(expression);
			return {
				value: { kind: "expression", sql },
				expression: sql,
			};
		}
	}
	// Ensure all code paths return a value
	return null;
}

function evaluateParameterExpression(args: {
	readonly node: ParameterExpressionNode;
	readonly parameters: ReadonlyArray<unknown>;
	readonly state: { position: number };
}): { value: unknown; expression: string } | null {
	const placeholder = args.node.placeholder ?? "?";
	const hasPosition =
		typeof args.node.position === "number" && args.node.position >= 0;

	if (placeholder === "?" || placeholder === "") {
		const index = hasPosition ? args.node.position : args.state.position;
		if (!hasPosition) {
			args.state.position += 1;
		} else {
			args.state.position = Math.max(args.state.position, index + 1);
		}
		if (index >= args.parameters.length) {
			return null;
		}
		return {
			value: args.parameters[index],
			expression: `?${index + 1}`,
		};
	}

	if (/^\?\d+$/.test(placeholder)) {
		const numeric = hasPosition
			? args.node.position
			: Number(placeholder.slice(1)) - 1;
		if (
			!Number.isInteger(numeric) ||
			numeric < 0 ||
			numeric >= args.parameters.length
		) {
			return null;
		}
		return {
			value: args.parameters[numeric],
			expression: placeholder,
		};
	}

	const index = hasPosition ? args.node.position : args.state.position;
	if (!hasPosition) {
		args.state.position += 1;
	} else {
		args.state.position = Math.max(args.state.position, index + 1);
	}
	if (index >= args.parameters.length) {
		return null;
	}
	return {
		value: args.parameters[index],
		expression:
			placeholder === "" || placeholder === "?" ? `?${index + 1}` : placeholder,
	};
}

function evaluateRawFragment(args: {
	readonly sql: string;
	readonly parameters: ReadonlyArray<unknown>;
	readonly state: { position: number };
}): { value: unknown; expression: string } | null {
	const trimmed = args.sql.trim();
	const jsonMatch = trimmed.match(/^json\((\?(\d+)?)\)$/i);
	if (jsonMatch) {
		const resolved = resolvePlaceholder({
			placeholder: jsonMatch[1] ?? "?",
			parameters: args.parameters,
			state: args.state,
		});
		if (!resolved) {
			return null;
		}
		return {
			value: deserializeJsonParameter(resolved.value),
			expression: `json(${resolved.expression})`,
		};
	}

	const jsonQuoteMatch = trimmed.match(/^json_quote\((\?(\d+)?)\)$/i);
	if (jsonQuoteMatch) {
		const resolved = resolvePlaceholder({
			placeholder: jsonQuoteMatch[1] ?? "?",
			parameters: args.parameters,
			state: args.state,
		});
		if (!resolved) {
			return null;
		}
		return {
			value: resolved.value,
			expression: `json_quote(${resolved.expression})`,
		};
	}

	if (/^\(.*\)$/.test(trimmed)) {
		return {
			value: { kind: "expression", sql: args.sql },
			expression: args.sql,
		};
	}

	return {
		value: { kind: "expression", sql: args.sql },
		expression: args.sql,
	};
}

function resolvePlaceholder(args: {
	readonly placeholder: string;
	readonly parameters: ReadonlyArray<unknown>;
	readonly state: { position: number };
}): { value: unknown; expression: string } | null {
	if (args.placeholder === "?" || args.placeholder === "") {
		const index = args.state.position;
		if (index >= args.parameters.length) {
			return null;
		}
		args.state.position += 1;
		return {
			value: args.parameters[index],
			expression: `?${index + 1}`,
		};
	}

	if (/^\?\d+$/.test(args.placeholder)) {
		const numeric = Number(args.placeholder.slice(1)) - 1;
		if (
			!Number.isInteger(numeric) ||
			numeric < 0 ||
			numeric >= args.parameters.length
		) {
			return null;
		}
		return {
			value: args.parameters[numeric],
			expression: args.placeholder,
		};
	}

	return null;
}

function buildStateRowExpressions(args: {
	schema: LixSchemaDefinition;
	schemaKey: string;
	schemaVersion: string;
	variant: EntityViewVariant;
	viewName: string;
	primaryKeys: readonly PrimaryKeyDescriptor[];
	columnMap: Map<string, unknown>;
	columnExpressions: Map<string, string>;
	overrides: Map<string, unknown>;
	propertyLowerToActual: Map<string, string>;
	celEnvironment: CelEnvironment | null;
	celContext: Record<string, unknown>;
}): StateRowResult | null {
	const columnExpressions = args.columnExpressions;
	const columnMap = args.columnMap;

	const expressionFor = (name: string): string | null => {
		const key = normalizeIdentifierValue(name);
		return columnExpressions.get(key) ?? null;
	};

	const getLixcolOverride = (key: string): unknown => {
		if (args.overrides.has(key)) {
			return args.overrides.get(key);
		}
		return undefined;
	};

	const renderPrimaryKeyExpr = (
		descriptor: PrimaryKeyDescriptor
	): string | null => {
		const pkValue = columnMap.get(descriptor.column);
		if (pkValue !== undefined) {
			if (isExpressionValue(pkValue)) {
				return pkValue.sql;
			}
			const directExpression =
				expressionFor(descriptor.column) ??
				expressionFor(descriptor.rootColumn);
			if (directExpression) {
				return directExpression;
			}
			return literal(pkValue);
		}
		const pointerExpr = renderPointerExpression({
			descriptor,
			columnMap,
			columnExpressions,
		});
		if (pointerExpr) {
			return pointerExpr;
		}
		const fallbackKey =
			args.propertyLowerToActual.get(descriptor.column) ??
			args.propertyLowerToActual.get(descriptor.rootColumn) ??
			descriptor.column;
		const pkDefinition = (args.schema.properties ?? {})[fallbackKey];
		const defaultExpr = renderDefaultSnapshotValue({
			propertyName: fallbackKey,
			definition: pkDefinition,
			literal,
			cel: args.celEnvironment,
			context: args.celContext,
			resolvedDefaults: new Map(),
		});
		if (!defaultExpr || defaultExpr === "NULL") {
			return null;
		}
		return defaultExpr;
	};

	const entityIdOverride = getLixcolOverride("lixcol_entity_id");
	let entityIdExpr: string;
	if (entityIdOverride !== undefined) {
		entityIdExpr = literal(normalizeOverrideValue(entityIdOverride));
	} else if (args.primaryKeys.length === 1) {
		const expr = renderPrimaryKeyExpr(args.primaryKeys[0]!);
		if (!expr) {
			return null;
		}
		entityIdExpr = expr;
	} else {
		const parts: string[] = [];
		for (const primaryKey of args.primaryKeys) {
			const expr = renderPrimaryKeyExpr(primaryKey);
			if (!expr) {
				return null;
			}
			parts.push(expr);
		}
		entityIdExpr = `(${parts.join(" || '~' || ")})`;
	}

	const schemaKeyExpr = literal(args.schemaKey);
	const overrideFileId = getLixcolOverride("lixcol_file_id");
	const fileIdValue =
		overrideFileId !== undefined
			? normalizeOverrideValue(overrideFileId)
			: getColumnOrDefault(columnMap, "lixcol_file_id", overrideFileId);
	if (fileIdValue === undefined) {
		throw new Error(
			`Schema ${args.schemaKey} requires lixcol_file_id via column or x-lix-override-lixcols`
		);
	}
	const fileIdExpr = expressionFor("lixcol_file_id") ?? literal(fileIdValue);

	const overridePluginKey = getLixcolOverride("lixcol_plugin_key");
	const pluginKeyValue =
		overridePluginKey !== undefined
			? normalizeOverrideValue(overridePluginKey)
			: getColumnOrDefault(columnMap, "lixcol_plugin_key", overridePluginKey);
	if (pluginKeyValue === undefined) {
		throw new Error(
			`Schema ${args.schemaKey} requires lixcol_plugin_key via column or x-lix-override-lixcols`
		);
	}
	const pluginKeyExpr =
		expressionFor("lixcol_plugin_key") ?? literal(pluginKeyValue);

	const overrideVersion = getLixcolOverride("lixcol_version_id");
	const explicitVersionExpr =
		expressionFor("lixcol_version_id") ?? expressionFor("version_id");
	let versionExpr: string;
	if (args.variant === "all") {
		if (explicitVersionExpr) {
			versionExpr = explicitVersionExpr;
		} else if (overrideVersion !== undefined) {
			versionExpr = literal(normalizeOverrideValue(overrideVersion));
		} else {
			throw new Error(
				`INSERT into ${args.viewName} requires explicit lixcol_version_id or schema default`
			);
		}
	} else if (overrideVersion !== undefined) {
		versionExpr = literal(normalizeOverrideValue(overrideVersion));
	} else if (explicitVersionExpr) {
		versionExpr = explicitVersionExpr;
	} else {
		versionExpr = "(SELECT version_id FROM active_version)";
	}

	const overrideMetadata = getLixcolOverride("lixcol_metadata");
	const metadataValue =
		overrideMetadata !== undefined
			? normalizeOverrideValue(overrideMetadata)
			: (columnMap.get("lixcol_metadata") ?? null);
	const metadataExpr =
		expressionFor("lixcol_metadata") ?? literal(metadataValue);

	const overrideUntracked = getLixcolOverride("lixcol_untracked");
	const untrackedValue =
		overrideUntracked !== undefined
			? normalizeOverrideValue(overrideUntracked)
			: getColumnOrDefault(
					columnMap,
					"lixcol_untracked",
					overrideUntracked ?? 0
				);
	const untrackedExpr =
		expressionFor("lixcol_untracked") ?? literal(untrackedValue);

	const resolvedDefaults = new Map<string, unknown>();
	const snapshotContentExpr = buildSnapshotObjectExpression({
		schema: args.schema,
		columnMap,
		columnExpressions,
		literal,
		cel: args.celEnvironment,
		context: args.celContext,
		resolvedDefaults,
	});

	return {
		expressions: [
			entityIdExpr,
			schemaKeyExpr,
			fileIdExpr,
			versionExpr,
			pluginKeyExpr,
			snapshotContentExpr,
			literal(args.schemaVersion),
			metadataExpr,
			untrackedExpr,
		],
	};
}

function expressionStringToAst(sql: string): ExpressionNode {
	const trimmed = sql.trim();
	if (/^\?\d+$/.test(trimmed) || trimmed === "?") {
		return createParameterExpression(trimmed === "?" ? "?" : trimmed);
	}
	if (trimmed.toUpperCase() === "NULL") {
		return createLiteralNode(null);
	}
	if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
		return createLiteralNode(Number(trimmed));
	}
	if (/^(TRUE|FALSE)$/i.test(trimmed)) {
		return createLiteralNode(trimmed.toLowerCase() === "true");
	}
	if (/^'(?:''|[^'])*'$/.test(trimmed)) {
		const inner = trimmed.slice(1, -1).replace(/''/g, "'");
		return createLiteralNode(inner);
	}
	return createRawExpression(sql);
}

function createParameterExpression(
	placeholder: string
): ParameterExpressionNode {
	const numericMatch = placeholder.match(/^\?(\d+)$/);
	const position = numericMatch ? Number(numericMatch[1]) - 1 : -1;
	return {
		node_kind: "parameter",
		placeholder,
		position,
	};
}

function createLiteralNode(
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

function buildObjectName(name: string): ObjectNameNode {
	return {
		node_kind: "object_name",
		parts: [identifier(name)],
	};
}

function extractTableName(name: ObjectNameNode): string | null {
	if (name.parts.length === 0) {
		return null;
	}
	const last = name.parts[name.parts.length - 1];
	return last?.value ?? null;
}
