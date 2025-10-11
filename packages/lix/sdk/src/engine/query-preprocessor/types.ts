/**
 * Shared result shape produced by the query preprocessor.
 *
 * @example
 * ```ts
 * import type { QueryPreprocessorResult } from "./types.js";
 *
 * const result: QueryPreprocessorResult = {
 *   sql: "SELECT 1",
 *   parameters: [],
 * };
 * ```
 */
export interface QueryPreprocessorResult {
	sql: string;
	parameters: ReadonlyArray<unknown>;
	expandedSql?: string;
}

/**
 * Supported top-level SQL statement kinds understood by the preprocessor.
 */
export type StatementKind = "select" | "insert" | "update" | "delete" | "other";

/**
 * Arguments accepted by the query preprocessor function.
 */
export interface QueryPreprocessorArgs {
	sql: string;
	parameters: ReadonlyArray<unknown>;
	sideEffects?: boolean;
}

/**
 * Signature of the query preprocessor function that transforms SQL before execution.
 */
export type QueryPreprocessorFn = (
	args: QueryPreprocessorArgs
) => QueryPreprocessorResult;
