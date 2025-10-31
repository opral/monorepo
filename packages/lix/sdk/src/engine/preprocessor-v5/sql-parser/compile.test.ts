import { describe, expect, test } from "vitest";
import { compile } from "./compile.js";
import { parse } from "./parse.js";

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

	test("SELECT with limit and offset", () => {
		expectRoundTrip(
			"SELECT id FROM projects ORDER BY created_at DESC LIMIT 5 OFFSET 10"
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

	test("compiles segmented statement sequences", () => {
		const sql = `
WITH RECURSIVE
  "foo" AS (
    SELECT
      "id",
      "name",
      0 AS "depth"
    FROM "items"
    WHERE "id" = 'root'

    UNION ALL

    SELECT
      "child"."id",
      "child"."name",
      "foo"."depth" + 1 AS "depth"
    FROM "items" AS "child"
    JOIN "foo" ON "child"."parent_id" = "foo"."id"
  )
SELECT *
FROM "foo";
			`.trim();

		const parsed = parse(sql);
		expect(parsed).toHaveLength(1);

		const { sql: compiled, parameters } = compile(parsed);

		expect(compiled).toContain("WITH RECURSIVE");
		expect(compiled).toContain("\nUNION ALL\n");
		expect(compiled).toContain("\n)\nSELECT *");
		expect(parameters).toEqual([]);

		const reparsed = parse(compiled);
		expect(reparsed).toEqual(parsed);
	});
});
