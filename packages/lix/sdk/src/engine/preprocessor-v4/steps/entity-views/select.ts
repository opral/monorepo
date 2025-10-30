import {
	AS,
	Comma,
	FROM,
	JOIN,
	SELECT,
	Ident,
	QIdent,
	tokenize,
	type Token,
} from "../../sql-parser/tokenizer.js";
import type {
	PreprocessorStatement,
	PreprocessorStep,
} from "../../types.js";
import {
	getEntityViewSelects,
	type EntityViewDefinition,
} from "./selects.js";

type EntityViewReference = {
	readonly start: number;
	readonly end: number;
	readonly alias: string;
	readonly viewName: string;
	readonly definition: EntityViewDefinition;
};

const isTableContext = (token: Token | undefined): boolean => {
	if (!token) return false;
	return (
		token.tokenType === FROM ||
		token.tokenType === JOIN ||
		token.tokenType === Comma
	);
};

const normalizeIdentifier = (token: Token | undefined): string | null => {
	if (!token?.image) {
		return null;
	}
	if (token.tokenType === QIdent) {
		return token.image.slice(1, -1).replace(/""/g, '"').toLowerCase();
	}
	if (token.tokenType === Ident) {
		return token.image.toLowerCase();
	}
	return token.image.toLowerCase();
};

const toAliasText = (token: Token | undefined, fallback: Token): string => {
	if (token) {
		return token.image;
	}
	return fallback.image;
};

const collectEntityViewReferences = (
	tokens: readonly Token[],
	metadata: Map<string, EntityViewDefinition>
): EntityViewReference[] => {
	const references: EntityViewReference[] = [];

	for (let index = 0; index < tokens.length; index += 1) {
		const token = tokens[index];
		if (!token) continue;
		if (token.tokenType !== Ident && token.tokenType !== QIdent) continue;

		const preceding = tokens[index - 1];
		if (!isTableContext(preceding)) {
			continue;
		}

		const normalized = normalizeIdentifier(token);
		if (!normalized) {
			continue;
		}

		const definition = metadata.get(normalized);
		if (!definition) {
			continue;
		}

		let aliasToken: Token | undefined;
		let lookahead = index + 1;

		if (tokens[lookahead]?.tokenType === AS) {
			aliasToken = tokens[lookahead + 1];
			if (aliasToken) {
				lookahead += 2;
			}
		} else {
			const candidate = tokens[lookahead];
			if (
				candidate &&
				(candidate.tokenType === Ident || candidate.tokenType === QIdent)
			) {
				aliasToken = candidate;
				lookahead += 1;
			}
		}

		const alias = toAliasText(aliasToken, token);
		const endToken = aliasToken ?? token;
		const startOffset = token.startOffset ?? 0;
		const endOffset =
			endToken.endOffset ?? endToken.startOffset ?? token.startOffset ?? 0;

		references.push({
			start: startOffset,
			end: endOffset,
			alias,
			viewName: token.image,
			definition,
		});
	}

	return references;
};

const applyReferences = (
	sql: string,
	references: readonly EntityViewReference[]
): string => {
	let current = sql;
	for (const reference of [...references].reverse()) {
		const replacement = `(\n${reference.definition.sql}\n) AS ${reference.alias}`;
		const before = current.slice(0, reference.start);
		const after = current.slice(reference.end + 1);
		current = `${before}${replacement}${after}`;
	}
	return current;
};

/**
 * Rewrites entity view SELECT statements to target the internal state vtable
 * directly. This mirrors the historic SQLite view expansion but bypasses the
 * view layer entirely.
 */
export const rewriteEntityViewSelects: PreprocessorStep = (context) => {
	const { statements, getEngine, cachePreflight, trace } = context;
	const engine = getEngine?.();
	if (!engine) {
		return { statements };
	}

	let metadata: Map<string, EntityViewDefinition>;
	try {
		({ metadata } = getEntityViewSelects({ engine }));
	} catch (error) {
		if (isMissingStateVtableError(error)) {
			return { statements };
		}
		throw error;
	}
	if (metadata.size === 0) {
		return { statements };
	}

	let mutated = false;
	const rewritten: PreprocessorStatement[] = [];
	const traceEntries: Array<{
		view: string;
		alias: string;
		variant: EntityViewDefinition["variant"];
		schemaKey: string;
	}> = [];

	for (const statement of statements) {
		const tokens = tokenize(statement.sql);
		if (tokens.length === 0 || tokens[0]?.tokenType !== SELECT) {
			rewritten.push(statement);
			continue;
		}

		const references = collectEntityViewReferences(tokens, metadata);
		if (references.length === 0) {
			rewritten.push(statement);
			continue;
		}

		for (const reference of references) {
			cachePreflight?.schemaKeys.add(reference.definition.schemaKey);
		}

		const sql = applyReferences(statement.sql, references);
		mutated = true;
		rewritten.push({
			sql,
			parameters: statement.parameters,
		});

		if (trace) {
			for (const reference of references) {
				traceEntries.push({
					view: reference.viewName,
					alias: reference.alias,
					variant: reference.definition.variant,
					schemaKey: reference.definition.schemaKey,
				});
			}
		}
	}

	if (trace && traceEntries.length > 0) {
		trace.push({
			step: "rewrite_entity_view_selects",
			payload: traceEntries,
		});
	}

	return mutated ? { statements: rewritten } : { statements };
};

const isMissingStateVtableError = (error: unknown): boolean => {
	if (!(error instanceof Error) || !error.message) {
		return false;
	}
	return /no such table:\s*lix_internal_state_vtable/i.test(error.message);
};
