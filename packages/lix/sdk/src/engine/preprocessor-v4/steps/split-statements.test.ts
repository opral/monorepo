import { describe, expect, test } from "vitest";
import { splitStatements } from "./split-statements.js";

describe("splitStatements", () => {
	test("splits multi-statement SQL and slices parameters per statement", () => {
		const result = splitStatements({
			statements: [
				{
					sql: `
						INSERT INTO foo(id, name) VALUES (?, ?);
						UPDATE foo SET name = ? WHERE id = ?;
					`,
					parameters: [1, "alpha", "beta", 1],
				},
			],
		});

		expect(result).toEqual({
			statements: [
				{
					sql: "INSERT INTO foo(id, name) VALUES (?, ?)",
					parameters: [1, "alpha"],
				},
				{
					sql: "UPDATE foo SET name = ? WHERE id = ?",
					parameters: ["beta", 1],
				},
			],
		});
	});

	test("passes through statements that are already split", () => {
		const statements = [
			{ sql: "SELECT 1", parameters: [] },
			{ sql: "SELECT 2", parameters: [2] },
		];

		const result = splitStatements({ statements });

		expect(result).toEqual({ statements });
	});

	test("ignores semicolons that appear inside literals or comments", () => {
		const result = splitStatements({
			statements: [
				{
					sql: `
						INSERT INTO foo(message) VALUES ('value;still literal');
						-- this; semicolon is in a comment
						UPDATE foo SET note = ? WHERE id = 1;
					`,
					parameters: ["note"],
				},
			],
		});

		expect(result.statements).toHaveLength(2);
		expect(result.statements[0]).toEqual({
			sql: "INSERT INTO foo(message) VALUES ('value;still literal')",
			parameters: [],
		});

		expect(result.statements[1]?.sql).toContain(
			"-- this; semicolon is in a comment"
		);
		expect(result.statements[1]?.sql).toContain(
			"UPDATE foo SET note = ? WHERE id = 1"
		);
		expect(result.statements[1]?.parameters).toEqual(["note"]);
	});

	test("retains parameter ordering when preceding statements do not use placeholders", () => {
		const result = splitStatements({
			statements: [
				{
					sql: `
						UPDATE foo SET updated_at = CURRENT_TIMESTAMP;
						DELETE FROM foo WHERE id = ?;
					`,
					parameters: [42],
				},
			],
		});

		expect(result).toEqual({
			statements: [
				{
					sql: "UPDATE foo SET updated_at = CURRENT_TIMESTAMP",
					parameters: [],
				},
				{
					sql: "DELETE FROM foo WHERE id = ?",
					parameters: [42],
				},
			],
		});
	});
});
