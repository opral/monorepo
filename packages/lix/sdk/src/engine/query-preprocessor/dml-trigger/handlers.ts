import type { LixEngine } from "../../boot.js";
import type { Token } from "../../sql-parser/tokenizer.js";
import type { RewriteResult } from "../entity-views/shared.js";
import type { DmlTriggerDefinition, DmlTriggerOperation } from "./collect.js";

export interface TriggerRewriteArgs {
	readonly engine: Pick<
		LixEngine,
		"sqlite" | "runtimeCacheRef" | "executeSync"
	>;
	readonly tokens: Token[];
	readonly parameters: ReadonlyArray<unknown>;
	readonly trigger: DmlTriggerDefinition;
}

export type TriggerHandler = (args: TriggerRewriteArgs) => RewriteResult | null;

const registry = new Map<string, Map<DmlTriggerOperation, TriggerHandler>>();

/**
 * Registers a handler responsible for expanding the collected trigger body for a view/op pair.
 */
export function registerTriggerHandler(
	target: string,
	op: DmlTriggerOperation,
	handler: TriggerHandler
): void {
	const normalized = target.toLowerCase();
	let map = registry.get(normalized);
	if (!map) {
		map = new Map();
		registry.set(normalized, map);
	}
	map.set(op, handler);
}

/**
 * Retrieves a previously registered trigger handler, if one exists.
 */
export function getTriggerHandler(
	target: string,
	op: DmlTriggerOperation
): TriggerHandler | null {
	const map = registry.get(target.toLowerCase());
	return map?.get(op) ?? null;
}
