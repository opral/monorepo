import type { PreprocessorStatement, PreprocessorStep } from "../types.js";
import {
	ColonName,
	DollarName,
	DollarNumber,
	QMark,
	QMarkNumber,
	Semicolon,
	AtName,
	tokenize,
} from "../sql-parser/tokenizer.js";

const PLACEHOLDER_TOKENS = new Set([
	QMark,
	QMarkNumber,
	DollarName,
	DollarNumber,
	AtName,
	ColonName,
]);

type Segment = {
	readonly sql: string;
	readonly placeholders: number;
};

type SplitResult = {
	readonly segments: ReadonlyArray<Segment>;
	readonly encounteredDelimiter: boolean;
};

/**
 * Splits combined SQL text into individual statements while preserving the
 * ordering of bound parameters for each statement.
 *
 * @example
 * ```ts
 * const result = splitStatements({
 *   statements: [{
 *     sql: "INSERT INTO foo VALUES (?, ?); UPDATE foo SET name = ? WHERE id = ?",
 *     parameters: [1, "alpha", "beta", 1],
 *   }],
 * });
 * console.log(result.statements.length); // 2
 * ```
 */
export const splitStatements: PreprocessorStep = ({ statements }) => {
	const nextStatements: PreprocessorStatement[] = [];

	for (const statement of statements) {
		const { segments, encounteredDelimiter } = splitSql(statement.sql);

		if (!encounteredDelimiter) {
			if (segments.length === 0 && statement.sql.trim() === "") {
				continue;
			}
			const sqlText =
				segments.length === 1 ? segments[0]!.sql : statement.sql.trim();
			nextStatements.push({
				sql: sqlText,
				parameters: statement.parameters,
			});
			continue;
		}

		let parameterOffset = 0;
		for (const segment of segments) {
			const count = segment.placeholders;
			const parameters = statement.parameters.slice(
				parameterOffset,
				parameterOffset + count
			);
			parameterOffset += count;

			nextStatements.push({
				sql: segment.sql,
				parameters,
			});
		}

		if (parameterOffset < statement.parameters.length && segments.length > 0) {
			const remaining = statement.parameters.slice(parameterOffset);
			const lastIndex = nextStatements.length - 1;
			const lastStatement = nextStatements[lastIndex]!;
			nextStatements[lastIndex] = {
				sql: lastStatement.sql,
				parameters: [...lastStatement.parameters, ...remaining],
			};
		}
	}

	return { statements: nextStatements };
};

const splitSql = (sql: string): SplitResult => {
	const tokens = tokenize(sql);
	let encounteredDelimiter = false;
	const segments: Segment[] = [];

	let segmentStart = 0;
	let placeholders = 0;

	const pushSegment = (endOffset: number) => {
		const text = sql.slice(segmentStart, endOffset).trim();
		if (text) {
			segments.push({
				sql: text,
				placeholders,
			});
		}
		placeholders = 0;
	};

	for (const token of tokens) {
		const startOffset = token.startOffset ?? 0;
		const endOffset = token.endOffset ?? startOffset + token.image.length - 1;

		if (PLACEHOLDER_TOKENS.has(token.tokenType)) {
			placeholders += 1;
		}

		if (token.tokenType === Semicolon) {
			encounteredDelimiter = true;
			pushSegment(startOffset);
			segmentStart = endOffset + 1;
		}
	}

	pushSegment(sql.length);

	return { segments, encounteredDelimiter };
};
