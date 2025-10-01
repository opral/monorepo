import {
	AS,
	Comma,
	FROM,
	Ident,
	JOIN,
	QIdent,
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
	const forbiddenAlias =
		aliasLower === "inner" ||
		aliasLower === "left" ||
		aliasLower === "right" ||
		aliasLower === "full" ||
		aliasLower === "cross" ||
		aliasLower === "outer" ||
		aliasLower === "natural" ||
		aliasLower === "join";
	if (forbiddenAlias) {
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
export function findTableFactor(
	tokens: Token[],
	tableName: string
): TableFactorMatch | null {
	for (let index = 0; index < tokens.length; index++) {
		const current = tokens[index];
		if (!isIdentifier(current)) continue;

		if (normalizeName(current.image) !== tableName.toLowerCase()) continue;

		const prev = tokens[index - 1];
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
		};
	}

	return null;
}
