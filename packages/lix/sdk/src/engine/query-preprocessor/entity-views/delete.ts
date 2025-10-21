import type { IToken } from "chevrotain";
import type { LixEngine } from "../../boot.js";
import {
	DELETE,
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
import {
	baseSchemaKey,
	classifyViewVariant,
	extractIdentifier,
	extractPrimaryKeys,
	findKeyword,
	loadStoredSchemaDefinition,
	resolveStoredSchemaKey,
	collectPointerColumnDescriptors,
	isEntityViewVariantEnabled,
	resolveMetadataDefaults,
	type RewriteResult,
} from "./shared.js";
import {
	createCelEnvironment,
	type CelEnvironmentState,
} from "./cel-environment.js";

interface ParameterState {
	readonly parameters: ReadonlyArray<unknown>;
	positional: number;
}

interface Condition {
	name: string;
	original: string;
	value: ValueSource;
}

type ValueSource =
	| { kind: "param"; value: unknown }
	| { kind: "null" }
	| { kind: "literal"; sql: string };

/**
 * Rewrites DELETE statements that target stored-schema entity views so that the
 * mutation applies directly to `state_all` instead of relying on SQLite
 * triggers.
 *
 * @example
 * ```ts
 * const rewritten = rewriteEntityDelete({
 *   sql: "DELETE FROM my_entity WHERE id = ?",
 *   tokens,
 *   parameters: ["row-1"],
 *   engine,
 * });
 * // => DELETE FROM state_all ...
 * ```
 */
export function rewriteEntityDelete(args: {
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
	if (tokens.length === 0 || tokens[0]?.tokenType !== DELETE) {
		return null;
	}

	let index = 1;
	if (isKeyword(tokens[index], "FROM")) {
		index += 1;
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
	if (!isEntityViewVariantEnabled(schema, variant)) {
		return null;
	}

	const rawMetadataDefaults =
		schema["x-lix-override-lixcols"] &&
		typeof schema["x-lix-override-lixcols"] === "object"
			? (schema["x-lix-override-lixcols"] as Record<string, unknown>)
			: undefined;
	let metadataCel: CelEnvironmentState | null = null;
	if (
		rawMetadataDefaults &&
		Object.values(rawMetadataDefaults).some(
			(value) => typeof value === "string"
		)
	) {
		metadataCel = createCelEnvironment({
			listFunctions: engine.listFunctions,
			callFunction: engine.call,
		});
	}
	const lixcolOverrides = resolveMetadataDefaults({
		defaults: rawMetadataDefaults,
		cel: metadataCel,
	});
	const getLixcolOverride = (key: string): unknown =>
		lixcolOverrides.has(key) ? lixcolOverrides.get(key) : undefined;

	const propertiesObject = (schema as Record<string, unknown>).properties ?? {};
	if (!propertiesObject || typeof propertiesObject !== "object") {
		return null;
	}
	const propertyKeys = Object.keys(propertiesObject);
	const propertyLowerToActual = new Map<string, string>();
	for (const key of propertyKeys) {
		propertyLowerToActual.set(key.toLowerCase(), key);
	}

	const primaryKeys = extractPrimaryKeys(schema);
	if (!primaryKeys) return null;

	const storedSchemaKey = resolveStoredSchemaKey(schema, baseKey);

	const whereIndex = findKeyword(tokens, index, "WHERE");
	const returningIndex = findKeyword(tokens, index, "RETURNING");
	const parameterState: ParameterState = {
		parameters,
		positional: 0,
	};

	const whereConditions =
		whereIndex !== -1
			? parseWhere(
					tokens,
					whereIndex,
					returningIndex !== -1 ? returningIndex : tokens.length,
					parameterState
				)
			: [];
	if (whereIndex !== -1 && !whereConditions) {
		return null;
	}

	const params: unknown[] = [];
	const addParam = (value: unknown): string => {
		params.push(value);
		return "?";
	};

	const valueRenderCache = new Map<ValueSource, string>();
	const renderValueSource = (source: ValueSource): string => {
		if (source.kind === "param") {
			return addParam(source.value);
		}
		if (source.kind === "null") {
			return "NULL";
		}
		return source.sql;
	};

	const propertyLowerSet = new Set(
		propertyKeys.map((key) => key.toLowerCase())
	);
	const pointerColumnExpressions = new Map<string, string>();
	const pointerColumns = collectPointerColumnDescriptors({
		schema,
		primaryKeys,
	});
	for (const pointer of pointerColumns) {
		for (const matcher of pointer.matchers) {
			const key = matcher.toLowerCase();
			if (propertyLowerSet.has(key)) {
				continue;
			}
			if (!pointerColumnExpressions.has(key)) {
				pointerColumnExpressions.set(key, pointer.expression);
			}
		}
	}
	const whereClauses: string[] = [];
	let hasVersionCondition = false;

	whereClauses.push(`state_all.schema_key = ${addParam(storedSchemaKey)}`);

	for (const condition of whereConditions ?? []) {
		const column = condition.name;
		const rendered = renderCachedValue(
			condition.value,
			valueRenderCache,
			renderValueSource
		);
		if (propertyLowerSet.has(column)) {
			const actual = propertyLowerToActual.get(column) ?? condition.original;
			whereClauses.push(
				`json_extract(snapshot_content, '$.${actual}') = ${rendered}`
			);
			continue;
		}
		const pointerExpr = pointerColumnExpressions.get(column);
		if (pointerExpr) {
			whereClauses.push(`${pointerExpr} = ${rendered}`);
			continue;
		}

		switch (column) {
			case "lixcol_entity_id":
				whereClauses.push(`state_all.entity_id = ${rendered}`);
				break;
			case "lixcol_schema_key":
				whereClauses.push(`state_all.schema_key = ${rendered}`);
				break;
			case "lixcol_file_id":
				whereClauses.push(`state_all.file_id = ${rendered}`);
				break;
			case "lixcol_plugin_key":
				whereClauses.push(`state_all.plugin_key = ${rendered}`);
				break;
			case "lixcol_version_id":
				hasVersionCondition = true;
				whereClauses.push(`state_all.version_id = ${rendered}`);
				break;
			case "lixcol_metadata":
				whereClauses.push(`state_all.metadata = ${rendered}`);
				break;
			case "lixcol_untracked":
				whereClauses.push(`state_all.untracked = ${rendered}`);
				break;
			default:
				return null;
		}
	}

	const defaultVersion = getLixcolOverride("lixcol_version_id");
	if (!hasVersionCondition) {
		if (variant === "base") {
			if (defaultVersion !== undefined) {
				whereClauses.push(`state_all.version_id = ${addParam(defaultVersion)}`);
			} else {
				whereClauses.push(
					`state_all.version_id = (SELECT version_id FROM active_version)`
				);
			}
		} else if (variant === "all") {
			if (defaultVersion !== undefined) {
				whereClauses.push(`state_all.version_id = ${addParam(defaultVersion)}`);
			} else {
				throw new Error(
					`DELETE from ${viewNameRaw} requires explicit lixcol_version_id or schema default`
				);
			}
		}
	}

	const rewrittenSql = `DELETE FROM state_all\nWHERE\n  ${whereClauses.join("\n  AND ")}`;

	return {
		sql: rewrittenSql,
		parameters: params,
	};
}

function parseWhere(
	tokens: IToken[],
	whereIndex: number,
	endIndex: number,
	state: ParameterState
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

		const equalsToken = tokens[index];
		if (!equalsToken || equalsToken.image !== "=") return null;
		index += 1;

		const value = parseValue(tokens, index, state);
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
	const first = extractIdentifier(token);
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
	state: ParameterState
): { source: ValueSource; nextIndex: number } | null {
	let token = tokens[index];
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
		return null;
	}

	if (token.tokenType === SQStr || token.tokenType === Num) {
		return {
			source: { kind: "literal", sql: token.image },
			nextIndex: index + 1,
		};
	}

	const ident = extractIdentifier(token);
	if (ident) {
		return { source: { kind: "literal", sql: ident }, nextIndex: index + 1 };
	}

	return null;
}

function renderCachedValue(
	source: ValueSource,
	cache: Map<ValueSource, string>,
	render: (value: ValueSource) => string
): string {
	let existing = cache.get(source);
	if (existing) return existing;
	existing = render(source);
	cache.set(source, existing);
	return existing;
}

function isKeyword(token: IToken | undefined, keyword: string): boolean {
	if (!token?.image) return false;
	return token.image.toUpperCase() === keyword.toUpperCase();
}
