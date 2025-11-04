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

	test("SELECT with CASE expression", () => {
		expectRoundTrip(
			"SELECT CASE WHEN status = 'active' THEN 1 ELSE 0 END AS status_flag FROM foo"
		);
	});

	test("SELECT DISTINCT with GROUP BY", () => {
		expectRoundTrip("SELECT DISTINCT foo FROM bar GROUP BY foo");
	});

	test("SELECT with limit and offset", () => {
		expectRoundTrip(
			"SELECT id FROM projects ORDER BY created_at DESC LIMIT 5 OFFSET 10"
		);
	});

	test("SELECT with json arrow operators", () => {
		expectRoundTrip(
			"SELECT value ->> '$.enabled' FROM key_value WHERE value -> '$.settings' IS NOT NULL"
		);
	});

	test("SELECT with NOT EXISTS predicate", () => {
		expectRoundTrip(
			"SELECT id FROM conversation_message_all AS m1 WHERE NOT EXISTS (SELECT 1 FROM conversation_message_all AS m2 WHERE m2.parent_id = m1.id)"
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

	test("INSERT with ON CONFLICT DO NOTHING", () => {
		expectRoundTrip(
			"INSERT INTO projects (id) VALUES ('a') ON CONFLICT DO NOTHING"
		);
	});

	test("INSERT with ON CONFLICT DO UPDATE", () => {
		expectRoundTrip(
			"INSERT INTO projects (id, name) VALUES ('a', 'A') ON CONFLICT(id) DO UPDATE SET name = excluded.name"
		);
	});

	test("SELECT window function with partition", () => {
		expectRoundTrip(
			"SELECT ROW_NUMBER() OVER (PARTITION BY entity_id ORDER BY created_at) FROM change"
		);
	});

	test("SELECT window function with frame", () => {
		expectRoundTrip(
			"SELECT SUM(amount) OVER (PARTITION BY account ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) FROM ledger"
		);
	});

	test("compiles compound select", () => {
		expectRoundTrip(
			`SELECT id FROM foo UNION ALL SELECT id FROM bar WHERE bar.active = 1`
		);
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
		expect(compiled).toContain("\n  UNION ALL\n");
		expect(compiled).toContain("\n)\nSELECT *");
		expect(parameters).toEqual([]);

		const reparsed = parse(compiled);
		expect(reparsed).toEqual(parsed);
	});
});
