import { describe, expect, test } from "vitest";
import { expandViews } from "./expand-views.js";
import type { PreprocessorTrace } from "../types.js";

const normalize = (sql: string) => sql.replace(/\s+/g, " ").trim();

describe("expandViewsStep", () => {
	test("returns original statements when no view definitions exist", () => {
		const originalSql = "SELECT * FROM foo";
		const result = expandViews({
			statements: [{ sql: originalSql, parameters: [] }],
			getSqlViews: () => new Map(),
		});

		expect(result.statements).toHaveLength(1);
		expect(result.statements[0]?.sql).toBe(originalSql);
		expect(result.statements[0]?.parameters).toEqual([]);
	});

	test("expands a simple view reference", () => {
		const views = new Map([
			["state_reader_view", "SELECT entity_id FROM lix_internal_state_vtable"],
		]);
		const result = expandViews({
			statements: [{ sql: "SELECT * FROM state_reader_view", parameters: [] }],
			getSqlViews: () => views,
		});

		expect(result.statements).toHaveLength(1);
		const expanded = normalize(result.statements[0]!.sql);
		expect(expanded).toContain(
			"FROM ( SELECT entity_id FROM lix_internal_state_vtable ) AS state_reader_view"
		);
	});

	test("expands nested views recursively", () => {
		const views = new Map([
			["outer_view", "SELECT * FROM inner_view"],
			["inner_view", "SELECT entity_id FROM lix_internal_state_vtable"],
		]);

		const result = expandViews({
			statements: [{ sql: "SELECT * FROM outer_view", parameters: [] }],
			getSqlViews: () => views,
		});

		const expanded = normalize(result.statements[0]!.sql);
		expect(expanded).toContain(
			"FROM ( SELECT * FROM ( SELECT entity_id FROM lix_internal_state_vtable ) AS inner_view ) AS outer_view"
		);
	});

	test("does not expand views without internal state references", () => {
		const views = new Map([["external_view", "SELECT 42 AS answer"]]);
		const result = expandViews({
			statements: [{ sql: "SELECT * FROM external_view", parameters: [] }],
			getSqlViews: () => views,
		});

		expect(result.statements[0]?.sql).toBe("SELECT * FROM external_view");
	});

	test("avoids infinite recursion when views are cyclic", () => {
		const views = new Map([
			["a_view", "SELECT * FROM b_view"],
			["b_view", "SELECT * FROM a_view"],
		]);

		const result = expandViews({
			statements: [{ sql: "SELECT * FROM a_view", parameters: [] }],
			getSqlViews: () => views,
		});

		expect(result.statements[0]?.sql).toBe("SELECT * FROM a_view");
	});

	test("expands each statement independently", () => {
		const views = new Map([
			["directory", "SELECT entity_id FROM lix_internal_state_vtable"],
			["file", "SELECT entity_id FROM lix_internal_state_vtable"],
		]);

		const result = expandViews({
			statements: [
				{ sql: 'SELECT * FROM "directory"', parameters: [] },
				{ sql: 'SELECT * FROM "file"', parameters: [] },
			],
			getSqlViews: () => views,
		});

		expect(result.statements).toHaveLength(2);
		const first = normalize(result.statements[0]!.sql);
		const second = normalize(result.statements[1]!.sql);

		expect(first).toContain(
			'FROM ( SELECT entity_id FROM lix_internal_state_vtable ) AS "directory"'
		);
		expect(second).toContain(
			'FROM ( SELECT entity_id FROM lix_internal_state_vtable ) AS "file"'
		);
	});

	test("records trace entries when views are expanded", () => {
		const views = new Map([
			["state_reader_view", "SELECT entity_id FROM lix_internal_state_vtable"],
		]);

		const trace: PreprocessorTrace = [];
		const result = expandViews({
			statements: [{ sql: "SELECT * FROM state_reader_view", parameters: [] }],
			getSqlViews: () => views,
			trace,
		});

		expect(result.statements[0]?.sql).toContain("lix_internal_state_vtable");
		expect(trace).toHaveLength(1);
		expect(trace[0]?.step).toBe("expand_views");
		expect(trace[0]?.payload).toEqual({
			expanded: true,
			views: ["state_reader_view"],
		});
	});

	test("records trace entries when no expansion occurs", () => {
		const trace: PreprocessorTrace = [];
		const result = expandViews({
			statements: [{ sql: "SELECT 1", parameters: [] }],
			getSqlViews: () => new Map(),
			trace,
		});

		expect(result.statements[0]?.sql).toBe("SELECT 1");
		expect(trace).toHaveLength(1);
		expect(trace[0]?.payload).toEqual({ expanded: false, views: [] });
	});
});
