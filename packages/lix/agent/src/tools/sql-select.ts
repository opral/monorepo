import { tool } from "ai";
import * as z from "zod/mini";
import type { Lix } from "@lix-js/sdk";

export type SqlSelectInput = {
	schema_key: string;
	file_id?: string;
	entity_id?: string;
	limit?: number;
	offset?: number;
	orderBy?: {
		column: "created_at" | "updated_at" | "change_id";
		direction: "asc" | "desc";
	};
};

export type SqlSelectResult = {
	rows: Array<{
		entity_id: string;
		schema_key: string;
		file_id: string;
		plugin_key: string;
		schema_version: string;
		created_at: string;
		updated_at: string;
		change_id: string;
		untracked: boolean;
		commit_id: string;
		snapshot_content: Record<string, any>;
	}>;
	rowCount: number;
	truncated: boolean;
};

/**
 * Read-only select tool over the Lix `state` view.
 *
 * The LLM decides which `schema_key` to query; optional filters include `file_id` and `entity_id`.
 * Returns a capped set of rows with safe default columns.
 */
export function createSqlSelectTool(lix: Lix) {
	const inputSchema = z.object({
		schema_key: z.string(),
		file_id: z.string().optional(),
		entity_id: z.string().optional(),
		limit: z.number().check(z.gte(1), z.lte(1000)).optional(),
		offset: z.number().check(z.gte(0)).optional(),
		orderBy: z
			.object({
				column: z.union([
					z.literal("created_at"),
					z.literal("updated_at"),
					z.literal("change_id"),
				]),
				direction: z.union([z.literal("asc"), z.literal("desc")]),
			})
			.optional(),
	});

	return tool({
		description:
			"Select rows from the Lix state view (active version). Read-only.",
		inputSchema,
		execute: async (args): Promise<SqlSelectResult> => {
			const {
				schema_key,
				file_id,
				entity_id,
				limit = 50,
				offset = 0,
				orderBy,
			} = (args ?? {}) as z.infer<typeof inputSchema>;

			let qb = lix.db
				.selectFrom("state")
				.selectAll()
				.where("schema_key", "=", schema_key);

			if (file_id) qb = qb.where("file_id", "=", file_id);
			if (entity_id) qb = qb.where("entity_id", "=", entity_id);

			if (orderBy) qb = qb.orderBy(orderBy.column, orderBy.direction);

			// fetch limit + 1 to detect truncation
			const fetchLimit = Math.min(1001, Math.max(1, (limit ?? 50) + 1));
			qb = qb.limit(fetchLimit).offset(offset);

			const rowsAll = await qb.execute();
			const truncated = rowsAll.length > (limit ?? 50);
			const rows = truncated ? rowsAll.slice(0, limit ?? 50) : rowsAll;

			return {
				rows,
				rowCount: rows.length,
				truncated,
			};
		},
	});
}
