import type { IToken } from "chevrotain";
import type { LixEngine } from "../../boot.js";
import {
	Ident,
	INSERT,
	LParen,
	RParen,
	Comma,
	QMark,
	QMarkNumber,
	NULL as NULL_TOKEN,
} from "../../sql-parser/tokenizer.js";
import { isJsonType } from "../../../schema-definition/json-type.js";
import { buildSqliteJsonPath } from "../../../schema-definition/json-pointer.js";

import {
	baseSchemaKey,
	classifyViewVariant,
	extractIdentifier,
	extractPrimaryKeys,
	findKeyword,
	getColumnOrDefault,
	loadStoredSchemaDefinition,
	resolveStoredSchemaKey,
	isEntityViewVariantEnabled,
	resolveMetadataDefaults,
	literal,
	type RewriteResult,
	type StoredSchemaDefinition,
	type PrimaryKeyDescriptor,
} from "./shared.js";
import {
	createCelEnvironment,
	type CelEnvironmentState,
} from "./cel-environment.js";

type ExpressionValue = { kind: "expression"; sql: string };

const isExpressionValue = (value: unknown): value is ExpressionValue =>
	typeof value === "object" &&
	value !== null &&
	(value as Partial<ExpressionValue>).kind === "expression" &&
	typeof (value as Partial<ExpressionValue>).sql === "string";

export function rewriteEntityInsert(args: {
	sql: string;
	tokens: IToken[];
	parameters: ReadonlyArray<unknown>;
	engine: Pick<
		LixEngine,
		| "sqlite"
		| "executeSync"
		| "hooks"
		| "runtimeCacheRef"
		| "listFunctions"
		| "call"
	>;
}): RewriteResult | null {
	const { tokens, parameters, engine } = args;
	if (tokens.length === 0 || tokens[0]?.tokenType !== INSERT) {
		return null;
	}

	let index = findKeyword(tokens, 1, "INTO");
	if (index === -1) return null;
	index += 1;

	const tableToken = tokens[index];
	const viewNameRaw = extractIdentifier(tableToken);
	if (!viewNameRaw) return null;
	index += 1;

	const variant = classifyViewVariant(viewNameRaw);
	if (variant === "history") return null;

	const baseKey = baseSchemaKey(viewNameRaw);
	if (!baseKey) return null;

	const schema = loadStoredSchemaDefinition(engine, baseKey);
	if (!schema) return null;
	if (!isEntityViewVariantEnabled(schema, variant)) {
		return null;
	}
	const rawMetadataDefaults =
		schema["x-lix-override-lixcols"] &&
		typeof schema["x-lix-override-lixcols"] === "object"
			? (schema["x-lix-override-lixcols"] as Record<string, unknown>)
			: undefined;
	const propertiesObject = (schema as StoredSchemaDefinition).properties ?? {};
	const propertyLowerToActual = new Map<string, string>();
	for (const key of Object.keys(propertiesObject ?? {})) {
		propertyLowerToActual.set(key.toLowerCase(), key);
	}
	const hasMetadataCelDefaults = rawMetadataDefaults
		? Object.values(rawMetadataDefaults).some(
				(value) => typeof value === "string"
			)
		: false;
	const hasCelDefaults =
		hasMetadataCelDefaults ||
		Object.values(propertiesObject ?? {}).some(
			(definition) =>
				definition &&
				typeof definition === "object" &&
				typeof (definition as Record<string, unknown>)["x-lix-default"] ===
					"string"
		);
	const celState: CelEnvironmentState | null = hasCelDefaults
		? createCelEnvironment({
				listFunctions: args.engine.listFunctions,
				callFunction: args.engine.call,
			})
		: null;
	const storedSchemaKey = resolveStoredSchemaKey(schema, baseKey);
	const columnParse = parseColumnList(tokens, index);
	if (!columnParse) return null;
	const columns = columnParse.columns;
	index = columnParse.nextIndex;
	if (columns.length === 0) return null; // Require explicit columns

	index = findKeyword(tokens, index, "VALUES");
	if (index === -1) return null;
	index += 1;

	const valuesParse = parseValuesList(tokens, index, parameters);
	if (!valuesParse) return null;
	const valueRows = valuesParse.rows;
	const expressionRows = valuesParse.expressions;
	index = valuesParse.nextIndex;
	if (valueRows.length === 0) return null;

	const columnMaps: Map<string, unknown>[] = [];
	const columnExpressionMaps: Map<string, string>[] = [];
	for (let rowIndex = 0; rowIndex < valueRows.length; rowIndex++) {
		const rowValues = valueRows[rowIndex];
		const rowExpressions = expressionRows[rowIndex];
		if (!rowValues || !rowExpressions) return null;
		if (columns.length !== rowValues.length) return null;
		const map = buildColumnValueMap(columns, rowValues);
		if (!map) return null;
		const exprMap = buildColumnExpressionMap(columns, rowExpressions);
		if (!exprMap) return null;
		columnMaps.push(map);
		columnExpressionMaps.push(exprMap);
	}

	const primaryKeys = extractPrimaryKeys(schema);
	if (!primaryKeys || primaryKeys.length === 0) return null;

	const insertColumns = [
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

	const schemaVersionValue = String(schema["x-lix-version"] ?? "");
	const rowsSql: string[] = [];

	for (let rowIndex = 0; rowIndex < columnMaps.length; rowIndex++) {
		const columnMap = columnMaps[rowIndex]!;
		const columnExpressions = columnExpressionMaps[rowIndex]!;
		const celContext = buildCelContext({
			columnMap,
			propertyLowerToActual,
		});
		const lixcolOverrides = resolveMetadataDefaults({
			defaults: rawMetadataDefaults,
			cel: celState,
			context: celContext,
		});
		const getLixcolOverride = (key: string): unknown =>
			lixcolOverrides.has(key) ? lixcolOverrides.get(key) : undefined;
		const resolvedDefaults = new Map<string, unknown>();
		const expressionFor = (name: string): string | null => {
			const lower = name.toLowerCase();
			if (columnExpressions.has(lower)) {
				const expr = columnExpressions.get(lower);
				return expr ?? null;
			}
			return null;
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
				literal,
			});
			if (pointerExpr) {
				return pointerExpr;
			}
			const fallbackKey =
				propertyLowerToActual.get(descriptor.column) ??
				propertyLowerToActual.get(descriptor.rootColumn) ??
				descriptor.column;
			const pkDefinition = (schema.properties ?? {})[fallbackKey];
			const defaultExpr = renderDefaultSnapshotValue({
				propertyName: fallbackKey,
				definition: pkDefinition,
				literal,
				cel: celState,
				context: celContext,
				resolvedDefaults,
			});
			if (!defaultExpr || defaultExpr === "NULL") {
				return null;
			}
			return defaultExpr;
		};

		const overrideEntityId = lixcolOverrides.has("lixcol_entity_id")
			? lixcolOverrides.get("lixcol_entity_id")
			: undefined;
		let entityIdExpr: string;
		if (overrideEntityId !== undefined) {
			entityIdExpr = literal(overrideEntityId);
		} else if (primaryKeys.length === 1) {
			const expr = renderPrimaryKeyExpr(primaryKeys[0]!);
			if (!expr) return null;
			entityIdExpr = expr;
		} else {
			const parts: string[] = [];
			for (const primaryKey of primaryKeys) {
				const expr = renderPrimaryKeyExpr(primaryKey);
				if (!expr) {
					return null;
				}
				parts.push(expr);
			}
			entityIdExpr = `(${parts.join(" || '~' || ")})`;
		}
		const schemaKeyValue = storedSchemaKey;
		const overrideFileId = getLixcolOverride("lixcol_file_id");
		const fileIdValue =
			overrideFileId !== undefined
				? overrideFileId
				: getColumnOrDefault(columnMap, "lixcol_file_id", overrideFileId);
		if (fileIdValue === undefined) {
			throw new Error(
				`Schema ${storedSchemaKey} requires lixcol_file_id via column or x-lix-override-lixcols`
			);
		}
		const overridePluginKey = getLixcolOverride("lixcol_plugin_key");
		const pluginKeyValue =
			overridePluginKey !== undefined
				? overridePluginKey
				: getColumnOrDefault(columnMap, "lixcol_plugin_key", overridePluginKey);
		if (pluginKeyValue === undefined) {
			throw new Error(
				`Schema ${storedSchemaKey} requires lixcol_plugin_key via column or x-lix-override-lixcols`
			);
		}
		const overrideMetadata = getLixcolOverride("lixcol_metadata");
		const metadataValue =
			overrideMetadata !== undefined
				? overrideMetadata
				: (columnMap.get("lixcol_metadata") ?? null);
		const overrideUntracked = getLixcolOverride("lixcol_untracked");
		const untrackedValue =
			overrideUntracked !== undefined
				? overrideUntracked
				: getColumnOrDefault(
						columnMap,
						"lixcol_untracked",
						overrideUntracked ?? 0
					);

		const schemaKeyExpr = literal(schemaKeyValue);
		const fileIdExpr = expressionFor("lixcol_file_id") ?? literal(fileIdValue);

		const overrideVersion = lixcolOverrides.has("lixcol_version_id")
			? lixcolOverrides.get("lixcol_version_id")
			: undefined;
		const explicitVersionExpr =
			expressionFor("lixcol_version_id") ?? expressionFor("version_id");
		let versionExpr: string;
		if (variant === "all") {
			if (explicitVersionExpr) {
				versionExpr = explicitVersionExpr;
			} else if (overrideVersion !== undefined) {
				versionExpr = literal(overrideVersion);
			} else {
				throw new Error(
					`INSERT into ${viewNameRaw} requires explicit lixcol_version_id or schema default`
				);
			}
		} else if (overrideVersion !== undefined) {
			versionExpr = literal(overrideVersion);
		} else if (explicitVersionExpr) {
			versionExpr = explicitVersionExpr;
		} else {
			versionExpr = "(SELECT version_id FROM active_version)";
		}

		const pluginKeyExpr =
			expressionFor("lixcol_plugin_key") ?? literal(pluginKeyValue);
		const snapshotContentExpr = buildSnapshotObjectExpression({
			schema,
			columnMap,
			columnExpressions,
			literal,
			cel: celState,
			context: celContext,
			resolvedDefaults,
		});
		const schemaVersionExpr = literal(schemaVersionValue);
		const metadataExpr =
			overrideMetadata !== undefined
				? literal(overrideMetadata)
				: (expressionFor("lixcol_metadata") ?? literal(metadataValue));
		const untrackedExpr =
			overrideUntracked !== undefined
				? literal(overrideUntracked)
				: (expressionFor("lixcol_untracked") ?? literal(untrackedValue));

		rowsSql.push(
			`(${[
				entityIdExpr,
				schemaKeyExpr,
				fileIdExpr,
				versionExpr,
				pluginKeyExpr,
				snapshotContentExpr,
				schemaVersionExpr,
				metadataExpr,
				untrackedExpr,
			].join(", ")})`
		);
	}

	const rewrittenSql = `INSERT INTO state_all (${insertColumns.join(", ")}) VALUES ${rowsSql.join(", ")}`;
	return {
		sql: rewrittenSql,
	};
}

function buildCelContext(args: {
	columnMap: Map<string, unknown>;
	propertyLowerToActual: Map<string, string>;
}): Record<string, unknown> {
	const context: Record<string, unknown> = {};
	for (const [lowerName, actualName] of args.propertyLowerToActual.entries()) {
		if (!args.columnMap.has(lowerName)) continue;
		const raw = args.columnMap.get(lowerName);
		if (raw === undefined || isExpressionValue(raw)) continue;
		context[actualName] = raw;
	}
	return context;
}

function parseColumnList(
	tokens: IToken[],
	index: number
): { columns: string[]; nextIndex: number } | null {
	if (tokens[index]?.tokenType !== LParen) return null;
	const columns: string[] = [];
	let i = index + 1;
	let expectValue = true;
	for (; i < tokens.length; i++) {
		const token = tokens[i];
		if (!token) return null;
		if (token.tokenType === RParen) {
			if (expectValue && columns.length > 0) return null;
			i += 1;
			break;
		}
		if (token.tokenType === Comma) {
			if (expectValue) return null;
			expectValue = true;
			continue;
		}
		if (!expectValue) return null;
		const name = extractIdentifier(token);
		if (!name) return null;
		columns.push(name.toLowerCase());
		expectValue = false;
	}
	return { columns, nextIndex: i };
}

function parseValuesList(
	tokens: IToken[],
	index: number,
	parameters: ReadonlyArray<unknown>
): { rows: unknown[][]; expressions: string[][]; nextIndex: number } | null {
	if (tokens[index]?.tokenType !== LParen) return null;
	const rows: unknown[][] = [];
	const expressions: string[][] = [];
	let positionalIndex = 0;
	let i = index;

	while (i < tokens.length && tokens[i]?.tokenType === LParen) {
		const row: unknown[] = [];
		const rowExpressions: string[] = [];
		i += 1;
		let expectValue = true;
		for (; i < tokens.length; i++) {
			const token = tokens[i];
			if (!token) return null;
			if (token.tokenType === RParen) {
				if (expectValue) return null;
				i += 1;
				break;
			}
			if (token.tokenType === Comma) {
				if (expectValue) return null;
				expectValue = true;
				continue;
			}
			if (!expectValue) return null;
			const parsed = parseValueToken({
				tokens,
				cursor: i,
				positionalIndex,
				parameters,
			});
			if (!parsed) return null;
			row.push(parsed.value);
			rowExpressions.push(parsed.expression);
			positionalIndex = parsed.nextPositionalIndex;
			i = parsed.nextTokenIndex - 1;
			expectValue = false;
		}
		rows.push(row);
		expressions.push(rowExpressions);
		if (tokens[i]?.tokenType === Comma) {
			i += 1;
			continue;
		}
		break;
	}

	return { rows, expressions, nextIndex: i };
}

function parseValueToken(args: {
	tokens: IToken[];
	cursor: number;
	positionalIndex: number;
	parameters: ReadonlyArray<unknown>;
}): {
	value: unknown;
	expression: string;
	nextTokenIndex: number;
	nextPositionalIndex: number;
} | null {
	const { tokens, cursor, positionalIndex, parameters } = args;
	const token = tokens[cursor];
	if (!token) return null;
	if (token.tokenType === QMark) {
		if (positionalIndex >= parameters.length) return null;
		return {
			value: parameters[positionalIndex],
			expression: formatPositionalParameter(positionalIndex),
			nextTokenIndex: cursor + 1,
			nextPositionalIndex: positionalIndex + 1,
		};
	}
	if (token.tokenType === QMarkNumber) {
		const idx = Number(token.image.slice(1)) - 1;
		if (!Number.isInteger(idx) || idx < 0 || idx >= parameters.length)
			return null;
		return {
			value: parameters[idx],
			expression: formatPositionalParameter(idx),
			nextTokenIndex: cursor + 1,
			nextPositionalIndex: positionalIndex,
		};
	}
	if (token.tokenType === NULL_TOKEN) {
		return {
			value: null,
			expression: "NULL",
			nextTokenIndex: cursor + 1,
			nextPositionalIndex: positionalIndex,
		};
	}
	if (
		token.tokenType === Ident &&
		token.image?.toLowerCase() === "json" &&
		tokens[cursor + 1]?.tokenType === LParen
	) {
		const innerToken = tokens[cursor + 2];
		const closing = tokens[cursor + 3];
		if (!closing || closing.tokenType !== RParen) {
			return null;
		}
		if (!innerToken) return null;
		if (innerToken.tokenType === QMark) {
			if (positionalIndex >= parameters.length) return null;
			return {
				value: deserializeJsonParameter(parameters[positionalIndex]),
				expression: `json(${formatPositionalParameter(positionalIndex)})`,
				nextTokenIndex: cursor + 4,
				nextPositionalIndex: positionalIndex + 1,
			};
		}
		if (innerToken.tokenType === QMarkNumber) {
			const idx = Number(innerToken.image.slice(1)) - 1;
			if (!Number.isInteger(idx) || idx < 0 || idx >= parameters.length)
				return null;
			return {
				value: deserializeJsonParameter(parameters[idx]),
				expression: `json(${formatPositionalParameter(idx)})`,
				nextTokenIndex: cursor + 4,
				nextPositionalIndex: positionalIndex,
			};
		}
		if (innerToken.tokenType === NULL_TOKEN) {
			return {
				value: null,
				expression: "json(NULL)",
				nextTokenIndex: cursor + 4,
				nextPositionalIndex: positionalIndex,
			};
		}
	}
	if (token.tokenType === LParen) {
		const rendered = renderTokenExpression({
			tokens,
			start: cursor,
			positionalIndex,
		});
		if (!rendered) {
			return null;
		}
		return {
			value: { kind: "expression", sql: rendered.sql },
			expression: rendered.sql,
			nextTokenIndex: rendered.nextTokenIndex,
			nextPositionalIndex: rendered.nextPositionalIndex,
		};
	}
	return null;
}

function formatPositionalParameter(index: number): string {
	return `?${index + 1}`;
}

function renderTokenExpression(args: {
	tokens: IToken[];
	start: number;
	positionalIndex: number;
}): {
	sql: string;
	nextTokenIndex: number;
	nextPositionalIndex: number;
} | null {
	const fragments: string[] = [];
	let index = args.start;
	let depth = 0;
	let positional = args.positionalIndex;

	while (index < args.tokens.length) {
		const token = args.tokens[index];
		if (!token?.image) {
			return null;
		}
		const fragment = renderTokenFragment(token, positional);
		if (fragment === null) {
			return null;
		}
		fragments.push(fragment.sql);
		positional = fragment.nextPositionalIndex;
		if (token.tokenType === LParen) {
			depth += 1;
		} else if (token.tokenType === RParen) {
			depth -= 1;
			if (depth === 0) {
				index += 1;
				break;
			}
		}
		index += 1;
	}
	if (depth !== 0) {
		return null;
	}
	return {
		sql: joinSqlFragments(fragments),
		nextTokenIndex: index,
		nextPositionalIndex: positional,
	};
}

function renderTokenFragment(
	token: IToken,
	positionalIndex: number
): { sql: string; nextPositionalIndex: number } | null {
	if (!token.image) {
		return null;
	}
	if (token.tokenType === QMark) {
		return {
			sql: formatPositionalParameter(positionalIndex),
			nextPositionalIndex: positionalIndex + 1,
		};
	}
	if (token.tokenType === QMarkNumber) {
		const raw = token.image.slice(1);
		const idx = Number(raw) - 1;
		if (!Number.isInteger(idx) || idx < 0) {
			return null;
		}
		return {
			sql: formatPositionalParameter(idx),
			nextPositionalIndex: positionalIndex,
		};
	}
	return { sql: token.image, nextPositionalIndex: positionalIndex };
}

function joinSqlFragments(fragments: string[]): string {
	let sqlExpr = "";
	for (const fragment of fragments) {
		if (fragment.length === 0) continue;
		if (sqlExpr.length === 0) {
			sqlExpr = fragment;
			continue;
		}
		const prev = sqlExpr[sqlExpr.length - 1] ?? "";
		const needsSpace =
			!/\s|[(,]/.test(prev) &&
			!/^(?:[,.)])/u.test(fragment[0] ?? "") &&
			fragment !== ".";
		if (needsSpace) {
			sqlExpr += " ";
		}
		sqlExpr += fragment;
	}
	return sqlExpr.trim();
}

function deserializeJsonParameter(value: unknown): unknown {
	if (value == null) return null;
	if (typeof value !== "string") {
		return value;
	}
	return JSON.parse(value);
}

function buildColumnValueMap(
	columns: string[],
	values: unknown[]
): Map<string, unknown> | null {
	if (columns.length !== values.length) return null;
	const map = new Map<string, unknown>();
	for (let i = 0; i < columns.length; i++) {
		const columnName = columns[i];
		if (columnName === undefined) return null;
		map.set(columnName, values[i]);
	}
	return map;
}

function buildColumnExpressionMap(
	columns: string[],
	expressions: string[]
): Map<string, string> | null {
	if (columns.length !== expressions.length) return null;
	const map = new Map<string, string>();
	for (let i = 0; i < columns.length; i++) {
		const columnName = columns[i];
		if (columnName === undefined) return null;
		const expr = expressions[i];
		if (expr === undefined) return null;
		map.set(columnName, expr);
	}
	return map;
}

function buildSnapshotObjectExpression(args: {
	schema: StoredSchemaDefinition;
	columnMap: Map<string, unknown>;
	columnExpressions: Map<string, string>;
	literal: (value: unknown) => string;
	cel: CelEnvironmentState | null;
	context: Record<string, unknown>;
	resolvedDefaults: Map<string, unknown>;
}): string {
	const properties = Object.keys(args.schema.properties ?? {});
	if (properties.length === 0) {
		return "json_object()";
	}
	const entries: string[] = [];
	for (const prop of properties) {
		const def = (args.schema.properties ?? {})[prop];
		const lower = prop.toLowerCase();
		if (!args.columnMap.has(lower)) {
			const defaultExpr = renderDefaultSnapshotValue({
				propertyName: prop,
				definition: def,
				literal: args.literal,
				cel: args.cel,
				context: args.context,
				resolvedDefaults: args.resolvedDefaults,
			});
			entries.push(`'${prop}', ${defaultExpr}`);
			continue;
		}
		const rawValue = args.columnMap.get(lower);
		if (rawValue === undefined) {
			entries.push(`'${prop}', NULL`);
			continue;
		}
		const expression = renderSnapshotValue({
			definition: def,
			value: rawValue,
			expression: args.columnExpressions.get(lower) ?? null,
			literal: args.literal,
		});
		entries.push(`'${prop}', ${expression}`);
	}
	return `json_object(${entries.join(", ")})`;
}

function renderPointerExpression(args: {
	descriptor: PrimaryKeyDescriptor;
	columnMap: Map<string, unknown>;
	columnExpressions: Map<string, string>;
	literal: (value: unknown) => string;
}): string | null {
	const path = args.descriptor.path;
	if (path.length === 0) {
		return null;
	}
	const root = path[0]!.toLowerCase();
	const baseValue = args.columnMap.get(root);
	const baseExpr = (() => {
		const expr = args.columnExpressions.get(root);
		if (expr) return expr;
		if (baseValue === undefined) return null;
		if (isExpressionValue(baseValue)) {
			return baseValue.sql;
		}
		return args.literal(baseValue);
	})();
	if (!baseExpr) {
		return null;
	}
	if (path.length === 1) {
		return baseExpr;
	}
	const jsonPath = buildSqliteJsonPath(path.slice(1));
	return `json_extract(${baseExpr}, '${jsonPath}')`;
}

function renderSnapshotValue(args: {
	definition: unknown;
	value: unknown;
	expression: string | null;
	literal: (value: unknown) => string;
}): string {
	const { definition, value, expression, literal } = args;
	if (expression && expression !== "NULL") {
		if (
			definition &&
			typeof definition === "object" &&
			isJsonType(definition)
		) {
			const trimmed = expression.trim().toLowerCase();
			if (trimmed.startsWith("json(") || trimmed.startsWith("json_quote(")) {
				return expression;
			}
			return `CASE WHEN json_valid(${expression}) THEN json(${expression}) ELSE json_quote(${expression}) END`;
		}
		return expression;
	}
	if (value === undefined || value === null) {
		return "NULL";
	}
	if (definition && typeof definition === "object" && isJsonType(definition)) {
		const literalExpr = literal(value);
		return `CASE WHEN json_valid(${literalExpr}) THEN json(${literalExpr}) ELSE json_quote(${literalExpr}) END`;
	}
	if (isExpressionValue(value)) {
		return value.sql;
	}
	return literal(value);
}

function renderDefaultSnapshotValue(args: {
	propertyName: string;
	definition: unknown;
	literal: (value: unknown) => string;
	cel: CelEnvironmentState | null;
	context: Record<string, unknown>;
	resolvedDefaults: Map<string, unknown>;
}): string {
	const { propertyName, definition, literal, cel, context, resolvedDefaults } =
		args;

	if (resolvedDefaults.has(propertyName)) {
		const cached = resolvedDefaults.get(propertyName);
		return renderSnapshotValue({
			definition,
			value: cached,
			expression: null,
			literal,
		});
	}

	if (!definition || typeof definition !== "object") {
		return "NULL";
	}

	const record = definition as Record<string, unknown>;

	const celExpression = record["x-lix-default"];
	if (typeof celExpression === "string") {
		if (!cel) {
			throw new Error(
				`Encountered x-lix-default on ${propertyName} but CEL evaluation is not initialised.`
			);
		}
		const value = cel.evaluate(celExpression, { ...context });
		resolvedDefaults.set(propertyName, value);
		context[propertyName] = value as unknown;
		return renderSnapshotValue({
			definition,
			value,
			expression: null,
			literal,
		});
	}

	const defaultValue = record.default;
	if (defaultValue !== undefined) {
		resolvedDefaults.set(propertyName, defaultValue);
		context[propertyName] = defaultValue as unknown;
		return renderSnapshotValue({
			definition,
			value: defaultValue,
			expression: null,
			literal,
		});
	}

	return "NULL";
}
