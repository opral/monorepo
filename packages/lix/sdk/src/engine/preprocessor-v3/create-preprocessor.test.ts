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
