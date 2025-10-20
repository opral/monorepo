import { describe, expect, test } from "vitest";
import { ensureNumberedPlaceholders } from "./ensure-numbered-placeholders.js";

describe("ensureNumberedPlaceholders", () => {
	test("numbers anonymous placeholders while leaving strings/comments untouched", () => {
		const sql = `
			SELECT '?' as literal -- ? comment
			/* block ? comment */
			WHERE version_id = ?
		`;
		const numbered = ensureNumberedPlaceholders(sql);
		expect(numbered).toBe(`
			SELECT '?' as literal -- ? comment
			/* block ? comment */
			WHERE version_id = ?1
		`);
	});

	test("preserves existing numbered placeholders", () => {
		const sql = `UPDATE foo SET name = ?2 WHERE id = ?1`;
		const numbered = ensureNumberedPlaceholders(sql);
		expect(numbered).toBe(`UPDATE foo SET name = ?2 WHERE id = ?1`);
	});

	test("numbers placeholders inside complex expressions", () => {
		const sql = `
			SELECT *
			FROM items
			WHERE (owner_id = ? AND status IN (SELECT status FROM audit WHERE actor_id = ?))
			  OR json_extract(metadata, '$.actor') = ?
		`;
		const numbered = ensureNumberedPlaceholders(sql);
		expect(numbered).toBe(`
			SELECT *
			FROM items
			WHERE (owner_id = ?1 AND status IN (SELECT status FROM audit WHERE actor_id = ?2))
			  OR json_extract(metadata, '$.actor') = ?3
		`);
	});

	test("ignores placeholders inside bracketed identifiers", () => {
		const sql = `SELECT [col?] FROM foo WHERE value = ?`;
		const numbered = ensureNumberedPlaceholders(sql);
		expect(numbered).toBe(`SELECT [col?] FROM foo WHERE value = ?1`);
	});

	test("does not renumber placeholders inside string literals", () => {
		const sql = `
			INSERT INTO messages (body)
			VALUES ('question mark -> ?')
		`;
		const numbered = ensureNumberedPlaceholders(sql);
		expect(numbered).toBe(`
			INSERT INTO messages (body)
			VALUES ('question mark -> ?')
		`);
	});
});
