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
}

const leadingTokens = new Set([FROM, JOIN, Comma]);

const isIdentifier = (token: Token | undefined): token is Token =>
  !!token && (token.tokenType === Ident || token.tokenType === QIdent);

const normalizeName = (image: string): string => {
  if (image.startsWith("\"") && image.endsWith("\"")) {
    return image.slice(1, -1).replace(/""/g, "").toLowerCase();
  }
  return image.toLowerCase();
};

const deriveAlias = (token: Token | undefined, tableName: string): { alias: string; explicit: boolean } => {
  if (!token || !isIdentifier(token)) {
    return { alias: tableName, explicit: false };
  }

  if (token.image.startsWith("\"") && token.image.endsWith("\"")) {
    const dequoted = token.image.slice(1, -1).replace(/""/g, "");
    return { alias: dequoted, explicit: true };
  }

  return { alias: token.image, explicit: true };
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
export function findTableFactor(tokens: Token[], tableName: string): TableFactorMatch | null {
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
    const { alias, explicit } = deriveAlias(aliasToken, tableName);

    const endToken = explicit ? aliasToken ?? current : current;
    const end = offsetOrThrow(endToken?.endOffset ?? current.endOffset, endToken?.image ?? current.image);

    return {
      start,
      end,
      alias,
      explicitAlias: explicit,
    };
  }

  return null;
}
