import type { IToken } from "chevrotain";
import type { LixEngine } from "../../boot.js";
import {
	UPDATE,
	Equals,
	Comma,
	Dot,
	QMark,
	QMarkNumber,
	NULL as NULL_TOKEN,
	SQStr,
	Num,
	Minus,
	AND,
	Semicolon,
	LParen,
	RParen,
} from "../../sql-parser/tokenizer.js";
import { buildJsonObjectEntries } from "../../../entity-views/build-json-object-entries.js";
import {
	baseSchemaKey,
	classifyViewVariant,
	extractIdentifier,
	extractPrimaryKeys,
	findKeyword,
	loadStoredSchemaDefinition,
	resolveStoredSchemaKey,
	type RewriteResult,
	type StoredSchemaDefinition,
} from "./shared.js";

interface ParameterState {
	readonly parameters: ReadonlyArray<unknown>;
	positional: number;
}

interface ColumnAssignment {
	name: string;
	original: string;
	value: ValueSource;
}

interface Condition {
	name: string;
	original: string;
	value: ValueSource;
}

type ValueSource =
	| { kind: "param"; value: unknown }
	| { kind: "null" }
	| { kind: "literal"; sql: string }
	| { kind: "expression"; tokens: IToken[]; params: unknown[] };

const paramSource = (value: unknown): ValueSource => ({
	kind: "param",
	value,
});

/**
 * Rewrites UPDATE statements that target stored-schema entity views so the
 * underlying mutation is executed against `state_all` instead of relying on
 * SQLite triggers.
 *
 * The transformation mirrors the historical `createEntityViewIfNotExists`
 * triggers by rebuilding the JSON snapshot payload, enforcing routing columns,
 * and ensuring base views always reference the active version unless callers
 * supply an explicit version.
 *
 * @example
 * ```ts
 * const rewritten = rewriteEntityUpdate({
 *   sql: "UPDATE my_entity SET name = ? WHERE id = ?",
 *   tokens,
 *   parameters: ["Updated", "row-1"],
 *   engine,
 * });
 * // => UPDATE state_all ...
 * ```
 */
export function rewriteEntityUpdate(args: {
	sql: string;
	tokens: IToken[];
	parameters: ReadonlyArray<unknown>;
	engine: Pick<LixEngine, "sqlite" | "runtimeCacheRef" | "executeSync">;
}): RewriteResult | null {
	const { sql, tokens, parameters, engine } = args;
	if (tokens.length === 0 || tokens[0]?.tokenType !== UPDATE) {
		return null;
	}

	let index = 1;
	if (isKeyword(tokens[index], "OR")) {
		index += 2; // Skip conflict resolution clause (e.g. OR REPLACE)
	}

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

	const defaults = (schema["x-lix-defaults"] ?? {}) as Record<string, unknown>;
	const storedSchemaKey = resolveStoredSchemaKey(schema, baseKey);
	const isActiveVersionSchema = storedSchemaKey === "lix_active_version";
	const propertiesObject = (schema as StoredSchemaDefinition).properties ?? {};
	if (typeof propertiesObject !== "object" || propertiesObject === null) {
		return null;
	}
	const propertyKeys = Object.keys(propertiesObject);
	const propertyLowerToActual = new Map<string, string>();
	for (const key of propertyKeys) {
		propertyLowerToActual.set(key.toLowerCase(), key);
	}

	const primaryKeys = extractPrimaryKeys(schema);
	if (!primaryKeys || primaryKeys.length === 0) return null;

	const setIndex = findKeyword(tokens, index, "SET");
	if (setIndex === -1) return null;
	const whereIndex = findKeyword(tokens, setIndex + 1, "WHERE");
	const returningIndex = findKeyword(tokens, setIndex + 1, "RETURNING");
	const boundaryIndex =
		whereIndex !== -1
			? whereIndex
			: returningIndex !== -1
				? returningIndex
				: tokens.length;

	const parameterState: ParameterState = {
		parameters,
		positional: 0,
	};

	const assignments = parseAssignments(
		tokens,
		setIndex,
		boundaryIndex,
		parameterState,
		sql
	);
	if (!assignments) return null;

	const whereConditions =
		whereIndex !== -1
			? parseWhere(
					tokens,
					whereIndex,
					returningIndex !== -1 ? returningIndex : tokens.length,
					parameterState,
					sql
				)
			: [];
	if (whereIndex !== -1 && !whereConditions) {
		return null;
	}

	const params: unknown[] = [];
	const addParam = (value: unknown): string => {
		params.push(serializeParameter(value));
		return "?";
	};

	const renderValueSource = (source: ValueSource): string => {
		if (source.kind === "param") {
			return addParam(source.value);
		}
		if (source.kind === "null") {
			return "NULL";
		}
		if (source.kind === "literal") {
			return source.sql;
		}
		for (const value of source.params) {
			params.push(serializeParameter(value));
		}
		return renderExpressionTokens({
			tokens: source.tokens,
			propertyLowerToActual,
		});
	};

	const propertyExpressions = new Map<string, () => string>();
	const getPropertyExpression = (prop: string): string => {
		const lower = prop.toLowerCase();
		let factory = propertyExpressions.get(lower);
		if (!factory) {
			const assignment = assignments.get(lower);
			if (assignment) {
				factory = () => renderValueSource(assignment.value);
			} else {
				const expression = `json_extract(snapshot_content, '$.${prop}')`;
				factory = () => expression;
			}
			propertyExpressions.set(lower, factory);
		}
		return factory();
	};

	const buildEntityIdExpr = (): { sql: string; params: unknown[] } => {
		const startLen = params.length;
		const parts = primaryKeys.map((key) => {
			const actual = propertyLowerToActual.get(key) ?? key;
			return getPropertyExpression(actual);
		});
		const sql =
			parts.length === 1 ? parts[0]! : `(${parts.join(" || '~' || ")})`;
		const addedParams = params.splice(startLen);
		return { sql, params: addedParams };
	};

	const schemaKeyExpr = addParam(storedSchemaKey);
	const fileIdAssignment = assignments.get("lixcol_file_id");
	const metadataAssignment = assignments.get("lixcol_metadata");
	const untrackedAssignment = assignments.get("lixcol_untracked");
	const versionAssignment =
		assignments.get("lixcol_version_id") ??
		(variant === "base" &&
		(defaults.lixcol_version_id !== undefined || isActiveVersionSchema)
			? undefined
			: assignments.get("version_id"));

	let versionFallbackExpr: string | null = null;
	let versionSource: ValueSource | null = null;
	if (variant === "all") {
		if (versionAssignment) {
			versionSource = versionAssignment.value;
		} else {
			versionFallbackExpr = "version_id";
		}
	} else {
		if (versionAssignment) {
			versionSource = versionAssignment.value;
		} else if (isActiveVersionSchema) {
			versionSource = paramSource("global");
		} else if (defaults.lixcol_version_id !== undefined) {
			versionSource = paramSource(defaults.lixcol_version_id);
		} else {
			versionFallbackExpr = "(SELECT version_id FROM active_version)";
		}
	}

	const pluginKeyExpr =
		defaults.lixcol_plugin_key !== undefined
			? addParam(defaults.lixcol_plugin_key)
			: "plugin_key";
	const schemaVersionValue = String(schema["x-lix-version"] ?? "");
	const schemaVersionSource = paramSource(schemaVersionValue);

	const snapshotEntries = buildJsonObjectEntries({
		schema: schema as any,
		ref(prop) {
			return getPropertyExpression(prop);
		},
	});

	const touchesPrimaryKey = primaryKeys.some((key) => assignments.has(key));
	const assignmentClauses = [
		`schema_key = ${schemaKeyExpr}`,
		`file_id = ${
			fileIdAssignment ? renderValueSource(fileIdAssignment.value) : "file_id"
		}`,
		`plugin_key = ${pluginKeyExpr}`,
		`snapshot_content = json_object(${snapshotEntries})`,
		`schema_version = ${renderValueSource(schemaVersionSource)}`,
		`version_id = ${
			versionSource
				? renderValueSource(versionSource)
				: (versionFallbackExpr ?? "version_id")
		}`,
		`metadata = ${
			metadataAssignment
				? renderValueSource(metadataAssignment.value)
				: "metadata"
		}`,
		`untracked = ${
			untrackedAssignment
				? renderValueSource(untrackedAssignment.value)
				: "untracked"
		}`,
	];
	if (touchesPrimaryKey) {
		const renderWithOrdering = (
			source: ValueSource
		): { sql: string; params: unknown[] } => {
			const startLen = params.length;
			const sql = renderValueSource(source);
			const added = params.splice(startLen);
			return { sql, params: added };
		};
		const entityIdRendered = isActiveVersionSchema
			? renderWithOrdering(paramSource("active"))
			: defaults.lixcol_entity_id !== undefined
				? renderWithOrdering(paramSource(defaults.lixcol_entity_id))
				: buildEntityIdExpr();
		params.unshift(...entityIdRendered.params);
		assignmentClauses.unshift(`entity_id = ${entityIdRendered.sql}`);
	}

	const propertyLowerSet = new Set(
		propertyKeys.map((key) => key.toLowerCase())
	);
	const whereClauses: string[] = [];
	let hasVersionCondition = false;
	for (const condition of whereConditions ?? []) {
		const column = condition.name;
		const valueSql = renderValueSource(condition.value);
		if (propertyLowerSet.has(column)) {
			const actual = propertyLowerToActual.get(column) ?? condition.original;
			whereClauses.push(
				`json_extract(snapshot_content, '$.${actual}') = ${valueSql}`
			);
			continue;
		}
		switch (column) {
			case "lixcol_entity_id":
				whereClauses.push(`state_all.entity_id = ${valueSql}`);
				break;
			case "lixcol_schema_key":
				whereClauses.push(`state_all.schema_key = ${valueSql}`);
				break;
			case "lixcol_file_id":
				whereClauses.push(`state_all.file_id = ${valueSql}`);
				break;
			case "lixcol_plugin_key":
				whereClauses.push(`state_all.plugin_key = ${valueSql}`);
				break;
			case "lixcol_version_id":
				hasVersionCondition = true;
				whereClauses.push(`state_all.version_id = ${valueSql}`);
				break;
			case "lixcol_metadata":
				whereClauses.push(`state_all.metadata = ${valueSql}`);
				break;
			case "lixcol_untracked":
				whereClauses.push(`state_all.untracked = ${valueSql}`);
				break;
			default:
				return null;
		}
	}

	whereClauses.push(`state_all.schema_key = ${addParam(storedSchemaKey)}`);
	if (variant === "base" && !hasVersionCondition) {
		if (isActiveVersionSchema) {
			whereClauses.push(`state_all.version_id = ${addParam("global")}`);
		} else {
			whereClauses.push(
				`state_all.version_id = (SELECT version_id FROM active_version)`
			);
		}
	}

	const rewrittenSql = `UPDATE state_all\nSET\n  ${assignmentClauses.join(",\n  ")}\nWHERE\n  ${whereClauses.join("\n  AND ")}`;

	return {
		sql: rewrittenSql,
		parameters: params,
	};
}

function parseAssignments(
	tokens: IToken[],
	setIndex: number,
	endIndex: number,
	state: ParameterState,
	sql: string
): Map<string, ColumnAssignment> | null {
	if (!isKeyword(tokens[setIndex], "SET")) return null;
	let index = setIndex + 1;
	const assignments = new Map<string, ColumnAssignment>();

	while (index < endIndex) {
		const token = tokens[index];
		if (!token) return null;
		if (token.tokenType === Comma) {
			index += 1;
			continue;
		}

		const column = readColumnName(tokens, index);
		if (!column) return null;
		index = column.nextIndex;

		if (tokens[index]?.tokenType !== Equals) return null;
		index += 1;

		const value = parseValue(tokens, index, endIndex, state);
		if (!value) return null;
		index = value.nextIndex;

		assignments.set(column.name, {
			name: column.name,
			original: column.original,
			value: value.source,
		});
	}

	return assignments;
}

function parseWhere(
	tokens: IToken[],
	whereIndex: number,
	endIndex: number,
	state: ParameterState,
	sql: string
): Condition[] | null {
	if (!isKeyword(tokens[whereIndex], "WHERE")) return null;
	let index = whereIndex + 1;
	const conditions: Condition[] = [];

	while (index < endIndex) {
		const token = tokens[index];
		if (!token) break;
		if (token.tokenType === Semicolon) break;
		if (isKeyword(token, "RETURNING")) break;

		if (token.tokenType === AND) {
			index += 1;
			continue;
		}
		if (token.tokenType === LParen || token.tokenType === RParen) {
			index += 1;
			continue;
		}

		const column = readColumnName(tokens, index);
		if (!column) return null;
		index = column.nextIndex;

		if (tokens[index]?.tokenType !== Equals) return null;
		index += 1;

		const value = parseValue(tokens, index, endIndex, state);
		if (!value) return null;
		index = value.nextIndex;

		conditions.push({
			name: column.name,
			original: column.original,
			value: value.source,
		});
	}

	return conditions;
}

function readColumnName(
	tokens: IToken[],
	index: number
): { name: string; original: string; nextIndex: number } | null {
	let i = index;
	let token = tokens[i];
	if (!token) return null;
	let first = extractIdentifier(token);
	if (!first) return null;
	i += 1;

	if (tokens[i]?.tokenType === Dot) {
		i += 1;
		token = tokens[i];
		if (!token) return null;
		const second = extractIdentifier(token);
		if (!second) return null;
		i += 1;
		return { name: second.toLowerCase(), original: second, nextIndex: i };
	}

	return { name: first.toLowerCase(), original: first, nextIndex: i };
}

function parseValue(
	tokens: IToken[],
	index: number,
	endIndex: number,
	state: ParameterState
): { source: ValueSource; nextIndex: number } | null {
	const token = tokens[index];
	if (!token) return null;

	if (token.tokenType === QMark) {
		if (state.positional >= state.parameters.length) return null;
		const value = state.parameters[state.positional];
		state.positional += 1;
		return { source: { kind: "param", value }, nextIndex: index + 1 };
	}

	if (token.tokenType === QMarkNumber) {
		const idx = Number(token.image.slice(1)) - 1;
		if (!Number.isInteger(idx) || idx < 0 || idx >= state.parameters.length)
			return null;
		return {
			source: { kind: "param", value: state.parameters[idx] },
			nextIndex: index + 1,
		};
	}

	if (token.tokenType === NULL_TOKEN) {
		return { source: { kind: "null" }, nextIndex: index + 1 };
	}

	if (token.tokenType === Minus) {
		const next = tokens[index + 1];
		if (next && next.tokenType === Num) {
			return {
				source: { kind: "literal", sql: `-${next.image}` },
				nextIndex: index + 2,
			};
		}
	}

	if (token.tokenType === SQStr || token.tokenType === Num) {
		return {
			source: { kind: "literal", sql: token.image },
			nextIndex: index + 1,
		};
	}

	return parseExpression(tokens, index, endIndex, state);
}

function parseExpression(
	tokens: IToken[],
	index: number,
	endIndex: number,
	state: ParameterState
): { source: ValueSource; nextIndex: number } | null {
	const startToken = tokens[index];
	if (!startToken) return null;

	let i = index;
	let depth = 0;
	const params: unknown[] = [];
	const captured: IToken[] = [];

	while (i < endIndex) {
		const token = tokens[i];
		if (!token) break;

		if (depth === 0) {
			if (token.tokenType === Comma || token.tokenType === Semicolon) {
				break;
			}
			if (isKeyword(token, "WHERE") || isKeyword(token, "RETURNING")) {
				break;
			}
		}

		captured.push(token);

		if (token.tokenType === LParen) {
			depth += 1;
		}
		if (token.tokenType === RParen) {
			if (depth > 0) {
				depth -= 1;
			} else {
				break;
			}
		}

		if (token.tokenType === QMark) {
			if (state.positional >= state.parameters.length) return null;
			params.push(state.parameters[state.positional]);
			state.positional += 1;
		}

		if (token.tokenType === QMarkNumber) {
			const idx = Number(token.image.slice(1)) - 1;
			if (!Number.isInteger(idx) || idx < 0 || idx >= state.parameters.length)
				return null;
			params.push(state.parameters[idx]);
		}

		i += 1;
	}

	if (captured.length === 0) return null;

	return {
		source: { kind: "expression", tokens: captured, params },
		nextIndex: i,
	};
}

function renderExpressionTokens(args: {
	tokens: IToken[];
	propertyLowerToActual: Map<string, string>;
}): string {
	const { tokens, propertyLowerToActual } = args;
	const rendered: string[] = [];

	for (const token of tokens) {
		const ident = extractIdentifier(token);
		if (ident) {
			const lower = ident.toLowerCase();
			if (propertyLowerToActual.has(lower)) {
				const actual = propertyLowerToActual.get(lower) ?? ident;
				rendered.push(`json_extract(snapshot_content, '$.${actual}')`);
				continue;
			}
			switch (lower) {
				case "lixcol_entity_id":
					rendered.push("state_all.entity_id");
					continue;
				case "lixcol_schema_key":
					rendered.push("state_all.schema_key");
					continue;
				case "lixcol_file_id":
					rendered.push("state_all.file_id");
					continue;
				case "lixcol_plugin_key":
					rendered.push("state_all.plugin_key");
					continue;
				case "lixcol_inherited_from_version_id":
					rendered.push("state_all.inherited_from_version_id");
					continue;
				case "lixcol_created_at":
					rendered.push("state_all.created_at");
					continue;
				case "lixcol_updated_at":
					rendered.push("state_all.updated_at");
					continue;
				case "lixcol_change_id":
					rendered.push("state_all.change_id");
					continue;
				case "lixcol_untracked":
					rendered.push("state_all.untracked");
					continue;
				case "lixcol_commit_id":
					rendered.push("state_all.commit_id");
					continue;
				case "lixcol_version_id":
					rendered.push("state_all.version_id");
					continue;
				case "lixcol_metadata":
					rendered.push("state_all.metadata");
					continue;
				case "lixcol_writer_key":
					rendered.push("state_all.writer_key");
					continue;
			}
			rendered.push(token.image);
			continue;
		}

		rendered.push(token.image);
	}

	let sqlExpr = "";
	for (const fragment of rendered) {
		if (sqlExpr.length === 0) {
			sqlExpr = fragment;
			continue;
		}
		const prev = sqlExpr[sqlExpr.length - 1] ?? "";
		const needsSpace =
			!/[\s(,]/.test(prev) &&
			!/(?:[,.)])/u.test(fragment[0] ?? "") &&
			fragment !== ".";
		if (needsSpace) {
			sqlExpr += " ";
		}
		sqlExpr += fragment;
	}

	return sqlExpr.trim();
}

function isKeyword(token: IToken | undefined, keyword: string): boolean {
	if (!token?.image) return false;
	return token.image.toUpperCase() === keyword.toUpperCase();
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
