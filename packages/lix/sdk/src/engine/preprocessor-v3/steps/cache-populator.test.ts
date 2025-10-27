import { afterEach, describe, expect, test, vi } from "vitest";
import { openLix } from "../../../lix/open-lix.js";
import { createPreprocessor } from "../create-preprocessor.js";
import {
	markStateCacheAsFresh,
	markStateCacheAsStale,
} from "../../../state/cache/mark-state-cache-as-stale.js";
import { isStaleStateCache } from "../../../state/cache/is-stale-state-cache.js";
import * as populateStateCacheModule from "../../../state/cache/populate-state-cache.js";
import type { LixSchemaDefinition } from "../../../schema-definition/definition.js";

const SELECT_VTABLE_SQL =
	"SELECT * FROM lix_internal_state_vtable v WHERE v.schema_key = 'lix_key_value'";

describe("cachePopulatorStep", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("skips population when cache is already fresh", async () => {
		const lix = await openLix({});
		const engine = lix.engine!;
		const preprocess = createPreprocessor({ engine });
		const spy = vi.spyOn(populateStateCacheModule, "populateStateCache");

		markStateCacheAsFresh({ engine });

		preprocess({ sql: SELECT_VTABLE_SQL, parameters: [] });

		expect(spy).not.toHaveBeenCalled();

		await lix.close();
	});

	test("repopulates when cache is stale", async () => {
		const lix = await openLix({});
		const engine = lix.engine!;
		const preprocess = createPreprocessor({ engine });
		const original = populateStateCacheModule.populateStateCache;
		const spy = vi
			.spyOn(populateStateCacheModule, "populateStateCache")
			.mockImplementation((args) => original(args));

		markStateCacheAsStale({ engine });
		expect(isStaleStateCache({ engine })).toBe(true);

		preprocess({ sql: SELECT_VTABLE_SQL, parameters: [] });

		expect(spy).toHaveBeenCalledTimes(1);
		expect(isStaleStateCache({ engine })).toBe(false);

		await lix.close();
	});

	test("scopes population by literal version predicate", async () => {
		const lix = await openLix({});
		const engine = lix.engine!;
		const preprocess = createPreprocessor({ engine });
		const original = populateStateCacheModule.populateStateCache;
		const spy = vi
			.spyOn(populateStateCacheModule, "populateStateCache")
			.mockImplementation((args) => original(args));

		markStateCacheAsStale({ engine });

		preprocess({
			sql: `SELECT * FROM lix_internal_state_vtable v WHERE v.schema_key = 'lix_key_value' AND v.version_id = 'global'`,
			parameters: [],
		});

		expect(spy).toHaveBeenCalledWith(
			expect.objectContaining({
				options: { version_id: "global" },
			})
		);

		await lix.close();
	});

	test("repopulates when entity view select rewrites to internal state", async () => {
		const lix = await openLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});
		const engine = lix.engine!;
		const preprocess = createPreprocessor({ engine });
		const original = populateStateCacheModule.populateStateCache;
		const spy = vi
			.spyOn(populateStateCacheModule, "populateStateCache")
			.mockImplementation((args) => original(args));

		const schema = {
			"x-lix-key": "selectable_schema",
			"x-lix-version": "1.0",
			"x-lix-primary-key": ["/id"],
			type: "object",
			properties: {
				id: { type: "string" },
			},
			required: ["id"],
			additionalProperties: false,
		} satisfies LixSchemaDefinition;

		await lix.db
			.insertInto("stored_schema")
			.values({ value: schema })
			.execute();

		markStateCacheAsStale({ engine });

		preprocess({
			sql: `SELECT id FROM ${schema["x-lix-key"]} WHERE id = ?`,
			parameters: ["row-1"],
		});

		expect(spy).toHaveBeenCalled();

		await lix.close();
	});
});
