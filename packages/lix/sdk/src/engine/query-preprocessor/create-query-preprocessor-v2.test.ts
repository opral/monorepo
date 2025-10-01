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
		const preprocess = await createQueryPreprocessorV2(lix.engine!);

		const result = preprocess({
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

		const preprocess = await createQueryPreprocessorV2(lix.engine!);

		preprocess({
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

		const preprocess = await createQueryPreprocessorV2(lix.engine!);

		const result = preprocess({
			sql: "SELECT * FROM internal_state_view",
			parameters: [],
		});

		expect(result.sql).not.toMatch(/FROM\s+internal_state_view\b/i);
		expect(result.sql).toContain("WITH RECURSIVE");
		expect(result.sql).toContain("internal_transaction_state");

		await lix.close();
	});

	test("leaves non-select statements untouched", async () => {
		const lix = await openLix({});
		const preprocess = await createQueryPreprocessorV2(lix.engine!);
		const sql =
			"DELETE FROM internal_state_vtable WHERE entity_id = 'mock' AND schema_key = 'mock_schema'";

		const result = preprocess({ sql, parameters: [] });

		expect(result.sql).toBe(sql);
		await lix.close();
	});

	test("skips WITH ... DELETE statements", async () => {
		const lix = await openLix({});
		const preprocess = await createQueryPreprocessorV2(lix.engine!);
		const sql = `WITH target AS (
			SELECT entity_id FROM internal_state_vtable
		)
		DELETE FROM internal_state_vtable WHERE entity_id IN (SELECT entity_id FROM target)`;

		const result = preprocess({ sql, parameters: [] });

		expect(result.sql).toBe(sql);
		await lix.close();
	});
});
