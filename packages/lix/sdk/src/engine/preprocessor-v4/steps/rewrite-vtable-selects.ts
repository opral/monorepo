import {
	AS,
	AtName,
	ColonName,
	Comma,
	DollarName,
	DollarNumber,
	Dot,
	Equals,
	FROM,
	IN,
	JOIN,
	LParen,
	LIMIT,
	Ident,
	QIdent,
	QMark,
	QMarkNumber,
	RParen,
	SELECT,
	Star,
	SQStr,
	tokenize,
	type Token,
} from "../sql-parser/tokenizer.js";
import type { PreprocessorStatement, PreprocessorStep } from "../types.js";
import {
	compileVtableSelectSql,
	type InlineVtableSqlOptions,
} from "../../../state/vtable/compile-vtable-select.js";

const INTERNAL_STATE_VTABLE = "lix_internal_state_vtable";

type TableReferenceCst = {
	readonly alias: string;
	readonly start: number;
	readonly end: number;
};

type RewriteContext = {
	readonly inlineSql: string;
};

const LOWER_INTERNAL_STATE_VTABLE = INTERNAL_STATE_VTABLE.toLowerCase();

const isIdentifierToken = (token: Token | undefined): token is Token => {
	if (!token) {
		return false;
	}
	const name = token.tokenType.name;
	return name === "Ident" || name === "QIdent";
};

const normalizeIdentifier = (token: Token): string => {
	if (token.tokenType === QIdent) {
		const trimmed = token.image.slice(1, token.image.length - 1);
		return trimmed.replace(/""/g, '"');
	}
	return token.image;
};

const equalsIgnoreCase = (value: string, expected: string): boolean => {
	return (
		value.localeCompare(expected, undefined, {
			sensitivity: "accent",
			numeric: false,
		}) === 0
	);
};

const quoteIdentifier = (identifier: string): string => {
	return `"${identifier.replace(/"/g, '""')}"`;
};

const findVtableTables = (tokens: readonly Token[]): TableReferenceCst[] => {
	const references: TableReferenceCst[] = [];

	for (let index = 0; index < tokens.length; index += 1) {
		const current = tokens[index];
		if (!current) {
			continue;
		}
		if (current.tokenType !== FROM && current.tokenType !== JOIN) {
			continue;
		}

		const tableToken = tokens[index + 1];
		if (!isIdentifierToken(tableToken)) {
			continue;
		}

		const tableName = normalizeIdentifier(tableToken);
		if (!equalsIgnoreCase(tableName, INTERNAL_STATE_VTABLE)) {
			continue;
		}

		let aliasToken: Token | undefined;
		let lastToken: Token = tableToken;
		let cursor = index + 2;

		const next = tokens[cursor];
		if (next && next.tokenType === AS) {
			aliasToken = tokens[cursor + 1];
			if (aliasToken) {
				lastToken = aliasToken;
			}
		} else if (isIdentifierToken(next)) {
			aliasToken = next;
			lastToken = next;
		}

		const alias = aliasToken ? normalizeIdentifier(aliasToken) : tableName;

		references.push({
			alias,
			start: tableToken.startOffset ?? 0,
			end: lastToken.endOffset ?? lastToken.startOffset ?? 0,
		});
	}

	return references;
};

const rewriteSql = (
	statement: PreprocessorStatement,
	context: RewriteContext
): PreprocessorStatement => {
	const tokens = tokenize(statement.sql);
	if (!tokens.some((token) => token.tokenType === SELECT)) {
		return statement;
	}

	const references = findVtableTables(tokens);
	if (references.length === 0) {
		return statement;
	}

	const replacementSql = `(\n${context.inlineSql}\n)`;
	let sql = statement.sql;

	for (const reference of [...references].reverse()) {
		const aliasSql = ` AS ${quoteIdentifier(reference.alias)}`;
		const targetStart = reference.start;
		const targetEnd = reference.end;
		const before = sql.slice(0, targetStart);
		const after = sql.slice(targetEnd + 1);
		sql = `${before}${replacementSql}${aliasSql}${after}`;
	}

	return {
		...statement,
		sql,
	};
};

const buildInlineSql = (
	filteredSchemaKeys: readonly string[],
	requiredColumns: readonly string[] | null
): RewriteContext | null => {
	if (filteredSchemaKeys.length === 0) {
		return null;
	}

	const options: InlineVtableSqlOptions = {
		filteredSchemaKeys,
		requiredColumns,
	};

	return {
		inlineSql: compileVtableSelectSql(options).trim(),
	};
};

/**
 * Collects schema key filters for references to the internal vtable.
 */

const collectSchemaKeyFilters = ({
	tokens,
	references,
	parameters,
	cacheTables,
}: {
	tokens: readonly Token[];
	references: readonly TableReferenceCst[];
	parameters: ReadonlyArray<unknown>;
	cacheTables: Map<string, unknown>;
}): string[] => {
	if (references.length === 0) {
		return [];
	}

	const aliasSet = new Set(
		references.map((reference) => reference.alias.toLowerCase())
	);
	aliasSet.add(LOWER_INTERNAL_STATE_VTABLE);
	const resolveParameter = buildParameterResolver(tokens, parameters);
	const collected = new Set<string>();

	for (let index = 0; index < tokens.length; index += 1) {
		const token = tokens[index];
		if (!token) {
			continue;
		}
		const tokenType = token.tokenType;
		if (tokenType !== Ident && tokenType !== QIdent) {
			continue;
		}

		const identifier = normalizeIdentifier(token);
		if (!equalsIgnoreCase(identifier, "schema_key")) {
			continue;
		}

		let matchesAlias = false;
		const dotToken = tokens[index - 1];
		const aliasTokenRaw = tokens[index - 2];
		let aliasCandidate: Token | null = null;
		if (
			aliasTokenRaw &&
			(aliasTokenRaw.tokenType === Ident || aliasTokenRaw.tokenType === QIdent)
		) {
			aliasCandidate = aliasTokenRaw;
		}

		if (
			dotToken &&
			dotToken.tokenType === Dot &&
			aliasCandidate &&
			(aliasCandidate.tokenType === Ident ||
				aliasCandidate.tokenType === QIdent)
		) {
			const alias = normalizeIdentifier(aliasCandidate).toLowerCase();
			if (aliasSet.has(alias)) {
				matchesAlias = true;
			}
		} else if (aliasSet.has(LOWER_INTERNAL_STATE_VTABLE)) {
			matchesAlias = true;
		}

		if (!matchesAlias) {
			continue;
		}

		let cursor = index + 1;
		const operatorToken = tokens[cursor];
		if (operatorToken == null) {
			continue;
		}

		if (operatorToken.tokenType === Equals) {
			cursor += 1;
			const valueToken = tokens[cursor];
			if (valueToken == null) {
				continue;
			}

			const value = extractSchemaKeyValue({
				token: valueToken,
				tokenIndex: cursor,
				resolveParameter,
			});
			if (typeof value !== "string" || value.length === 0) {
				continue;
			}
			if (!cacheTables.has(value)) {
				continue;
			}
			collected.add(value);
			continue;
		}

		if (!isInToken(operatorToken)) {
			continue;
		}

		cursor += 1;
		const lParen = tokens[cursor];
		if (lParen == null || lParen.tokenType !== LParen) {
			continue;
		}

		cursor += 1;
		for (; cursor < tokens.length; cursor += 1) {
			const candidateToken = tokens[cursor];
			if (candidateToken == null) {
				break;
			}
			if (candidateToken.tokenType === RParen) {
				break;
			}
			if (candidateToken.tokenType === Comma) {
				continue;
			}

			const value = extractSchemaKeyValue({
				token: candidateToken,
				tokenIndex: cursor,
				resolveParameter,
			});
			if (typeof value !== "string" || value.length === 0) {
				continue;
			}
			if (!cacheTables.has(value)) {
				continue;
			}
			collected.add(value);
		}
	}

	return Array.from(collected);
};

const collectSelectedColumns = ({
	tokens,
	references,
}: {
	tokens: readonly Token[];
	references: readonly TableReferenceCst[];
}): string[] | null => {
	if (references.length === 0) {
		return null;
	}

	const aliasSet = new Set<string>(
		references.map((reference) => reference.alias.toLowerCase())
	);
	aliasSet.add(LOWER_INTERNAL_STATE_VTABLE);

	const columns = new Set<string>();
	let requiresAll = false;

	for (let index = 0; index < tokens.length; index += 1) {
		const token = tokens[index];
		if (!token) {
			continue;
		}
		if (token.tokenType === FROM || token.tokenType === LIMIT) {
			break;
		}
		if (token.tokenType === Star) {
			requiresAll = true;
			break;
		}

		if (token.tokenType !== Ident && token.tokenType !== QIdent) {
			continue;
		}

		const identifier = normalizeIdentifier(token);
		const lowerIdentifier = identifier.toLowerCase();
		const next = tokens[index + 1];
		const following = tokens[index + 2];

		if (next && next.tokenType === Dot) {
			if (!aliasSet.has(lowerIdentifier)) {
				continue;
			}
			if (!following) {
				continue;
			}
			if (following.tokenType === Star) {
				requiresAll = true;
				break;
			}
			if (following.tokenType === Ident || following.tokenType === QIdent) {
				const column = normalizeIdentifier(following);
				columns.add(column);
				index += 2;
				continue;
			}
			requiresAll = true;
			break;
		}

		if (aliasSet.has(LOWER_INTERNAL_STATE_VTABLE)) {
			columns.add(identifier);
		}
	}

	if (requiresAll || columns.size === 0) {
		return null;
	}

	return Array.from(columns);
};

const buildParameterResolver = (
	tokens: readonly Token[],
	parameters: ReadonlyArray<unknown>
): ((tokenIndex: number) => unknown) => {
	if (!parameters || parameters.length === 0) {
		return () => undefined;
	}

	const mapping = new Map<number, number>();
	let positionalCursor = 0;

	for (let index = 0; index < tokens.length; index += 1) {
		const token = tokens[index];
		if (!token) {
			continue;
		}
		if (!isPlaceholderToken(token)) {
			continue;
		}

		let parameterIndex: number | undefined;

		if (token.tokenType === QMarkNumber) {
			const numeric = Number.parseInt(token.image.slice(1), 10);
			if (Number.isInteger(numeric) && numeric > 0) {
				parameterIndex = numeric - 1;
			}
		} else if (token.tokenType === DollarNumber) {
			const numeric = Number.parseInt(token.image.slice(1), 10);
			if (Number.isInteger(numeric) && numeric > 0) {
				parameterIndex = numeric - 1;
			}
		}

		if (parameterIndex === undefined) {
			parameterIndex = positionalCursor;
			positionalCursor += 1;
		} else if (parameterIndex >= positionalCursor) {
			positionalCursor = parameterIndex + 1;
		}

		if (parameterIndex >= 0) {
			mapping.set(index, parameterIndex);
		}
	}

	return (tokenIndex: number) => {
		const parameterIndex = mapping.get(tokenIndex);
		if (parameterIndex === undefined) {
			return undefined;
		}
		return parameters[parameterIndex];
	};
};

const extractSchemaKeyValue = ({
	token,
	tokenIndex,
	resolveParameter,
}: {
	token: Token;
	tokenIndex: number;
	resolveParameter: (tokenIndex: number) => unknown;
}): string | null => {
	if (token.tokenType === SQStr) {
		return decodeSingleQuotedString(token.image);
	}

	if (token.tokenType === QIdent) {
		return normalizeIdentifier(token);
	}

	if (isPlaceholderToken(token)) {
		const value = resolveParameter(tokenIndex);
		return typeof value === "string" ? value : null;
	}

	if (isIdentifierToken(token)) {
		return normalizeIdentifier(token);
	}

	return null;
};

const decodeSingleQuotedString = (value: string): string => {
	const inner = value.slice(1, value.length - 1);
	return inner.replace(/''/g, "'");
};

const isPlaceholderToken = (token: Token): boolean => {
	const name = token.tokenType.name;
	return (
		name === QMark.name ||
		name === QMarkNumber.name ||
		name === DollarNumber.name ||
		name === DollarName.name ||
		name === ColonName.name ||
		name === AtName.name
	);
};

const isInToken = (token: Token): boolean => {
	const name = token.tokenType.name;
	return name === IN.name || equalsIgnoreCase(token.image, "IN");
};

/**
 * Rewrites statements that select from the internal state vtable.
 *
 * @example
 * ```ts
 * const { statements } = rewriteVtableSelects({ statements, getCacheTables });
 * ```
 */
export const rewriteVtableSelects: PreprocessorStep = ({
	statements,
	getCacheTables,
	trace,
}) => {
	if (!getCacheTables) {
		return { statements };
	}

	const cacheTables = getCacheTables();
	if (!cacheTables || cacheTables.size === 0) {
		return { statements };
	}

	const availableSchemaKeys = Array.from(cacheTables.keys());

	let changed = false;
	const rewritten = statements.map((statement) => {
		const tokens = tokenize(statement.sql);
		const references = findVtableTables(tokens);
		if (references.length === 0) {
			return statement;
		}

		const filters = collectSchemaKeyFilters({
			tokens,
			references,
			parameters: statement.parameters,
			cacheTables,
		});

		const selectedColumns = collectSelectedColumns({
			tokens,
			references,
		});

		const schemaKeys = filters.length > 0 ? filters : availableSchemaKeys;
		const context = buildInlineSql(schemaKeys, selectedColumns);
		if (!context) {
			if (trace) {
				trace.push({
					step: "rewrite_vtable_selects",
					payload: {
						filtered_schema_keys: filters,
						selected_columns: selectedColumns,
					},
				});
			}
			return statement;
		}

		const next = rewriteSql(statement, context);
		if (trace) {
			trace.push({
				step: "rewrite_vtable_selects",
				payload: {
					filtered_schema_keys: schemaKeys,
					selected_columns: selectedColumns,
				},
			});
		}
		if (next !== statement && next.sql !== statement.sql) {
			changed = true;
		}
		return next;
	});

	return changed ? { statements: rewritten } : { statements };
};
