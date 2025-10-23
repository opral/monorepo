import type { RootOperationNode } from "kysely";

export type PreprocessorTraceEntry = {
	step: string;
	payload: unknown;
};

export type PreprocessorTrace = PreprocessorTraceEntry[];

/**
 * A single transformation stage in the preprocessor pipeline.
 *
 * Each step receives the current operation node alongside shared caches and
 * returns either the same node or a transformed copy.
 *
 * @example
 * ```ts
 * export const rewriteExample: PreprocessorStep = ({ node }) => {
 *   return node;
 * };
 * ```
 */
export type PreprocessorStep = (context: {
	node: RootOperationNode;
	storedSchemas: Map<string, unknown>;
	cacheTables: Map<string, unknown>;
	trace?: PreprocessorTrace;
	hasOpenTransaction?: boolean;
}) => RootOperationNode;

/**
 * Arguments accepted by the query preprocessor function.
 */
export interface PreprocessorArgs {
	sql: string;
	parameters: ReadonlyArray<unknown>;
	sideEffects?: boolean;
}

/**
 * Signature of the query preprocessor function that transforms SQL before execution.
 */
export type PreprocessorFn = (args: PreprocessorArgs) => PreprocessorResult;

/**
 * Shared result shape produced by the query preprocessor.
 *
 * @example
 * ```ts
 * import type { PreprocessorResult } from "./types.js";
 *
 * const result: PreprocessorResult = {
 *   sql: "SELECT 1",
 *   parameters: [],
 * };
 * ```
 */
export interface PreprocessorResult {
	sql: string;
	parameters: ReadonlyArray<unknown>;
	expandedSql?: string;
}
