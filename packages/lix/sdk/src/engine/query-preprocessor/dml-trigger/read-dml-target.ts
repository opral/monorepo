import type { Token } from "../../sql-parser/tokenizer.js";
import { extractIdentifier, findKeyword } from "../entity-views/shared.js";

export type DmlOperation = "insert" | "update" | "delete";

/**
 * Attempts to read the target identifier for a DML statement.
 */
export function readDmlTarget(
	tokens: Token[],
	op: DmlOperation
): string | null {
	switch (op) {
		case "insert": {
			const intoIndex = findKeyword(tokens, 1, "INTO");
			if (intoIndex === -1) return null;
			return extractIdentifier(tokens[intoIndex + 1]);
		}
		case "update": {
			let index = 1;
			const limit = Math.min(tokens.length, 6);
			while (index < limit) {
				const token = tokens[index];
				const image = token?.image?.toUpperCase();
				if (!image) break;
				if (
					image === "OR" ||
					image === "ROLLBACK" ||
					image === "ABORT" ||
					image === "REPLACE" ||
					image === "FAIL" ||
					image === "IGNORE"
				) {
					index += 1;
					continue;
				}
				break;
			}
			return extractIdentifier(tokens[index]);
		}
		case "delete": {
			const fromIndex = findKeyword(tokens, 0, "FROM");
			if (fromIndex === -1) return null;
			return extractIdentifier(tokens[fromIndex + 1]);
		}
	}
}
