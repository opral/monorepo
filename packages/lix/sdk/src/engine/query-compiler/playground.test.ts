import { promises as fs } from "node:fs";
import { expect, test } from "vitest";

import { openLix } from "../../lix/open-lix.js";

test("explain key_value select", async () => {
	const lix = await openLix({});
	try {
		const compiled = lix.db.selectFrom("key_value").selectAll().compile();

		const explainSql = `EXPLAIN QUERY PLAN ${compiled.sql}`;
		const result = lix.engine!.executeSync({
			sql: explainSql,
			parameters: compiled.parameters,
		});

		const lines = result.rows.map((row) => {
			const detail = (row as any)?.detail;
			return typeof detail === "string" ? detail : JSON.stringify(row);
		});
		const explainPath = new URL("./explain.txt", import.meta.url);
		await fs.writeFile(explainPath, `${lines.join("\n")}\n`, "utf8");

		expect(lines.length).toBeGreaterThan(0);
	} finally {
		await lix.close();
	}
});
