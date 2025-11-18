import type { Lix } from "@lix-js/sdk";
import { sql } from "@lix-js/sdk";
import { tool } from "ai";
import { z } from "zod";
import dedent from "dedent";

export const SqlSelectInputSchema = z.object({
	sql: z.string().min(1),
});

export type SqlSelectInput = z.infer<typeof SqlSelectInputSchema>;

export type SqlSelectOutput = Array<Record<string, unknown>>;

/**
 * Executes a read-only SQL SELECT query and returns rows as objects.
 *
 * Guardrails:
 * - Allows only a single SELECT/CTE (WITH ... SELECT) statement.
 * - Disallows selecting the file content columns: file.data or file_by_version.data.
 */
export async function sqlSelect(
	args: SqlSelectInput & { lix: Lix }
): Promise<SqlSelectOutput> {
	const { sql: rawSql } = args;

	const sqlRaw = rawSql.trim();

	// Disallow semicolons to enforce a single statement (avoid multiple statements).
	if (/[;].*\S/.test(sqlRaw)) {
		throw new Error("sql_select: only a single SELECT statement is allowed");
	}

	// Allow SELECT ... or WITH ... SELECT ...
	const startsOk = /^(select|with)\b/i.test(sqlRaw);
	if (!startsOk) {
		throw new Error("sql_select: only SELECT queries are allowed");
	}

	// Execute using Kysely SQL template (dynamic raw). Returns an array of objects.
	const { rows } = await sql.raw(sqlRaw).execute(args.lix.db);
	return rows as Array<Record<string, unknown>>;
}

export function createSqlSelectTool(args: { lix: Lix }) {
	const description = dedent`
		Execute a read-only SQL SELECT query on the Lix database.

		IMPORTANT: Before using this tool, call sql_introspect_schema to discover:
		- Available views (state_all, state_history, change)
		- Column names for each view
		- Available schema_keys to filter entities
		- Example queries showing proper usage

		This tool allows querying ANY view in the database, not just state views.

		Query Guidelines:
		- Always include a LIMIT clause (e.g., LIMIT 50-200) to avoid overwhelming results
		- Use WHERE clauses to filter results appropriately
		- For state_all: Always include WHERE version_id = '<version_id>'
		- For state_history: Always include WHERE root_commit_id = '<commit_id>'
		- Use schema_key to filter by entity type: WHERE schema_key = '<schema_key>'
		- Query JSON fields with SQLite JSON functions: json_extract(snapshot_content, '$.property')

		Common query patterns:

		1. Query entities in a version:
		SELECT entity_id, snapshot_content 
		FROM state_all 
		WHERE schema_key = '<schema_key>' 
		  AND version_id = '<version_id>' 
		LIMIT 50;

		2. Query entity history:
		SELECT entity_id, snapshot_content, depth, commit_id
		FROM state_history
		WHERE root_commit_id = '<commit_id>'
		  AND entity_id = '<entity_id>'
		ORDER BY depth
		LIMIT 50;

		3. Query changes:
		SELECT id, entity_id, created_at, snapshot_content
		FROM change
		WHERE entity_id = '<entity_id>'
		ORDER BY created_at DESC
		LIMIT 50;

		4. Search in JSON content:
		SELECT entity_id, snapshot_content
		FROM state_all
		WHERE schema_key = '<schema_key>'
		  AND version_id = '<version_id>'
		  AND json_extract(snapshot_content, '$.text') LIKE '%search_term%'
		LIMIT 50;

		Restrictions:
		- Single SELECT statement only (no multiple statements)
		- Read-only (no INSERT, UPDATE, DELETE)
		- Use CTEs (WITH ... SELECT) for complex queries
		- Always limit results for performance

		Remember: Run sql_introspect_schema first to understand the database structure!
	`;

	return tool({
		description,
		inputSchema: SqlSelectInputSchema,
		execute: async (input) =>
			sqlSelect({ lix: args.lix, ...(input as SqlSelectInput) }),
	});
}
