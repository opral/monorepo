import { promises as fs } from "node:fs";
import { expect, test } from "vitest";

import { openLix } from "../../lix/open-lix.js";

test("explain key_value select", async () => {
	const lix = await openLix({});
	try {
		const compiled = lix.db
			.selectFrom("state as s")
			.selectAll()
			.where("s.schema_key", "=", "lix_key_value")
			.compile();

		const explained = (await lix.call("lix_explain_query", {
			query: compiled,
		})) as {
			plan: Array<{ detail?: string }>;
			original: { sql: string };
			compiled: { sql: string };
		};

		const lines = explained.plan.map((row) =>
			typeof row.detail === "string" ? row.detail : JSON.stringify(row)
		);
		const explainPath = new URL("./explain.txt", import.meta.url);
		const content = [
			"Original SQL:",
			explained.original.sql,
			"",
			"Compiled SQL:",
			explained.compiled.sql,
			"",
			"Plan:",
			...lines.map((line) => `  - ${line}`),
			"",
		].join("\n");
		await fs.writeFile(explainPath, content, "utf8");

		expect(lines.length).toBeGreaterThan(0);
	} finally {
		await lix.close();
	}
});
