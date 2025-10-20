import type { PreprocessorStep } from "./types.js";
import {
	readDmlTarget,
	type DmlOperation,
} from "../dml-trigger/read-dml-target.js";

export const triggerStep: PreprocessorStep = (context) => {
	if (
		context.kind !== "insert" &&
		context.kind !== "update" &&
		context.kind !== "delete"
	) {
		return null;
	}

	const op: DmlOperation =
		context.kind === "insert"
			? "insert"
			: context.kind === "update"
				? "update"
				: "delete";

	const target = readDmlTarget(context.tokens, op);
	if (!target) {
		return null;
	}

	// Mutation rewrites are currently disabled; we only optimize SELECT queries.
	return null;
	// return (
	// 	maybeRewriteInsteadOfTrigger({
	// 		engine: context.engine,
	// 		sql: context.sql,
	// 		tokens: context.tokens,
	// 		parameters: context.parameters,
	// 		op,
	// 	}) ?? null
	// );
};
