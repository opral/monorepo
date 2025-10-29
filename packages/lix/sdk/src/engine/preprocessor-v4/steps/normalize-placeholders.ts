import type { PreprocessorStep, PreprocessorStatement } from "../types.js";

/**
 * Normalizes placeholders across all statements by converting unnumbered variants to
 * numbered placeholders (`?1`, `?2`, …) while preserving existing numbering.
 *
 * @example
 * ```ts
 * const result = normalizePlaceholders({
 *   statements: [
 *     { sql: "SELECT ? FROM foo", parameters: [1] },
 *   ],
 * });
 * console.log(result.statements[0].sql); // SELECT ?1 FROM foo
 * ```
 */
export const normalizePlaceholders: PreprocessorStep = ({ statements }) => {
	let counter = computeNextPlaceholderIndex(statements);

	const rewritten = statements.map((statement) => {
		if (!statement.sql.includes("?")) {
			return statement;
		}

		const { sql, nextIndex } = rewriteStatement(statement.sql, counter);
		counter = nextIndex;

		return {
			...statement,
			sql,
		};
	});

	return { statements: rewritten };
};

const rewriteStatement = (
	sql: string,
	initialCounter: number
): { sql: string; nextIndex: number } => {
	let result = "";
	let index = 0;
	let paramCounter = initialCounter;
	let inSingle = false;
	let inDouble = false;
	let inBracket = false;
	let inLineComment = false;
	let inBlockComment = false;

	const advance = (count = 1): void => {
		result += sql.slice(index, index + count);
		index += count;
	};

	while (index < sql.length) {
		const ch = sql[index]!;
		const next = sql[index + 1];

		if (inLineComment) {
			advance();
			if (ch === "\n") inLineComment = false;
			continue;
		}

		if (inBlockComment) {
			if (ch === "*" && next === "/") {
				advance(2);
				inBlockComment = false;
				continue;
			}
			advance();
			continue;
		}

		if (!inSingle && !inDouble && !inBracket) {
			if (ch === "-" && next === "-") {
				advance(2);
				inLineComment = true;
				continue;
			}
			if (ch === "/" && next === "*") {
				advance(2);
				inBlockComment = true;
				continue;
			}
		}

		if (!inDouble && !inBracket && ch === "'") {
			if (inSingle && next === "'") {
				advance(2);
				continue;
			}
			inSingle = !inSingle;
			advance();
			continue;
		}

		if (!inSingle && !inBracket && ch === '"') {
			if (inDouble && next === '"') {
				advance(2);
				continue;
			}
			inDouble = !inDouble;
			advance();
			continue;
		}

		if (!inSingle && !inDouble && ch === "[" && !inBracket) {
			inBracket = true;
			advance();
			continue;
		}

		if (inBracket) {
			advance();
			if (ch === "]") inBracket = false;
			continue;
		}

		if (!inSingle && !inDouble && !inBracket) {
			if (ch === "?") {
				let j = index + 1;
				while (j < sql.length && /\d/.test(sql[j]!)) {
					j += 1;
				}
				if (j > index + 1) {
					const digits = sql.slice(index + 1, j);
					const value = parseInt(digits, 10);
					if (Number.isFinite(value) && value > paramCounter) {
						paramCounter = value;
					}
					advance(j - index);
					continue;
				}
				paramCounter += 1;
				result += `?${paramCounter}`;
				index += 1;
				continue;
			}
		}

		advance();
	}

	return { sql: result, nextIndex: paramCounter };
};

const computeNextPlaceholderIndex = (
	statements: ReadonlyArray<PreprocessorStatement>
): number => {
	let counter = 0;
	for (const statement of statements) {
		counter = scanForMaxPlaceholderIndex(statement.sql, counter);
	}
	return counter;
};

const scanForMaxPlaceholderIndex = (
	sql: string,
	initialMax: number
): number => {
	let maxIndex = initialMax;
	let index = 0;
	let inSingle = false;
	let inDouble = false;
	let inBracket = false;
	let inLineComment = false;
	let inBlockComment = false;

	while (index < sql.length) {
		const ch = sql[index]!;
		const next = sql[index + 1];

		if (inLineComment) {
			if (ch === "\n") {
				inLineComment = false;
			}
			index += 1;
			continue;
		}

		if (inBlockComment) {
			if (ch === "*" && next === "/") {
				inBlockComment = false;
				index += 2;
				continue;
			}
			index += 1;
			continue;
		}

		if (!inSingle && !inDouble && !inBracket) {
			if (ch === "-" && next === "-") {
				inLineComment = true;
				index += 2;
				continue;
			}
			if (ch === "/" && next === "*") {
				inBlockComment = true;
				index += 2;
				continue;
			}
		}

		if (!inDouble && !inBracket && ch === "'") {
			if (inSingle && next === "'") {
				index += 2;
				continue;
			}
			inSingle = !inSingle;
			index += 1;
			continue;
		}

		if (!inSingle && !inBracket && ch === '"') {
			if (inDouble && next === '"') {
				index += 2;
				continue;
			}
			inDouble = !inDouble;
			index += 1;
			continue;
		}

		if (!inSingle && !inDouble && ch === "[" && !inBracket) {
			inBracket = true;
			index += 1;
			continue;
		}

		if (inBracket) {
			if (ch === "]") {
				inBracket = false;
			}
			index += 1;
			continue;
		}

		if (!inSingle && !inDouble && !inBracket && ch === "?") {
			let j = index + 1;
			while (j < sql.length && /\d/.test(sql[j]!)) {
				j += 1;
			}
			if (j > index + 1) {
				const digits = sql.slice(index + 1, j);
				const value = parseInt(digits, 10);
				if (Number.isFinite(value) && value > maxIndex) {
					maxIndex = value;
				}
				index = j;
				continue;
			}
		}

		index += 1;
	}

	return maxIndex;
};
