import { expect, test } from "vitest";
import { openLix } from "../lix/index.js";
import { createExplainQuery } from "./explain-query.js";

test("createExplainQuery returns rewritten when query is mutated", async () => {
	const lix = await openLix({});

	const engine = lix.engine!;
	const explain = createExplainQuery({ engine });

	const query = {
		sql: "SELECT * FROM lix_internal_state_vtable WHERE schema_key = 'mock_schema'",
		parameters: [],
	};

	const report = explain(query);

	expect(report.rewrittenSql).toBeDefined();
	expect(report.rewrittenSql).not.toBe(report.originalSql);
	await lix.close();
});
