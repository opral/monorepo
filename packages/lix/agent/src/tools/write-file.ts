import type { Lix } from "@lix-js/sdk";
import { tool } from "ai";
import { z } from "zod";

export const WriteFileInputSchema = z.object({
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
	const { lix, path, content, mode = "replace" } = args;
	const enc = new TextEncoder();

	const existing = await lix.db
		.selectFrom("file")
		.where("path", "=", path)
		.select(["id", "data"])
		.executeTakeFirst();

	let data = enc.encode(content);

	if (existing && mode === "append") {
		// Append by decoding existing as utf-8 and concatenating text
		const dec = new TextDecoder("utf-8", { fatal: false });
		const currentText = dec.decode(existing.data as unknown as Uint8Array);
		data = enc.encode(currentText + content);
	}

	if (existing) {
		await lix.db
			.updateTable("file")
			.set({ data })
			.where("id", "=", existing.id)
			.execute();

		const sel = await lix.db
			.selectFrom("file")
			.where("id", "=", existing.id)
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
		await lix.db.insertInto("file").values({ path, data }).execute();

		const sel = await lix.db
			.selectFrom("file")
			.where("path", "=", path)
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
}

export function createWriteFileTool(args: { lix: Lix }) {
	return tool({
		description:
			"Write a UTF-8 text file to the Lix workspace. Paths must be absolute ('/'). Supports replace or append modes.",
		inputSchema: WriteFileInputSchema,
		execute: async (input) =>
			writeFile({ lix: args.lix, ...(input as WriteFileInput) }),
	});
}
