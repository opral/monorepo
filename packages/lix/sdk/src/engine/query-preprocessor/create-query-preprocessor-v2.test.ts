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

	test("rewrites stored_schema view via state pipeline", async () => {
		const lix = await openLix({});
		const preprocess = await createQueryPreprocessorV2(lix.engine!);
		const sql =
			'SELECT "key", "version", "value" FROM "stored_schema" WHERE "key" = ? AND "version" = ? LIMIT ?';

		const result = preprocess({
			sql,
			parameters: ["schema", "1.0", 1],
		});

		expect(result.sql).not.toMatch(/FROM\s+"stored_schema"/i);
		expect(result.sql).toContain("WITH RECURSIVE");

		const { rows } = lix.engine!.executeSync({
			sql: result.sql,
			parameters: result.parameters,
		});

		expect(rows).toBeInstanceOf(Array);
		await lix.close();
	});

	test("does not rewrite change history query without vtable references", async () => {
		const lix = await openLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const preprocess = await createQueryPreprocessorV2(lix.engine!);

		const sql = `select 
			"change"."schema_key", 
			"change"."entity_id", 
			"change_set_element"."change_id", 
			"change"."snapshot_content" 
		from "change_set_element" 
		inner join "change" 
		on "change_set_element"."change_id" = "change"."id" 
		where "change_set_id" = ?`;

		const parameters = ["some-id"];

		const result = preprocess({ sql, parameters });

		const { rows } = lix.engine!.executeSync({
			sql: result.sql,
			parameters: result.parameters,
		});

		expect(rows).toBeInstanceOf(Array);
		expect(rows.length).toBe(0);

		await lix.close();
	});
});
