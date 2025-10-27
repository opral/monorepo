import type { SqlNode } from "./sql-parser/nodes.js";
import type { CelEnvironment } from "./steps/entity-view/cel-environment.js";
import type { LixEngine } from "../boot.js";

/**
 * Shared trace entry type for documenting per-step behaviour.
 *
 * @example
 * ```ts
 * const entry: PreprocessorTraceEntry = { step: "rewrite", payload: null };
 * ```
 */
export type PreprocessorTraceEntry = {
	readonly step: string;
	readonly payload: any;
};

/**
 * Ordered collection of preprocessing trace entries.
 */
export type PreprocessorTrace = PreprocessorTraceEntry[];

/**
 * Shared context passed to each v3 preprocessor stage.
 *
 * @example
 * ```ts
 * const context: PreprocessorContext = {
 *   getStoredSchemas: () => new Map(),
 *   getCacheTables: () => new Map(),
 *   hasOpenTransaction: () => false,
 * };
 * ```
 */
export type PreprocessorContext = {
	readonly getStoredSchemas?: () => Map<string, unknown>;
	readonly getCacheTables?: () => Map<string, unknown>;
	readonly getSqlViews?: () => Map<string, string>;
	readonly hasOpenTransaction?: () => boolean;
	readonly getCelEnvironment?: () => CelEnvironment;
	readonly getEngine?: () => LixEngine;
	readonly trace?: PreprocessorTrace;
};

/**
 * Context shape for individual preprocessing steps.
 */
export type PreprocessorStepContext = PreprocessorContext & {
	readonly node: SqlNode;
	readonly parameters?: ReadonlyArray<unknown>;
};

/**
 * Signature for a single preprocessing stage.
 *
 * @example
 * ```ts
 * const noop: PreprocessorStep = (context) => context.node;
 * ```
 */
export type PreprocessorStep = (context: PreprocessorStepContext) => SqlNode;

/**
 * Arguments accepted by the v3 preprocessor entry point.
 */
export type PreprocessorArgs = {
	readonly sql: string;
	readonly parameters: ReadonlyArray<unknown>;
	readonly sideEffects?: boolean;
	readonly trace?: boolean;
};

/**
 * Shape of the function returned by `createPreprocessor`.
 */
export type PreprocessorFn = (args: PreprocessorArgs) => PreprocessorResult;

/**
 * Shared result produced after preprocessing SQL.
 *
 * @example
 * ```ts
 * const result: PreprocessorResult = {
 *   sql: "SELECT 1",
 *   parameters: [],
 * };
 * ```
 */
export type PreprocessorResult = {
	readonly sql: string;
	readonly parameters: ReadonlyArray<unknown>;
	readonly expandedSql?: string;
	readonly context?: PreprocessorContext;
};
