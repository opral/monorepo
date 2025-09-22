import type { KyselyPlugin } from "kysely";
import { createCachePopulator } from "./cache-populator.js";
import { createQueryRouter } from "./router.js";
import type { LixEngine } from "../boot.js";

export function createQueryCompiler(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "executeSync" | "runtimeCacheRef"
	>;
}): KyselyPlugin[] {
	return [createCachePopulator(args), createQueryRouter()];
}
