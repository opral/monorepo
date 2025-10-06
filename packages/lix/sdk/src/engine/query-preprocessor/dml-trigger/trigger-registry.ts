import type { LixEngine } from "../../boot.js";
import {
	getSchemaVersion,
	normalizeIdentifier,
} from "../shared/schema-version.js";
import {
	type DmlTriggerDefinition,
	type DmlTriggerOperation,
	collectDmlTriggers,
} from "./collect.js";

export function findInsteadOfTrigger({
	engine,
	target,
	operation,
}: {
	engine: Pick<LixEngine, "sqlite" | "runtimeCacheRef">;
	target: string;
	operation: DmlTriggerOperation;
}): DmlTriggerDefinition | null {
	const map = loadTriggerMap(engine);
	const entry = map.get(normalizeIdentifier(target));
	return entry?.get(operation) ?? null;
}

const cache = new WeakMap<object, CacheEntry>();

type CacheEntry = {
	schemaVersion: number;
	map: TriggerMap;
};

type TriggerMap = Map<string, Map<DmlTriggerOperation, DmlTriggerDefinition>>;

function loadTriggerMap(
	engine: Pick<LixEngine, "sqlite" | "runtimeCacheRef">
): TriggerMap {
	const schemaVersion = getSchemaVersion(engine.sqlite);
	const cached = cache.get(engine.runtimeCacheRef);
	if (cached && cached.schemaVersion === schemaVersion) {
		return cached.map;
	}

	const definitions = collectDmlTriggers({ sqlite: engine.sqlite });
	const map: TriggerMap = new Map();
	for (const definition of definitions) {
		const normalizedTarget = normalizeIdentifier(definition.target);
		if (!normalizedTarget) continue;
		let opMap = map.get(normalizedTarget);
		if (!opMap) {
			opMap = new Map();
			map.set(normalizedTarget, opMap);
		}
		opMap.set(definition.operation, definition);
	}

	cache.set(engine.runtimeCacheRef, { schemaVersion, map });
	return map;
}
