import { newProject } from "./newProject.js";
import { loadProjectInMemory } from "./loadProjectInMemory.js";
import { uuidv4, type Lix } from "@lix-js/sdk";
// eslint-disable-next-line no-restricted-imports
import type fs from "node:fs/promises";
// eslint-disable-next-line no-restricted-imports
import nodePath from "node:path";
import type {
	InlangPlugin,
	NodeFsPromisesSubsetLegacy,
} from "../plugin/schema.js";
import { insertBundleNested } from "../query-utilities/insertBundleNested.js";
import { fromMessageV1 } from "../json-schema/old-v1-message/fromMessageV1.js";
import type { ProjectSettings } from "../json-schema/settings.js";
import type { PreprocessPluginBeforeImportFunction } from "../plugin/importPlugins.js";
import { PluginImportError } from "../plugin/errors.js";
import type { InlangProject, ResourceFile } from "./api.js";

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

	const localImport = await importLocalPlugins({
		fs: args.fs,
		path: args.path,
	});

	const providePluginsWithLocalPlugins = [
		...(args.providePlugins ?? []),
		...localImport.locallyImportedPlugins,
	];

	// TODO call tempProject.lix.settled() to wait for the new settings file, and remove reload of the proejct as soon as reactive settings has landed
	// NOTE: we need to ensure two things:
	// 1. settled needs to include the changes from the copyFiles call
	// 2. the changes created from the copyFiles call need to be realized and lead to a signal on the settings
	const project = await loadProjectInMemory({
		// pass common arguments to loadProjectInMemory
		...args,
		providePlugins: providePluginsWithLocalPlugins,
		blob: await tempProject.toBlob(),
	});

	// TODO i guess we should move this validation logic into sdk2/src/project/loadProject.ts
	// Two scenarios could arise:
	// 1. set settings is called from an app - it should detect and reject the setting of settings -> app need to be able to validate before calling set
	// 2. the settings file loaded from disc here is corrupted -> user has to fix the file on disc

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

	const importedResourceFileErrors: Error[] = [];

	for (const importer of importPlugins) {
		const files: ResourceFile[] = [];

		if (importer.toBeImportedFiles) {
			const paths = await importer.toBeImportedFiles({
				settings: await project.settings.get(),
				nodeFs: args.fs,
			});
			for (const path of paths) {
				const absolute = absolutePathFromProject(args.path, path);
				try {
					const data = await args.fs.readFile(absolute);
					files.push({ path, content: data, pluginKey: importer.key });
				} catch (e) {
					importedResourceFileErrors.push(
						new ResourceFileImportError({ cause: e as Error, path })
					);
				}
			}
		}

		await project.importFiles({
			pluginKey: importer.key,
			files,
		});
	}

	const chosenLegacyPlugin = loadMessagesPlugins[0];

	if (chosenLegacyPlugin) {
		await loadLegacyMessages({
			project,
			projectPath: args.path,
			fs: args.fs,
			pluginKey: chosenLegacyPlugin.key ?? chosenLegacyPlugin.id,
			loadMessagesFn: chosenLegacyPlugin.loadMessages,
		});
	}

	return {
		...project,
		errors: {
			get: async () => {
				const errors = await project.errors.get();
				return [
					...withLocallyImportedPluginWarning(errors),
					...localImport.errors,
					...importedResourceFileErrors,
				];
			},
			subscribe: (
				callback: Parameters<InlangProject["errors"]["subscribe"]>[0]
			) => {
				return project.errors.subscribe((value) => {
					callback([
						...withLocallyImportedPluginWarning(value),
						...localImport.errors,
						...importedResourceFileErrors,
					]);
				});
			},
		},
	};
}

async function loadLegacyMessages(args: {
	project: Awaited<ReturnType<typeof loadProjectInMemory>>;
	pluginKey: NonNullable<InlangPlugin["key"] | InlangPlugin["id"]>;
	loadMessagesFn: Required<InlangPlugin>["loadMessages"];
	projectPath: string;
	fs: typeof fs;
}) {
	const loadedLegacyMessages = await args.loadMessagesFn({
		settings: await args.project.settings.get(),
		// @ts-ignore
		nodeishFs: withAbsolutePaths(args.fs, args.projectPath),
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

/**
 * Imports local plugins for backwards compatibility.
 *
 * https://github.com/opral/inlang-sdk/issues/171
 */
async function importLocalPlugins(args: {
	fs: typeof fs;
	path: string;
	preprocessPluginBeforeImport?: PreprocessPluginBeforeImportFunction;
}) {
	const errors: Error[] = [];
	const locallyImportedPlugins = [];
	const settingsPath = nodePath.join(args.path, "settings.json");
	const settings = JSON.parse(
		await args.fs.readFile(settingsPath, "utf8")
	) as ProjectSettings;
	for (const module of settings.modules ?? []) {
		const modulePath = absolutePathFromProject(args.path, module);
		try {
			let moduleAsText = await args.fs.readFile(modulePath, "utf8");
			if (moduleAsText.includes("messageLintRule")) {
				errors.push(new WarningDeprecatedLintRule(module));
				continue;
			}
			if (args.preprocessPluginBeforeImport) {
				moduleAsText = await args.preprocessPluginBeforeImport(moduleAsText);
			}
			const moduleWithMimeType =
				"data:application/javascript," + encodeURIComponent(moduleAsText);
			const { default: plugin } = await import(
				/* @vite-ignore */ moduleWithMimeType
			);
			locallyImportedPlugins.push(plugin);
		} catch (e) {
			errors.push(new PluginImportError({ plugin: module, cause: e as Error }));
			continue;
		}
	}
	return {
		errors,
		locallyImportedPlugins,
	};
}

function withLocallyImportedPluginWarning(errors: readonly Error[]) {
	return errors.map((error) => {
		if (
			error instanceof PluginImportError &&
			error.plugin.startsWith("http") === false
		) {
			return new WarningLocalPluginImport(error.plugin);
		}
		return error;
	});
}

export class WarningLocalPluginImport extends Error {
	constructor(module: string) {
		super(
			`Plugin ${module} is imported from a local path. This will work fine in dev tools like Sherlock or Paraglide JS but is not portable. Web apps like Fink or Parrot won't be able to import this plugin. It is recommended to use an http url to import plugins. The plugins are cached locally and will be available offline.`
		);
		this.name = "WarningLocalImport";
	}
}

export class WarningDeprecatedLintRule extends Error {
	constructor(module: string) {
		super(
			`The lint rule ${module} is deprecated. Please remove the lint rule from the settings. Lint rules are interim built into apps and will be succeeded by more generilizable lix validation rules.`
		);
		this.name = "WarningDeprecatedLintRule";
	}
}

/**
 * Resolving absolute paths for fs functions.
 *
 * This mapping is required for backwards compatibility.
 * Relative paths in the project.inlang/settings.json
 * file are resolved to absolute paths with `*.inlang`
 * being pruned.
 *
 * @example
 *   "/website/project.inlang"
 *   "./local-plugins/mock-plugin.js"
 *   -> "/website/local-plugins/mock-plugin.js"
 *
 */
export function withAbsolutePaths(
	fs: NodeFsPromisesSubsetLegacy,
	projectPath: string
): NodeFsPromisesSubsetLegacy {
	return {
		// @ts-expect-error
		readFile: (path, options) => {
			return fs.readFile(absolutePathFromProject(projectPath, path), options);
		},
		writeFile: (path, data) => {
			return fs.writeFile(absolutePathFromProject(projectPath, path), data);
		},
		mkdir: (path) => {
			return fs.mkdir(absolutePathFromProject(projectPath, path));
		},
		readdir: (path) => {
			return fs.readdir(absolutePathFromProject(projectPath, path));
		},
	};
}

/**
 * Joins a path from a project path.
 *
 * @example
 *   joinPathFromProject("/project.inlang", "./local-plugins/mock-plugin.js") -> "/local-plugins/mock-plugin.js"
 *
 *   joinPathFromProject("/website/project.inlang", "./mock-plugin.js") -> "/website/mock-plugin.js"
 */
export function absolutePathFromProject(projectPath: string, path: string) {
	// need to remove the project path from the module path for legacy reasons
	// "/project.inlang/local-plugins/mock-plugin.js" -> "/local-plugins/mock-plugin.js"
	const pathWithoutProject = projectPath
		.split(nodePath.sep)
		.slice(0, -1)
		.join(nodePath.sep);

	const resolvedPath = nodePath.resolve(pathWithoutProject, path);

	return resolvedPath;
}

export class ResourceFileImportError extends Error {
	path: string;

	constructor(args: { cause: Error; path: string }) {
		super("Could not import a resource file");
		this.name = "ResourceFileImportError";
		this.cause = args.cause;
		this.path = args.path;
	}
}