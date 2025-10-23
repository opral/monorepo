import type { LixEngine } from "../boot.js";
import type { PreprocessorArgs, PreprocessorFn } from "./types.js";

export function createQueryPreprocessor(
	engine: Pick<
		LixEngine,
		| "sqlite"
		| "hooks"
		| "runtimeCacheRef"
		| "executeSync"
		| "call"
		| "listFunctions"
	>
): PreprocessorFn {
	return ({ sql, parameters, sideEffects }: PreprocessorArgs) => {
		return { sql, parameters };
	};
}
