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

	expect(result.sql.toLowerCase()).toContain(
		"lix_internal_state_all_untracked"
	);

	expect(() =>
		lix.engine!.sqlite.exec({
			sql: result.sql,
			bind: result.parameters as any[],
			returnValue: "resultRows",
			rowMode: "object",
		})
	).not.toThrow();

	expect(result.context?.trace?.[0]?.step).toBe("rewrite_vtable_selects");
});

test("state_all query flows through state_all and vtable rewrites", async () => {
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

test.skip("sql view expansion feeds subsequent rewrites", async () => {
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
	expect(upper).toContain("LIX_INTERNAL_STATE_VTABLE_REWRITTEN");
	const steps = context?.trace?.map((entry) => entry.step) ?? [];
	expect(steps).toContain("expand_sql_views");
	expect(steps).toContain("rewrite_vtable_selects");
	expect(steps).toContain("complete");

	await lix.close();
});
