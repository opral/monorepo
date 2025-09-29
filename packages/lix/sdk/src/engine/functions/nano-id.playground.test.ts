import { expect, test } from "vitest";
import { writeFileSync } from "node:fs";
import { openLix } from "../../lix/open-lix.js";
import { internalQueryBuilder } from "../internal-query-builder.js";
import { sql } from "kysely";
import { createExplainQuery } from "../explain-query.js";

function compileDeterministicNanoIdQuery() {
	return internalQueryBuilder
		.selectFrom("internal_state_reader")
		.where("entity_id", "=", "lix_deterministic_mode")
		.where("schema_key", "=", "lix_key_value")
		.where("snapshot_content", "is not", null)
		.select(sql`json_extract(snapshot_content, '$.value.nano_id')`.as("nano_id"))
		.limit(1)
		.compile();
}

test("emit EXPLAIN QUERY PLAN for deterministic nano id query", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	try {
		const engine = lix.engine!;
		const query = compileDeterministicNanoIdQuery();
		const explain = await createExplainQuery({ engine });

		const report = explain({ query });
		const serialized = JSON.stringify(report, null, 2);
		writeFileSync(new URL("./plan.txt", import.meta.url), serialized, "utf8");

		console.log("nano-id explain", serialized);

		expect(report.plan.length).toBeGreaterThan(0);
	} finally {
		await lix.close();
	}
});
