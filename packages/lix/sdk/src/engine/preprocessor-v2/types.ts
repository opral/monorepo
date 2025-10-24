import type { RootOperationNode } from "kysely";

export type PreprocessorTraceEntry = {
	step: string;
	payload: unknown;
};

export type PreprocessorTrace = PreprocessorTraceEntry[];

/**
 * Shared context passed along the preprocessing pipeline.
 *
 * @example
 * ```ts
 * const context: PreprocessorContext = {
 *   storedSchemas: new Map(),
 *   cacheTables: new Map(),
 *   hasOpenTransaction: true,
 * };
 * ```
 */
export interface PreprocessorContext {
	storedSchemas: Map<string, unknown>;
	cacheTables: Map<string, unknown>;
	hasOpenTransaction: boolean;
	trace?: PreprocessorTrace;
}

export type PreprocessorStepContext = PreprocessorContext & {
	node: RootOperationNode;
};

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
export type PreprocessorStep = (
	context: PreprocessorStepContext
) => RootOperationNode;

/**
 * Arguments accepted by the query preprocessor function.
 */
export interface PreprocessorArgs {
	sql: string;
	parameters: ReadonlyArray<unknown>;
	sideEffects?: boolean;
	trace?: boolean;
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
	context?: PreprocessorContext;
}
