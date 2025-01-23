import type { Adapter } from "@inlang/paraglide-js";
import fs from "node:fs";

/**
 * Reads a file from the file system and returns it as a string.
 */
const file = (path: string) => ({
	[path]: fs.readFileSync(new URL(path, import.meta.url), "utf-8"),
});

export const ParaglideNext: () => Adapter = () => {
	const files = {
		...file("adapter.js"),
		...file("adapter.provider.jsx"),
		...file("adapter.provider.client.jsx"),
	};
	return { files };
};
