import { afterEach, describe, expect, test, vi } from "vitest";
import { openLix } from "../../lix/index.js";
import { createQueryPreprocessorV2 } from "./create-query-preprocessor-v2.js";
import { markStateCacheAsStale } from "../../state/cache/mark-state-cache-as-stale.js";
import * as populateStateCacheModule from "../../state/cache/populate-state-cache.js";

describe("createQueryPreprocessorV2", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("rewrites internal_state_vtable queries using Chevrotain pipeline", async () => {
		const lix = await openLix({});
		const stage = await createQueryPreprocessorV2(lix.engine!);

		const result = stage({
			sql: "SELECT * FROM internal_state_vtable WHERE schema_key = 'lix_key_value'",
			parameters: [],
		});

		expect(result.sql).toContain("WITH RECURSIVE");
		expect(result.sql).not.toMatch(/FROM\s+internal_state_vtable/i);

		await lix.close();
	});

	test("refreshes cache when stale", async () => {
		const lix = await openLix({});
		const populateSpy = vi.spyOn(
			populateStateCacheModule,
			"populateStateCache"
		);

		markStateCacheAsStale({ engine: lix.engine! });

		const stage = await createQueryPreprocessorV2(lix.engine!);

		stage({
			sql: "SELECT * FROM internal_state_vtable WHERE schema_key = 'lix_key_value'",
			parameters: [],
		});

		expect(populateSpy).toHaveBeenCalled();

		await lix.close();
	});

	test("expands view references before rewriting", async () => {
		const lix = await openLix({});
		lix.engine!.sqlite.exec({
			sql: `
				CREATE VIEW internal_state_view AS
				SELECT schema_key FROM internal_state_vtable WHERE schema_key = 'lix_key_value'
			`,
			returnValue: "resultRows",
		});

		const stage = await createQueryPreprocessorV2(lix.engine!);

		const result = stage({
			sql: "SELECT * FROM internal_state_view",
			parameters: [],
		});

		expect(result.sql).not.toMatch(/FROM\s+internal_state_view\b/i);
		expect(result.sql).toContain("WITH RECURSIVE");
		expect(result.sql).toContain("internal_transaction_state");

		await lix.close();
	});
});
