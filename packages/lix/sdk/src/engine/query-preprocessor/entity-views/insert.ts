import type { IToken } from "chevrotain";
import type { LixEngine } from "../../boot.js";
import {
	Ident,
	INSERT,
	LParen,
	RParen,
	Comma,
	QIdent,
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
	isEntityRewriteAllowed,
	resolveMetadataDefaults,
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
	if (!isEntityRewriteAllowed(baseKey)) {
		return null;
	}

	const schema = loadStoredSchemaDefinition(engine, baseKey);
	if (!schema) return null;
	const rawMetadataDefaults =
		schema["x-lix-defaults"] && typeof schema["x-lix-defaults"] === "object"
			? (schema["x-lix-defaults"] as Record<string, unknown>)
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
	if (!isEntityRewriteAllowed(storedSchemaKey)) {
		return null;
	}
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
	index = valuesParse.nextIndex;
	if (valueRows.length === 0) return null;

	const columnMaps: Map<string, unknown>[] = [];
	for (const rowValues of valueRows) {
		if (columns.length !== rowValues.length) return null;
		const map = buildColumnValueMap(columns, rowValues);
		if (!map) return null;
		columnMaps.push(map);
	}

	const primaryKeys = extractPrimaryKeys(schema);
	if (!primaryKeys || primaryKeys.length === 0) return null;

	const params: unknown[] = [];
	const addParam = (value: unknown): string => {
		params.push(serializeParameter(value));
		return "?";
	};

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

	for (const columnMap of columnMaps) {
		const celContext = buildCelContext({
			columnMap,
			propertyLowerToActual,
		});
		const metadataDefaults = resolveMetadataDefaults({
			defaults: rawMetadataDefaults,
			cel: celState,
			context: celContext,
		});
		const getMetadataDefault = (key: string): unknown =>
			metadataDefaults.has(key) ? metadataDefaults.get(key) : undefined;
		const resolvedDefaults = new Map<string, unknown>();

		const renderPrimaryKeyExpr = (
			descriptor: PrimaryKeyDescriptor
		): string | null => {
			const pkValue = columnMap.get(descriptor.column);
			if (pkValue !== undefined) {
				if (isExpressionValue(pkValue)) {
					return pkValue.sql;
				}
				return addParam(pkValue);
			}
			const pointerExpr = renderPointerExpression({
				descriptor,
				columnMap,
				addParam,
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
				addParam,
				cel: celState,
				context: celContext,
				resolvedDefaults,
			});
			if (!defaultExpr || defaultExpr === "NULL") {
				return null;
			}
			return defaultExpr;
		};

		let entityIdExpr: string;
		if (primaryKeys.length === 1) {
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
		const fileIdValue = getColumnOrDefault(
			columnMap,
			"lixcol_file_id",
			getMetadataDefault("lixcol_file_id")
		);
		if (fileIdValue === undefined) {
			throw new Error(
				`Schema ${storedSchemaKey} requires lixcol_file_id via column or x-lix-defaults`
			);
		}
		const pluginKeyValue = getColumnOrDefault(
			columnMap,
			"lixcol_plugin_key",
			getMetadataDefault("lixcol_plugin_key")
		);
		if (pluginKeyValue === undefined) {
			throw new Error(
				`Schema ${storedSchemaKey} requires lixcol_plugin_key via column or x-lix-defaults`
			);
		}
		const metadataValue = columnMap.get("lixcol_metadata") ?? null;
		const untrackedValue = getColumnOrDefault(
			columnMap,
			"lixcol_untracked",
			metadataDefaults.has("lixcol_untracked")
				? metadataDefaults.get("lixcol_untracked")
				: 0
		);

		const schemaKeyExpr = addParam(schemaKeyValue);
		const fileIdExpr = addParam(fileIdValue);

		const explicitVersion = columnMap.get("lixcol_version_id");
		let versionExpr: string;
		if (variant === "all") {
			if (explicitVersion !== undefined) {
				versionExpr = isExpressionValue(explicitVersion)
					? explicitVersion.sql
					: addParam(explicitVersion);
			} else if (metadataDefaults.has("lixcol_version_id")) {
				versionExpr = addParam(metadataDefaults.get("lixcol_version_id"));
			} else {
				throw new Error(
					`INSERT into ${viewNameRaw} requires explicit lixcol_version_id or schema default`
				);
			}
		} else if (explicitVersion !== undefined) {
			versionExpr = isExpressionValue(explicitVersion)
				? explicitVersion.sql
				: addParam(explicitVersion);
		} else if (metadataDefaults.has("lixcol_version_id")) {
			versionExpr = addParam(metadataDefaults.get("lixcol_version_id"));
		} else {
			versionExpr = "(SELECT version_id FROM active_version)";
		}

		const pluginKeyExpr = addParam(pluginKeyValue);
		const snapshotContentExpr = buildSnapshotObjectExpression({
			schema,
			columnMap,
			addParam,
			cel: celState,
			context: celContext,
			resolvedDefaults,
		});
		const schemaVersionExpr = addParam(schemaVersionValue);
		const metadataExpr = addParam(metadataValue);
		const untrackedExpr = addParam(untrackedValue);

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
		parameters: params,
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
): { rows: unknown[][]; nextIndex: number } | null {
	if (tokens[index]?.tokenType !== LParen) return null;
	const rows: unknown[][] = [];
	let positionalIndex = 0;
	let i = index;

	while (i < tokens.length && tokens[i]?.tokenType === LParen) {
		const row: unknown[] = [];
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
			positionalIndex = parsed.nextPositionalIndex;
			i = parsed.nextTokenIndex - 1;
			expectValue = false;
		}
		rows.push(row);
		if (tokens[i]?.tokenType === Comma) {
			i += 1;
			continue;
		}
		break;
	}

	return { rows, nextIndex: i };
}

function parseValueToken(args: {
	tokens: IToken[];
	cursor: number;
	positionalIndex: number;
	parameters: ReadonlyArray<unknown>;
}): {
	value: unknown;
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
			nextTokenIndex: cursor + 1,
			nextPositionalIndex: positionalIndex,
		};
	}
	if (token.tokenType === NULL_TOKEN) {
		return {
			value: null,
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
				nextTokenIndex: cursor + 4,
				nextPositionalIndex: positionalIndex,
			};
		}
		if (innerToken.tokenType === NULL_TOKEN) {
			return {
				value: null,
				nextTokenIndex: cursor + 4,
				nextPositionalIndex: positionalIndex,
			};
		}
	}
	if (token.tokenType === LParen) {
		const fragments = [token.image ?? "("];
		let next = cursor + 1;
		let depth = 1;
		while (next < tokens.length && depth > 0) {
			const current = tokens[next];
			if (!current?.image) {
				return null;
			}
			fragments.push(current.image);
			if (current.tokenType === LParen) {
				depth += 1;
			} else if (current.tokenType === RParen) {
				depth -= 1;
			}
			next += 1;
		}
		if (depth !== 0) {
			return null;
		}
		return {
			value: { kind: "expression", sql: fragments.join(" ") },
			nextTokenIndex: next,
			nextPositionalIndex: positionalIndex,
		};
	}
	return null;
}

function deserializeJsonParameter(value: unknown): unknown {
	if (value == null) return null;
	if (typeof value !== "string") {
		return value;
	}
	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
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

function buildSnapshotObjectExpression(args: {
	schema: StoredSchemaDefinition;
	columnMap: Map<string, unknown>;
	addParam: (value: unknown) => string;
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
				addParam: args.addParam,
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
			addParam: args.addParam,
		});
		entries.push(`'${prop}', ${expression}`);
	}
	return `json_object(${entries.join(", ")})`;
}

function renderPointerExpression(args: {
	descriptor: PrimaryKeyDescriptor;
	columnMap: Map<string, unknown>;
	addParam: (value: unknown) => string;
}): string | null {
	const path = args.descriptor.path;
	if (path.length === 0) {
		return null;
	}
	const root = path[0]!.toLowerCase();
	const baseValue = args.columnMap.get(root);
	if (baseValue === undefined) {
		return null;
	}
	const baseExpr = valueToSqlExpression(baseValue, args.addParam);
	if (!baseExpr) {
		return null;
	}
	if (path.length === 1) {
		return baseExpr;
	}
	const jsonPath = buildSqliteJsonPath(path.slice(1));
	return `json_extract(${baseExpr}, '${jsonPath}')`;
}

function valueToSqlExpression(
	value: unknown,
	addParam: (value: unknown) => string
): string | null {
	if (value === undefined || value === null) {
		return null;
	}
	if (isExpressionValue(value)) {
		return value.sql;
	}
	if (typeof value === "object") {
		const serialized = jsonStringifyOrNull(value);
		if (serialized === null) {
			return null;
		}
		return `json(${addParam(serialized)})`;
	}
	return addParam(value);
}

function renderSnapshotValue(args: {
	definition: unknown;
	value: unknown;
	addParam: (value: unknown) => string;
}): string {
	const { definition, value, addParam } = args;
	if (value === undefined || value === null) {
		return "NULL";
	}
	if (definition && typeof definition === "object" && isJsonType(definition)) {
		if (typeof value === "object") {
			const serialized = jsonStringifyOrNull(value);
			if (serialized === null) {
				return "NULL";
			}
			return `json(${addParam(serialized)})`;
		}
		return addParam(value);
	}
	return addParam(value);
}

function renderDefaultSnapshotValue(args: {
	propertyName: string;
	definition: unknown;
	addParam: (value: unknown) => string;
	cel: CelEnvironmentState | null;
	context: Record<string, unknown>;
	resolvedDefaults: Map<string, unknown>;
}): string {
	const { propertyName, definition, addParam, cel, context, resolvedDefaults } =
		args;

	if (resolvedDefaults.has(propertyName)) {
		const cached = resolvedDefaults.get(propertyName);
		return renderSnapshotValue({
			definition,
			value: cached,
			addParam,
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
			addParam,
		});
	}

	const defaultValue = record.default;
	if (defaultValue !== undefined) {
		resolvedDefaults.set(propertyName, defaultValue);
		context[propertyName] = defaultValue as unknown;
		return renderSnapshotValue({
			definition,
			value: defaultValue,
			addParam,
		});
	}

	return "NULL";
}

function jsonStringifyOrNull(value: unknown): unknown {
	try {
		return JSON.stringify(value);
	} catch {
		return null;
	}
}

function serializeParameter(value: unknown): unknown {
	if (value === undefined) return null;
	if (value === null) return null;
	if (typeof value === "object") {
		if (value instanceof Uint8Array) return value;
		if (value instanceof Date) return value.toISOString();
		try {
			return JSON.stringify(value);
		} catch {
			return null;
		}
	}
	return value;
}
