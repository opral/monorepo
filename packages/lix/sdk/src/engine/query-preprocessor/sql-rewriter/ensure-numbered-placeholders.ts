/**
 * Normalises un-numbered SQLite parameter placeholders (`?`) into
 * 1-based numbered placeholders (`?1`, `?2`, …) so downstream parsing
 * can reliably match them against the provided parameter array.
 *
 * @example
 * ```ts
 * const sql = "select * from foo where id = ? and name = ?";
 * const normalised = ensureNumberedPlaceholders(sql);
 * console.log(normalised); // "select * from foo where id = ?1 and name = ?2"
 * ```
 */
export function ensureNumberedPlaceholders(sql: string): string {
	let result = "";
	let index = 0;
	let paramCounter = 0;
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
				advance(2); // escaped quote
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

	return result;
}
