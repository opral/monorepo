import type { LixEngine } from "../../boot.js";
import type { Token } from "../../sql-parser/tokenizer.js";
import type { RewriteResult } from "../entity-views/shared.js";
import { findInsteadOfTrigger } from "./trigger-registry.js";
import { readDmlTarget, type DmlOperation } from "./read-dml-target.js";
import { findKeyword, extractIdentifier } from "../entity-views/shared.js";
import { LParen, RParen, Comma, Equals } from "../../sql-parser/tokenizer.js";

/**
 * Routes a DML statement through a registered INSTEAD OF trigger handler when available.
 */
export function maybeRewriteInsteadOfTrigger(args: {
	engine: Pick<LixEngine, "sqlite" | "runtimeCacheRef" | "executeSync">;
	sql: string;
	tokens: Token[];
	parameters: ReadonlyArray<unknown>;
	op: DmlOperation;
}): RewriteResult | null {
	const { engine, sql, tokens, op } = args;
	const resolvedTarget = readDmlTarget(tokens, op);
	if (!resolvedTarget) {
		return null;
	}

	const trigger = findInsteadOfTrigger({
		engine,
		target: resolvedTarget,
		operation: op,
	});
	if (!trigger) {
		return null;
	}

	const body = trigger.bodySql.trim();
	if (body.length === 0) {
		return null;
	}

	if (!/\bNEW\b|\bOLD\b/i.test(body)) {
		const normalizedBody = rewriteRaiseCalls(body);
		return {
			sql: ensureTerminated(normalizedBody),
		};
	}

	if (op === "insert") {
		const rewritten = rewriteInsertTrigger({
			engine,
			sql,
			tokens,
			body,
			target: resolvedTarget,
		});
		if (rewritten) {
			return rewritten;
		}
	}

	if (op === "update") {
		const rewritten = rewriteUpdateTrigger({
			engine,
			sql,
			tokens,
			body,
			target: resolvedTarget,
		});
		if (rewritten) {
			return rewritten;
		}
	}

	if (op === "delete") {
		const rewritten = rewriteDeleteTrigger({
			engine,
			sql,
			tokens,
			body,
			target: resolvedTarget,
		});
		if (rewritten) {
			return rewritten;
		}
	}

	return null;
}

interface RewriteInsertArgs {
	readonly engine: Pick<LixEngine, "sqlite">;
	readonly sql: string;
	readonly tokens: Token[];
	readonly body: string;
	readonly target: string;
}

/**
 * Rewrites INSERT statements that would normally invoke an INSTEAD OF trigger
 * by inlining the trigger body once per VALUES row and substituting each
 * `NEW.column` reference with the caller-provided expression.
 */
function rewriteInsertTrigger(args: RewriteInsertArgs): RewriteResult | null {
	const { engine, sql, tokens, body, target } = args;
	const extraction = extractInsertValues({ sql, tokens, engine, target });
	if (!extraction) {
		return null;
	}
	const { rows, columnNames, returningClause } = extraction;
	if (rows.length === 0) {
		return null;
	}
	if (rows.length > 1) {
		return rewriteInsertTriggerMultiRow({
			body,
			rows,
			columnNames,
			returningClause,
		});
	}

	const statements: string[] = [];
	const returningStatements: string[] = [];
	for (const row of rows) {
		const rewrittenBody = substituteNewForRow({ body, row, columnNames });
		if (!rewrittenBody) {
			return null;
		}
		statements.push(ensureTerminated(rewrittenBody));
		if (returningClause) {
			const returningSelect = renderReturningSelect({
				returningClause,
				row,
				columnNames,
			});
			if (!returningSelect) {
				return null;
			}
			returningStatements.push(returningSelect);
		}
	}

	const finalSql =
		returningStatements.length > 0
			? [...statements, ...returningStatements].join("\n")
			: statements.join("\n");
	return {
		sql: finalSql,
	};
}

interface MultiRowRewriteArgs {
	readonly body: string;
	readonly rows: RowExpressions[];
	readonly columnNames: string[];
	readonly returningClause: string | null;
}

function rewriteInsertTriggerMultiRow(
	args: MultiRowRewriteArgs
): RewriteResult | null {
	if (args.returningClause) {
		return null;
	}

	const tuples: string[] = [];
	let prefix: string | null = null;
	let suffix: string | null = null;

	for (const row of args.rows) {
		const rewritten = substituteNewForRow({
			body: args.body,
			row,
			columnNames: args.columnNames,
		});
		if (!rewritten) {
			return null;
		}
		const parsed = splitInsertValuesStatement(rewritten);
		if (!parsed) {
			return null;
		}
		if (prefix === null) {
			prefix = parsed.prefix;
			suffix = parsed.suffix;
		} else {
			if (!equivalentInsertPrefix(prefix, parsed.prefix)) {
				return null;
			}
			if (!equivalentSuffix(suffix, parsed.suffix)) {
				return null;
			}
		}
		tuples.push(parsed.tuple);
	}

	if (!prefix || tuples.length === 0) {
		return null;
	}

	const valuesList = tuples.join(", ");
	const finalSql = `${prefix} ${valuesList}${
		suffix && suffix.length > 0 ? ` ${suffix}` : ""
	}`;

	return {
		sql: ensureTerminated(finalSql),
	};
}

function splitInsertValuesStatement(sql: string): {
	prefix: string;
	tuple: string;
	suffix: string;
} | null {
	const trimmed = sql.trim();
	if (trimmed.length === 0) return null;
	const upper = trimmed.toUpperCase();
	const valuesIndex = upper.indexOf("VALUES");
	if (valuesIndex === -1) {
		return null;
	}
	const prefixBase = trimmed.slice(0, valuesIndex + "VALUES".length).trimEnd();
	let cursor = valuesIndex + "VALUES".length;
	while (cursor < trimmed.length && /\s/.test(trimmed[cursor]!)) {
		cursor += 1;
	}
	if (cursor >= trimmed.length || trimmed[cursor] !== "(") {
		return null;
	}
	let depth = 0;
	let endIndex = -1;
	for (let i = cursor; i < trimmed.length; i++) {
		const ch = trimmed[i];
		if (ch === "(") {
			depth += 1;
		} else if (ch === ")") {
			depth -= 1;
			if (depth === 0) {
				endIndex = i + 1;
				break;
			}
		}
	}
	if (endIndex === -1) {
		return null;
	}
	const tuple = trimmed.slice(cursor, endIndex).trim();
	const remainder = trimmed.slice(endIndex).trimStart();
	return {
		prefix: prefixBase,
		tuple,
		suffix: remainder,
	};
}

function equivalentInsertPrefix(a: string | null, b: string | null): boolean {
	if (a === null || b === null) return a === b;
	return normalizeWhitespace(a) === normalizeWhitespace(b);
}

function equivalentSuffix(a: string | null, b: string | null): boolean {
	const normA = normalizeWhitespace(a ?? "");
	const normB = normalizeWhitespace(b ?? "");
	return normA === normB;
}

function normalizeWhitespace(input: string): string {
	return input.replace(/\s+/g, " ").trim();
}

interface RewriteUpdateArgs {
	readonly engine: Pick<LixEngine, "sqlite">;
	readonly sql: string;
	readonly tokens: Token[];
	readonly body: string;
	readonly target: string;
}

function rewriteUpdateTrigger(args: RewriteUpdateArgs): RewriteResult | null {
	const { engine, sql, tokens, body, target } = args;
	const viewColumns = loadViewColumns(engine, target);
	if (viewColumns.length === 0) {
		return null;
	}

	const updateParsed = parseUpdateStatement({ sql, tokens });
	if (!updateParsed) {
		return null;
	}

	const renumberState = { positional: 0 };
	const assignments = new Map<string, string>();
	for (const [column, expr] of updateParsed.assignments.entries()) {
		const normalized = renumberAndRewriteExpression({
			expression: expr,
			renumberState,
			viewColumns,
		});
		if (normalized === null) {
			return null;
		}
		assignments.set(column, normalized);
	}

	const whereClause = renumberPositionalPlaceholders(
		updateParsed.whereClause,
		renumberState
	);
	const cte = `WITH __lix_old AS (SELECT * FROM ${quoteQualifiedIdentifier(target)} WHERE ${whereClause.length > 0 ? whereClause : "1"})`;

	const replacementMap = new Map<string, string>();
	for (const column of viewColumns) {
		const key = column.toLowerCase();
		const assignedExpr = assignments.get(key);
		const fallback = `(SELECT "${column}" FROM __lix_old LIMIT 1)`;
		replacementMap.set(
			`new.${key}`,
			assignedExpr ? `(${assignedExpr})` : fallback
		);
		replacementMap.set(`old.${key}`, fallback);
	}

	const rewrittenBody = substituteNewOldInBody({ body, replacementMap });
	if (!rewrittenBody) {
		return null;
	}

	let updateStatement = rewrittenBody;
	if (updateParsed.returningClause) {
		updateStatement = appendReturningClause(
			rewrittenBody,
			updateParsed.returningClause
		);
	}
	const sqlOut = `${cte}\n${updateParsed.returningClause ? updateStatement : rewrittenBody}`;
	return {
		sql: sqlOut,
	};
}

interface RewriteDeleteArgs {
	readonly engine: Pick<LixEngine, "sqlite">;
	readonly sql: string;
	readonly tokens: Token[];
	readonly body: string;
	readonly target: string;
}

function rewriteDeleteTrigger(args: RewriteDeleteArgs): RewriteResult | null {
	const { engine, sql, tokens, body, target } = args;
	const viewColumns = loadViewColumns(engine, target);
	if (viewColumns.length === 0) {
		return null;
	}
	const clauses = extractDeleteClauses(sql, tokens);
	if (!clauses) {
		return null;
	}
	const renumberState = { positional: 0 };
	const renumberedWhere = renumberPositionalPlaceholders(
		clauses.whereClause,
		renumberState
	);
	const cte = `WITH __lix_old AS (SELECT * FROM ${quoteQualifiedIdentifier(target)} WHERE ${renumberedWhere.length > 0 ? renumberedWhere : "1"})`;

	const replacementMap = new Map<string, string>();
	for (const column of viewColumns) {
		const fallback = `(SELECT "${column}" FROM __lix_old LIMIT 1)`;
		replacementMap.set(`new.${column.toLowerCase()}`, fallback);
		replacementMap.set(`old.${column.toLowerCase()}`, fallback);
	}

	let rewrittenBody = substituteNewOldInBody({ body, replacementMap });
	if (!rewrittenBody) {
		return null;
	}
	if (clauses.returningClause) {
		rewrittenBody = appendReturningClause(
			rewrittenBody,
			clauses.returningClause
		);
	}

	return {
		sql: `${cte}\n${rewrittenBody}`,
	};
}

interface RowExpressions {
	readonly map: Map<string, string>;
}

interface InsertExtraction {
	readonly rows: RowExpressions[];
	readonly columnNames: string[];
	readonly returningClause: string | null;
}

/**
 * Parses the caller INSERT statement into a set of column-expression maps in
 * the order SQLite would execute the trigger.
 */
function extractInsertValues({
	sql,
	tokens,
	engine,
	target,
}: {
	sql: string;
	tokens: Token[];
	engine: Pick<LixEngine, "sqlite">;
	target: string;
}): InsertExtraction | null {
	let index = 0;
	const intoIndex = findKeyword(tokens, 0, "INTO");
	if (intoIndex === -1) return null;
	index = intoIndex + 1;
	if (!tokens[index]) return null;
	index += 1; // skip target identifier or schema prefix (handled by tokenizer offsets)

	const viewColumns = loadViewColumns(engine, target);
	if (viewColumns.length === 0) {
		return null;
	}

	let explicitColumns: string[] = [];
	if (tokens[index]?.tokenType === LParen) {
		const parsed = parseColumnNames(sql, tokens, index);
		if (!parsed) return null;
		explicitColumns = parsed.columns;
		index = parsed.nextIndex;
	}

	const nextToken = tokens[index];
	if (nextToken?.image?.toUpperCase() === "DEFAULT") {
		const valuesToken = tokens[index + 1];
		if (!valuesToken || valuesToken.image?.toUpperCase() !== "VALUES") {
			return null;
		}
		const returningIndex = findKeyword(tokens, index + 2, "RETURNING");
		let returningClause: string | null = null;
		if (returningIndex !== -1) {
			const returningToken = tokens[returningIndex];
			const returningStart =
				returningToken?.startOffset ?? returningToken?.endOffset ?? -1;
			if (returningStart === -1 || !returningToken?.image) {
				return null;
			}
			returningClause = sql
				.slice(returningStart + returningToken.image.length)
				.replace(/;\s*$/, "")
				.trim();
			if (returningClause.length === 0) {
				return null;
			}
		}
		const extraction = buildDefaultRows(viewColumns);
		return extraction
			? {
					rows: extraction.rows,
					columnNames: extraction.columnNames,
					returningClause,
				}
			: null;
	}

	const valuesIndex = findKeyword(tokens, index, "VALUES");
	if (valuesIndex === -1) {
		return null;
	}

	index = valuesIndex + 1;
	const parsedValues = parseValuesExpressions(sql, tokens, index);
	if (!parsedValues) return null;
	const { rows, nextIndex } = parsedValues;
	index = nextIndex;

	const returningIndex = findKeyword(tokens, index, "RETURNING");

	const columnOrder =
		explicitColumns.length > 0 ? explicitColumns : viewColumns;
	if (columnOrder.length === 0) return null;

	const renumberState = { positional: 0 };
	const lowerViewColumns = viewColumns.map((name) => name.toLowerCase());
	const resultRows: RowExpressions[] = [];

	for (const valueRow of rows) {
		if (valueRow.length > columnOrder.length) {
			return null;
		}
		const map = new Map<string, string>();
		for (const viewColumn of lowerViewColumns) {
			map.set(viewColumn, "NULL");
		}
		for (let i = 0; i < valueRow.length; i++) {
			const columnName = columnOrder[i];
			if (!columnName) {
				return null;
			}
			const expression = renumberPositionalPlaceholders(
				valueRow[i]!.trim(),
				renumberState
			);
			map.set(columnName.toLowerCase(), expression);
		}
		resultRows.push({ map });
	}

	let returningClause: string | null = null;
	if (returningIndex !== -1) {
		const returningToken = tokens[returningIndex];
		const returningStart =
			returningToken?.startOffset ?? returningToken?.endOffset ?? -1;
		if (returningStart === -1 || !returningToken?.image) {
			return null;
		}
		returningClause = sql
			.slice(returningStart + returningToken.image.length)
			.replace(/;\s*$/, "")
			.trim();
		if (returningClause.length === 0) {
			return null;
		}
	}

	return {
		rows: resultRows,
		columnNames: lowerViewColumns,
		returningClause,
	};
}

function parseColumnNames(
	sql: string,
	tokens: Token[],
	startIndex: number
): { columns: string[]; nextIndex: number } | null {
	const columns: string[] = [];
	let i = startIndex + 1;
	let expectValue = true;
	for (; i < tokens.length; i++) {
		const token = tokens[i];
		if (!token) return null;
		if (token.tokenType === RParen) {
			if (expectValue && columns.length > 0) return null;
			i += 1;
			break;
		}
		if (token.tokenType === Comma) {
			if (expectValue) return null;
			expectValue = true;
			continue;
		}
		if (!expectValue) return null;
		const name = extractIdentifier(token);
		if (!name) return null;
		columns.push(name);
		expectValue = false;
	}
	return { columns, nextIndex: i };
}

function parseValuesExpressions(
	sql: string,
	tokens: Token[],
	startIndex: number
): { rows: string[][]; nextIndex: number } | null {
	const rows: string[][] = [];
	let index = startIndex;
	while (tokens[index]?.tokenType === LParen) {
		const { row, nextIndex } = parseSingleValuesRow(sql, tokens, index);
		if (!row) return null;
		rows.push(row);
		index = nextIndex;
		if (tokens[index]?.tokenType === Comma) {
			index += 1;
			continue;
		}
		break;
	}
	if (rows.length === 0) return null;
	return { rows, nextIndex: index };
}

function parseSingleValuesRow(
	sql: string,
	tokens: Token[],
	startIndex: number
): { row: string[]; nextIndex: number } | { row: null; nextIndex: number } {
	const row: string[] = [];
	let depth = 0;
	let exprStart: number | null = null;
	let i = startIndex;
	for (; i < tokens.length; i++) {
		const token = tokens[i];
		if (!token) {
			return { row: null, nextIndex: i };
		}
		const { tokenType: type } = token;
		if (type === LParen) {
			if (depth === 0) {
				exprStart = null;
			}
			if (depth === 0) {
				exprStart = null;
			}
			if (depth === 1 && exprStart === null) {
				exprStart = token.startOffset ?? 0;
			}
			depth += 1;
			continue;
		}
		if (type === RParen) {
			if (depth === 0) {
				return { row: null, nextIndex: i };
			}
			depth -= 1;
			if (depth === 0) {
				if (exprStart !== null) {
					const end = token.startOffset ?? token.endOffset ?? 0;
					row.push(sql.slice(exprStart, end).trim());
				}
				i += 1;
				break;
			}
			continue;
		}
		if (depth === 1) {
			if (type === Comma) {
				if (exprStart === null) {
					return { row: null, nextIndex: i };
				}
				const end = token.startOffset ?? token.endOffset ?? 0;
				row.push(sql.slice(exprStart, end).trim());
				exprStart = null;
				continue;
			}
			if (exprStart === null) {
				exprStart = token.startOffset ?? 0;
			}
		}
	}
	return { row, nextIndex: i };
}

function renumberPositionalPlaceholders(
	expression: string,
	state: { positional: number }
): string {
	return expression.replace(/\?(?!\d)/g, () => {
		state.positional += 1;
		return `?${state.positional}`;
	});
}

interface UpdateParseResult {
	readonly assignments: Map<string, string>;
	readonly whereClause: string;
	readonly returningClause: string | null;
}

function parseUpdateStatement({
	sql,
	tokens,
}: {
	sql: string;
	tokens: Token[];
}): UpdateParseResult | null {
	const setIndex = findKeyword(tokens, 0, "SET");
	if (setIndex === -1) {
		return null;
	}
	const whereIndex = findKeyword(tokens, setIndex + 1, "WHERE");
	const returningIndex = findKeyword(tokens, setIndex + 1, "RETURNING");
	let endIndex = tokens.length;
	if (whereIndex !== -1 && whereIndex < endIndex) {
		endIndex = whereIndex;
	}
	if (returningIndex !== -1 && returningIndex < endIndex) {
		endIndex = returningIndex;
	}
	const assignments = new Map<string, string>();
	let i = setIndex + 1;
	while (i < endIndex) {
		const columnToken = tokens[i];
		if (!columnToken) {
			return null;
		}
		let columnName = extractIdentifier(columnToken);
		if (!columnName) {
			return null;
		}
		i += 1;
		if (tokens[i]?.tokenType === Equals) {
			// fine
		} else if (tokens[i]?.tokenType === Comma) {
			// unexpected comma without expression
			return null;
		} else if (tokens[i]?.tokenType === undefined && i < endIndex) {
			return null;
		}
		if (tokens[i]?.tokenType !== Equals) {
			return null;
		}
		i += 1;
		if (i >= endIndex) {
			return null;
		}
		let depth = 0;
		let exprEndIndex = i;
		for (; exprEndIndex < endIndex; exprEndIndex++) {
			const token = tokens[exprEndIndex];
			if (!token) continue;
			if (token.tokenType === LParen) depth += 1;
			else if (token.tokenType === RParen && depth > 0) depth -= 1;
			else if (token.tokenType === Comma && depth === 0) {
				break;
			}
		}
		const lastToken = tokens[exprEndIndex - 1];
		if (!lastToken) {
			return null;
		}
		const exprTokens = tokens.slice(i, exprEndIndex);
		const rawExpr = exprTokens
			.map((token) => token?.image ?? "")
			.join(" ")
			.trim();
		if (!rawExpr) {
			return null;
		}
		assignments.set(columnName.toLowerCase(), rawExpr);
		i = exprEndIndex;
		if (tokens[i]?.tokenType === Comma) {
			i += 1;
		}
	}

	let whereClause = "1";
	const returningToken =
		returningIndex !== -1 ? tokens[returningIndex] : undefined;
	const returningStart = returningToken
		? (returningToken.startOffset ?? returningToken.endOffset ?? -1)
		: -1;

	if (whereIndex !== -1) {
		const whereToken = tokens[whereIndex];
		const whereStart = whereToken?.startOffset ?? whereToken?.endOffset ?? -1;
		if (whereStart === -1) {
			return null;
		}
		const sliceEnd = returningStart !== -1 ? returningStart : sql.length;
		const whereSlice = sql
			.slice(whereStart, sliceEnd)
			.replace(/;\s*$/, "")
			.trim();
		if (!whereSlice.toUpperCase().startsWith("WHERE")) {
			return null;
		}
		whereClause = whereSlice.slice("WHERE".length).trim();
	}

	let returningClause: string | null = null;
	if (returningIndex !== -1) {
		if (returningStart === -1 || !returningToken || !returningToken.image) {
			return null;
		}
		returningClause = sql
			.slice(returningStart + returningToken.image.length)
			.replace(/;\s*$/, "")
			.trim();
		if (returningClause.length === 0) {
			return null;
		}
	}

	return { assignments, whereClause, returningClause };
}

function extractDeleteClauses(
	sql: string,
	tokens: Token[]
): { whereClause: string; returningClause: string | null } | null {
	const whereIndex = findKeyword(tokens, 0, "WHERE");
	const returningIndex = findKeyword(tokens, 0, "RETURNING");
	let whereClause = "1";
	if (whereIndex !== -1) {
		const whereToken = tokens[whereIndex];
		const whereStart = whereToken?.startOffset ?? whereToken?.endOffset ?? -1;
		if (whereStart === -1) {
			return null;
		}
		const slice = sql.slice(whereStart).replace(/;\s*$/, "").trim();
		if (!slice.toUpperCase().startsWith("WHERE")) {
			return null;
		}
		const boundary =
			returningIndex !== -1 && tokens[returningIndex]?.startOffset !== undefined
				? (tokens[returningIndex]?.startOffset as number)
				: sql.length;
		whereClause = slice.slice("WHERE".length, boundary - whereStart).trim();
	}

	let returningClause: string | null = null;
	if (returningIndex !== -1) {
		const returningToken = tokens[returningIndex];
		const returningStart =
			returningToken?.startOffset ?? returningToken?.endOffset ?? -1;
		if (returningStart === -1 || !returningToken?.image) {
			return null;
		}
		returningClause = sql
			.slice(returningStart + returningToken.image.length)
			.replace(/;\s*$/, "")
			.trim();
		if (returningClause.length === 0) {
			return null;
		}
	}

	return { whereClause, returningClause };
}

function renumberAndRewriteExpression({
	expression,
	renumberState,
	viewColumns,
}: {
	expression: string;
	renumberState: { positional: number };
	viewColumns: string[];
}): string | null {
	if (!expression) {
		return null;
	}
	let rewritten = renumberPositionalPlaceholders(expression, renumberState);
	for (const column of viewColumns) {
		const pattern = new RegExp(
			`\\b${escapeIdentifierForRegex(column)}\\b`,
			"g"
		);
		rewritten = rewritten.replace(
			pattern,
			`(SELECT "${column}" FROM __lix_old LIMIT 1)`
		);
	}
	return rewritten.trim();
}

function substituteNewOldInBody({
	body,
	replacementMap,
}: {
	body: string;
	replacementMap: Map<string, string>;
}): string | null {
	let rewritten = body;
	for (const [key, value] of replacementMap.entries()) {
		const [scope, columnLower] = key.split(".");
		if (!scope || !columnLower) {
			continue;
		}
		const regex = new RegExp(
			`${scope}\\s*\\.\\s*${escapeIdentifierForRegex(columnLower)}`,
			"gi"
		);
		rewritten = rewritten.replace(regex, value);
	}
	rewritten = rewriteRaiseCalls(rewritten);
	if (/\bNEW\b|\bOLD\b/i.test(rewritten)) {
		return null;
	}
	return ensureTerminated(rewritten.trim());
}

function quoteQualifiedIdentifier(identifier: string): string {
	return identifier
		.split(".")
		.map((part) => `"${part.replace(/"/g, '""')}"`)
		.join(".");
}

function rewriteRaiseCalls(sql: string): string {
	return sql.replace(
		/RAISE\s*\(\s*(ABORT|FAIL|ROLLBACK|IGNORE)\s*(?:,\s*([^)]*))?\)/gi,
		(_match, action: string, message?: string) => {
			const args: string[] = [`'${action.toUpperCase()}'`];
			if (message && message.trim().length > 0) {
				args.push(message.trim());
			}
			return `lix_trigger_raise(${args.join(", ")})`;
		}
	);
}

function renderReturningSelect({
	returningClause,
	row,
	columnNames,
}: {
	returningClause: string;
	row: RowExpressions;
	columnNames: string[];
}): string | null {
	const assignments: string[] = [];
	for (const column of columnNames) {
		const expr = row.map.get(column) ?? "NULL";
		assignments.push(`${expr} AS "${column}"`);
	}
	const innerSelect =
		assignments.length > 0 ? assignments.join(", ") : "1 AS noop";
	let clauseExpr = returningClause.trim();
	if (clauseExpr.length === 0) {
		return null;
	}
	for (const column of columnNames) {
		const pattern = new RegExp(
			`NEW\\s*\\.\\s*${escapeIdentifierForRegex(column)}`,
			"gi"
		);
		clauseExpr = clauseExpr.replace(pattern, `"${column}"`);
	}
	if (/\bNEW\b|\bOLD\b/i.test(clauseExpr)) {
		return null;
	}
	return `SELECT ${clauseExpr} FROM (SELECT ${innerSelect}) AS __lix_returning;`;
}

function appendReturningClause(statement: string, clause: string): string {
	const trimmedClause = clause.trim();
	if (trimmedClause.length === 0) {
		return ensureTerminated(statement);
	}
	const upperStmt = statement.toUpperCase();
	if (upperStmt.includes("RETURNING")) {
		return ensureTerminated(statement);
	}
	const base = statement.trimEnd();
	const withoutSemicolon = base.endsWith(";") ? base.slice(0, -1) : base;
	return `${withoutSemicolon} RETURNING ${trimmedClause};`;
}

function substituteNewForRow({
	body,
	row,
	columnNames,
}: {
	body: string;
	row: RowExpressions;
	columnNames: string[];
}): string | null {
	let rewritten = body;
	for (const column of columnNames) {
		const pattern = new RegExp(
			`NEW\\s*\\.\\s*${escapeIdentifierForRegex(column)}`,
			"gi"
		);
		if (pattern.test(rewritten)) {
			rewritten = rewritten.replace(pattern, row.map.get(column) ?? "NULL");
		}
	}
	rewritten = rewriteRaiseCalls(rewritten);
	if (/\bNEW\b/i.test(rewritten)) {
		return null;
	}
	return rewritten.trim();
}

function escapeIdentifierForRegex(name: string): string {
	return name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ensureTerminated(sql: string): string {
	const trimmed = sql.trim();
	if (trimmed.endsWith(";")) {
		return trimmed;
	}
	return `${trimmed};`;
}

function loadViewColumns(
	engine: Pick<LixEngine, "sqlite">,
	viewName: string
): string[] {
	const qualified = viewName
		.split(".")
		.map((part) => part.trim())
		.filter((part) => part.length > 0);
	const quoted = qualified
		.map((part) => `"${part.replace(/"/g, '""')}"`)
		.join(".");
	const pragmaSql = `PRAGMA table_info(${quoted})`;
	const result = engine.sqlite.exec({
		sql: pragmaSql,
		returnValue: "resultRows",
		rowMode: "object",
		columnNames: [],
	});
	const rows = result as Array<Record<string, unknown>>;
	const columns: string[] = [];
	for (const row of rows) {
		const name = row?.name;
		if (typeof name === "string" && name.length > 0) {
			columns.push(name);
		}
	}
	return columns;
}

function buildDefaultRows(columnNames: string[]): InsertExtraction | null {
	if (columnNames.length === 0) {
		return null;
	}
	const map = new Map<string, string>();
	for (const column of columnNames) {
		map.set(column.toLowerCase(), "NULL");
	}
	return {
		rows: [{ map }],
		columnNames: columnNames.map((name) => name.toLowerCase()),
		returningClause: null,
	};
}
