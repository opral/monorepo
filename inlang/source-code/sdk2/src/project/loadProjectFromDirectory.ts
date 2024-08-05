import { newProject } from "./newProject.js";
import { loadProjectInMemory } from "./loadProjectInMemory.js";
import { uuidv4, type Lix } from "@lix-js/sdk";
// eslint-disable-next-line no-restricted-imports
import type fs from "node:fs/promises";
// eslint-disable-next-line no-restricted-imports
import nodePath from "node:path";

/**
 * Loads a project from a directory.
 *
 * Main use case are dev tools that want to load a project from a directory
 * that is stored in git.
 */
export async function loadProjectFromDirectory(
	args: { path: string; fs: typeof fs } & Omit<
		Parameters<typeof loadProjectInMemory>[0],
		"blob"
	>
) {
	const project = await loadProjectInMemory({
		// pass common arguments to loadProjectInMemory
		...args,
		blob: await newProject(),
	});
	await copyFiles({ fs: args.fs, path: args.path, lix: project.lix });
	return project;
}

/**
 * Copies the files in a directory into lix.
 */
async function copyFiles(args: {
	fs: typeof fs;
	path: string;
	lix: Lix;
}): Promise<void> {
	const paths = await traverseDir({ path: args.path, fs: args.fs });

	for (const path of paths) {
		if (path.endsWith("settings.json")) {
			continue;
		}
		await args.lix.db
			.insertInto("file")
			.values({
				id: uuidv4(),
				path: "/" + nodePath.relative(args.path, path),
				data: await args.fs.readFile(nodePath.resolve(args.path, path)),
			})
			.execute();
	}
	await args.lix.db
		.updateTable("file")
		.set({
			data: await args.fs.readFile(nodePath.join(args.path, "settings.json")),
		})
		.where("path", "=", "/settings.json")
		.execute();
}

async function traverseDir(args: {
	path: string;
	fs: typeof fs;
}): Promise<string[]> {
	const result = [];
	for (const file of await args.fs.readdir(args.path)) {
		const fullPath = nodePath.join(args.path, file);
		const isDirectory = (await args.fs.lstat(fullPath)).isDirectory();
		if (isDirectory) {
			result.push(...(await traverseDir({ path: fullPath, fs: args.fs })));
		} else {
			result.push(fullPath);
		}
	}
	return result;
}