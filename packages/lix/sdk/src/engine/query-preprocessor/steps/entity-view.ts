import type { PreprocessorStep } from "./types.js";
import { applyRewriteResult } from "../context.js";
import { rewriteEntityInsert } from "../entity-views/insert.js";
import { rewriteEntityUpdate } from "../entity-views/update.js";
import { rewriteEntityDelete } from "../entity-views/delete.js";

export const entityViewStep: PreprocessorStep = (context) => {
	if (
		context.kind !== "insert" &&
		context.kind !== "update" &&
		context.kind !== "delete"
	) {
		return null;
	}

	if (context.kind === "insert") {
		const rewrite =
			rewriteEntityInsert({
				sql: context.sql,
				tokens: context.tokens,
				parameters: context.parameters,
				engine: context.engine,
			}) ?? null;
		if (rewrite) {
			applyRewriteResult(context, rewrite);
		}
		return null;
	}

	if (context.kind === "update") {
		const rewrite =
			rewriteEntityUpdate({
				sql: context.sql,
				tokens: context.tokens,
				parameters: context.parameters,
				engine: context.engine,
			}) ?? null;
		if (rewrite) {
			applyRewriteResult(context, rewrite);
		}
		return null;
	}

	const rewrite =
		rewriteEntityDelete({
			sql: context.sql,
			tokens: context.tokens,
			parameters: context.parameters,
			engine: context.engine,
		}) ?? null;
	if (rewrite) {
		applyRewriteResult(context, rewrite);
	}
	return null;
};
