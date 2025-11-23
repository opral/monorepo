import type { Lix } from "@lix-js/sdk";
import { tool } from "ai";
import dedent from "dedent";
import { z } from "zod";

const BaseReadFileInputSchema = z.object({
	version_id: z.string().min(1),
	byteOffset: z.number().int().min(0).default(0).optional(),
	byteLength: z.number().int().min(1).optional(),
	lineOffset: z.number().int().min(0).optional(),
	lineLimit: z.number().int().min(0).optional(),
	maxBytes: z
		.number()
		.int()
		.min(1)
		.max(5_000_000)
		.default(200_000)
		.optional(),
	maxChars: z
		.number()
		.int()
		.min(100)
		.max(1_000_000)
		.default(15_000)
		.optional(),
});

export const ReadFileByPathInputSchema = BaseReadFileInputSchema.extend({
	path: z.string().min(1),
});

export const ReadFileByIdInputSchema = BaseReadFileInputSchema.extend({
	fileId: z.string().min(1),
});

export type ReadFileByPathInput = z.infer<typeof ReadFileByPathInputSchema>;
export type ReadFileByIdInput = z.infer<typeof ReadFileByIdInputSchema>;

// Legacy union type for internal use
export type ReadFileInput = ReadFileByPathInput | ReadFileByIdInput;

export const ReadFileOutputSchema = z.object({
	text: z.string(),
	path: z.string(),
	fileId: z.string().optional(),
	size: z.number().int().nonnegative(),
	byteOffset: z.number().int().nonnegative(),
	byteLength: z.number().int().nonnegative(),
	encoding: z.literal("utf-8"),
	truncated: z.boolean(),
});

export type ReadFileOutput = z.infer<typeof ReadFileOutputSchema>;

/**
 * Minimal, generic file reader for Lix files (stored as binary).
 * - Always decodes the selected byte window as UTF-8 (replacement-safe).
 * - Supports simple byte-windowing and optional line-based slicing after decode.
 * - Returns a flat result (no nested meta), always including the resolved file path.
 */
export async function readFile(
	args: (ReadFileInput & { lix: Lix }) | (ReadFileByPathInput & { lix: Lix }) | (ReadFileByIdInput & { lix: Lix })
): Promise<ReadFileOutput> {
	const {
		lix,
		version_id,
		byteOffset = 0,
		byteLength,
		lineOffset,
		lineLimit,
		maxBytes = 200_000,
		maxChars = 15_000,
	} = args;

	const path = "path" in args ? args.path : undefined;
	const fileId = "fileId" in args ? args.fileId : undefined;

	if (!path && !fileId)
		throw new Error("read_file: provide 'path' or 'fileId'.");
	if (path && fileId)
		throw new Error("read_file: provide only one of 'path' or 'fileId'.");

	const row = path
		? await lix.db
				.selectFrom("file_by_version")
				.where("path", "=", path)
				.where("lixcol_version_id", "=", version_id as any)
				.select(["id", "path", "data"])
				.executeTakeFirst()
		: await lix.db
				.selectFrom("file_by_version")
				.where("id", "=", fileId as string)
				.where("lixcol_version_id", "=", version_id as any)
				.select(["id", "path", "data"])
				.executeTakeFirst();

	if (!row) {
		const identifier = path ? `"${path}"` : `fileId "${fileId}"`;
		throw new Error(`File not found: ${identifier}. Try using the list_files tool to see available files.`);
	}

	const bytes = row.data as unknown as Uint8Array;
	const size = bytes?.byteLength ?? 0;

	const start = clamp(byteOffset, 0, size);
	const maxLen = clamp(maxBytes, 0, size - start);
	const reqLen =
		byteLength == null ? maxLen : clamp(byteLength, 0, size - start);
	const len = Math.min(reqLen, maxLen);

	const window = bytes.subarray(start, start + len);
	const decoder = new TextDecoder("utf-8", { fatal: false });
	let text = decoder.decode(window);

	// Optional line slicing after decode
	if (lineOffset != null || lineLimit != null) {
		const lines = text.split("\n");
		const lo = Math.max(0, lineOffset ?? 0);
		const ll = Math.max(0, lineLimit ?? lines.length - lo);
		text = lines.slice(lo, lo + ll).join("\n");
	}

	// Clamp characters
	let truncated = false;
	if (text.length > maxChars) {
		text = text.slice(0, maxChars);
		truncated = true;
	}

	// If our byte window didn't cover the rest of file or was capped by maxBytes, mark truncated
	if (start + len < size || (byteLength != null && len < byteLength)) {
		truncated = true;
	}

	const output = {
		text,
		path: row.path as string,
		fileId: row.id as string,
		size,
		byteOffset: start,
		byteLength: len,
		encoding: "utf-8",
		truncated,
	};
	return ReadFileOutputSchema.parse(output);
}

function clamp(n: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, n));
}

export function createReadFileByPathTool(args: { lix: Lix }) {
	const description = dedent`
	    Read a file from the lix (UTF-8) for a specific version using its path.

    Paths
    - Paths are absolute and must start with '/'.
      Good: "/z.md" • Bad: "z.md"

    Verification
    - If in doubt whether a file exists or the exact path is correct, first
      list files and confirm the absolute path (e.g., via the list_files tool).

    Windowing
    - Use byteOffset/byteLength for byte windows, or lineOffset/lineLimit after decode.
    - Prefer small windows for previews; the tool clamps very large outputs.

    Output
    - Returns the selected UTF-8 text window directly (string only).
    - Always pass the version_id field to read from the intended lix version.
  `;

	return tool({
		description,
		inputSchema: ReadFileByPathInputSchema,
		outputSchema: z.string(),
		execute: async (input) => {
			const result = await readFile({
				lix: args.lix,
				...(input as ReadFileByPathInput),
			});
			return result.text;
		},
	});
}

export function createReadFileByIdTool(args: { lix: Lix }) {
	const description = dedent`
	    Read a file from the lix (UTF-8) for a specific version using its file ID.

    File ID
    - Use this when you have the file ID to avoid path ambiguity.

    Windowing
    - Use byteOffset/byteLength for byte windows, or lineOffset/lineLimit after decode.
    - Prefer small windows for previews; the tool clamps very large outputs.

    Output
    - Returns the selected UTF-8 text window directly (string only).
    - Always pass the version_id field to read from the intended lix version.
  `;

	return tool({
		description,
		inputSchema: ReadFileByIdInputSchema,
		outputSchema: z.string(),
		execute: async (input) => {
			const result = await readFile({
				lix: args.lix,
				...(input as ReadFileByIdInput),
			});
			return result.text;
		},
	});
}
