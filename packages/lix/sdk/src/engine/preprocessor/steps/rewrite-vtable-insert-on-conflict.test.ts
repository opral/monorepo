import { describe, expect, test } from "vitest";
import { parse } from "../sql-parser/parse.js";
import { compile } from "../sql-parser/compile.js";
import type { PreprocessorStepContext } from "../types.js";
import { rewriteVtableInsertOnConflict } from "./rewrite-vtable-insert-on-conflict.js";

	const baseContext: PreprocessorStepContext = {
		statements: [],
		parameters: [],
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () => new Map(),
		hasOpenTransaction: () => false,
		getCelEnvironment: () => null as any,
		getEngine: () => null as any,
		getVersionInheritance: () => null as any,
		getActiveVersionId: () => null,
		trace: [],
	};

describe("rewrite_vtable_insert_on_conflict", () => {
	test("splits vtable on conflict into insert-do-nothing and guarded update", () => {
		const sql =
			'INSERT INTO "lix_internal_state_vtable" (entity_id, schema_key, file_id, version_id, snapshot_content, plugin_key, schema_version, untracked) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (entity_id, schema_key, file_id, version_id) DO UPDATE SET snapshot_content = excluded.snapshot_content';

		const rewritten = rewriteVtableInsertOnConflict({
			...baseContext,
			statements: parse(sql),
		});

		const statements = rewritten;

		expect(statements).toHaveLength(2);

		const compiled = compile(statements).sql.replace(/\s+/g, " ").trim();

		expect(compiled).toMatch(/^INSERT INTO "lix_internal_state_vtable"/i);
		expect(compiled).toMatch(/; UPDATE "lix_internal_state_vtable"/i);
		expect(compiled).not.toContain("ON CONFLICT");
		expect(compiled).toMatch(/entity_id = \?1/);
		expect(compiled).toMatch(/schema_key = \?2/);
		expect(compiled).toMatch(/file_id = \?3/);
		expect(compiled).toMatch(/version_id = \?4/);
	});

	test("does not duplicate assignments when required columns are missing", () => {
		// Only snapshot_content is provided in SET; required columns must be filled
		// from the insert values without duplicating assignments.
		const sql =
			'INSERT INTO "lix_internal_state_vtable" (entity_id, schema_key, file_id, version_id, snapshot_content, plugin_key, schema_version, untracked) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (entity_id, schema_key, file_id, version_id) DO UPDATE SET snapshot_content = excluded.snapshot_content';

		const rewritten = rewriteVtableInsertOnConflict({
			...baseContext,
			statements: parse(sql),
		});

		const statements = rewritten;
		const compiled = compile(statements).sql;

		const updateSegment = compiled.split(";").pop() ?? "";
		const [_, setClause] =
			updateSegment.match(/SET\s+(.+?)\s+WHERE/i) ?? [];
		const occurrences = (substr: string, text: string) =>
			(text.match(new RegExp(substr, "g")) ?? []).length;

		expect(setClause).toBeDefined();
		expect(occurrences("entity_id =", setClause!)).toBe(1);
		expect(occurrences("schema_key =", setClause!)).toBe(1);
		expect(occurrences("file_id =", setClause!)).toBe(1);
		expect(occurrences("version_id =", setClause!)).toBe(1);
		expect(occurrences("plugin_key =", setClause!)).toBe(1);
	});

	test("does not rewrite non-vtable inserts", () => {
		const sql =
			'INSERT INTO "some_other_table" (entity_id) VALUES (1) ON CONFLICT (entity_id) DO UPDATE SET entity_id = excluded.entity_id';

		const original = parse(sql);
		const rewritten = rewriteVtableInsertOnConflict({
			...baseContext,
			statements: original,
		});

		expect(rewritten).toEqual(original);
	});
});
