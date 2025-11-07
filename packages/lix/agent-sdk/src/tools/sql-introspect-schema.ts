import type { Lix } from "@lix-js/sdk";
import { tool } from "ai";
import { z } from "zod";
import dedent from "dedent";

export const SqlIntrospectSchemaInputSchema = z.object({});

export type SqlIntrospectSchemaInput = z.infer<
	typeof SqlIntrospectSchemaInputSchema
>;

export const SqlIntrospectSchemaOutputSchema = z.object({
	views: z.array(
		z.object({
			name: z.string(),
			type: z.enum(["view"]),
			description: z.string(),
			columns: z.array(z.string()),
			example_query: z.string(),
		})
	),
	schema_keys: z.array(z.string()),
});

export type SqlIntrospectSchemaOutput = z.infer<
	typeof SqlIntrospectSchemaOutputSchema
>;

/**
 * Returns the available tables and views that can be queried in the Lix database,
 * along with the stored schema keys that can be used to filter state queries.
 */
export async function sqlIntrospectSchema(args: {
	lix: Lix;
}): Promise<SqlIntrospectSchemaOutput> {
	// Query stored schemas to get available schema_keys
	const storedSchemas = await args.lix.db
		.selectFrom("stored_schema")
		.select(["value"])
		.execute();

	// Extract x-lix-key from each schema
	const schemaKeys = storedSchemas
		.map((row) => {
			const value = row.value as any;
			return value?.["x-lix-key"] as string;
		})
		.filter((key): key is string => typeof key === "string" && key.length > 0);

	return {
		views: [
			{
				name: "state_all",
				type: "view",
				description:
					"Entity state across all versions. Query entities with version control.",
				columns: [
					"entity_id",
					"schema_key",
					"file_id",
					"plugin_key",
					"snapshot_content",
					"schema_version",
					"version_id",
					"created_at",
					"updated_at",
					"inherited_from_version_id",
					"change_id",
					"untracked",
					"commit_id",
					"writer_key",
					"metadata",
				],
				example_query:
					"SELECT entity_id, snapshot_content FROM state_all WHERE schema_key = 'markdown_paragraph' AND version_id = '<version_id>' LIMIT 10",
			},
			{
				name: "state_history",
				type: "view",
				description:
					"Historical entity states with depth information for blame functionality. Shows how entities evolved over commits.",
				columns: [
					"entity_id",
					"schema_key",
					"file_id",
					"plugin_key",
					"snapshot_content",
					"metadata",
					"schema_version",
					"change_id",
					"commit_id",
					"root_commit_id",
					"depth",
					"version_id",
				],
				example_query:
					"SELECT entity_id, snapshot_content, depth, commit_id FROM state_history WHERE root_commit_id = '<commit_id>' AND entity_id = '<entity_id>' ORDER BY depth",
			},
			{
				name: "change",
				type: "view",
				description:
					"Change history and metadata. Tracks all modifications to entities.",
				columns: [
					"id",
					"entity_id",
					"schema_key",
					"schema_version",
					"file_id",
					"plugin_key",
					"metadata",
					"created_at",
					"snapshot_content",
				],
				example_query:
					"SELECT id, entity_id, created_at, snapshot_content FROM change WHERE entity_id = '<entity_id>' ORDER BY created_at DESC LIMIT 10",
			},
		],
		schema_keys: schemaKeys,
	};
}

export function createSqlIntrospectSchemaTool(args: { lix: Lix }) {
	const description = dedent`
		Returns detailed information about queryable views and available schema types in the Lix database.
		
		Each view includes:
		- name: View identifier
		- type: Always "view"
		- description: What the view contains
		- columns: Array of available column names
		- example_query: Sample query showing proper usage
		
		Main queryable views:
		- state_all: Entity state across all versions (requires version_id filter)
		- state_history: Historical entity states with depth for blame (requires root_commit_id)
		- change: Change history and metadata (tracks all modifications)
		
		Schema keys:
		The schema_keys array contains all available schema types that can be used to
		filter entities in the views. Use these values in WHERE clauses like:
		WHERE schema_key = '<schema_key>' to query specific entity types.
		
		Schema definitions:
		To understand the structure and properties of any schema_key, query the schema
		definition from state_all where schema_key = 'lix_stored_schema'. The snapshot_content
		will contain the full JSON schema definition including all properties, types, and
		metadata for that entity type.
		
		Example - Get schema definition:
		SELECT snapshot_content
		FROM state_all
		WHERE schema_key = 'lix_stored_schema'
		  AND json_extract(snapshot_content, '$.value."x-lix-key"') = 'markdown_paragraph'
		  AND version_id = 'global'
		LIMIT 1;
		
		Use this tool to discover what data is available before constructing SQL queries.
		The returned column lists and example queries will guide you in writing correct queries.
	`;

	return tool({
		description,
		inputSchema: SqlIntrospectSchemaInputSchema,
		execute: async () => sqlIntrospectSchema({ lix: args.lix }),
	});
}
