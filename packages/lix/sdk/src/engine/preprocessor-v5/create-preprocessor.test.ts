import { expect, test } from "vitest";
import { createPreprocessor } from "./create-preprocessor.js";
import { openLix } from "../../lix/open-lix.js";

test("state_all view is rewritten", async () => {
	const lix = await openLix({});
	const preprocess = createPreprocessor({ engine: lix.engine! });

	const result = preprocess({
		sql: `
		SELECT sa.file_id
		FROM state_all AS sa
		WHERE sa.schema_key = 'demo'
		`,
		parameters: [],
		trace: true,
	});
	const { sql, parameters, context } = result;

	const steps = context?.trace?.map((entry) => entry.step) ?? [];
	expect(steps).toContain("rewrite_vtable_selects");
	expect(steps).toContain("complete");

	expect(() =>
		lix.engine!.sqlite.exec({
			sql,
			bind: parameters as any[],
			returnValue: "resultRows",
			rowMode: "object",
		})
	).not.toThrow();

	await lix.close();
});

test("unsupported statements are ignored", async () => {
	const lix = await openLix({});
	const preprocess = createPreprocessor({ engine: lix.engine! });

	const sql = "CREATE TABLE raw_escape(id TEXT)";
	const result = preprocess({
		sql,
		parameters: [],
	});

	expect(result.sql).toBe(sql);
	expect(result.expandedSql).toBe(sql);
	expect(result.parameters).toEqual([]);

	await lix.close();
});

test("sql view expansion feeds subsequent rewrites", async () => {
	const lix = await openLix({});
	const preprocess = createPreprocessor({ engine: lix.engine! });

	lix.engine!.sqlite.exec({
		sql: `
			CREATE VIEW foo_view AS
			SELECT sa.file_id
			FROM state_all AS sa
		`,
	});

	const result = preprocess({
		sql: `
		SELECT fv.file_id
		FROM foo_view AS fv
		`,
		parameters: [],
		trace: true,
	});
	const { sql, context } = result;

	const upper = sql.toUpperCase();
	expect(upper).toContain("LIX_INTERNAL_STATE_VTABLE");
	const steps = context?.trace?.map((entry) => entry.step) ?? [];
	expect(steps).toContain("expand_sql_views");
	expect(steps).toContain("rewrite_vtable_selects");
	expect(steps).toContain("complete");

	await lix.close();
});

test("selecting from stored schema view returns rows via preprocessor", async () => {
	const lix = await openLix({});

	const schema = {
		"x-lix-key": "e2e_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id"],
		additionalProperties: false,
	} as const;

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = createPreprocessor({ engine: lix.engine! });

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "row-1",
			schema_key: "e2e_schema",
			file_id: "lix",
			version_id: activeVersion.version_id,
			plugin_key: "lix_own_entity",
			snapshot_content: { id: "row-1", name: "Entity 1" },
			schema_version: "1.0",
			metadata: null,
			untracked: false,
		})
		.execute();

	const selectResult = preprocess({
		sql: "SELECT name FROM e2e_schema WHERE id = ?",
		parameters: ["row-1"],
	});

	expect(selectResult.sql).not.toMatch(/FROM\s+e2e_schema\b/i);
	expect(selectResult.sql).toContain("schema_key = 'e2e_schema'");

	const executed = lix.engine!.sqlite.exec({
		sql: selectResult.sql,
		bind: selectResult.parameters as any[],
		returnValue: "resultRows",
		rowMode: "object",
		columnNames: [],
	});

	expect(executed).toEqual([{ name: "Entity 1" }]);

	await lix.close();
});
