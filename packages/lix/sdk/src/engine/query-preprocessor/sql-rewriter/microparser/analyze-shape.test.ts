import { describe, expect, test } from "vitest";
import { tokenize } from "../tokenizer.js";
import { analyzeShape, analyzeShapes } from "./analyze-shape.js";

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
			expect.objectContaining({ kind: "placeholder" }),
			expect.objectContaining({ kind: "placeholder" }),
		]);
	});

	test("gracefully ignores unknown filters", () => {
		const sql = `SELECT * FROM internal_state_vtable v WHERE v.other_col = 'xyz'`;
		const shape = analyzeShape(tokenize(sql));
		expect(shape?.filters.length).toBe(0);
	});

	test("detects writer_key selection", () => {
		const sql = `SELECT v.writer_key FROM internal_state_vtable v WHERE v.schema_key = 'abc'`;
		const shape = analyzeShape(tokenize(sql));
		expect(shape).not.toBeNull();
		expect(shape?.selectsWriterKey).toBe(true);
	});

	test("selectsWriterKey defaults to false", () => {
		const sql = `SELECT v.entity_id FROM internal_state_vtable v`;
		const shape = analyzeShape(tokenize(sql));
		expect(shape).not.toBeNull();
		expect(shape?.selectsWriterKey).toBe(false);
	});

	test("marks _pk references", () => {
		const sql = `SELECT v._pk FROM internal_state_vtable v WHERE v.schema_key = 'abc'`;
		const shape = analyzeShape(tokenize(sql));
		expect(shape).not.toBeNull();
		expect(shape?.referencesPrimaryKey).toBe(true);
	});

	test("does not mark _pk when absent", () => {
		const sql = `SELECT * FROM internal_state_vtable v WHERE v.schema_key = 'abc'`;
		const shape = analyzeShape(tokenize(sql));
		expect(shape).not.toBeNull();
		expect(shape?.referencesPrimaryKey).toBe(false);
	});

	test("analyzes filters nested inside subqueries", () => {
		const sql = `SELECT * FROM (
		SELECT * FROM internal_state_vtable v
		WHERE v.schema_key = 'lix_active_version'
		  AND v.version_id = 'global'
	) derived
	WHERE derived.entity_id = ?`;
		const shapes = analyzeShapes(tokenize(sql));
		expect(shapes.length).toBe(1);
		const shape = shapes[0]!;
		expect(shape.schemaKeys).toEqual([
			{ kind: "literal", value: "lix_active_version" },
		]);
		expect(shape.versionId).toEqual({
			kind: "literal",
			value: "global",
		});
	});

	test("analyzeShape returns the first shape", () => {
		const sql = `SELECT * FROM internal_state_vtable v WHERE v.schema_key = 'one';
	SELECT * FROM internal_state_vtable w WHERE w.schema_key = 'two';`;
		const shapes = analyzeShapes(tokenize(sql));
		expect(shapes.length).toBe(2);
		const first = analyzeShape(tokenize(sql));
		expect(first?.schemaKeys).toEqual([{ kind: "literal", value: "one" }]);
	});
});
