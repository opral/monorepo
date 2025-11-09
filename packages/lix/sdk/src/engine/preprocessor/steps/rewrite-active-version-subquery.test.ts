import { expect, test } from "vitest";
import { parse as parseStatements } from "../sql-parser/parse.js";
import { compile } from "../sql-parser/compile.js";
import { rewriteActiveVersionSubquery } from "./rewrite-active-version-subquery.js";

const baseContext = {
	parameters: [] as ReadonlyArray<unknown>,
	getActiveVersionId: () => "feature_branch",
} as const;

const run = (sql: string, overrides: Partial<typeof baseContext> = {}) => {
	const statements = parseStatements(sql);
	return rewriteActiveVersionSubquery({
		statements,
		...baseContext,
		...overrides,
	});
};

const compileSql = (sql: string): string => compile(parseStatements(sql)).sql;

const compileStatements = (statements: ReturnType<typeof parseStatements>) =>
	compile(statements).sql;

test("replaces IN subquery filters with an equality literal", () => {
	const rewritten = run(`
		SELECT *
		FROM state_by_version
		WHERE version_id IN (SELECT version_id FROM active_version)
	`);
	const sql = compileStatements(rewritten);
	expect(sql).toContain("version_id = 'feature_branch'");
	expect(sql).not.toMatch(/FROM\s+active_version/i);
});

test("handles expanded active_version view aliases", () => {
	const rewritten = run(`
		SELECT *
		FROM state_by_version
		WHERE version_id IN (
			SELECT version_id FROM (
				SELECT 'placeholder' AS version_id
			) AS active_version
		)
	`);
	const sql = compileStatements(rewritten);
	expect(sql).toContain("version_id = 'feature_branch'");
	// ensure the fake subquery was removed
	expect(sql).not.toMatch(/AS\s+active_version/i);
});

test("replaces equality comparisons that reference active_version", () => {
	const rewritten = run(`
		SELECT 1
		FROM state_by_version
		WHERE version_id = (SELECT version_id FROM active_version)
	`);
	const sql = compileStatements(rewritten);
	expect(sql).toMatch(/version_id\s*=\s*'feature_branch'/i);
	// Ensure the subquery has been removed entirely.
	expect(sql).not.toMatch(/SELECT\s+version_id\s+FROM\s+active_version/i);
});

test("leaves unrelated subqueries untouched", () => {
	const original = `
		SELECT *
		FROM state_by_version
		WHERE version_id IN (SELECT version_id FROM other_view)
	`;
	const rewritten = run(original);
	const sql = compileStatements(rewritten);
	expect(sql).toEqual(compileSql(original));
});
