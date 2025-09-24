import { expect, test } from "vitest";
import { createExplainQuery } from "./explain-query.js";
import { openLix } from "../lix/open-lix.js";

test.todo("explains a routed select", async () => {
	const lix = await openLix({});
	const explainQuery = createExplainQuery({ engine: lix.engine! });

	const compiled = lix.db
		.selectFrom("state as s")
		.selectAll()
		.where("s.schema_key", "=", "lix_key_value")
		.compile();

	const result = explainQuery({ query: compiled });

	expect(result.plan.length).toBeGreaterThan(0);
	expect(result.original.sql).toContain('"state" as "s"');
	expect(result.rewritten.sql).not.toBe(result.original.sql);

	await lix.close();
});

test("returns original plan for raw queries", async () => {
	const lix = await openLix({});

	const explainQuery = createExplainQuery({ engine: lix.engine! });

	const compiled = {
		query: undefined,
		queryId: { queryId: "manual" },
		sql: "SELECT 1",
		parameters: [],
	};

	const result = explainQuery({ query: compiled as any });
	const details = result.plan.map((row: any) => row.detail ?? "");
	expect(details.join("\n")).toContain("SCAN");
	expect(result.original.sql).toBe("SELECT 1");
	expect(result.rewritten.sql).toBe("SELECT 1");
});
