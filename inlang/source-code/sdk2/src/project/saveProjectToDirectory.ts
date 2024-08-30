import { InlangProject } from "./api.js";
// eslint-disable-next-line no-restricted-imports
import type fs from "node:fs/promises";

export async function saveProjectToDirectory(args: {
	project: InlangProject;
	path: string;
	fs: typeof fs;
}): Promise<void> {
	throw Error("Not implemented");
}
