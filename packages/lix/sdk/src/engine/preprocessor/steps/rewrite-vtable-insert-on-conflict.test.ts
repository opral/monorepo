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

		console.log(compile(rewritten).sql);

		expect(rewritten).toHaveLength(2);

		const compiled = compile(rewritten).sql.replace(/\s+/g, " ").trim();

		expect(compiled).toMatch(/^UPDATE/i);
		expect(compiled).toMatch(/; INSERT INTO "lix_internal_state_vtable"/i);
		expect(compiled).not.toContain("ON CONFLICT");
		expect(compiled).toContain("changes() = 0");
		expect(compiled).toMatch(/entity_id = \?1/);
		expect(compiled).toMatch(/schema_key = \?2/);
		expect(compiled).toMatch(/file_id = \?3/);
		expect(compiled).toMatch(/version_id = \?4/);
		expect(compiled).toContain("entity_id = ?");
		expect(compiled).toContain("schema_key = ?");
		expect(compiled).toContain("file_id = ?");
		expect(compiled).toContain("version_id = ?");
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
