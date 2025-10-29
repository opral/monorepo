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
import { buildSqliteJsonPath } from "../../../schema-definition/json-pointer.js";
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
	literal,
	type RewriteResult,
	type PrimaryKeyDescriptor,
	type StoredSchemaDefinition,
} from "./shared.js";
import {
	createCelEnvironment,
	type CelEnvironment,
} from "../../cel-environment/cel-environment.js";
import { buildJsonObjectEntries } from "../../entity-views/build-json-object-entries.js";

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
	| { kind: "null" }
	| { kind: "sql"; sql: string }
	| { kind: "expression"; tokens: IToken[]; placeholders: number[] };

const formatPositionalParameter = (index: number): string => `?${index + 1}`;

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
	if (!isEntityViewVariantEnabled(schema, variant)) {
		return null;
	}

	const rawMetadataDefaults =
		schema["x-lix-override-lixcols"] &&
		typeof schema["x-lix-override-lixcols"] === "object"
			? (schema["x-lix-override-lixcols"] as Record<string, unknown>)
			: undefined;
	let metadataCel: CelEnvironment | null = null;
	if (
		rawMetadataDefaults &&
		Object.values(rawMetadataDefaults).some(
			(value) => typeof value === "string"
		)
	) {
		metadataCel = createCelEnvironment({ engine });
	}
	const lixcolOverrides = resolveMetadataDefaults({
		defaults: rawMetadataDefaults,
		cel: metadataCel,
	});
	const getLixcolOverride = (key: string): unknown =>
		lixcolOverrides.has(key) ? lixcolOverrides.get(key) : undefined;
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
		parameterState
	);
	if (!assignments) return null;

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

	const renderValueSource = (source: ValueSource): string => {
		if (source.kind === "null") {
			return "NULL";
		}
		if (source.kind === "sql") {
			return source.sql;
		}
		return renderExpressionTokens({
			tokens: source.tokens,
			placeholders: source.placeholders,
			propertyLowerToActual,
		});
	};

	const propertyExpressionCache = new Map<string, string>();
	const getPropertyExpression = (prop: string): string => {
		const lower = prop.toLowerCase();
		const assignment = assignments.get(lower);
		if (assignment) {
			return renderValueSource(assignment.value);
		}
		let cached = propertyExpressionCache.get(lower);
		if (!cached) {
			cached = `json_extract(snapshot_content, '$.${prop}')`;
			propertyExpressionCache.set(lower, cached);
		}
		return cached;
	};

	const buildEntityIdExpr = (): string => {
		const parts = primaryKeys.map((descriptor) =>
			renderPrimaryKeySource({
				descriptor,
				assignments,
				renderValueSource,
				propertyLowerToActual,
			})
		);
		return parts.length === 1 ? parts[0]! : `(${parts.join(" || '~' || ")})`;
	};

	const schemaKeyExpr = literal(storedSchemaKey);
	const fileIdAssignment = assignments.get("lixcol_file_id");
	const metadataAssignment = assignments.get("lixcol_metadata");
	const untrackedAssignment = assignments.get("lixcol_untracked");
	const overrideEntityId = lixcolOverrides.has("lixcol_entity_id")
		? getLixcolOverride("lixcol_entity_id")
		: undefined;
	const overrideFileId = lixcolOverrides.has("lixcol_file_id")
		? getLixcolOverride("lixcol_file_id")
		: undefined;
	const overridePluginKey = lixcolOverrides.has("lixcol_plugin_key")
		? getLixcolOverride("lixcol_plugin_key")
		: undefined;
	const overrideVersion = lixcolOverrides.has("lixcol_version_id")
		? getLixcolOverride("lixcol_version_id")
		: undefined;
	const overrideMetadata = lixcolOverrides.has("lixcol_metadata")
		? getLixcolOverride("lixcol_metadata")
		: undefined;
	const overrideUntracked = lixcolOverrides.has("lixcol_untracked")
		? getLixcolOverride("lixcol_untracked")
		: undefined;
	const fileIdOverrideExpr =
		overrideFileId !== undefined ? literal(overrideFileId) : null;
	const pluginOverrideExpr =
		overridePluginKey !== undefined ? literal(overridePluginKey) : null;
	const metadataOverrideExpr =
		overrideMetadata !== undefined ? literal(overrideMetadata) : null;
	const untrackedOverrideExpr =
		overrideUntracked !== undefined ? literal(overrideUntracked) : null;
	const schemaVersionValue = String(schema["x-lix-version"] ?? "");
	const schemaVersionExpr = literal(schemaVersionValue);

	const snapshotEntries = buildJsonObjectEntries({
		schema: schema as any,
		ref(prop) {
			return getPropertyExpression(prop);
		},
	});
	const explicitVersionAssignment =
		assignments.get("lixcol_version_id") ?? assignments.get("version_id");

	let versionExpr: string | null = null;
	let versionFallbackExpr: string | null = null;
	if (variant === "all") {
		if (explicitVersionAssignment) {
			versionExpr = renderValueSource(explicitVersionAssignment.value);
		} else {
			versionFallbackExpr = "version_id";
		}
	} else if (overrideVersion !== undefined) {
		versionExpr = literal(overrideVersion);
	} else if (explicitVersionAssignment) {
		versionExpr = renderValueSource(explicitVersionAssignment.value);
	} else if (isActiveVersionSchema) {
		versionExpr = literal("global");
	} else {
		versionFallbackExpr = "(SELECT version_id FROM active_version)";
	}

	const touchesPrimaryKey = primaryKeys.some(
		(descriptor) =>
			assignments.has(descriptor.column) ||
			assignments.has(descriptor.rootColumn)
	);
	const assignmentClauses = [
		`schema_key = ${schemaKeyExpr}`,
		`file_id = ${
			fileIdOverrideExpr ??
			(fileIdAssignment ? renderValueSource(fileIdAssignment.value) : "file_id")
		}`,
		`plugin_key = ${pluginOverrideExpr ?? "plugin_key"}`,
		`snapshot_content = json_object(${snapshotEntries})`,
		`schema_version = ${schemaVersionExpr}`,
		(() => {
			return `version_id = ${
				versionExpr ?? versionFallbackExpr ?? "version_id"
			}`;
		})(),
		`metadata = ${
			metadataOverrideExpr
				? metadataOverrideExpr
				: metadataAssignment
					? renderValueSource(metadataAssignment.value)
					: "metadata"
		}`,
		`untracked = ${
			untrackedOverrideExpr
				? untrackedOverrideExpr
				: untrackedAssignment
					? renderValueSource(untrackedAssignment.value)
					: "untracked"
		}`,
	];
	if (touchesPrimaryKey) {
		const entityIdSql =
			overrideEntityId !== undefined
				? literal(overrideEntityId)
				: buildEntityIdExpr();
		assignmentClauses.unshift(`entity_id = ${entityIdSql}`);
	}

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
		const pointerExpr = pointerColumnExpressions.get(column);
		if (pointerExpr) {
			whereClauses.push(`${pointerExpr} = ${valueSql}`);
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

	whereClauses.push(`state_all.schema_key = ${literal(storedSchemaKey)}`);
	if (variant === "base" && !hasVersionCondition) {
		whereClauses.push(
			`state_all.version_id = (SELECT version_id FROM active_version)`
		);
	}

	const rewrittenSql = `UPDATE state_all\nSET\n  ${assignmentClauses.join(",\n  ")}\nWHERE\n  ${whereClauses.join("\n  AND ")}`;

	return {
		sql: rewrittenSql,
	};
}

function parseAssignments(
	tokens: IToken[],
	setIndex: number,
	endIndex: number,
	state: ParameterState
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
		const placeholderIndex = state.positional;
		state.positional += 1;
		return {
			source: { kind: "sql", sql: formatPositionalParameter(placeholderIndex) },
			nextIndex: index + 1,
		};
	}

	if (token.tokenType === QMarkNumber) {
		const idx = Number(token.image.slice(1)) - 1;
		if (!Number.isInteger(idx) || idx < 0 || idx >= state.parameters.length)
			return null;
		return {
			source: { kind: "sql", sql: formatPositionalParameter(idx) },
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
				source: { kind: "sql", sql: `-${next.image}` },
				nextIndex: index + 2,
			};
		}
	}

	if (token.tokenType === SQStr || token.tokenType === Num) {
		return {
			source: { kind: "sql", sql: token.image },
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
	const result = captureExpression(tokens, index, endIndex, state);
	if (!result) return null;
	return {
		source: {
			kind: "expression",
			tokens: result.tokens,
			placeholders: result.placeholders,
		},
		nextIndex: result.nextIndex,
	};
}

function captureExpression(
	tokens: IToken[],
	index: number,
	endIndex: number,
	state: ParameterState
): { tokens: IToken[]; placeholders: number[]; nextIndex: number } | null {
	let i = index;
	let depth = 0;
	const captured: IToken[] = [];
	const placeholders: number[] = [];

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
		} else if (token.tokenType === RParen) {
			if (depth > 0) {
				depth -= 1;
			} else {
				break;
			}
		}

		if (token.tokenType === QMark) {
			if (state.positional >= state.parameters.length) return null;
			placeholders.push(state.positional);
			state.positional += 1;
		} else if (token.tokenType === QMarkNumber) {
			const idx = Number(token.image.slice(1)) - 1;
			if (!Number.isInteger(idx) || idx < 0 || idx >= state.parameters.length)
				return null;
			placeholders.push(idx);
		}

		i += 1;
	}

	if (captured.length === 0) {
		return null;
	}

	return { tokens: captured, placeholders, nextIndex: i };
}

function renderPrimaryKeySource(args: {
	descriptor: PrimaryKeyDescriptor;
	assignments: Map<string, ColumnAssignment>;
	renderValueSource: (source: ValueSource) => string;
	propertyLowerToActual: Map<string, string>;
}): string {
	const assignment =
		args.assignments.get(args.descriptor.column) ??
		args.assignments.get(args.descriptor.rootColumn);
	const normalizedPath = normalizePointerPath(
		args.descriptor,
		args.propertyLowerToActual
	);
	if (assignment) {
		const base = args.renderValueSource(assignment.value);
		if (normalizedPath.length <= 1) {
			return base;
		}
		const restPath = buildSqliteJsonPath(normalizedPath.slice(1));
		return `json_extract(${base}, '${restPath}')`;
	}
	const fullPath = buildSqliteJsonPath(normalizedPath);
	return `json_extract(snapshot_content, '${fullPath}')`;
}

function normalizePointerPath(
	descriptor: PrimaryKeyDescriptor,
	propertyLowerToActual: Map<string, string>
): string[] {
	return descriptor.path.map((segment, index) => {
		if (index === 0) {
			return propertyLowerToActual.get(segment.toLowerCase()) ?? segment;
		}
		return segment;
	});
}

function renderExpressionTokens(args: {
	tokens: IToken[];
	placeholders: number[];
	propertyLowerToActual: Map<string, string>;
}): string {
	const { tokens, placeholders, propertyLowerToActual } = args;
	const rendered: string[] = [];
	let placeholderCursor = 0;

	for (const token of tokens) {
		if (token.tokenType === QMark || token.tokenType === QMarkNumber) {
			const index = placeholders[placeholderCursor++] ?? 0;
			rendered.push(formatPositionalParameter(index));
			continue;
		}
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
