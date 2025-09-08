import { describe, expect, test } from "vitest";
import { openLix } from "@lix-js/sdk";
import { sqlSelectState } from "./sql-select-state.js";

function enc(s: string): Uint8Array {
	return new TextEncoder().encode(s);
}

describe("sql_select_state tool", () => {
	test("query snapshot_content with json_extract via state", async () => {
		const lix = await openLix({});

		await lix.db
			.insertInto("key_value")
			.values({
				key: "project_name",
				value: "My Project",
			})
			.execute();

		const result = await sqlSelectState({
			lix,
			sql: `
        SELECT 
          snapshot_content ->> '$.value' AS value, 
          snapshot_content ->> '$.key' AS key
        FROM state
        WHERE schema_key = 'lix_key_value' AND json_extract(snapshot_content, '$.key') = 'project_name'
        LIMIT 1
      `,
		});

		expect(result).toEqual([{ key: "project_name", value: "My Project" }]);
	});

	test("rejects non-select statements", async () => {
		const lix = await openLix({});
		await expect(
			sqlSelectState({ lix, sql: "DELETE FROM file" })
		).rejects.toThrow(/only SELECT/i);
	});
});
