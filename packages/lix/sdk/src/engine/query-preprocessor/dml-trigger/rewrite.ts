import type { LixEngine } from "../../boot.js";
import type { Token } from "../../sql-parser/tokenizer.js";
import type { RewriteResult } from "../entity-views/shared.js";
import { findInsteadOfTrigger } from "./trigger-registry.js";
import { getTriggerHandler } from "./handlers.js";
import { readDmlTarget, type DmlOperation } from "./read-dml-target.js";

/**
 * Routes a DML statement through a registered INSTEAD OF trigger handler when available.
 */
export function maybeRewriteInsteadOfTrigger(args: {
	engine: Pick<LixEngine, "sqlite" | "runtimeCacheRef" | "executeSync">;
	sql: string;
	tokens: Token[];
	parameters: ReadonlyArray<unknown>;
	op: DmlOperation;
}): RewriteResult | null {
	const { engine, tokens, parameters, op } = args;
	const resolvedTarget = readDmlTarget(tokens, op);
	if (!resolvedTarget) {
		return null;
	}

	const trigger = findInsteadOfTrigger({
		engine,
		target: resolvedTarget,
		operation: op,
	});
	if (!trigger) {
		return null;
	}

	const handler = getTriggerHandler(resolvedTarget, op);
	if (!handler) {
		return null;
	}

	return handler({ engine, tokens, parameters, trigger });
}
