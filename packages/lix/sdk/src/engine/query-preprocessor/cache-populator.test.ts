import { afterEach, describe, expect, test, vi } from "vitest";
import { openLix } from "../../lix/index.js";
import { ensureFreshStateCache } from "./cache-populator.js";
import {
	markStateCacheAsFresh,
	markStateCacheAsStale,
} from "../../state/cache/mark-state-cache-as-stale.js";
import * as populateStateCacheModule from "../../state/cache/populate-state-cache.js";
import { isStaleStateCache } from "../../state/cache/is-stale-state-cache.js";
import { tokenize } from "../sql-parser/tokenizer.js";
import { analyzeShape } from "./sql-rewriter/microparser/analyze-shape.js";

const shapeFrom = (sql: string) => {
	const tokens = tokenize(sql);
	const shape = analyzeShape(tokens);
	if (!shape) {
		throw new Error("expected query to target internal_state_vtable");
	}
	return shape;
};

describe("ensureStateCacheFresh", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("skips population when cache is already fresh", async () => {
		const lix = await openLix({});
		const engine = lix.engine!;
		const spy = vi.spyOn(populateStateCacheModule, "populateStateCache");

		markStateCacheAsFresh({ engine });
		const shape = shapeFrom(
			"SELECT * FROM internal_state_vtable v WHERE v.schema_key = 'lix_key_value'"
		);
		ensureFreshStateCache({ engine, shape });

		expect(spy).not.toHaveBeenCalled();

		await lix.close();
	});

	test("repopulates when cache is stale", async () => {
		const lix = await openLix({});
		const engine = lix.engine!;
		const original = populateStateCacheModule.populateStateCache;
		const spy = vi
			.spyOn(populateStateCacheModule, "populateStateCache")
			.mockImplementation((args) => original(args));

		markStateCacheAsStale({ engine });
		expect(isStaleStateCache({ engine })).toBe(true);

		const shape = shapeFrom(
			"SELECT * FROM internal_state_vtable v WHERE v.schema_key = 'lix_key_value'"
		);
		ensureFreshStateCache({ engine, shape });

		expect(spy).toHaveBeenCalledTimes(1);
		expect(isStaleStateCache({ engine })).toBe(false);

		await lix.close();
	});

	test("scopes population when version hint is provided", async () => {
		const lix = await openLix({});
		const engine = lix.engine!;
		const original = populateStateCacheModule.populateStateCache;
		const spy = vi
			.spyOn(populateStateCacheModule, "populateStateCache")
			.mockImplementation((args) => original(args));

		markStateCacheAsStale({ engine });
		const shape = shapeFrom(
			"SELECT * FROM internal_state_vtable v WHERE v.version_id = 'global'"
		);
		ensureFreshStateCache({ engine, shape });

		expect(spy).toHaveBeenCalledWith(
			expect.objectContaining({
				options: { version_id: "global" },
			})
		);

		await lix.close();
	});
});
