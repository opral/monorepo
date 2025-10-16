import { afterEach, describe, expect, test, vi } from "vitest";
import { openLix } from "../../lix/index.js";
import { ensureFreshStateCache } from "./cache-populator.js";
import {
	markStateCacheAsFreshV2,
	markStateCacheAsStaleV2,
} from "../../state/cache-v2/mark-state-cache-as-stale.js";
import * as populateStateCacheModule from "../../state/cache-v2/populate-state-cache.js";
import { isStaleStateCacheV2 } from "../../state/cache-v2/is-stale-state-cache.js";
import { tokenize } from "../sql-parser/tokenizer.js";
import { analyzeShape } from "./sql-rewriter/microparser/analyze-shape.js";

const shapeFrom = (sql: string) => {
	const tokens = tokenize(sql);
	const shape = analyzeShape(tokens);
	if (!shape) {
		throw new Error("expected query to target lix_internal_state_vtable");
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
		const spy = vi.spyOn(populateStateCacheModule, "populateStateCacheV2");

		markStateCacheAsFreshV2({ engine });
		const shape = shapeFrom(
			"SELECT * FROM lix_internal_state_vtable v WHERE v.schema_key = 'lix_key_value'"
		);
		ensureFreshStateCache({ engine, shape });

		expect(spy).not.toHaveBeenCalled();

		await lix.close();
	});

	test("repopulates when cache is stale", async () => {
		const lix = await openLix({});
		const engine = lix.engine!;
		const original = populateStateCacheModule.populateStateCacheV2;
		const spy = vi
			.spyOn(populateStateCacheModule, "populateStateCacheV2")
			.mockImplementation((args) => original(args));

		markStateCacheAsStaleV2({ engine });
		expect(isStaleStateCacheV2({ engine })).toBe(true);

		const shape = shapeFrom(
			"SELECT * FROM lix_internal_state_vtable v WHERE v.schema_key = 'lix_key_value'"
		);
		ensureFreshStateCache({ engine, shape });

		expect(spy).toHaveBeenCalledTimes(1);
		expect(isStaleStateCacheV2({ engine })).toBe(false);

		await lix.close();
	});

	test("scopes population when version hint is provided", async () => {
		const lix = await openLix({});
		const engine = lix.engine!;
		const original = populateStateCacheModule.populateStateCacheV2;
		const spy = vi
			.spyOn(populateStateCacheModule, "populateStateCacheV2")
			.mockImplementation((args) => original(args));

		markStateCacheAsStaleV2({ engine });
		const shape = shapeFrom(
			"SELECT * FROM lix_internal_state_vtable v WHERE v.version_id = 'global'"
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
