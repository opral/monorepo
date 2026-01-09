import type fs from "node:fs/promises";
import type { InlangProject } from "./api.js";
import path from "node:path";
import { toMessageV1 } from "../json-schema/old-v1-message/toMessageV1.js";
import {
	absolutePathFromProject,
	withAbsolutePaths,
} from "./loadProjectFromDirectory.js";
import { detectJsonFormatting } from "../utilities/detectJsonFormatting.js";
import { selectBundleNested } from "../query-utilities/selectBundleNested.js";
import { README_CONTENT } from "./README_CONTENT.js";

export async function saveProjectToDirectory(args: {
	fs: typeof fs;
	project: InlangProject;
	path: string;
}): Promise<void> {
	if (args.path.endsWith(".inlang") === false) {
		throw new Error("The path must end with .inlang");
	}
	const files = await args.project.lix.db
		.selectFrom("file")
		.selectAll()
		.execute();

	const gitignoreContent = new TextEncoder().encode(
		"# this file is auto generated\ncache\nREADME.md"
	);

	// write all files to the directory
	for (const file of files) {
		if (file.path.endsWith("db.sqlite") || file.path === "/project_id") {
			continue;
		}
		const p = path.join(args.path, file.path);
		await args.fs.mkdir(path.dirname(p), { recursive: true });
		await args.fs.writeFile(p, new Uint8Array(file.data));
	}

	await args.fs.writeFile(path.join(args.path, ".gitignore"), gitignoreContent);

	// Write README.md for coding agents
	await args.fs.writeFile(
		path.join(args.path, "README.md"),
		new TextEncoder().encode(README_CONTENT)
	);

	// run exporters
	const plugins = await args.project.plugins.get();
	const settings = await args.project.settings.get();

	for (const plugin of plugins) {
		if (plugin.exportFiles) {
			const bundles = await args.project.db
				.selectFrom("bundle")
				.selectAll()
				.execute();
			const messages = await args.project.db
				.selectFrom("message")
				.selectAll()
				.execute();
			const variants = await args.project.db
				.selectFrom("variant")
				.selectAll()
				.execute();
			const files = await plugin.exportFiles({
				bundles,
				messages,
				variants,
				settings,
			});
			for (const file of files) {
				const pathPattern = settings[plugin.key]?.pathPattern;

				// We need to check if pathPattern is a string or an array of strings
				// and handle both cases.
				const formattedPathPatterns = Array.isArray(pathPattern)
					? pathPattern
					: [pathPattern];

				for (const pathPattern of formattedPathPatterns) {
					const p = pathPattern
						? absolutePathFromProject(
								args.path,
								pathPattern.replace(/\{(languageTag|locale)\}/g, file.locale)
							)
						: absolutePathFromProject(args.path, file.name);
					const dirname = path.dirname(p);
					if ((await args.fs.stat(dirname)).isDirectory() === false) {
						await args.fs.mkdir(dirname, { recursive: true });
					}
					if (p.endsWith(".json")) {
						try {
							const existing = await args.fs.readFile(p, "utf-8");
							const stringify = detectJsonFormatting(existing);
							await args.fs.writeFile(
								p,
								new TextEncoder().encode(
									stringify(JSON.parse(new TextDecoder().decode(file.content)))
								)
							);
						} catch {
							// write the file to disk (json doesn't exist yet)
							// yeah ugly duplication of write file but it works.
							await args.fs.writeFile(p, new Uint8Array(file.content));
						}
					} else {
						await args.fs.writeFile(p, new Uint8Array(file.content));
					}
				}
			}
		}
		// old legacy remove with v3
		else if (plugin.saveMessages) {
			// in-efficient re-qeuery but it's a legacy function that will be removed.
			// the effort of adjusting the code to not re-query is not worth it.
			const bundlesNested = await selectBundleNested(args.project.db).execute();
			await plugin.saveMessages({
				messages: bundlesNested.map((b) => toMessageV1(b)),
				// @ts-expect-error - legacy
				nodeishFs: withAbsolutePaths(args.fs, args.path),
				settings,
			});
		}
	}
}
