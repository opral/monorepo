import type { PreprocessorStep } from "../types.js";

/**
 * Prototype transform that will eventually rewrite queries targeting the
 * internal vtable into equivalent native SQLite statements.
 *
 * The initial implementation is a no-op so the pipeline can be exercised while
 * the actual rewrite algorithm is prototyped.
 *
 * @example
 * ```ts
 * const transformed = rewriteVtableSelects({
 *   node,
 *   storedSchemas,
 *   cacheTables,
 * });
 * ```
 */
export const rewriteVtableSelects: PreprocessorStep = ({ node }) => node;
