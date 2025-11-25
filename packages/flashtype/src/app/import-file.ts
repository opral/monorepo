import type { ViewContext } from "./types";
import {
	AGENT_VIEW_KIND,
	FILE_VIEW_KIND,
	fileViewInstance,
	buildFileViewProps,
} from "./view-instance-helpers";

type ImportFileOptions = {
	context: ViewContext;
	content: string;
	filename: string;
	source: "paste" | "file-open";
};

/**
 * Generates a unique file path by checking for existing files and adding a counter if needed.
 */
async function generateUniqueFilePath(
	context: ViewContext,
	baseFilename: string,
): Promise<string> {
	let filePath = `/${baseFilename}.md`;
	let counter = 1;

	while (true) {
		const existing = await context.lix.db
			.selectFrom("file")
			.where("path", "=", filePath)
			.select(["id"])
			.executeTakeFirst();

		if (!existing) break;
		filePath = `/${baseFilename}-${counter}.md`;
		counter++;
	}

	return filePath;
}

/**
 * Sanitizes a string to create a valid filename.
 */
export function sanitizeFilename(input: string): string {
	const sanitized = input
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 50);

	return sanitized || "new-file";
}

/**
 * Creates a unique invocation ID for the agent view.
 */
function createInvocationId(): string {
	if (
		typeof crypto !== "undefined" &&
		typeof crypto.randomUUID === "function"
	) {
		return crypto.randomUUID();
	}
	return `import-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Imports content as a new file and opens the editor with agent panel.
 */
export async function importFile({
	context,
	content,
	filename,
	source,
}: ImportFileOptions): Promise<void> {
	const sanitizedFilename = sanitizeFilename(filename);
	const filePath = await generateUniqueFilePath(context, sanitizedFilename);

	// Create file
	await context.lix.db
		.insertInto("file")
		.values({
			path: filePath,
			data: new TextEncoder().encode(content),
		})
		.execute();

	// Get auto-generated file ID
	const newFile = await context.lix.db
		.selectFrom("file")
		.select("id")
		.where("path", "=", filePath)
		.executeTakeFirst();

	const fileId = newFile?.id as string;
	if (!fileId) {
		throw new Error("Failed to get file id");
	}

	// Open file in central panel
	context.openView?.({
		panel: "central",
		kind: FILE_VIEW_KIND,
		instance: fileViewInstance(fileId),
		state: {
			...buildFileViewProps({ fileId, filePath }),
			focusOnLoad: true,
		},
		focus: true,
	});

	// Open agent in right panel with a fresh conversation
	const invocationId = createInvocationId();
	context.openView?.({
		panel: "right",
		kind: AGENT_VIEW_KIND,
		instance: `${AGENT_VIEW_KIND}:${invocationId}`,
		launchArgs: {
			source,
			invocationId,
			fileId,
			filePath,
		},
		focus: false,
	});

	// Resize right panel
	context.resizePanel?.("right", 30);
}

/**
 * Imports content from the clipboard as a new file.
 */
export async function importFromClipboard(
	context: ViewContext,
): Promise<void> {
	const content = await navigator.clipboard.readText();

	if (!content?.trim()) {
		console.warn("Clipboard is empty");
		return;
	}

	// Generate filename from first line
	const firstLine = content.split("\n")[0].trim();
	const title = firstLine.replace(/^#+\s*/, ""); // Remove markdown headers

	await importFile({
		context,
		content,
		filename: title,
		source: "paste",
	});
}

/**
 * Opens a file picker and imports the selected file.
 */
export async function importFromComputer(
	context: ViewContext,
): Promise<void> {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = ".md,.txt,.markdown";

	const file = await new Promise<File | null>((resolve) => {
		input.onchange = () => resolve(input.files?.[0] ?? null);
		input.oncancel = () => resolve(null);
		input.click();
	});

	if (!file) {
		return;
	}

	const content = await file.text();
	const filename = file.name.replace(/\.[^/.]+$/, ""); // Remove extension

	await importFile({
		context,
		content,
		filename,
		source: "file-open",
	});
}
