import type { IToken } from "chevrotain";
import type { LixEngine } from "../../boot.js";
import {
	columnReference,
	identifier,
	type ColumnReferenceNode,
	type ExpressionNode,
	type FunctionCallExpressionNode,
	type FunctionCallArgumentNode,
	type LiteralNode,
	type RawFragmentNode,
	type OrderByItemNode,
	type WindowSpecificationNode,
	type WindowReferenceNode,
	type WindowFrameNode,
	type WindowFrameBoundNode,
} from "../sql-parser/nodes.js";
import { getColumnName } from "../sql-parser/ast-helpers.js";
import { Ident, QIdent } from "../../sql-parser/tokenizer.js";
import {
	parseJsonPointer,
	buildSqliteJsonPath,
} from "../../../schema-definition/json-pointer.js";
import { isJsonType } from "../../../schema-definition/json-type.js";
import type { CelEnvironment } from "../../cel-environment/cel-environment.js";
import { getStoredSchema } from "../../../stored-schema/get-stored-schema.js";
import type { LixSchemaDefinition } from "../../../schema-definition/definition.js";

export const escapeSqlString = (input: string): string =>
	input.replace(/'/g, "''");

export const literal = (value: unknown): string => {
	if (value === undefined || value === null) {
		return "NULL";
	}
	if (typeof value === "number") {
		if (!Number.isFinite(value)) {
			return "NULL";
		}
		return String(value);
	}
	if (typeof value === "bigint") {
		return value.toString();
	}
	if (typeof value === "boolean") {
		return value ? "1" : "0";
	}
	if (typeof value === "string") {
		return `'${escapeSqlString(value)}'`;
	}
	if (value instanceof Uint8Array) {
		let hex = "";
		for (const byte of value) {
			hex += byte.toString(16).padStart(2, "0");
		}
		return `X'${hex}'`;
	}
	if (value instanceof Date) {
		return `'${escapeSqlString(value.toISOString())}'`;
	}
	const serialized = JSON.stringify(value);
	if (serialized === undefined) {
		return "NULL";
	}
	return `'${escapeSqlString(serialized)}'`;
};

/**
 * Result emitted by entity view rewriters. When null is returned the
 * preprocessor should fall back to executing the original statement.
 */
export type RewriteResult = {
	sql: string;
};

export type ExpressionValue = { kind: "expression"; sql: string };

export const isExpressionValue = (value: unknown): value is ExpressionValue =>
	typeof value === "object" &&
	value !== null &&
	(value as Partial<ExpressionValue>).kind === "expression" &&
	typeof (value as Partial<ExpressionValue>).sql === "string";

export function deserializeJsonParameter(value: unknown): unknown {
	if (value == null) return null;
	if (typeof value !== "string") {
		return value;
	}
	return JSON.parse(value);
}

export function buildColumnValueMap(
	columns: readonly string[],
	values: readonly unknown[]
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

export function buildColumnExpressionMap(
	columns: readonly string[],
	expressions: readonly string[]
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

/**
 * Builds a map from lower-case property names to their canonical casing.
 *
 * @example
 * ```ts
 * const lookup = buildPropertyLookup(schema);
 * lookup.get("name"); // => "name"
 * ```
 */
export function buildPropertyLookup(
	schema: LixSchemaDefinition
): Map<string, string> {
	const map = new Map<string, string>();
	const properties = schema.properties ?? {};
	for (const property of Object.keys(properties)) {
		map.set(property.toLowerCase(), property);
	}
	return map;
}

/**
 * Finds the index of a keyword in a token stream, starting at a given offset.
 */
export function findKeyword(
	tokens: IToken[],
	start: number,
	keyword: string
): number {
	const target = keyword.toUpperCase();
	for (let i = start; i < tokens.length; i++) {
		const image = tokens[i]?.image;
		if (!image) continue;
		if (image.toUpperCase() === target) {
			return i;
		}
	}
	return -1;
}

/**
 * Extracts the SQL identifier name from either a quoted or unquoted token.
 */
export function extractIdentifier(token: IToken | undefined): string | null {
	if (!token?.image) return null;
	if (token.tokenType === QIdent) {
		return token.image.slice(1, -1).replace(/""/g, '"');
	}
	if (token.tokenType === Ident) {
		return token.image;
	}
	return null;
}

/**
 * Categorises an entity view by its suffix (base, _by_version, or _history).
 */
export type EntityViewVariant = "base" | "by_version" | "history";

export function classifyViewVariant(name: string): EntityViewVariant {
	const lower = name.toLowerCase();
	if (lower.endsWith("_by_version")) return "by_version";
	if (lower.endsWith("_history")) return "history";
	return "base";
}

/**
 * Removes variant suffixes from a view name to recover the stored schema key.
 */
export function baseSchemaKey(name: string): string | null {
	const lower = name.toLowerCase();
	if (lower.endsWith("_by_version")) return name.slice(0, -11);
	if (lower.endsWith("_history")) return name.slice(0, -8);
	return name;
}

const VIEW_VARIANT_TO_KEY: Record<"base" | "by_version" | "history", string> = {
	base: "state",
	by_version: "state_by_version",
	history: "state_history",
};

/**
 * Returns true if a specific view variant is enabled for the schema.
 */
export function isEntityViewVariantEnabled(
	schema: LixSchemaDefinition,
	variant: "base" | "by_version" | "history"
): boolean {
	const selected = schema?.["x-lix-entity-views"];
	if (!Array.isArray(selected)) {
		return true;
	}
	const viewKey = VIEW_VARIANT_TO_KEY[variant];
	return selected.some(
		(entry): boolean =>
			typeof entry === "string" && entry.toLowerCase() === viewKey
	);
}

export function resolveStoredSchemaKey(
	schema: LixSchemaDefinition,
	fallbackKey: string
): string {
	const key = schema?.["x-lix-key"];
	if (typeof key === "string" && key.length > 0) {
		return key;
	}
	return fallbackKey;
}

function candidateStoredSchemaKeys(schemaKey: string): string[] {
	if (!schemaKey) {
		return [];
	}
	const candidates = [schemaKey];
	if (!schemaKey.startsWith("lix_")) {
		candidates.push(`lix_${schemaKey}`);
	}
	return candidates;
}

export function loadLixSchemaDefinition(
	engine: Pick<LixEngine, "executeSync" | "runtimeCacheRef" | "hooks">,
	schemaKey: string
): LixSchemaDefinition | null {
	for (const candidate of candidateStoredSchemaKeys(schemaKey)) {
		const schema = getStoredSchema({ engine, key: candidate });
		if (schema) {
			return schema;
		}
	}
	return null;
}

/**
 * Extracts the lower-cased primary key fields from a stored schema.
 */
export interface PrimaryKeyDescriptor {
	readonly column: string;
	readonly rootColumn: string;
	readonly path: readonly string[];
}

export function extractPrimaryKeys(
	schema: LixSchemaDefinition
): PrimaryKeyDescriptor[] | null {
	const pk = schema["x-lix-primary-key"];
	if (!Array.isArray(pk) || pk.length === 0) {
		return null;
	}

	const descriptors: PrimaryKeyDescriptor[] = [];
	for (const entry of pk) {
		if (typeof entry !== "string" || entry.length === 0) {
			return null;
		}
		if (!entry.startsWith("/")) {
			return null;
		}
		const segments = parseJsonPointer(entry);
		if (segments.length === 0) {
			return null;
		}
		const root = segments[0]!.toLowerCase();
		const column = segments[segments.length - 1]!.toLowerCase();
		descriptors.push({
			column,
			rootColumn: root,
			path: segments.map((segment) => segment),
		});
	}
	return descriptors;
}

export interface PointerColumnDescriptor {
	readonly alias: string;
	readonly expression: string;
	readonly matchers: readonly string[];
}

/**
 * Derives column expressions for JSON pointers referenced by a schema's primary key.
 * These descriptors allow entity view rewrites to match WHERE clauses that target
 * nested structures using either the pointer name (e.g. `/value/x-lix-key`) or
 * friendly aliases such as `key`.
 *
 * @example
 * const columns = collectPointerColumnDescriptors({ schema });
 * // columns[0]?.alias === "key"
 * // columns[0]?.expression === `json_extract(snapshot_content, '$.value."x-lix-key"')`
 */
export function collectPointerColumnDescriptors(args: {
	schema: LixSchemaDefinition;
	primaryKeys?: PrimaryKeyDescriptor[] | null;
}): PointerColumnDescriptor[] {
	const primaryKeys = args.primaryKeys ?? extractPrimaryKeys(args.schema);
	if (!primaryKeys || primaryKeys.length === 0) {
		return [];
	}

	const descriptors = new Map<string, PointerColumnDescriptor>();
	for (const descriptor of primaryKeys) {
		if (!descriptor.path || descriptor.path.length <= 1) {
			continue;
		}
		const lastSegment = descriptor.path.at(-1) ?? "";
		const aliasInfo = buildPointerAliasInfo(lastSegment);
		if (!aliasInfo) continue;

		const aliasLower = aliasInfo.alias.toLowerCase();
		if (descriptors.has(aliasLower)) {
			continue;
		}

		const expression = `json_extract(snapshot_content, '${buildSqliteJsonPath(descriptor.path)}')`;
		const matcherSet = new Set<string>();
		for (const matcher of aliasInfo.matchers) {
			if (matcher.length > 0) {
				matcherSet.add(matcher.toLowerCase());
			}
		}
		if (descriptor.column.length > 0) {
			matcherSet.add(descriptor.column.toLowerCase());
		}

		descriptors.set(aliasLower, {
			alias: aliasInfo.alias,
			expression,
			matchers: Array.from(matcherSet),
		});
	}

	return Array.from(descriptors.values());
}

/**
 * Helper that returns an explicitly provided column value or a fallback default.
 */
export function getColumnOrDefault(
	columnMap: Map<string, unknown>,
	column: string,
	defaultValue: unknown
): unknown {
	if (columnMap.has(column)) {
		return columnMap.get(column);
	}
	const lowerColumn = column.toLowerCase();
	if (columnMap.has(lowerColumn)) {
		return columnMap.get(lowerColumn);
	}
	return defaultValue;
}

/**
 * Evaluates metadata overrides defined via x-lix-override-lixcols. Values that are strings are treated
 * as CEL expressions; other primitive values are passed through unchanged.
 */
export function resolveMetadataDefaults(args: {
	defaults: unknown;
	cel: CelEnvironment | null;
	context?: Record<string, unknown>;
}): Map<string, unknown> {
	const { defaults, cel } = args;
	const resolved = new Map<string, unknown>();
	if (!defaults || typeof defaults !== "object") {
		return resolved;
	}

	const context = args.context ?? {};
	for (const [key, raw] of Object.entries(
		defaults as Record<string, unknown>
	)) {
		if (typeof raw === "string") {
			if (!cel) {
				throw new Error(
					`Encountered x-lix-override-lixcols entry "${key}" but CEL evaluation is not initialised.`
				);
			}
			const value = cel.evaluate(raw, { ...context });
			if (value !== undefined) {
				resolved.set(key, value);
				context[key] = value as unknown;
			}
			continue;
		}
		if (raw !== undefined) {
			const normalized = normalizeOverrideValue(raw);
			resolved.set(key, normalized);
			context[key] = normalized as unknown;
		}
	}

	return resolved;
}

export function normalizeOverrideValue(value: unknown): unknown {
	if (typeof value !== "string") {
		return value;
	}
	const trimmed = value.trim();
	if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
		try {
			return JSON.parse(trimmed);
		} catch (error) {
			void error;
		}
	}
	return value;
}

export function buildSnapshotObjectExpression(args: {
	schema: LixSchemaDefinition;
	columnMap: Map<string, unknown>;
	columnExpressions: Map<string, string>;
	literal: (value: unknown) => string;
	cel: CelEnvironment | null;
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
			entries.push(`'${escapeSqlString(prop)}', ${defaultExpr}`);
			continue;
		}
		const rawValue = args.columnMap.get(lower);
		const expression = args.columnExpressions.get(lower) ?? null;
		const snapshotExpr = renderSnapshotValue({
			definition: def,
			value: rawValue,
			expression,
		});
		entries.push(`'${escapeSqlString(prop)}', ${snapshotExpr}`);
	}
	return `json_object(${entries.join(", ")})`;
}

export function buildCelContext(args: {
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

export function renderPointerExpression(args: {
	descriptor: PrimaryKeyDescriptor;
	columnMap: Map<string, unknown>;
	columnExpressions: Map<string, string>;
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
		return literal(baseValue);
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

export function renderDefaultSnapshotValue(args: {
	propertyName: string;
	definition: unknown;
	literal: (value: unknown) => string;
	cel: CelEnvironment | null;
	context: Record<string, unknown>;
	resolvedDefaults: Map<string, unknown>;
}): string {
	const {
		propertyName,
		definition,
		literal: literalFn,
		cel,
		context,
		resolvedDefaults,
	} = args;

	if (resolvedDefaults.has(propertyName)) {
		const cached = resolvedDefaults.get(propertyName);
		return renderSnapshotValue({ definition, value: cached, expression: null });
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
		return renderSnapshotValue({
			definition,
			value,
			expression: null,
		});
	}

	if (record.default !== undefined) {
		resolvedDefaults.set(propertyName, record.default);
		return literalFn(record.default);
	}

	return "NULL";
}

export function renderSnapshotValue(args: {
	definition: unknown;
	value: unknown;
	expression: string | null;
}): string {
	const { definition, value, expression } = args;
	if (expression && expression !== "NULL") {
		if (
			definition &&
			typeof definition === "object" &&
			isJsonType(definition)
		) {
			const trimmed = expression.trim().toLowerCase();
			if (
				trimmed.startsWith("json(") ||
				trimmed.startsWith("json_quote(") ||
				trimmed.startsWith("json_extract(") ||
				trimmed.startsWith("json_set(") ||
				trimmed.startsWith("case")
			) {
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

export function resolveSchemaDefinition(
	storedSchemas: Map<string, unknown>,
	viewName: string
): LixSchemaDefinition | null {
	const candidates = buildSchemaKeyCandidates(viewName);

	for (const candidate of candidates) {
		const direct = storedSchemas.get(candidate);
		if (direct && isSchemaDefinition(direct)) {
			return direct;
		}
	}

	const normalizedCandidates = new Set(
		candidates.map((candidate) => candidate.toLowerCase())
	);

	for (const [key, value] of storedSchemas) {
		if (!value) continue;
		if (!isSchemaDefinition(value)) continue;
		if (normalizedCandidates.has(key.toLowerCase())) {
			return value;
		}
	}

	return null;
}

function buildSchemaKeyCandidates(viewName: string): string[] {
	const candidates = new Set<string>();
	const addCandidate = (value: string | null | undefined) => {
		if (typeof value === "string" && value.length > 0) {
			candidates.add(value);
		}
	};

	addCandidate(viewName);

	const base = baseSchemaKey(viewName);
	addCandidate(base);

	const baseValue = base ?? viewName;
	const lowerBase = baseValue.toLowerCase();
	if (lowerBase.startsWith("lix_")) {
		addCandidate(baseValue.slice(4));
	} else {
		addCandidate(`lix_${baseValue}`);
	}

	return Array.from(candidates);
}

function isSchemaDefinition(value: unknown): value is LixSchemaDefinition {
	return typeof value === "object" && value !== null;
}

function buildPointerAliasInfo(
	segment: string
): { alias: string; matchers: readonly string[] } | null {
	if (!segment) {
		return null;
	}
	const stripped = segment.replace(/^x-lix-/, "");
	let alias = stripped.replace(/[^A-Za-z0-9_]/g, "_");
	if (alias.length === 0) {
		return null;
	}
	if (/^[0-9]/.test(alias)) {
		alias = `_${alias}`;
	}

	const matchers = new Set<string>();
	matchers.add(alias);
	matchers.add(alias.toLowerCase());
	if (stripped.length > 0) {
		matchers.add(stripped);
		matchers.add(stripped.toLowerCase());
	}
	matchers.add(segment);
	matchers.add(segment.toLowerCase());
	const sanitizedSegment = segment.replace(/[^A-Za-z0-9_]/g, "_");
	if (sanitizedSegment.length > 0) {
		matchers.add(sanitizedSegment);
		matchers.add(sanitizedSegment.toLowerCase());
	}

	return {
		alias,
		matchers: Array.from(matchers),
	};
}

export type ResolvedEntityView = {
	readonly schema: LixSchemaDefinition;
	readonly variant: Exclude<EntityViewVariant, "history">;
	readonly storedSchemaKey: string;
	readonly propertyLowerToActual: Map<string, string>;
};

export function resolveEntityView(args: {
	storedSchemas?: Map<string, unknown>;
	viewName: string | null;
	rejectImmutable?: boolean;
}): ResolvedEntityView | null {
	const { storedSchemas, viewName } = args;
	if (!storedSchemas || !viewName) {
		return null;
	}

	const variant = classifyViewVariant(viewName);
	if (variant === "history") {
		return null;
	}

	const schema = resolveSchemaDefinition(storedSchemas, viewName);
	if (!schema) {
		return null;
	}

	if (!isEntityViewVariantEnabled(schema, variant)) {
		return null;
	}

	if (args.rejectImmutable && schema["x-lix-immutable"]) {
		throw new Error(`Schema ${schema["x-lix-key"] ?? viewName} is immutable`);
	}

	const storedSchemaKey = resolveStoredSchemaKey(
		schema,
		baseSchemaKey(viewName) ?? viewName
	);

	return {
		schema,
		variant,
		storedSchemaKey,
		propertyLowerToActual: buildPropertyLookup(schema),
	};
}

export type EqualityCondition = {
	readonly column: string;
	readonly expression: ExpressionNode;
};

export function collectEqualityConditions(
	whereClause: ExpressionNode | RawFragmentNode | null
): EqualityCondition[] {
	if (!whereClause) {
		return [];
	}
	if ("sql_text" in whereClause) {
		return [];
	}

	const conditions: EqualityCondition[] = [];
	const visit = (expression: ExpressionNode) => {
		switch (expression.node_kind) {
			case "binary_expression":
				if (expression.operator === "and") {
					visit(expression.left);
					visit(expression.right);
					return;
				}
				if (expression.operator === "=") {
					if (expression.left.node_kind === "column_reference") {
						const column = getColumnName(expression.left).toLowerCase();
						conditions.push({ column, expression: expression.right });
						return;
					}
					if (expression.right.node_kind === "column_reference") {
						const column = getColumnName(expression.right).toLowerCase();
						conditions.push({ column, expression: expression.left });
						return;
					}
				}
				break;
			case "grouped_expression":
				visit(expression.expression);
				return;
			default:
				return;
		}
	};

	visit(whereClause);
	return conditions;
}

const VIEW_METADATA_COLUMN_MAP: Record<string, string> = {
	entity_id: "entity_id",
	lixcol_entity_id: "entity_id",
	schema_key: "schema_key",
	lixcol_schema_key: "schema_key",
	file_id: "file_id",
	lixcol_file_id: "file_id",
	plugin_key: "plugin_key",
	lixcol_plugin_key: "plugin_key",
	version_id: "version_id",
	lixcol_version_id: "version_id",
	metadata: "metadata",
	lixcol_metadata: "metadata",
	untracked: "untracked",
	lixcol_untracked: "untracked",
};

export type PredicateRewriteResult = {
	expression: ExpressionNode | null;
	hasVersionReference: boolean;
};

export function rewriteViewWhereClause(
	whereClause: ExpressionNode | RawFragmentNode | null,
	options: { propertyLowerToActual: Map<string, string> }
): PredicateRewriteResult | null {
	if (!whereClause) {
		return { expression: null, hasVersionReference: false };
	}
	if ("sql_text" in whereClause) {
		return null;
	}

	const flags = { hasVersionReference: false };
	const rewritten = rewritePredicateExpression(
		whereClause,
		options.propertyLowerToActual,
		flags
	);
	if (!rewritten) {
		return null;
	}

	return {
		expression: rewritten,
		hasVersionReference: flags.hasVersionReference,
	};
}

type PredicateRewriteFlags = {
	hasVersionReference: boolean;
};

function rewritePredicateExpression(
	expression: ExpressionNode,
	propertyLowerToActual: Map<string, string>,
	flags: PredicateRewriteFlags
): ExpressionNode | null {
	switch (expression.node_kind) {
		case "binary_expression": {
			const operator = expression.operator;
			if (operator === "and" || operator === "or") {
				const left = rewritePredicateExpression(
					expression.left,
					propertyLowerToActual,
					flags
				);
				if (!left) return null;
				const right = rewritePredicateExpression(
					expression.right,
					propertyLowerToActual,
					flags
				);
				if (!right) return null;
				return {
					node_kind: "binary_expression",
					left,
					operator,
					right,
				};
			}

			const supportedOperators = new Set([
				"=",
				"!=",
				"<>",
				">",
				">=",
				"<",
				"<=",
				"like",
				"not_like",
				"is",
				"is_not",
			]);
			if (!supportedOperators.has(operator)) {
				return null;
			}

			const left = rewritePredicateExpression(
				expression.left,
				propertyLowerToActual,
				flags
			);
			if (!left) return null;
			const right = rewritePredicateExpression(
				expression.right,
				propertyLowerToActual,
				flags
			);
			if (!right) return null;
			return {
				node_kind: "binary_expression",
				left,
				operator,
				right,
			};
		}
		case "unary_expression": {
			if (expression.operator === "minus" || expression.operator === "not") {
				const operand = rewritePredicateExpression(
					expression.operand,
					propertyLowerToActual,
					flags
				);
				if (!operand) return null;
				return {
					node_kind: "unary_expression",
					operator: expression.operator,
					operand,
				};
			}
			return null;
		}
		case "grouped_expression": {
			const rewritten = rewritePredicateExpression(
				expression.expression,
				propertyLowerToActual,
				flags
			);
			if (!rewritten) return null;
			return {
				node_kind: "grouped_expression",
				expression: rewritten,
			};
		}
		case "column_reference":
			return rewriteColumnReference(expression, propertyLowerToActual, flags);
		case "function_call": {
			const args: FunctionCallArgumentNode[] = [];
			for (const arg of expression.arguments) {
				if (arg.node_kind === "all_columns") {
					args.push(arg);
					continue;
				}
				const rewritten = rewritePredicateExpression(
					arg,
					propertyLowerToActual,
					flags
				);
				if (!rewritten) return null;
				args.push(rewritten);
			}
			const over = rewriteWindowOverForPredicate(
				expression.over,
				propertyLowerToActual,
				flags
			);
			if (expression.over && !over) {
				return null;
			}
			const call: FunctionCallExpressionNode = {
				node_kind: "function_call",
				name: expression.name,
				arguments: args,
				over,
			};
			return call;
		}
		case "in_list_expression": {
			const operand = rewritePredicateExpression(
				expression.operand,
				propertyLowerToActual,
				flags
			);
			if (!operand) return null;
			const items: ExpressionNode[] = [];
			for (const item of expression.items) {
				const rewritten = rewritePredicateExpression(
					item,
					propertyLowerToActual,
					flags
				);
				if (!rewritten) return null;
				items.push(rewritten);
			}
			return {
				node_kind: "in_list_expression",
				operand,
				items,
				negated: expression.negated,
			};
		}
		case "between_expression": {
			const operand = rewritePredicateExpression(
				expression.operand,
				propertyLowerToActual,
				flags
			);
			if (!operand) return null;
			const start = rewritePredicateExpression(
				expression.start,
				propertyLowerToActual,
				flags
			);
			if (!start) return null;
			const end = rewritePredicateExpression(
				expression.end,
				propertyLowerToActual,
				flags
			);
			if (!end) return null;
			return {
				node_kind: "between_expression",
				operand,
				start,
				end,
				negated: expression.negated,
			};
		}
		case "literal":
		case "parameter":
		case "subquery_expression":
			return expression;
		default:
			return null;
	}
}

function rewriteColumnReference(
	column: ColumnReferenceNode,
	propertyLowerToActual: Map<string, string>,
	flags: PredicateRewriteFlags
): ExpressionNode | null {
	const terminal = column.path[column.path.length - 1];
	if (!terminal) {
		return null;
	}
	const columnName = terminal.value;
	const lower = columnName.toLowerCase();

	const property = propertyLowerToActual.get(lower);
	if (property) {
		return createJsonExtractExpression(property);
	}

	const metadata = VIEW_METADATA_COLUMN_MAP[lower];
	if (metadata) {
		if (metadata === "version_id") {
			flags.hasVersionReference = true;
		}
		return columnReference(["state_by_version", metadata]);
	}

	if (
		column.path.length === 2 &&
		column.path[0]?.value.toLowerCase() === "state_by_version"
	) {
		const target = column.path[1]!.value;
		if (target.toLowerCase() === "version_id") {
			flags.hasVersionReference = true;
		}
		return columnReference(["state_by_version", target]);
	}

	return null;
}

function rewriteWindowOverForPredicate(
	over: WindowSpecificationNode | WindowReferenceNode | null,
	propertyLowerToActual: Map<string, string>,
	flags: PredicateRewriteFlags
): WindowSpecificationNode | WindowReferenceNode | null {
	if (!over) {
		return null;
	}
	if (over.node_kind === "window_reference") {
		return over;
	}
	const specification = rewriteWindowSpecificationForPredicate(
		over,
		propertyLowerToActual,
		flags
	);
	return specification;
}

function rewriteWindowSpecificationForPredicate(
	spec: WindowSpecificationNode,
	propertyLowerToActual: Map<string, string>,
	flags: PredicateRewriteFlags
): WindowSpecificationNode | null {
	const partitionBy: ExpressionNode[] = [];
	for (const expression of spec.partition_by) {
		const rewritten = rewritePredicateExpression(
			expression,
			propertyLowerToActual,
			flags
		);
		if (!rewritten) {
			return null;
		}
		partitionBy.push(rewritten);
	}

	const orderBy: OrderByItemNode[] = [];
	for (const item of spec.order_by) {
		const rewritten = rewritePredicateExpression(
			item.expression,
			propertyLowerToActual,
			flags
		);
		if (!rewritten) {
			return null;
		}
		orderBy.push({
			...item,
			expression: rewritten,
		});
	}

	let frame: WindowFrameNode | null = null;
	if (spec.frame) {
		frame = rewriteWindowFrameForPredicate(
			spec.frame,
			propertyLowerToActual,
			flags
		);
		if (!frame) {
			return null;
		}
	}

	return {
		...spec,
		partition_by: partitionBy,
		order_by: orderBy,
		frame,
	};
}

function rewriteWindowFrameForPredicate(
	frame: WindowFrameNode,
	propertyLowerToActual: Map<string, string>,
	flags: PredicateRewriteFlags
): WindowFrameNode | null {
	const start = rewriteWindowFrameBoundForPredicate(
		frame.start,
		propertyLowerToActual,
		flags
	);
	if (!start) {
		return null;
	}
	let end: WindowFrameBoundNode | null = null;
	if (frame.end) {
		end = rewriteWindowFrameBoundForPredicate(
			frame.end,
			propertyLowerToActual,
			flags
		);
		if (!end) {
			return null;
		}
	}
	return {
		...frame,
		start,
		end,
	};
}

function rewriteWindowFrameBoundForPredicate(
	bound: WindowFrameBoundNode,
	propertyLowerToActual: Map<string, string>,
	flags: PredicateRewriteFlags
): WindowFrameBoundNode | null {
	if (!bound.offset) {
		return bound;
	}
	const offset = rewritePredicateExpression(
		bound.offset,
		propertyLowerToActual,
		flags
	);
	if (!offset) {
		return null;
	}
	return {
		...bound,
		offset,
	};
}

function createJsonExtractExpression(property: string): ExpressionNode {
	const path = buildSqliteJsonPath([property]);
	return {
		node_kind: "function_call",
		name: identifier("json_extract"),
		arguments: [
			columnReference(["state_by_version", "snapshot_content"]),
			createLiteralNode(path),
		],
		over: null,
	};
}

function createLiteralNode(
	value: string | number | boolean | null
): LiteralNode {
	return {
		node_kind: "literal",
		value,
	};
}

export function combineWithAnd(
	left: ExpressionNode,
	right: ExpressionNode
): ExpressionNode {
	const normalizedLeft = requiresGrouping(left)
		? { node_kind: "grouped_expression" as const, expression: left }
		: left;
	const normalizedRight = requiresGrouping(right)
		? { node_kind: "grouped_expression" as const, expression: right }
		: right;
	return {
		node_kind: "binary_expression",
		left: normalizedLeft,
		operator: "and",
		right: normalizedRight,
	};
}

function requiresGrouping(expression: ExpressionNode): boolean {
	if (expression.node_kind !== "binary_expression") {
		return false;
	}
	return expression.operator === "or";
}
