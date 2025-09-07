import { expect, test } from "vitest";
import { openLix } from "@lix-js/sdk";
import { createSqlSelectTool } from "./sql-select.js";

test("lix.sql.select reads rows by schema_key from state", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	const sqlSelect = createSqlSelectTool(lix);
	const out = await sqlSelect.execute!({
		schema_key: "lix_key_value",
		limit: 3,
	});

	expect(out).toBeTruthy();
	expect(Array.isArray(out.rows)).toBe(true);
	expect(out.rowCount).toBeLessThanOrEqual(3);
	if (out.rowCount > 0) {
		for (const r of out.rows) {
			expect(r.schema_key).toBe("lix_key_value");
			expect(r).toHaveProperty("snapshot_content");
		}
	}
});
