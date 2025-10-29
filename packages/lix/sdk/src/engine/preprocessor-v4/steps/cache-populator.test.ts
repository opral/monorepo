import { afterEach, describe, expect, test, vi } from "vitest";
import { openLix } from "../../../lix/index.js";
import { cachePopulator } from "./cache-populator.js";
import {
	markStateCacheAsFresh,
	markStateCacheAsStale,
} from "../../../state/cache/mark-state-cache-as-stale.js";
import * as populateStateCacheModule from "../../../state/cache/populate-state-cache.js";

const buildPreflight = (
	schemaKeys: Iterable<string>,
	versionIds?: Iterable<string>
) => {
	return {
		schemaKeys: new Set(schemaKeys),
		versionIds: new Set(versionIds ?? []),
	};
};

describe("cachePopulator", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("skips when no preflight schema keys are available", () => {
		const spy = vi.spyOn(populateStateCacheModule, "populateStateCache");

		cachePopulator({
			statements: [],
			cachePreflight: buildPreflight([]),
			getEngine: () => undefined as any,
		});

		expect(spy).not.toHaveBeenCalled();
	});

	test("refreshes cache when marked stale", async () => {
		const lix = await openLix({});
		const engine = lix.engine!;
		const original = populateStateCacheModule.populateStateCache;
		const spy = vi
			.spyOn(populateStateCacheModule, "populateStateCache")
			.mockImplementation((args) => {
				return original(args);
			});

		markStateCacheAsStale({ engine });
		const cachePreflight = buildPreflight(["test_schema"], ["global_version"]);
		expect(Array.from(cachePreflight.versionIds)).toEqual(["global_version"]);

		cachePopulator({
			statements: [],
			cachePreflight,
			getEngine: () => engine,
		});
		expect(Array.from(cachePreflight.versionIds)).toEqual(["global_version"]);
		expect(spy).toHaveBeenCalledTimes(1);

		await lix.close();
	});

	test("does not repopulate when cache is already fresh", async () => {
		const lix = await openLix({});
		const engine = lix.engine!;
		const spy = vi.spyOn(populateStateCacheModule, "populateStateCache");

		markStateCacheAsFresh({ engine });

		cachePopulator({
			statements: [],
			cachePreflight: buildPreflight(["test_schema"]),
			getEngine: () => engine,
		});

		expect(spy).not.toHaveBeenCalled();

		await lix.close();
	});
});
