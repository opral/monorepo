import {
	AS,
	Comma,
	Dot,
	FROM,
	Ident,
	JOIN,
	QIdent,
	SELECT,
	type Token,
} from "../tokenizer.js";

/**
 * Result returned when the lexer encounters an internal_state_vtable table factor.
 */
export interface TableFactorMatch {
	/** Inclusive start offset of the slice to replace. */
	start: number;
	/** Inclusive end offset of the slice to replace. */
	end: number;
	/** Alias to reuse for the rewritten subselect. */
	alias: string;
	/** Whether the alias was explicitly provided in the SQL. */
	explicitAlias: boolean;
	/** Alias text exactly as it appeared in SQL (quoted if applicable). */
	aliasSql: string;
	/** Index of the table identifier token inside the token array. */
	tokenIndex: number;
}

const leadingTokens = new Set([FROM, JOIN, Comma]);

const isIdentifier = (token: Token | undefined): token is Token =>
	!!token && (token.tokenType === Ident || token.tokenType === QIdent);

const normalizeName = (image: string): string => {
	if (image.startsWith('"') && image.endsWith('"')) {
		return image.slice(1, -1).replace(/""/g, "").toLowerCase();
	}
	return image.toLowerCase();
};

const reservedAlias = new Set([
	"inner",
	"left",
	"right",
	"full",
	"cross",
	"outer",
	"natural",
	"join",
	"union",
	"intersect",
	"except",
	"where",
	"group",
	"order",
	"having",
	"limit",
	"offset",
	"returning",
]);

const deriveAlias = (
	tableToken: Token,
	aliasToken: Token | undefined,
	tableName: string
): { alias: string; explicit: boolean; aliasSql: string } => {
	if (!aliasToken || !isIdentifier(aliasToken)) {
		return {
			alias: tableName,
			explicit: false,
			aliasSql: tableToken.image,
		};
	}

	const aliasLower = aliasToken.image.toLowerCase();
	if (reservedAlias.has(aliasLower)) {
		return {
			alias: tableName,
			explicit: false,
			aliasSql: tableToken.image,
		};
	}

	if (aliasToken.image.startsWith('"') && aliasToken.image.endsWith('"')) {
		const dequoted = aliasToken.image.slice(1, -1).replace(/""/g, "");
		return { alias: dequoted, explicit: true, aliasSql: aliasToken.image };
	}

	return {
		alias: aliasToken.image,
		explicit: true,
		aliasSql: aliasToken.image,
	};
};

const offsetOrThrow = (value: number | undefined, label: string): number => {
	if (value == null) {
		throw new Error(`Token ${label} is missing offset information`);
	}
	return value;
};

/**
 * Locate the first occurrence of `tableName` as a table factor in the provided token stream.
 *
 * The matcher is case-insensitive, supports quoted identifiers, optional `AS`, and aliases.
 * Returns `null` when the identifier is not used as a table factor (e.g. qualified column references).
 */

/**
 * Collects every table-factor match for the provided table name in a token stream.
 *
 * @example
 * ```ts
 * const tokens = tokenize("SELECT * FROM internal_state_vtable v");
 * const [match] = findTableFactors(tokens, "internal_state_vtable");
 * console.log(match.alias); // "v"
 * ```
 */
export function findTableFactors(
	tokens: Token[],
	tableName: string
): TableFactorMatch[] {
	const matches: TableFactorMatch[] = [];
	let startIndex = 0;
	while (startIndex < tokens.length) {
		const match = findTableFactor(tokens, tableName, startIndex);
		if (!match) break;
		matches.push(match);
		startIndex = match.tokenIndex + 1;
	}
	return matches;
}

export function findTableFactor(
	tokens: Token[],
	tableName: string,
	startIndex = 0
): TableFactorMatch | null {
	for (let index = startIndex; index < tokens.length; index++) {
		const current = tokens[index];
		if (!isIdentifier(current)) continue;

		if (normalizeName(current.image) !== tableName.toLowerCase()) continue;

		const next = tokens[index + 1];
		const afterNext = tokens[index + 2];
		if (next?.tokenType === Dot && isIdentifier(afterNext)) {
			// Column reference like alias.column; not a table factor.
			continue;
		}

		const prev = tokens[index - 1];
		if (prev && prev.tokenType === Comma) {
			let lookback = index - 2;
			let hasFromContext = false;
			while (lookback >= 0) {
				const candidate = tokens[lookback];
				if (!candidate) {
					lookback -= 1;
					continue;
				}
				if (candidate.tokenType === FROM || candidate.tokenType === JOIN) {
					hasFromContext = true;
					break;
				}
				if (candidate.tokenType === SELECT) {
					break;
				}
				lookback -= 1;
			}
			if (!hasFromContext) {
				continue;
			}
		}

		if (prev && !leadingTokens.has(prev.tokenType)) {
			// Not a table factor (likely qualified column reference).
			continue;
		}

		const start = offsetOrThrow(current.startOffset, current.image);

		let cursor = index + 1;
		const maybeAs = tokens[cursor];

		if (maybeAs?.tokenType === AS) {
			cursor += 1;
		}

		const aliasToken = tokens[cursor];
		const { alias, explicit, aliasSql } = deriveAlias(
			current,
			aliasToken,
			tableName
		);

		const endToken = explicit ? (aliasToken ?? current) : current;
		const end = offsetOrThrow(
			endToken?.endOffset ?? current.endOffset,
			endToken?.image ?? current.image
		);

		return {
			start,
			end,
			alias,
			explicitAlias: explicit,
			aliasSql,
			tokenIndex: index,
		};
	}

	return null;
}
