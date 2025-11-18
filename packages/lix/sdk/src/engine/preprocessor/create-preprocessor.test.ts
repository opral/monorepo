import { expect, test } from "vitest";
import { createPreprocessor } from "./create-preprocessor.js";
import { openLix } from "../../lix/open-lix.js";

test("state_by_version view is rewritten", async () => {
	const lix = await openLix({});
	const preprocess = createPreprocessor({ engine: lix.engine! });

	const result = preprocess({
		sql: `
		SELECT sa.file_id
		FROM state_by_version AS sa
		WHERE sa.schema_key = 'demo'
		`,
		parameters: [],
		trace: true,
	});
	const { sql, parameters, trace } = result;

	const steps = trace?.map((entry) => entry.step) ?? [];
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

test("state_by_version insert statements are rewritten via preprocessor", async () => {
	const lix = await openLix({});
	const preprocess = createPreprocessor({ engine: lix.engine! });

	const { sql, trace } = preprocess({
		sql: `
			INSERT INTO state_by_version (
				entity_id,
				schema_key,
				file_id,
				version_id,
				plugin_key,
				snapshot_content,
				schema_version
			) VALUES ('row', 'schema', 'file', 'version', 'plugin', json('{}'), '1.0')
		`,
		parameters: [],
		trace: true,
	});

	expect(sql.toLowerCase()).toContain("lix_internal_state_vtable");
	expect(
		trace?.some((entry) => entry.step === "rewrite_state_by_version_insert")
	).toBe(true);

	await lix.close();
});

test("unsupported statements are passed through", async () => {
	const lix = await openLix({});
	const preprocess = createPreprocessor({ engine: lix.engine! });

	const sql = "CREATE TABLE raw_escape(id TEXT)";
	const result = preprocess({
		sql,
		parameters: [],
	});

	expect(result.sql).toBe(sql);
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
			FROM state_by_version AS sa
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
	const { sql, trace } = result;

	const upper = sql.toUpperCase();
	expect(upper).toContain("LIX_INTERNAL_STATE_VTABLE");
	const steps = trace?.map((entry) => entry.step) ?? [];
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
		.insertInto("state_by_version")
		.values({
			entity_id: "row-1",
			schema_key: "e2e_schema",
			file_id: "lix",
			version_id: activeVersion.version_id,
			plugin_key: "lix_sdk",
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

test("rewrites inner joins on views", async () => {
	const lix = await openLix({});

	const preprocess = createPreprocessor({ engine: lix.engine! });

	lix.engine!.sqlite.exec({
		sql: `
			CREATE VIEW view_a AS
			SELECT sa.entity_id, sa.schema_key
			FROM state_by_version AS sa
		`,
	});

	lix.engine!.sqlite.exec({
		sql: `
			CREATE VIEW view_b AS
			SELECT sa.entity_id, sa.file_id
			FROM state_by_version AS sa
		`,
	});

	const result = preprocess({
		sql: `
		SELECT va.schema_key, vb.file_id
		FROM view_a AS va
		INNER JOIN view_b AS vb ON va.entity_id = vb.entity_id
		`,
		parameters: [],
		trace: true,
	});
	const { sql, trace } = result;

	expect(() => {
		lix.engine!.sqlite.exec({
			sql,
			returnValue: "resultRows",
			rowMode: "object",
		});
	}).not.toThrow();

	const upper = sql.toUpperCase();
	expect(upper).toContain("LIX_INTERNAL_STATE_VTABLE");
	const steps = trace?.map((entry) => entry.step) ?? [];
	expect(steps).toContain("expand_sql_views");
	expect(steps).toContain("rewrite_vtable_selects");
	expect(steps).toContain("complete");

	await lix.close();
});

test("state filter on inherited_from_version_id=NULL prunes inheritance rewrites", async () => {
	const lix = await openLix({});
	const preprocess = createPreprocessor({ engine: lix.engine! });

	const query = `
		SELECT st.entity_id
		FROM state AS st
		WHERE st.file_id = ?
		  AND st.inherited_from_version_id IS NULL
	`;

	const result = preprocess({
		sql: query,
		parameters: ["file-1"],
	});

	const upper = result.sql.toUpperCase();
	expect(upper).toContain("LIX_INTERNAL_STATE_VTABLE");
	expect(upper).not.toContain("VERSION_INHERITANCE");
	expect(upper).not.toContain("VERSION_DESCRIPTOR_BASE");

	await lix.close();
});

test("version view rewrite prunes cache unions", async () => {
	const lix = await openLix({});
	const preprocess = createPreprocessor({ engine: lix.engine! });

	const result = preprocess({
		sql: `
			SELECT id
			FROM version
			WHERE id = ?
		`,
		parameters: ["global"],
		trace: true,
	});

	const normalizedSql = result.sql.toLowerCase();
	expect(normalizedSql).toContain(
		`"lix_internal_state_cache_v1_lix_version_descriptor"`
	);
	// Ensure cache unions are pruned down to descriptor/tip tables.
	expect(normalizedSql).not.toContain(
		`"lix_internal_state_cache_v1_lix_stored_schema"`
	);

	const rewriteTrace =
		result.trace?.filter((entry) => entry.step === "rewrite_vtable_selects") ??
		[];
	expect(rewriteTrace.length).toBeGreaterThan(0);
	expect(
		rewriteTrace.some((entry) =>
			(entry.payload?.schema_key_literals ?? []).includes(
				"lix_version_descriptor"
			)
		)
	).toBe(true);

	await lix.close();
});

test("state file_id predicate is pushed into vtable rewrite for markdown schemas", async () => {
	const lix = await openLix({});
	const preprocess = createPreprocessor({ engine: lix.engine! });

	const result = preprocess({
		sql: `
		SELECT st.entity_id
		FROM state AS st
		WHERE st.file_id = ?
		  AND st.schema_key IN ('markdown_wc_paragraph')
		`,
		parameters: ["file-xyz"],
	});

	const normalized = result.sql.toLowerCase();
	expect(normalized).toContain("unt.file_id in ('file-xyz')");

	await lix.close();
});
