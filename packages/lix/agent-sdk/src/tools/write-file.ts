import type { Lix } from "@lix-js/sdk";
import { tool } from "ai";
import { z } from "zod";

export const WriteFileInputSchema = z.object({
	version_id: z.string().min(1),
	path: z
		.string()
		.min(1)
		.refine((p) => p.startsWith("/"), {
			message: "Path must be absolute and start with '/'.",
		}),
	content: z.string(),
	mode: z.enum(["replace", "append"]).default("replace").optional(),
});

export type WriteFileInput = z.infer<typeof WriteFileInputSchema>;

export const WriteFileOutputSchema = z.object({
	path: z.string(),
	fileId: z.string(),
	size: z.number().int().nonnegative(),
	created: z.boolean(),
	updated: z.boolean(),
});

export type WriteFileOutput = z.infer<typeof WriteFileOutputSchema>;

export async function writeFile(
	args: WriteFileInput & { lix: Lix }
): Promise<WriteFileOutput> {
	const { lix, version_id, path, content, mode = "replace" } = args;
	const enc = new TextEncoder();

	const exec = async (trx: Lix["db"]) => {
		// Ensure the target version exists
		const version = await trx
			.selectFrom("version")
			.where("id", "=", version_id as any)
			.select(["id"])
			.executeTakeFirst();
		if (!version) {
			throw new Error(`write_file: version ${version_id} not found`);
		}

		// Look up existing file row in the agent version
		const existing = await trx
			.selectFrom("file_all")
			.where("path", "=", path)
			.where("lixcol_version_id", "=", version_id as any)
			.select(["id", "data"])
			.executeTakeFirst();

		let data = enc.encode(content);
		if (existing && mode === "append") {
			const dec = new TextDecoder("utf-8", { fatal: false });
			const currentText = dec.decode(existing.data as unknown as Uint8Array);
			data = enc.encode(currentText + content);
		}

		if (existing) {
			await trx
				.updateTable("file_all")
				.set({ data })
				.where("id", "=", existing.id)
				.where("lixcol_version_id", "=", version_id as any)
				.execute();

			const sel = await trx
				.selectFrom("file_all")
				.where("id", "=", existing.id)
				.where("lixcol_version_id", "=", version_id as any)
				.select(["id", "path", "data"])
				.executeTakeFirstOrThrow();
			const size = (sel.data as unknown as Uint8Array)?.byteLength ?? 0;
			return WriteFileOutputSchema.parse({
				path: sel.path as string,
				fileId: sel.id as string,
				size,
				created: false,
				updated: true,
			});
		} else {
			await trx
				.insertInto("file_all")
				.values({
					path,
					data,
					lixcol_version_id: version_id as unknown as any,
				})
				.execute();

			const sel = await trx
				.selectFrom("file_all")
				.where("path", "=", path)
				.where("lixcol_version_id", "=", version_id as any)
				.select(["id", "path", "data"])
				.executeTakeFirstOrThrow();
			const size = (sel.data as unknown as Uint8Array)?.byteLength ?? 0;
			return WriteFileOutputSchema.parse({
				path: sel.path as string,
				fileId: sel.id as string,
				size,
				created: true,
				updated: false,
			});
		}
	};

	if (lix.db.isTransaction) return exec(lix.db);
	return lix.db.transaction().execute(exec);
}

export function createWriteFileTool(args: { lix: Lix }) {
	return tool({
		description:
			"Write a UTF-8 text file to the lix for a specific version. Provide an absolute path ('/'), the version_id to modify, and optionally set mode to 'append'.",
		inputSchema: WriteFileInputSchema,
		execute: async (input) =>
			writeFile({ lix: args.lix, ...(input as WriteFileInput) }),
	});
}
