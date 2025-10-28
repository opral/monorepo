import {
	identifier,
	type ExpressionNode,
	type InsertStatementNode,
	type ObjectNameNode,
	type ParameterExpressionNode,
	type RawFragmentNode,
	type StatementNode,
} from "../../sql-parser/nodes.js";
import { normalizeIdentifierValue } from "../../sql-parser/ast-helpers.js";
import { expressionToSql, compile } from "../../compile.js";
import type { PreprocessorStep } from "../../types.js";
import type { LixSchemaDefinition } from "../../../../schema-definition/definition.js";
import type { CelEnvironment } from "./cel-environment.js";
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
import { expandSqlViews as expandSqlViewsStep } from "../expand-sql-views.js";

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
	const statement = context.node as StatementNode;
	if (statement.node_kind !== "insert_statement") {
		return statement;
	}

	const storedSchemas = context.getStoredSchemas?.();
	if (!storedSchemas || storedSchemas.size === 0) {
		return statement;
	}

	const insert = statement as InsertStatementNode;
	const viewName = extractTableName(insert.target);
	if (!viewName) {
		return statement;
	}

	const variant = classifyViewVariant(viewName);
	if (variant === "history") {
		return statement;
	}

	const schema = resolveSchemaDefinition(storedSchemas, viewName);
	if (!schema) {
		return statement;
	}

	if (!isEntityViewVariantEnabled(schema, variant)) {
		return statement;
	}

	const parameters = context.parameters ?? [];
	const celEnvironment = context.getCelEnvironment?.() ?? null;

	const rewritten = buildEntityViewInsert({
		insert,
		schema,
		variant,
		viewName,
		parameters,
		celEnvironment,
		getSqlViews: context.getSqlViews,
	});

	if (!rewritten) {
		return statement;
	}

	const finalNode = context.getSqlViews
		? (expandSqlViewsStep({
				...context,
				node: rewritten,
			}) as StatementNode)
		: rewritten;

	context.trace?.push({
		step: "rewrite_entity_view_insert",
		payload: {
			view: viewName,
			schema: schema["x-lix-key"],
			variant,
		},
	});

	return finalNode;
};

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
	readonly usesActiveVersionCte: boolean;
};

function buildEntityViewInsert(args: BuildInsertArgs): StatementNode | null {
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
	let requiresActiveVersionCte = false;

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
		if (rowResult.usesActiveVersionCte) {
			requiresActiveVersionCte = true;
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

	if (!requiresActiveVersionCte) {
		return rewritten;
	}

	const baseSql = compile(rewritten).sql;
	const views = args.getSqlViews?.();
	const viewSql =
		views?.get("active_version") ??
		views?.get("active_version".toLowerCase()) ??
		null;
	const normalizedViewSql = (
		viewSql ?? "SELECT version_id FROM active_version"
	).trim();
	const viewAlias = "__active_version_view";
	const cteSelect = `SELECT version_id FROM (${normalizedViewSql})`;
	const insertSql = baseSql.replace(
		/(\(SELECT\s+version_id\s+FROM\s+)active_version\)/i,
		(_match, prefix) => `${prefix}${viewAlias})`
	);
	const finalSql = `WITH ${viewAlias} AS (${cteSelect}) ${insertSql}`;

	return {
		node_kind: "raw_fragment",
		sql_text: finalSql,
	};
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
				placeholder: expression.placeholder ?? "?",
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
		default: {
			const sql = expressionToSql(expression);
			return {
				value: { kind: "expression", sql },
				expression: sql,
			};
		}
	}
}

function evaluateParameterExpression(args: {
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
	let usesDefaultActiveVersion = false;
	const referencesActiveVersion = explicitVersionExpr
		? /\bactive_version\b/i.test(explicitVersionExpr)
		: false;
	if (args.variant === "all") {
		if (explicitVersionExpr) {
			versionExpr = explicitVersionExpr;
			if (referencesActiveVersion) {
				usesDefaultActiveVersion = true;
			}
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
		if (referencesActiveVersion) {
			usesDefaultActiveVersion = true;
		}
	} else {
		versionExpr = "(SELECT version_id FROM active_version)";
		usesDefaultActiveVersion = true;
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
		usesActiveVersionCte: usesDefaultActiveVersion,
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
	return {
		node_kind: "parameter",
		placeholder,
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
