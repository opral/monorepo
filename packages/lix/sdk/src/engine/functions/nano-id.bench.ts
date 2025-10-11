import { bench, describe } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { nanoId, nanoIdSync } from "./nano-id.js";

/**
 * Benchmarks deterministic nano ID generation to guard against regressions when routing
 * reads through the lix_internal_state_vtable rewrite path.
 *
 * @example
 * pnpm exec vitest bench packages/lix/sdk/src/engine/functions/nano-id.bench.ts
 */
const deterministicModeSeed = {
	key: "lix_deterministic_mode",
	value: { enabled: true },
};

describe("nanoId deterministic mode", () => {
	bench("nanoId - async deterministic generation", async () => {
		const lix = await openLix({
			keyValues: [deterministicModeSeed],
		});

		for (let i = 0; i < 10; i++) {
			const id = await nanoId({ lix });
			if (!id.startsWith("test_")) {
				throw new Error("deterministic nanoId lost test_ prefix");
			}
		}
	});

	bench("nanoIdSync - engine deterministic generation", async () => {
		const lix = await openLix({
			keyValues: [deterministicModeSeed],
		});
		const engine = lix.engine;
		if (!engine) {
			throw new Error("nanoIdSync benchmark requires in-process engine");
		}

		for (let i = 0; i < 10; i++) {
			const id = nanoIdSync({ engine });
			if (!id.startsWith("test_")) {
				throw new Error("deterministic nanoId lost test_ prefix (sync)");
			}
		}
	});
});
