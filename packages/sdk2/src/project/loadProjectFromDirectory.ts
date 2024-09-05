import { newProject } from "./newProject.js";
import { loadProjectInMemory } from "./loadProjectInMemory.js";
import { type Lix } from "@lix-js/sdk";
// eslint-disable-next-line no-restricted-imports
import type fs from "node:fs";
// eslint-disable-next-line no-restricted-imports
import nodePath from "node:path";
import type { InlangPlugin } from "../plugin/schema.js";
import { insertBundleNested } from "../query-utilities/insertBundleNested.js";
import { fromMessageV1 } from "../json-schema/old-v1-message/fromMessageV1.js";

import { watch } from "../chokidar/index.js";

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
		...args,
		blob: await newProject(),
	});

	await keepFilesInSync({ fs: args.fs, path: args.path, lix: project.lix });

	// TODO i guess we should move this validation logic into sdk2/src/project/loadProject.ts
	// Two scenarios could arise:
	// 1. set settings is called from an app - it should detect and reject the setting of settings -> app need to be able to validate before calling set
	// 2. the settings file loaded from disc here is corrupted -> user has to fix the file on disc

	// TODO expose a onFileChange Event in lix via temp trigger

	const {
		loadMessagesPlugins,
		saveMessagesPlugins,
		importPlugins,
		exportPlugins,
	} = categorizePlugins(await project.plugins.get());

	if (loadMessagesPlugins.length > 1 || saveMessagesPlugins.length > 1) {
		throw new Error(
			"Max one loadMessages (found: " +
				loadMessagesPlugins.length +
				") and one saveMessages plugins (found: " +
				saveMessagesPlugins.length +
				") are allowed "
		);
	}

	if (
		(loadMessagesPlugins.length > 0 || saveMessagesPlugins.length > 0) &&
		(exportPlugins.length > 0 || importPlugins.length > 0)
	) {
		throw new Error(
			"Plugins for loadMessages (found: " +
				loadMessagesPlugins.length +
				") and saveMessages plugins (found: " +
				saveMessagesPlugins.length +
				") must not coexist with import (found: " +
				importPlugins.length +
				") or export (found: " +
				exportPlugins.length +
				") "
		);
	}

	for (const importer of importPlugins) {
		const files = importer.toBeImportedFiles
			? await importer.toBeImportedFiles({
					settings: await project.settings.get(),
					nodeFs: args.fs.promises,
			  })
			: [];

		await project.importFiles({
			pluginKey: importer.key,
			files,
		});

		// TODO check user id and description (where will this one appear?)
		await project.lix.commit({
			description: "Executed importFiles",
		});
	}

	const chosenLegacyPlugin = loadMessagesPlugins[0];

	if (chosenLegacyPlugin) {
		await loadLegacyMessages({
			project,
			fs: args.fs,
			pluginKey: chosenLegacyPlugin.key ?? chosenLegacyPlugin.id,
			loadMessagesFn: chosenLegacyPlugin.loadMessages,
		});
		// TODO check user id and description (where will this one appear?)
		await project.lix.commit({
			description: "legacy load and save messages",
		});
	}

	return project;
}

async function loadLegacyMessages(args: {
	project: Awaited<ReturnType<typeof loadProjectInMemory>>;
	pluginKey: NonNullable<InlangPlugin["key"] | InlangPlugin["id"]>;
	loadMessagesFn: Required<InlangPlugin>["loadMessages"];
	fs: typeof fs;
}) {
	const loadedLegacyMessages = await args.loadMessagesFn({
		settings: await args.project.settings.get(),
		nodeishFs: args.fs.promises,
	});
	const insertQueries = [];

	for (const legacyMessage of loadedLegacyMessages) {
		const messageBundle = fromMessageV1(legacyMessage, args.pluginKey);
		insertQueries.push(insertBundleNested(args.project.db, messageBundle));
	}

	return Promise.all(insertQueries);
}
/**
 * Watches a directory and copies files into lix, keeping them in sync.
 */
async function keepFilesInSync(args: {
	fs: typeof fs;
	path: string;
	lix: Lix;
}) {
	async function copyFilesFromDiskRecursive(dirPath: string) {
		const entries = args.fs.readdirSync(dirPath, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = nodePath.join(dirPath, entry.name);
			if (entry.isDirectory()) {
				copyFilesFromDiskRecursive(fullPath);
			} else {
				await handleFile(args, fullPath, "add");
			}
		}
	}

	// Initial copy of all files
	await copyFilesFromDiskRecursive(args.path);

	// Set up recursive watch for all files on disk

	const setupWatcher = new Promise((resolve) => {
		const watcher = watch(args.path, {
			recursive: true,
		});

		watcher.on("all", (event, targetPath, targetPathNext) => {
			console.log(event); // => could be any target event: 'add', 'addDir', 'change', 'rename', 'renameDir', 'unlink' or 'unlinkDir'
			console.log(targetPath); // => the file system path where the event took place, this is always provided
			console.log(targetPathNext); // => the file system path "targetPath" got renamed to, this is only provided on 'rename'/'renameDir' events
		});

		watcher.on("add", (fp) => {
			console.log(`File ${fp} added`);
			const fullPath = fp;
			try {
				const stats = args.fs.statSync(fullPath);
				if (!stats.isDirectory()) {
					// TODO shouldnt we pass the content here? what happens if the file gets removed in the meantime
					handleFile(args, fullPath, "add");
				}
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === "ENOENT") {
					handleFile(args, fullPath, "delete");
				} else {
					console.error(`Error handling file ${fullPath}:`, error);
				}
			}
		});

		watcher.on("change", (fp) => {
			const fullPath = fp;

			try {
				const stats = args.fs.statSync(fullPath);
				if (!stats.isDirectory()) {
					// TODO shouldnt we pass the content here? what happens if the file gets removed in the meantime
					handleFile(args, fullPath, "change");
				}
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === "ENOENT") {
					handleFile(args, fullPath, "delete");
				} else {
					console.error(`Error handling file ${fullPath}:`, error);
				}
			}
		});

		watcher.on("unlink", (fp) => {
			const fullPath = fp;
			handleFile(args, fullPath, "delete");
		});

		// watcher.on("ready", () => {
		resolve(() => {
			watcher.close();
		});
		// });
	});

	return await setupWatcher;
}

async function handleFile(
	args: { fs: typeof fs; path: string; lix: Lix },
	filePath: string,
	event: "add" | "change" | "delete"
): Promise<void> {
	await 1; // send to the next tick?
	console.log(`Handling file ${filePath} with event ${event}`);
	const relativePath = nodePath.relative(args.path, filePath);
	const normalizedPath =
		"/" + nodePath.normalize(relativePath).replace(/^\.inlang[/\\]/, "");

	if (event === "delete") {
		args.lix.db
			.deleteFrom("file_internal")
			.where("path", "=", normalizedPath)
			.execute();
	} else {
		const data = args.fs.readFileSync(filePath);
		console.log({ data, txt: new TextDecoder().decode(data) });
		await args.lix.db
			.insertInto("file_internal") // change queue
			.values({
				path: normalizedPath,
				data,
			})
			.onConflict((oc) => oc.column("path").doUpdateSet({ data }))
			.execute();
		console.log(`File ${filePath} copied to lix, content: ${data.toString()}`);
	}
}


// TODO i guess we should move this validation logic into sdk2/src/project/loadProject.ts
function categorizePlugins(plugins: readonly InlangPlugin[]): {
	loadMessagesPlugins: (InlangPlugin &
		Required<Pick<InlangPlugin, "loadMessages">>)[];
	saveMessagesPlugins: (InlangPlugin &
		Required<Pick<InlangPlugin, "saveMessages">>)[];
	importPlugins: (InlangPlugin &
		Required<Pick<InlangPlugin, "importFiles" | "toBeImportedFiles">>)[];
	exportPlugins: (InlangPlugin & Required<Pick<InlangPlugin, "exportFiles">>)[];
} {
	const loadMessagesPlugins = plugins.filter(
		(
			plugin
		): plugin is InlangPlugin & Required<Pick<InlangPlugin, "loadMessages">> =>
			plugin.loadMessages !== undefined
	);

	const saveMessagesPlugins = plugins.filter(
		(
			plugin
		): plugin is InlangPlugin & Required<Pick<InlangPlugin, "saveMessages">> =>
			plugin.saveMessages !== undefined
	);

	const importPlugins = plugins.filter(
		(
			plugin
		): plugin is InlangPlugin &
			Required<Pick<InlangPlugin, "importFiles" | "toBeImportedFiles">> =>
			plugin.importFiles !== undefined && plugin.toBeImportedFiles !== undefined
	);

	const exportPlugins = plugins.filter(
		(
			plugin
		): plugin is InlangPlugin & Required<Pick<InlangPlugin, "exportFiles">> =>
			plugin.exportFiles !== undefined
	);

	return {
		loadMessagesPlugins,
		saveMessagesPlugins,
		importPlugins,
		exportPlugins,
	};
}
