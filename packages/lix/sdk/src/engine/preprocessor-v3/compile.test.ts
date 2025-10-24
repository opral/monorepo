import { describe, expect, test } from "vitest";
import { compile } from "./compile.js";
import { parse } from "./sql-parser/parse.js";

function expectRoundTrip(sql: string) {
	const original = parse(sql);
	const { sql: compiledSql, parameters } = compile(original);
	const reparsed = parse(compiledSql);
	expect(reparsed).toEqual(original);
	expect(Array.isArray(parameters)).toBe(true);
}

describe("compile", () => {
	test("SELECT with projection and predicate", () => {
		expectRoundTrip("SELECT id, name FROM person WHERE age > 30");
	});

	test("SELECT with join and order by", () => {
		expectRoundTrip(
			`
				SELECT p.id, t.name
				FROM projects AS p
				INNER JOIN teams AS t ON t.id = p.team_id
				WHERE p.archived = FALSE
				ORDER BY t.priority DESC, p.id
			`
		);
	});

	test("SELECT with IN and BETWEEN expressions", () => {
		expectRoundTrip(
			"SELECT * FROM audit WHERE event_type IN ('login', 'logout') AND created_at BETWEEN '2024-01-01' AND '2024-12-31'"
		);
	});

	test("UPDATE with assignments", () => {
		expectRoundTrip(
			"UPDATE projects SET name = 'new', revision = revision + 1 WHERE id = ?"
		);
	});

	test("DELETE statement", () => {
		expectRoundTrip("DELETE FROM projects WHERE projects.id = 'obsolete'");
	});
});
