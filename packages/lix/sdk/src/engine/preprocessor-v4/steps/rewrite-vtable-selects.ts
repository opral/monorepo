import {
	AS,
	FROM,
	JOIN,
	QIdent,
	SELECT,
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
			start: tableToken.startOffset,
			end: lastToken.endOffset,
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

	const replacementSql = `(${context.inlineSql})`;
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
	filteredSchemaKeys: readonly string[]
): RewriteContext | null => {
	if (filteredSchemaKeys.length === 0) {
		return null;
	}

	const options: InlineVtableSqlOptions = {
		filteredSchemaKeys,
		requiredColumns: null,
	};

	return {
		inlineSql: compileVtableSelectSql(options).trim(),
	};
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
}) => {
	if (!getCacheTables) {
		return { statements };
	}

	const cacheTables = getCacheTables();
	if (!cacheTables || cacheTables.size === 0) {
		return { statements };
	}

	const schemaKeys = Array.from(cacheTables.keys());
	const context = buildInlineSql(schemaKeys);
	if (!context) {
		return { statements };
	}

	let changed = false;
	const rewritten = statements.map((statement) => {
		const next = rewriteSql(statement, context);
		if (next !== statement && next.sql !== statement.sql) {
			changed = true;
		}
		return next;
	});

	return changed ? { statements: rewritten } : { statements };
};
