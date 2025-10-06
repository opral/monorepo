import { describe, expect, test } from "vitest";
import { tokenize } from "../../../sql-parser/tokenizer.js";
import { findTableFactor } from "./table-factor.js";

describe("findInternalStateVtable", () => {
	test("finds plain table factor with alias", () => {
		const sql = "SELECT * FROM internal_state_vtable s";
		const tokens = tokenize(sql);
		const match = findTableFactor(tokens, "internal_state_vtable");
		expect(match).toBeTruthy();
		expect(match?.alias).toBe("s");
		expect(match?.explicitAlias).toBe(true);
		const segment = sql.slice(match!.start, match!.end + 1);
		expect(segment).toBe("internal_state_vtable s");
	});

	test("handles quoted table and alias", () => {
		const sql = 'SELECT * FROM "internal_state_vtable" AS "State"';
		const tokens = tokenize(sql);
		const match = findTableFactor(tokens, "internal_state_vtable");
		expect(match).toBeTruthy();
		expect(match?.alias).toBe("State");
		expect(match?.explicitAlias).toBe(true);
		const segment = sql.slice(match!.start, match!.end + 1);
		expect(segment).toBe('"internal_state_vtable" AS "State"');
	});

	test("falls back to table name when alias is missing", () => {
		const sql = "SELECT * FROM internal_state_vtable";
		const tokens = tokenize(sql);
		const match = findTableFactor(tokens, "internal_state_vtable");
		expect(match).toBeTruthy();
		expect(match?.alias).toBe("internal_state_vtable");
		expect(match?.explicitAlias).toBe(false);
		const segment = sql.slice(match!.start, match!.end + 1);
		expect(segment).toBe("internal_state_vtable");
	});

	test("detects join usage", () => {
		const sql =
			"SELECT * FROM mock_other_table m JOIN internal_state_vtable v ON v.id = m.id";
		const tokens = tokenize(sql);
		const match = findTableFactor(tokens, "internal_state_vtable");
		expect(match).toBeTruthy();
		expect(match?.alias).toBe("v");
		const segment = sql.slice(match!.start, match!.end + 1);
		expect(segment).toBe("internal_state_vtable v");
	});

	test.each([
		"inner",
		"left",
		"right",
		"full",
		"cross",
		"outer",
		"natural",
		"join",
	])("falls back when alias token is reserved keyword '%s'", (keyword) => {
		const sql = `SELECT * FROM internal_state_vtable ${keyword} JOIN other_table o ON o.id = 1`;
		const tokens = tokenize(sql);
		const match = findTableFactor(tokens, "internal_state_vtable");
		expect(match).toBeTruthy();
		expect(match?.alias).toBe("internal_state_vtable");
		expect(match?.explicitAlias).toBe(false);
	});

	test("ignores column references", () => {
		const sql = "SELECT internal_state_vtable.schema_key FROM mock_other_table";
		const tokens = tokenize(sql);
		const match = findTableFactor(tokens, "internal_state_vtable");
		expect(match).toBeNull();
	});

	test("returns null when table is absent", () => {
		const sql = "SELECT * FROM mock_other_table";
		const tokens = tokenize(sql);
		const match = findTableFactor(tokens, "internal_state_vtable");
		expect(match).toBeNull();
	});

	test("general finder accepts arbitrary casing", () => {
		const sql = "SELECT * FROM internal_state_vtable AS t";
		const tokens = tokenize(sql);
		const match = findTableFactor(tokens, "INTERNAL_STATE_VTABLE");
		expect(match).not.toBeNull();
		expect(match?.alias).toBe("t");
	});
});
