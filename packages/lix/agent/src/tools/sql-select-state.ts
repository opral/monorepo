import type { Lix } from "@lix-js/sdk";
import { sql } from "@lix-js/sdk";
import { tool } from "ai";
import { z } from "zod";
import dedent from "dedent";

export const SqlSelectStateInputSchema = z.object({
	sql: z.string().min(1),
});

export type SqlSelectStateInput = z.infer<typeof SqlSelectStateInputSchema>;

export type SqlSelectStateOutput = Array<Record<string, unknown>>;

/**
 * Executes a read-only SQL query and returns rows as objects.
 *
 * Guardrails:
 * - Allows only a single SELECT/CTE (WITH ... SELECT) statement.
 * - Automatically limits results to `maxRows` by wrapping the query.
 * - Disallows selecting the file content columns: file.data or file_all.data.
 */
export async function sqlSelectState(
	args: SqlSelectStateInput & { lix: Lix }
): Promise<SqlSelectStateOutput> {
	const { lix, sql: rawSql } = args;

	const sqlRaw = rawSql.trim();

	// Disallow semicolons to enforce a single statement (avoid multiple statements).
	if (/[;].*\S/.test(sqlRaw)) {
		throw new Error("query_sql: only a single SELECT statement is allowed");
	}

	// Allow SELECT ... or WITH ... SELECT ...
	const startsOk = /^(select|with)\b/i.test(sqlRaw);
	if (!startsOk) {
		throw new Error("query_sql: only SELECT queries are allowed");
	}

	// Execute using Kysely SQL template (dynamic raw). Returns an array of objects.
	const { rows } = await sql.raw(sqlRaw).execute(args.lix.db);
	return rows as Array<Record<string, unknown>>;
}

export function createSqlSelectStateTool(args: { lix: Lix }) {
	const description = dedent`
			Execute a read-only SQL SELECT over Lix state.

			State views:
			- state (active version): entity_id, schema_key, file_id, plugin_key, snapshot_content (JSON), schema_version, created_at, updated_at, inherited_from_version_id, change_id, untracked, commit_id.

			Dynamic schemas: Lix stores entity shapes dynamically by schema_key in snapshot_content.

			You can filter by schema_key, file_id, etc., and query fields inside snapshot_content using SQLite JSON functions. Example:

			SELECT entity_id
			  FROM state
			  WHERE schema_key = 'markdown_paragraph'
			    AND json_extract(snapshot_content,'$.text') LIKE '%hello%'
			  ORDER BY updated_at DESC
			  LIMIT 10;

			Good (LIMIT and selective columns):

			SELECT entity_id, file_id, updated_at
			  FROM state
			  WHERE schema_key = '<schema_key>'
			    AND json_extract(snapshot_content,'$.text') LIKE '%<text>%'
			  ORDER BY updated_at DESC
			  LIMIT 50;

			Bad (no LIMIT, SELECT *):

			SELECT *
			  FROM state
			  WHERE json_extract(snapshot_content,'$.text') LIKE '%<text>%';

			Single-statement only: a single SELECT (or WITH ... SELECT).
			Always include a low LIMIT (e.g., 50–200). For more results, issue follow-up range queries.

			Follow-up paging examples:

			-- next page via OFFSET
			SELECT entity_id
			  FROM state
			  WHERE schema_key = '<schema_key>'
			  ORDER BY updated_at DESC
			  LIMIT 50 OFFSET 50;

			-- or range window on updated_at (preferred for stability)
			SELECT entity_id, updated_at
			  FROM state
			  WHERE schema_key = '<schema_key>'
			    AND updated_at < '<last_seen_timestamp>'
			  ORDER BY updated_at DESC
			  LIMIT 50;
		`;

	return tool({
		description,
		inputSchema: SqlSelectStateInputSchema,
		execute: async (input) =>
			sqlSelectState({ lix: args.lix, ...(input as SqlSelectStateInput) }),
	});
}
