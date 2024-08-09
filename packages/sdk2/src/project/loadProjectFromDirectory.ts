import { newProject } from "./newProject.js";
import { loadProjectInMemory } from "./loadProjectInMemory.js";
import { uuidv4, type Lix } from "@lix-js/sdk";
// eslint-disable-next-line no-restricted-imports
import type fs from "node:fs/promises";
// eslint-disable-next-line no-restricted-imports
import nodePath from "node:path";
import type { InlangPlugin } from "../plugin/schema.js";
import { insertBundleNested } from "../query-utilities/insertBundleNested.js";
import { fromMessageV1 } from "./util/fromMessageV1.js";

/**
 * Loads a project from a directory.
 *
 * Main use case are dev tools that want to load a project from a directory
 * that is stored in git.
 */
export async function loadProjectFromDirectoryInMemory(
	args: { path: string; fs: typeof fs } & Omit<
		Parameters<typeof loadProjectInMemory>[0],
		"blob"
	>
) {
	const tempProject = await loadProjectInMemory({
		// pass common arguments to loadProjectInMemory
		...args,
		blob: await newProject(),
	});
	await copyFiles({ fs: args.fs, path: args.path, lix: tempProject.lix });

	// TODO call tempProject.lix.settled() to wait for the new settings file, and remove reload of the proejct as soon as reactive settings has landed
	// NOTE: we need to ensure two things:
	// 1. settled needs to include the changes from the copyFiles call
	// 2. the changes created from the copyFiles call need to be realized and lead to a signal on the settings
	const project = await loadProjectInMemory({
		// pass common arguments to loadProjectInMemory
		...args,
		blob: await tempProject.toBlob(),
	});

	// TODO i guess we should move this validation logic into sdk2/src/project/loadProject.ts
	// Two scenarios could arise:
	// 1. set settings is called from an app - it should detect and reject the setting of settings -> app need to be able to validate before calling set
	// 2. the settings file loaded from disc here is corrupted -> user has to fix the file on disc

	const loadMessagesPlugins = project.plugins
		.get()
		.filter((plugin) => plugin.loadMessages !== undefined);
	const saveMessagesPlugins = project.plugins
		.get()
		.filter((plugin) => plugin.saveMessages !== undefined);
	const exportPlugins = project.plugins
		.get()
		.filter((plugin) => plugin.importFiles !== undefined);
	const importPlugins = project.plugins
		.get()
		.filter((plugin) => plugin.exportFiles !== undefined);

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

	const chosenLegacyPlugin = loadMessagesPlugins[0];

	if (!chosenLegacyPlugin) {
		return project;
	}

	if (chosenLegacyPlugin.loadMessages) {
		await loadLegacyMessages({
			project,
			fs: args.fs,
			pluginKey: chosenLegacyPlugin.key ?? chosenLegacyPlugin.id,
			loadMessagesFn: chosenLegacyPlugin.loadMessages,
		});
		// TODO check user id and description (where will this one appear?)
		await project.lix.commit({
			userId: "inlang-bot",
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
		settings: args.project.settings.get(),
		nodeishFs: args.fs,
	});
	const insertQueries = [];

	for (const legacyMessage of loadedLegacyMessages) {
		const messageBundle = fromMessageV1(legacyMessage, args.pluginKey);
		insertQueries.push(insertBundleNested(args.project.db, messageBundle));
	}

	return Promise.all(insertQueries);
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
