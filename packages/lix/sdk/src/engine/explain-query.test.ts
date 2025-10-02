import { expect, test } from "vitest";
import type { CompiledQuery } from "kysely";
import { openLix } from "../lix/index.js";
import { createExplainQuery } from "./explain-query.js";

test("createExplainQuery returns rewritten when query is mutated", async () => {
	const lix = await openLix({});

	try {
		const engine = lix.engine!;
		const explain = await createExplainQuery({ engine });

		const query = {
			sql: "SELECT * FROM internal_state_vtable WHERE schema_key = 'mock_schema'",
			parameters: [],
		};

		const report = explain({ query });

		expect(report.rewritten).toBeDefined();
		expect(report.rewritten?.sql).not.toBe(report.original.sql);
		expect(report.rewritten?.sql ?? "").toContain(
			"hoisted_internal_state_vtable_rewrite"
		);
	} finally {
		await lix.close();
	}
});

test.skip("createExplainQuery omits rewritten when query is unchanged", async () => {
	const lix = await openLix({});

	try {
		const engine = lix.engine!;
		const explain = await createExplainQuery({ engine });

		const query = {
			sql: "SELECT * FROM state",
			parameters: [],
		};

		const report = explain({ query });

		expect(report.rewritten).toBeUndefined();
		expect(report.expanded?.sql).toContain("state_all");
	} finally {
		await lix.close();
	}
});
