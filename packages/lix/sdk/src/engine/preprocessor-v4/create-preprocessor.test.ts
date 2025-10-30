import { expect, test } from "vitest";
import { createPreprocessor } from "./create-preprocessor.js";
import { openLix } from "../../lix/open-lix.js";

test("executing preprocessed sql does not throw", async () => {
	const lix = await openLix({});
	const preprocess = createPreprocessor({ engine: lix.engine! });

	const result = preprocess({
		sql: `
			SELECT v.*
			FROM lix_internal_state_vtable AS v
			WHERE v.schema_key = 'test_schema_key'
		`,
		parameters: [],
		trace: true,
	});

	const steps = result.trace?.map((entry) => entry.step) ?? [];
	expect(steps).toContain("expand_views");
	expect(steps).toContain("rewrite_vtable_selects");
	expect(steps.at(-1)).toBe("complete");

	expect(() =>
		lix.engine!.sqlite.exec({
			sql: result.sql,
			bind: result.parameters as any[],
			returnValue: "resultRows",
			rowMode: "object",
		})
	).not.toThrow();
});

test("state_all query flows is expanded leads to rewritten vtable select", async () => {
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
	const { sql, parameters, trace, cachePreflight } = result;

	const steps = trace?.map((entry) => entry.step) ?? [];
	expect(steps).toContain("expand_views");
	expect(steps).toContain("rewrite_vtable_selects");
	expect(steps).toContain("complete");
	expect(cachePreflight?.schemaKeys ?? []).not.toHaveLength(0);

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

test("unsupported statements are returned as is", async () => {
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
