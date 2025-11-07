import type { Lix } from "@lix-js/sdk";
import { tool } from "ai";
import { z } from "zod";

export const ListFilesInputSchema = z.object({
	version_id: z.string().min(1),
	// Simple filters over the file.path
	query: z.string().min(1).optional(), // substring match (LIKE %query%)
	prefix: z.string().min(1).optional(), // starts with (LIKE prefix%)
	ext: z.string().min(1).optional(), // file extension, e.g. ".md" or "md"

	include_hidden: z.boolean().default(true).optional(),

	// Pagination + sorting
	limit: z.number().int().min(1).max(500).default(50).optional(),
	offset: z.number().int().min(0).max(100_000).default(0).optional(),
	order_by: z
		.enum(["path", "updated", "created"]) // path | lixcol_updated_at | lixcol_created_at
		.default("path")
		.optional(),
	order: z.enum(["asc", "desc"]).default("asc").optional(),
});

export type ListFilesInput = z.infer<typeof ListFilesInputSchema>;

export const ListFilesOutputSchema = z.object({
	paths: z.array(z.string()),
});

export type ListFilesOutput = z.infer<typeof ListFilesOutputSchema>;

export async function listFiles(
	args: ListFilesInput & { lix: Lix }
): Promise<ListFilesOutput> {
	const {
		lix,
		version_id,
		query,
		prefix,
		ext,
		include_hidden = true,
		limit = 50,
		offset = 0,
		order_by = "path",
		order = "asc",
	} = args;

	// Build query
	let q = lix.db
		.selectFrom("file_by_version")
		.where("lixcol_version_id", "=", version_id as any);

	if (!include_hidden) {
		q = q.where("hidden", "=", false);
	}

	if (query && query.length > 0) {
		q = q.where("path", "like", `%${query}%`);
	}

	if (prefix && prefix.length > 0) {
		q = q.where("path", "like", `${prefix}%`);
	}

	if (ext && ext.length > 0) {
		const normalized = ext.startsWith(".") ? ext : `.${ext}`;
		q = q.where("path", "like", `%${normalized}`);
	}

	// Sorting
	if (order_by === "path") {
		q = q.orderBy("path", order);
	} else if (order_by === "updated") {
		q = q.orderBy("lixcol_updated_at", order);
	} else if (order_by === "created") {
		q = q.orderBy("lixcol_created_at", order);
	}

	const rows = await q
		.select(["path"]) // keep it minimal for token economy
		.offset(offset)
		.limit(limit)
		.execute();

	const paths = rows.map((r) => String((r as any).path));
	return ListFilesOutputSchema.parse({ paths });
}

export function createListFilesTool(args: { lix: Lix }) {
	return tool({
		description:
			"List file paths in the lix for a specific version using simple filters (query/prefix/ext), with pagination and sorting. Pass version_id to scope results.",
		inputSchema: ListFilesInputSchema,
		execute: async (input) =>
			listFiles({ lix: args.lix, ...(input as ListFilesInput) }),
	});
}
