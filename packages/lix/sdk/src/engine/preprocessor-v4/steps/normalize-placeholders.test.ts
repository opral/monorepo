import { describe, expect, test } from "vitest";
import { normalizePlaceholders } from "./normalize-placeholders.js";

describe("normalizePlaceholdersStep", () => {
	test("replaces unnamed placeholders with numbered placeholders", () => {
		const result = normalizePlaceholders({
			statements: [
				{
					sql: `SELECT * FROM foo WHERE id = ? AND name = ?`,
					parameters: [],
				},
			],
		});

		expect(result).toEqual({
			statements: [
				{
					sql: `SELECT * FROM foo WHERE id = ?1 AND name = ?2`,
					parameters: [],
				},
			],
		});
	});

	test("preserves existing numbered placeholders while numbering new ones", () => {
		const result = normalizePlaceholders({
			statements: [
				{
					sql: `UPDATE foo SET name = upper(?1) WHERE id = ?`,
					parameters: [],
				},
			],
		});

		expect(result).toEqual({
			statements: [
				{
					sql: `UPDATE foo SET name = upper(?1) WHERE id = ?2`,
					parameters: [],
				},
			],
		});
	});

	test("ignores placeholders that appear inside strings, comments, or bracketed identifiers", () => {
		const result = normalizePlaceholders({
			statements: [
				{
					sql: `
				SELECT '-- ?' AS literal_comment,
				       'value ?' AS literal_string,
				       /* ignore ? */ [col?]
				FROM foo
				WHERE id = ? AND name = ?
			`,
					parameters: [],
				},
			],
		});

		expect(result).toEqual({
			statements: [
				{
					sql: `
				SELECT '-- ?' AS literal_comment,
				       'value ?' AS literal_string,
				       /* ignore ? */ [col?]
				FROM foo
				WHERE id = ?1 AND name = ?2
			`,
					parameters: [],
				},
			],
		});
	});

	test("increments numbering across nested statements", () => {
		const result = normalizePlaceholders({
			statements: [
				{
					sql: `
				SELECT *
				FROM foo
				WHERE id IN (
					SELECT bar_id FROM bar WHERE owner = ?
					UNION
					SELECT baz_id FROM baz WHERE owner = ?
				)
			`,
					parameters: [],
				},
			],
		});

		expect(result).toEqual({
			statements: [
				{
					sql: `
				SELECT *
				FROM foo
				WHERE id IN (
					SELECT bar_id FROM bar WHERE owner = ?1
					UNION
					SELECT baz_id FROM baz WHERE owner = ?2
				)
			`,
					parameters: [],
				},
			],
		});
	});

	test("leaves already numbered SQL unchanged", () => {
		const sql = `SELECT * FROM foo WHERE id = ?1 AND name = ?2`;
		const result = normalizePlaceholders({
			statements: [
				{
					sql,
					parameters: [],
				},
			],
		});

		expect(result).toEqual({
			statements: [
				{
					sql,
					parameters: [],
				},
			],
		});
	});

	test("ignores placeholders inside quoted identifiers", () => {
		const result = normalizePlaceholders({
			statements: [
				{
					sql: `SELECT "col?" FROM foo WHERE id = ?`,
					parameters: [],
				},
			],
		});

		expect(result).toEqual({
			statements: [
				{
					sql: `SELECT "col?" FROM foo WHERE id = ?1`,
					parameters: [],
				},
			],
		});
	});

	test("ignores placeholders inside escaped single-quoted strings", () => {
		const result = normalizePlaceholders({
			statements: [
				{
					sql: `SELECT 'it''s ?' AS label FROM foo WHERE note = ?`,
					parameters: [],
				},
			],
		});

		expect(result).toEqual({
			statements: [
				{
					sql: `SELECT 'it''s ?' AS label FROM foo WHERE note = ?1`,
					parameters: [],
				},
			],
		});
	});

	test("skips placeholders inside multi-line block comments", () => {
		const result = normalizePlaceholders({
			statements: [
				{
					sql: `
				SELECT *
				FROM foo /* filter ? should be ignored
				            while block comment continues */
				WHERE id = ?
			`,
					parameters: [],
				},
			],
		});

		expect(result).toEqual({
			statements: [
				{
					sql: `
				SELECT *
				FROM foo /* filter ? should be ignored
				            while block comment continues */
				WHERE id = ?1
			`,
					parameters: [],
				},
			],
		});
	});

	test("continues numbering after existing placeholders with gaps", () => {
		const result = normalizePlaceholders({
			statements: [
				{
					sql: `SELECT * FROM foo WHERE owner = ?2 AND id = ?`,
					parameters: [],
				},
			],
		});

		expect(result).toEqual({
			statements: [
				{
					sql: `SELECT * FROM foo WHERE owner = ?2 AND id = ?3`,
					parameters: [],
				},
			],
		});
	});

	test("numbers placeholders across multiple statements", () => {
		const result = normalizePlaceholders({
			statements: [
				{
					sql: `
				INSERT INTO foo(id, name) VALUES(?, ?);
			`,
					parameters: [],
				},
				{
					sql: `
				UPDATE foo SET name = ? WHERE id = ?;
			`,
					parameters: [],
				},
			],
		});

		expect(result).toEqual({
			statements: [
				{
					sql: `
				INSERT INTO foo(id, name) VALUES(?1, ?2);
			`,
					parameters: [],
				},
				{
					sql: `
				UPDATE foo SET name = ?3 WHERE id = ?4;
			`,
					parameters: [],
				},
			],
		});
	});

	test("ignores numbered placeholders that appear inside literals when computing next index", () => {
		const result = normalizePlaceholders({
			statements: [
				{
					sql: `
				SELECT '-- ?10' AS literal_comment,
				       col
				FROM foo
				WHERE col = ?;
			`,
					parameters: [],
				},
			],
		});

		expect(result).toEqual({
			statements: [
				{
					sql: `
				SELECT '-- ?10' AS literal_comment,
				       col
				FROM foo
				WHERE col = ?1;
			`,
					parameters: [],
				},
			],
		});
	});
});
