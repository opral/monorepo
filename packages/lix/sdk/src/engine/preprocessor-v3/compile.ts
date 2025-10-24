import type { SqlNode } from "./ast/types.js";

/**
 * Placeholder SQL compiler for the v3 preprocessor AST.
 *
 * @example
 * ```ts
 * const statement = { node_kind: "raw_fragment", sql_text: "" } satisfies SqlNode;
 * const result = compile(statement);
 * ```
 */
export function compile(
	statement: SqlNode
): {
	sql: string;
	parameters: ReadonlyArray<unknown>;
} {
	void statement;
	return {
		sql: "",
		parameters: [],
	};
}
