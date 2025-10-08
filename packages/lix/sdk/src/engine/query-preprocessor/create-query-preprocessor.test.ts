import { afterEach, describe, expect, test, vi } from "vitest";
import { openLix } from "../../lix/index.js";
import { createQueryPreprocessor } from "./create-query-preprocessor.js";
import { setHasOpenTransaction } from "../../state/vtable/vtable.js";
import { markStateCacheAsStale } from "../../state/cache/mark-state-cache-as-stale.js";
import * as populateStateCacheModule from "../../state/cache/populate-state-cache.js";

describe("createQueryPreprocessorV2", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("rewrites internal_state_vtable queries using Chevrotain pipeline", async () => {
		const lix = await openLix({});
		const preprocess = await createQueryPreprocessor(lix.engine!);
		setHasOpenTransaction(lix.engine!, true);

		const result = preprocess({
			sql: "SELECT * FROM internal_state_vtable WHERE schema_key = 'lix_key_value'",
			parameters: [],
		});

		expect(result.sql.trim().startsWith("WITH")).toBe(true);
		expect(result.sql).toContain("internal_state_vtable_rewritten AS (");
		expect(result.sql).toContain(
			"(SELECT entity_id, schema_key, file_id, plugin_key, snapshot_content, schema_version, version_id, created_at, updated_at, inherited_from_version_id, change_id, untracked, commit_id, metadata, writer_key FROM internal_state_vtable_rewritten) AS internal_state_vtable"
		);

		await lix.close();
	});

	test("refreshes cache when stale", async () => {
		const lix = await openLix({});
		const populateSpy = vi.spyOn(
			populateStateCacheModule,
			"populateStateCache"
		);

		markStateCacheAsStale({ engine: lix.engine! });

		const preprocess = await createQueryPreprocessor(lix.engine!);

		preprocess({
			sql: "SELECT * FROM internal_state_vtable WHERE schema_key = 'lix_key_value'",
			parameters: [],
		});

		expect(populateSpy).toHaveBeenCalled();

		await lix.close();
	});

	test("skips cache population when sideEffects=false", async () => {
		const lix = await openLix({});
		try {
			const populateSpy = vi.spyOn(
				populateStateCacheModule,
				"populateStateCache"
			);

			markStateCacheAsStale({ engine: lix.engine! });

			const preprocess = await createQueryPreprocessor(lix.engine!);

			preprocess({
				sql: "SELECT * FROM internal_state_vtable WHERE schema_key = 'lix_key_value'",
				parameters: [],
				sideEffects: false,
			});

			expect(populateSpy).not.toHaveBeenCalled();
		} finally {
			await lix.close();
		}
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

		const preprocess = await createQueryPreprocessor(lix.engine!);
		setHasOpenTransaction(lix.engine!, true);

		const result = preprocess({
			sql: "SELECT * FROM internal_state_view",
			parameters: [],
		});

		expect(result.expandedSql).toBeDefined();
		expect(result.expandedSql).not.toMatch(/FROM\s+internal_state_view\b/i);
		expect(result.sql).toContain("internal_transaction_state");
		expect(result.sql).not.toMatch(/FROM\s+internal_state_view\b/i);

		await lix.close();
	});

	test("skips transaction segments when none pending", async () => {
		const lix = await openLix({});
		lix.engine!.sqlite.exec({
			sql: `
				CREATE VIEW internal_state_view AS
				SELECT schema_key FROM internal_state_vtable WHERE schema_key = 'lix_key_value'
			`,
			returnValue: "resultRows",
		});

		const preprocess = await createQueryPreprocessor(lix.engine!);

		const result = preprocess({
			sql: "SELECT * FROM internal_state_view",
			parameters: [],
		});

		expect(result.sql).not.toContain("internal_transaction_state");
		await lix.close();
	});

	test("leaves non-select statements untouched", async () => {
		const lix = await openLix({});
		const preprocess = await createQueryPreprocessor(lix.engine!);
		const sql =
			"DELETE FROM internal_state_vtable WHERE entity_id = 'mock' AND schema_key = 'mock_schema'";

		const result = preprocess({ sql, parameters: [] });

		expect(result.sql).toBe(sql);
		await lix.close();
	});

	test("skips WITH ... DELETE statements", async () => {
		const lix = await openLix({});
		const preprocess = await createQueryPreprocessor(lix.engine!);
		const sql = `WITH target AS (
			SELECT entity_id FROM internal_state_vtable
		)
		DELETE FROM internal_state_vtable WHERE entity_id IN (SELECT entity_id FROM target)`;

		const result = preprocess({ sql, parameters: [] });

		expect(result.sql).toBe(sql);
		await lix.close();
	});

	test("leaves internal_state_materializer select semantically equal", async () => {
		const lix = await openLix({});
		const preprocess = await createQueryPreprocessor(lix.engine!);
		const sql =
			'select * from "internal_state_materializer" where "version_id" = ? and "entity_id" = ?';

		const result = preprocess({
			sql,
			parameters: ["base-version", "base-entity"],
		});

		expect(result.sql).toBe(
			`select * from "internal_state_materializer" where "version_id" = ?1 and "entity_id" = ?2`
		);
		expect(result.expandedSql).toBeUndefined();

		await lix.close();
	});

	test("rewrites stored_schema view via state pipeline", async () => {
		const lix = await openLix({});
		const preprocess = await createQueryPreprocessor(lix.engine!);
		const sql =
			'SELECT "value" FROM "stored_schema" WHERE "lixcol_entity_id" = ? LIMIT ?';

		const result = preprocess({
			sql,
			parameters: ["lix_stored_schema~1.0", 1],
		});

		expect(result.sql).toContain("WITH RECURSIVE");
		expect(result.sql).not.toMatch(/FROM\s+"stored_schema"/i);

		const rows = lix.engine!.sqlite.exec({
			sql: result.sql,
			bind: result.parameters as any[],
			returnValue: "resultRows",
			rowMode: "object",
			columnNames: [],
		});

		expect(Array.isArray(rows)).toBe(true);
		await lix.close();
	});

	test("expands stored schema entity view without sqlite view", async () => {
		const lix = await openLix({});
		const customSchema = {
			"x-lix-key": "my_cool_schema",
			"x-lix-version": "1.0",
			"x-lix-primary-key": ["id"],
			type: "object",
			properties: {
				id: { type: "string" },
				name: { type: "string" },
			},
			required: ["id"],
			additionalProperties: false,
		} as const;

		await lix.db
			.insertInto("stored_schema")
			.values({ value: customSchema })
			.execute();

		const preprocess = await createQueryPreprocessor(lix.engine!);
		const result = preprocess({
			sql: "SELECT name FROM my_cool_schema WHERE id = ?",
			parameters: ["demo"],
		});

		expect(result.expandedSql).toBeDefined();
		expect(result.sql).toContain("schema_key = 'my_cool_schema'");
		expect(result.sql).not.toMatch(/FROM\s+my_cool_schema\b/i);
		expect(result.sql).toContain("internal_state_vtable_rewritten");

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

		const preprocess = await createQueryPreprocessor(lix.engine!);

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

		const rows = lix.engine!.sqlite.exec({
			sql: result.sql,
			bind: result.parameters as any[],
			returnValue: "resultRows",
			rowMode: "object",
			columnNames: [],
		});

		expect(Array.isArray(rows)).toBe(true);
		expect((rows as unknown[]).length).toBe(0);

		await lix.close();
	});
});
