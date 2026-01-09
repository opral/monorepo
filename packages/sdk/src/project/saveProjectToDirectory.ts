import type fs from "node:fs/promises";
import type { InlangProject } from "./api.js";
import path from "node:path";
import { toMessageV1 } from "../json-schema/old-v1-message/toMessageV1.js";
import { absolutePathFromProject, withAbsolutePaths } from "./path-helpers.js";
import { detectJsonFormatting } from "../utilities/detectJsonFormatting.js";
import { selectBundleNested } from "../query-utilities/selectBundleNested.js";
import { README_CONTENT } from "./README_CONTENT.js";
import { ENV_VARIABLES } from "../services/env-variables/index.js";
import { compareSemver, pickHighestVersion, readProjectMeta } from "./meta.js";

async function fileExists(fsModule: typeof fs, filePath: string) {
	try {
		await fsModule.stat(filePath);
		return true;
	} catch {
		return false;
	}
}

/**
 * Saves a project to a directory.
 *
 * Writes all project files to disk and runs exporters to generate
 * resource files (e.g., JSON translation files).
 *
 * @example
 *   await saveProjectToDirectory({
 *     fs: await import("node:fs/promises"),
 *     project,
 *     path: "./project.inlang",
 *   });
 */
export async function saveProjectToDirectory(args: {
	/**
	 * The file system module to use for writing files.
	 */
	fs: typeof fs;
	/**
	 * The inlang project to save.
	 */
	project: InlangProject;
	/**
	 * The path to the inlang project directory. Must end with `.inlang`.
	 */
	path: string;
	/**
	 * If `true`, skips running exporters and only writes internal project files.
	 *
	 * Useful when you only want to update project metadata without
	 * regenerating resource files.
	 */
	skipExporting?: boolean;
}): Promise<void> {
	if (args.path.endsWith(".inlang") === false) {
		throw new Error("The path must end with .inlang");
	}
	const files = await args.project.lix.db
		.selectFrom("file")
		.selectAll()
		.execute();

	const gitignoreContent = new TextEncoder().encode(
		"# IF GIT SHOWED THAT THIS FILE CHANGED\n#\n# 1. RUN THE FOLLOWING COMMAND\n#\n# ---\n# git rm --cached '**/*.inlang/.gitignore'\n# ---\n#\n# 2. COMMIT THE CHANGE\n#\n# ---\n# git commit -m \"fix: remove tracked .gitignore from inlang project\"\n# ---\n#\n# Inlang handles the gitignore itself starting with version ^2.5.\n#\n# everything is ignored except settings.json\n*\n!settings.json"
	);

	const existingMeta = await readProjectMeta({
		fs: args.fs,
		projectPath: args.path,
	});
	const highestSdkVersion =
		pickHighestVersion([
			existingMeta?.highestSdkVersion,
			ENV_VARIABLES.SDK_VERSION,
		]) ?? ENV_VARIABLES.SDK_VERSION;
	const shouldWriteMetadata = (() => {
		const comparison = compareSemver(
			highestSdkVersion,
			ENV_VARIABLES.SDK_VERSION
		);
		return comparison === null || comparison <= 0;
	})();
	const readmePath = path.join(args.path, "README.md");
	const gitignorePath = path.join(args.path, ".gitignore");
	const shouldWriteReadme =
		shouldWriteMetadata || !(await fileExists(args.fs, readmePath));
	const shouldWriteGitignore =
		shouldWriteMetadata || !(await fileExists(args.fs, gitignorePath));

	// write all files to the directory
	for (const file of files) {
		if (file.path.endsWith("db.sqlite") || file.path === "/project_id") {
			continue;
		}
		const p = path.join(args.path, file.path);
		await args.fs.mkdir(path.dirname(p), { recursive: true });
		await args.fs.writeFile(p, new Uint8Array(file.data));
	}

	if (shouldWriteGitignore) {
		await args.fs.writeFile(gitignorePath, gitignoreContent);
	}

	if (shouldWriteReadme) {
		// Write README.md for coding agents
		await args.fs.writeFile(
			readmePath,
			new TextEncoder().encode(README_CONTENT)
		);
	}

	if (shouldWriteMetadata) {
		const metaContent = JSON.stringify({ highestSdkVersion }, null, 2);
		await args.fs.writeFile(
			path.join(args.path, ".meta.json"),
			new TextEncoder().encode(metaContent)
		);
	}

	if (args.skipExporting) {
		return;
	}

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
