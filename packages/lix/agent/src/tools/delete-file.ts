import type { Lix } from "@lix-js/sdk";
import { tool } from "ai";
import { z } from "zod";

export const DeleteFileInputSchema = z
	.object({
		path: z
			.string()
			.min(1)
			.optional()
			.refine((p) => (p == null ? true : p.startsWith("/")), {
				message: "Path must be absolute and start with '/'.",
			}),
		fileId: z.string().min(1).optional(),
	})
	.refine((v) => v.path || v.fileId, {
		message: "Provide either 'path' or 'fileId'",
	})
	.refine((v) => !(v.path && v.fileId), {
		message: "Provide only one of 'path' or 'fileId'",
	});

export type DeleteFileInput = z.infer<typeof DeleteFileInputSchema>;

export const DeleteFileOutputSchema = z.object({
	path: z.string().optional(),
	fileId: z.string().optional(),
	deleted: z.boolean(),
});

export type DeleteFileOutput = z.infer<typeof DeleteFileOutputSchema>;

export async function deleteFile(
	args: DeleteFileInput & { lix: Lix }
): Promise<DeleteFileOutput> {
	const { lix, path, fileId } = args;

	// Resolve the target row by path or id
	const row = path
		? await lix.db
				.selectFrom("file")
				.where("path", "=", path)
				.select(["id", "path"])
				.executeTakeFirst()
		: await lix.db
				.selectFrom("file")
				.where("id", "=", fileId as string)
				.select(["id", "path"])
				.executeTakeFirst();

	if (!row) {
		return DeleteFileOutputSchema.parse({
			path,
			fileId,
			deleted: false,
		});
	}

	await lix.db
		.deleteFrom("file")
		.where("id", "=", row.id as string)
		.execute();

	return DeleteFileOutputSchema.parse({
		path: row.path as string,
		fileId: row.id as string,
		deleted: true,
	});
}

export function createDeleteFileTool(args: { lix: Lix }) {
	return tool({
		description:
			"Delete a file from the Lix workspace. Provide an absolute path (starting with '/') or a fileId.",
		inputSchema: DeleteFileInputSchema,
		execute: async (input) =>
			deleteFile({ lix: args.lix, ...(input as DeleteFileInput) }),
	});
}
