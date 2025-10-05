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
} from "../sql-rewriter/tokenizer.js";
import { buildJsonObjectEntries } from "../../../entity-views/build-json-object-entries.js";

import {
	baseSchemaKey,
	classifyViewVariant,
	extractIdentifier,
	extractPrimaryKeys,
	findKeyword,
	getColumnOrDefault,
	loadStoredSchemaDefinition,
	type RewriteResult,
	type StoredSchemaDefinition,
} from "./shared.js";

export function rewriteEntityInsert(args: {
	sql: string;
	tokens: IToken[];
	parameters: ReadonlyArray<unknown>;
	engine: Pick<LixEngine, "sqlite">;
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

	const schema = loadStoredSchemaDefinition(engine.sqlite, baseKey);
	if (!schema) return null;
	const defaults = (schema["x-lix-defaults"] ?? {}) as Record<string, unknown>;

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
	if (!primaryKeys || primaryKeys.length !== 1) return null;

	const params: unknown[] = [];
	const addParam = (value: unknown): string => {
		params.push(serializeParameter(value));
		return "?";
	};

	const primaryKey = primaryKeys[0]!;
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
		const entityIdValue = columnMap.get(primaryKey);
		if (entityIdValue === undefined) return null;
		const schemaKeyValue = baseKey;
		const fileIdValue = getColumnOrDefault(
			columnMap,
			"lixcol_file_id",
			defaults.lixcol_file_id ?? "lix"
		);
		if (fileIdValue === undefined) return null;
		const pluginKeyValue = getColumnOrDefault(
			columnMap,
			"lixcol_plugin_key",
			defaults.lixcol_plugin_key ?? "lix_own_entity"
		);
		if (pluginKeyValue === undefined) return null;
		const metadataValue = columnMap.get("lixcol_metadata") ?? null;
		const untrackedValue = columnMap.get("lixcol_untracked") ?? 0;

		const entityIdExpr = addParam(entityIdValue);
		const schemaKeyExpr = addParam(schemaKeyValue);
		const fileIdExpr = addParam(fileIdValue);

		let versionExpr: string;
		if (variant === "all") {
			const explicitVersion = columnMap.get("lixcol_version_id");
			if (explicitVersion === undefined) return null;
			versionExpr = addParam(explicitVersion);
		} else {
			const explicitVersion = columnMap.get("lixcol_version_id");
			if (explicitVersion !== undefined) {
				versionExpr = addParam(explicitVersion);
			} else if (defaults.lixcol_version_id !== undefined) {
				versionExpr = addParam(defaults.lixcol_version_id);
			} else {
				versionExpr = "(SELECT version_id FROM active_version)";
			}
		}

		const pluginKeyExpr = addParam(pluginKeyValue);

		const snapshotEntries = buildJsonObjectEntries({
			schema: schema as any,
			ref(prop) {
				const value = columnMap.get(prop.toLowerCase());
				if (value === undefined) return "NULL";
				return addParam(value);
			},
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
				`json_object(${snapshotEntries})`,
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
			if (token.tokenType === QMark) {
				if (positionalIndex >= parameters.length) return null;
				row.push(parameters[positionalIndex]);
				positionalIndex += 1;
			} else if (token.tokenType === QMarkNumber) {
				const idx = Number(token.image.slice(1)) - 1;
				if (!Number.isInteger(idx) || idx < 0 || idx >= parameters.length)
					return null;
				row.push(parameters[idx]);
			} else if (token.tokenType === NULL_TOKEN) {
				row.push(null);
			} else {
				return null;
			}
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
