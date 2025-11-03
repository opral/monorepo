import type {
	QueryPreprocessorArgs,
	QueryPreprocessorFn,
	QueryPreprocessorResult,
} from "./types.js";
export type {
	QueryPreprocessorArgs,
	QueryPreprocessorFn,
	QueryPreprocessorResult,
} from "./types.js";
import { createPreprocessContext } from "./context.js";
import type { PreprocessContext } from "./context.js";
import type { LixEngine } from "../boot.js";
import { entityViewStep, triggerStep, stateAccessStep } from "./steps/index.js";
import type { PreprocessorStep } from "./steps/types.js";

const preprocessorSteps: PreprocessorStep[] = [
	entityViewStep,
	triggerStep,
	stateAccessStep,
];

function runPreprocessorSteps(
	context: PreprocessContext
): QueryPreprocessorResult | null {
	for (const step of preprocessorSteps) {
		const result = step(context);
		if (result) {
			return result;
		}
	}
	return null;
}

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
): QueryPreprocessorFn {
	return ({ sql, parameters }: QueryPreprocessorArgs) => {
		const context = createPreprocessContext({
			engine,
			sql,
			parameters,
		});
		const result = runPreprocessorSteps(context);
		if (result) {
			return result;
		}
		if (context.rewriteApplied) {
			return {
				sql: context.sql,
				parameters: context.parameters,
				expandedSql: context.expandedSql,
			};
		}
		return { sql, parameters };
	};
}
