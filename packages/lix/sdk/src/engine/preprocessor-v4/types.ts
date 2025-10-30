import type { CelEnvironment } from "../cel-environment/cel-environment.js";
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
 * Aggregated cache preflight state shared between pipeline stages.
 *
 * @example
 * const state: CachePreflight = {
 *   schemaKeys: new Set(["test_schema"]),
 *   versionIds: new Set(["v1"]),
 * };
 */
export type CachePreflight = {
	readonly schemaKeys: Set<string>;
	readonly versionIds: Set<string>;
};

/**
 * Serializable snapshot of cache preflight hints returned from the preprocessor.
 *
 * @example
 * ```ts
 * const result: CachePreflightResult = {
 *   schemaKeys: ["test_schema"],
 *   versionIds: ["v1"],
 * };
 * ```
 */
export type CachePreflightResult = {
	readonly schemaKeys: ReadonlyArray<string>;
	readonly versionIds: ReadonlyArray<string>;
};

/**
 * Shared context passed to each preprocessor stage.
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
	readonly cachePreflight?: CachePreflight;
};

/**
 * Normalized SQL statement flowing through the pipeline.
 *
 * @example
 * ```ts
 * const statement: PreprocessorStatement = { sql: "SELECT 1", parameters: [] };
 * ```
 */
export type PreprocessorStatement = {
	readonly sql: string;
	readonly parameters: ReadonlyArray<unknown>;
};

/**
 * Context shape for individual preprocessing steps.
 */
export type PreprocessorStepContext = PreprocessorContext & {
	readonly statements: ReadonlyArray<PreprocessorStatement>;
};

/**
 * Signature for a single preprocessing stage.
 *
 * @example
 * ```ts
 * const noop: PreprocessorStep = (context) => ({
 *   statements: context.statements,
 * });
 * ```
 */
export type PreprocessorStep = (context: PreprocessorStepContext) => {
	readonly statements: ReadonlyArray<PreprocessorStatement>;
};

/**
 * Arguments accepted by the preprocessor entry point.
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
	readonly statements?: ReadonlyArray<PreprocessorStatement>;
	readonly trace?: PreprocessorTrace;
	readonly cachePreflight?: CachePreflightResult;
};
