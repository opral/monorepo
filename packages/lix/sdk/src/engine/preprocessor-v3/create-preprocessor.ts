import type { LixEngine } from "../boot.js";
import type {
	PreprocessorArgs,
	PreprocessorContext,
	PreprocessorFn,
	PreprocessorResult,
} from "./types.js";

type EngineShape = Pick<
	LixEngine,
	| "sqlite"
	| "hooks"
	| "runtimeCacheRef"
	| "executeSync"
	| "call"
	| "listFunctions"
>;

/**
 * Creates a v3 preprocessor instance that will eventually parse SQL into the
 * custom AST, apply rewrites, and compile the result back to text.
 *
 * @example
 * ```ts
 * const preprocess = createPreprocessor({ engine });
 * const result = preprocess({ sql: "SELECT 1", parameters: [] });
 * ```
 */
export function createPreprocessor(args: {
	engine: EngineShape;
}): PreprocessorFn {
	const { engine } = args;
	void engine;

	return (input: PreprocessorArgs): PreprocessorResult => ({
		sql: input.sql,
		parameters: input.parameters,
		context: createPlaceholderContext(),
	});
}

function createPlaceholderContext(): PreprocessorContext {
	let storedSchemas: Map<string, unknown> | undefined;
	let cacheTables: Map<string, unknown> | undefined;

	return {
		getStoredSchemas: () => {
			if (!storedSchemas) {
				storedSchemas = new Map();
			}
			return storedSchemas;
		},
		getCacheTables: () => {
			if (!cacheTables) {
				cacheTables = new Map();
			}
			return cacheTables;
		},
		hasOpenTransaction: () => false,
	};
}
