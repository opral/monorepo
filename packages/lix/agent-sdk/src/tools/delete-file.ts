import type { Lix } from "@lix-js/sdk";
import { tool } from "ai";
import { z } from "zod";

export const DeleteFileInputSchema = z
	.object({
		versionId: z.string().min(1, "versionId is required"),
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
	const { lix, versionId, path, fileId } = args;

	const exec = async (trx: Lix["db"]) => {
		const version = await trx
			.selectFrom("version")
			.where("id", "=", versionId as any)
			.select(["id"])
			.executeTakeFirst();
		if (!version) {
			throw new Error(`delete_file: version ${versionId} not found`);
		}

		// Resolve the target row by path or id within the agent version
		const row = path
			? await trx
					.selectFrom("file_all")
					.where("path", "=", path)
					.where("lixcol_version_id", "=", versionId as any)
					.select(["id", "path"])
					.executeTakeFirst()
			: await trx
					.selectFrom("file_all")
					.where("id", "=", fileId as string)
					.where("lixcol_version_id", "=", versionId as any)
					.select(["id", "path"])
					.executeTakeFirst();

		if (!row) {
			return DeleteFileOutputSchema.parse({ path, fileId, deleted: false });
		}

		await trx
			.deleteFrom("file_all")
			.where("id", "=", row.id as string)
			.where("lixcol_version_id", "=", versionId as any)
			.execute();

		return DeleteFileOutputSchema.parse({
			path: row.path as string,
			fileId: row.id as string,
			deleted: true,
		});
	};

	if (lix.db.isTransaction) return exec(lix.db);
	return lix.db.transaction().execute(exec);
}

export function createDeleteFileTool(args: { lix: Lix }) {
	return tool({
		description:
			"Delete a file from the lix for a specific version. Provide an absolute path (starting with '/') or a fileId together with the versionId.",
		inputSchema: DeleteFileInputSchema,
		execute: async (input) =>
			deleteFile({ lix: args.lix, ...(input as DeleteFileInput) }),
	});
}
