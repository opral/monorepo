import { describe, expect, test } from "vitest";
import { tokenize } from "../tokenizer.js";
import { analyzeShape } from "./analyze-shape.js";

describe("analyzeShape", () => {
	test("collects filters and limit", () => {
		const sql = `SELECT json_extract(v.snapshot_content, '$.value') FROM internal_state_vtable v
      WHERE v.schema_key = 'abc'
        AND v.entity_id IN ('e1', 'e2')
        AND v.version_id = :vid
      LIMIT 1`;

		const shape = analyzeShape(tokenize(sql));
		expect(shape).not.toBeNull();
		expect(shape?.table.alias).toBe("v");
		expect(shape?.limit).toMatchObject({ kind: "number", value: 1 });
		expect(shape?.schemaKeys).toEqual([{ kind: "literal", value: "abc" }]);
		expect(shape?.entityIds).toEqual([
			{ kind: "literal", value: "e1" },
			{ kind: "literal", value: "e2" },
		]);
		expect(shape?.versionId.kind).toBe("placeholder");
	});

	test("returns null when table factor missing", () => {
		const sql = `SELECT * FROM mock_other_table LIMIT 1`;
		expect(analyzeShape(tokenize(sql))).toBeNull();
	});

	test("handles placeholders in IN lists", () => {
		const sql = `SELECT * FROM internal_state_vtable v WHERE v.entity_id IN (?, :named)`;
		const shape = analyzeShape(tokenize(sql));
		expect(shape?.entityIds).toEqual([
			{ kind: "placeholder" },
			{ kind: "placeholder" },
		]);
	});

	test("gracefully ignores unknown filters", () => {
		const sql = `SELECT * FROM internal_state_vtable v WHERE v.other_col = 'xyz'`;
		const shape = analyzeShape(tokenize(sql));
		expect(shape?.filters.length).toBe(0);
	});
});
