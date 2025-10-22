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
}) => RootOperationNode;
