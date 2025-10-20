import type { QueryPreprocessorResult } from "../types.js";
import type { PreprocessContext } from "../context.js";

export type PreprocessorStep = (
	context: PreprocessContext
) => QueryPreprocessorResult | null;
