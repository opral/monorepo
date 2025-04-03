/**
 * Describes how to traverse a graph structure (such as a change set graph).
 *
 * - `direct`: {@link GraphTraversalModeDirect}
 * - `recursive`: {@link GraphTraversalModeRecursive}
 *
 * This is used throughout Lix to determine how much of the graph should be included
 * during operations like applying, merging, or analyzing change sets.
 */
export type GraphTraversalMode =
	| GraphTraversalModeDirect
	| GraphTraversalModeRecursive;

/**
 * Direct mode: Only the specified node is included.
 *
 * No parent or child traversal is performed.
 *
 * ```mermaid
 * graph TD
 *     A[ChangeSet A]
 *     B[ChangeSet B]
 *     C[ChangeSet C]
 *     B --> A
 *     C --> B
 *     click A "Selected (direct)"
 * ```
 *
 * Selected node: A
 * Included: only A
 *
 * @example
 * ```ts
 * const mode: GraphTraversalMode = { type: "direct" };
 * ```
 */
export type GraphTraversalModeDirect = {
	type: "direct";
};

/**
 * Recursive mode: Includes the specified node and all transitive parents (or children).
 *
 * Optionally limits depth of traversal.
 *
 * ```mermaid
 * graph TD
 *     A[ChangeSet A]
 *     B[ChangeSet B]
 *     C[ChangeSet C]
 *     B --> A
 *     C --> B
 *     click C "Selected (recursive)"
 * ```
 *
 * @example
 * ```ts
 * const mode: GraphTraversalMode = { type: "recursive" };
 * const mode: GraphTraversalMode = { type: "recursive", depth: 1 };
 * ```
 *
 * Selected node: C
 * Included:
 * - If `depth` is undefined: C → B → A
 * - If `depth` is 1: C → B only
 */
export type GraphTraversalModeRecursive = {
	type: "recursive";
	/**
	 * Optional maximum depth to traverse.
	 * - `depth = 0` includes direct parents/children only.
	 * - `undefined` includes full ancestry/descendants.
	 */
	depth?: number;
};
