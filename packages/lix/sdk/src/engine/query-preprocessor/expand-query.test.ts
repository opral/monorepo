import { describe, expect, test } from "vitest";
import { expandQuery } from "./expand-query.js";

const normalize = (sql: string) => sql.replace(/\s+/g, " ").trim();

describe("expandQuery", () => {
	test("returns original SQL when no matching views exist", () => {
		const sql = "SELECT * FROM internal_state_vtable";
		const result = expandQuery({ sql, views: new Map(), runtimeCacheRef: {} });
		expect(result.sql).toBe(sql);
		expect(result.expanded).toBe(false);
	});

	test("expands a simple view reference", () => {
		const sql = "SELECT * FROM state_reader_view";
		const views = new Map([
			["state_reader_view", "SELECT entity_id FROM internal_state_vtable"],
		]);

		const result = expandQuery({ sql, views, runtimeCacheRef: {} });

		expect(result.expanded).toBe(true);
		const normalized = normalize(result.sql);
		expect(normalized).toContain(
			"FROM ( SELECT entity_id FROM internal_state_vtable ) AS state_reader_view"
		);
	});

	test("preserves aliases while expanding", () => {
		const sql = "SELECT sr.entity_id FROM state_reader_view AS sr";
		const views = new Map([
			[
				"state_reader_view",
				"SELECT entity_id, schema_key FROM internal_state_vtable",
			],
		]);

		const result = expandQuery({ sql, views, runtimeCacheRef: {} });
		expect(result.expanded).toBe(true);
		const normalized = normalize(result.sql);
		expect(normalized).toContain(
			"FROM ( SELECT entity_id, schema_key FROM internal_state_vtable ) AS sr"
		);
	});

	test("expands nested views recursively", () => {
		const sql = "SELECT * FROM outer_view";
		const views = new Map([
			["outer_view", "SELECT * FROM inner_view"],
			["inner_view", "SELECT entity_id FROM internal_state_vtable"],
		]);

		const result = expandQuery({ sql, views, runtimeCacheRef: {} });
		expect(result.expanded).toBe(true);
		const normalized = normalize(result.sql);
		expect(normalized).toContain(
			"FROM ( SELECT * FROM ( SELECT entity_id FROM internal_state_vtable ) AS inner_view ) AS outer_view"
		);
	});

	test("expands multi-level views defined over state", () => {
		const sql = "SELECT c.id FROM commit c";
		const views = new Map([
			["commit", "SELECT id FROM commit_state"],
			["commit_state", "SELECT entity_id AS id FROM internal_state_vtable"],
		]);

		const result = expandQuery({ sql, views, runtimeCacheRef: {} });
		expect(result.expanded).toBe(true);
		const normalized = normalize(result.sql);
		expect(normalized).toContain(
			"FROM ( SELECT entity_id AS id FROM internal_state_vtable ) AS c"
		);
	});

	test("avoids infinite recursion on cyclic view definitions", () => {
		const sql = "SELECT * FROM a_view";
		const views = new Map([
			["a_view", "SELECT * FROM b_view"],
			["b_view", "SELECT * FROM a_view"],
		]);

		const result = expandQuery({ sql, views, runtimeCacheRef: {} });
		expect(result.expanded).toBe(false);
		expect(result.sql).toBe(sql);
	});

	test("does not expand views with no internal_state_vtable reference", () => {
		const sql = "SELECT * FROM external_view";
		const views = new Map([["external_view", "SELECT 42 AS answer"]]);

		const result = expandQuery({ sql, views, runtimeCacheRef: {} });
		expect(result.expanded).toBe(false);
		expect(result.sql).toBe(sql);
	});

	test("still expands after view map changes to include vtable", () => {
		const runtimeCacheRef = {};
		const sql = "SELECT * FROM maybe_state";
		const viewsWithoutState = new Map([["maybe_state", "SELECT 1"]]);
		const viewsWithState = new Map([
			["maybe_state", "SELECT * FROM internal_state_vtable"],
		]);

		const first = expandQuery({
			sql,
			views: viewsWithoutState,
			runtimeCacheRef,
		});
		expect(first.expanded).toBe(false);
		expect(first.sql).toBe(sql);

		const second = expandQuery({
			sql,
			views: viewsWithState,
			runtimeCacheRef,
		});
		expect(second.expanded).toBe(true);
		expect(normalize(second.sql)).toContain(
			"FROM ( SELECT * FROM internal_state_vtable ) AS maybe_state"
		);
	});
});
