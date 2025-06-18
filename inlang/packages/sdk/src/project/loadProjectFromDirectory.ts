import { newProject } from "./newProject.js";
import { loadProjectInMemory } from "./loadProjectInMemory.js";
import { closeLix, openLixInMemory, toBlob, type Lix } from "@lix-js/sdk";
import fs from "node:fs";
import nodePath from "node:path";
import type {
	InlangPlugin,
	NodeFsPromisesSubsetLegacy,
} from "../plugin/schema.js";
import { fromMessageV1 } from "../json-schema/old-v1-message/fromMessageV1.js";
import type { ProjectSettings } from "../json-schema/settings.js";
import type { PreprocessPluginBeforeImportFunction } from "../plugin/importPlugins.js";
import { PluginImportError } from "../plugin/errors.js";
import { upsertBundleNestedMatchByProperties } from "../import-export/upsertBundleNestedMatchByProperties.js";
import type { ImportFile } from "./api.js";

/**
 * Loads a project from a directory.
 *
 * Main use case are dev tools that want to load a project from a directory
 * that is stored in git.
 */
export async function loadProjectFromDirectory(
	args: { path: string; fs: typeof fs; syncInterval?: number } & Omit<
		Parameters<typeof loadProjectInMemory>[0],
		"blob"
	>
) {
	const settingsPath = nodePath.join(args.path, "settings.json");
	const settings = JSON.parse(
		await args.fs.promises.readFile(settingsPath, "utf8")
	) as ProjectSettings;

	let inlangId: string | undefined = undefined;

	try {
		inlangId = await args.fs.promises.readFile(
			nodePath.join(args.path, "project_id"),
			"utf8"
		);
	} catch {
		// await args.fs.promises.writeFile(
		// 	nodePath.join(args.path, "project_id"),
		// 	,
		// 	{ encoding: "utf8" }
		// );
		// file doesn't exist yet
	}

	const localImport = await importLocalPlugins({
		fs: args.fs,
		settings,
		path: args.path,
	});

	const providePluginsWithLocalPlugins = [
		...(args.providePlugins ?? []),
		...localImport.locallyImportedPlugins,
	];

	// Loading a new lix to sync the fs files to before
	// opening the inlang project
	// https://github.com/opral/inlang-paraglide-js/issues/498
	const newLix = await newProject({
		settings,
	});

	const tempLix = await openLixInMemory({ blob: newLix });

	await syncLixFsFiles({
		fs: args.fs,
		path: args.path,
		lix: tempLix,
		syncInterval: undefined,
	});

	// TODO call tempProject.lix.settled() to wait for the new settings file, and remove reload of the proejct as soon as reactive settings has landed
	// NOTE: we need to ensure two things:
	// 1. settled needs to include the changes from the copyFiles call
	// 2. the changes created from the copyFiles call need to be realized and lead to a signal on the settings
	const project = await loadProjectInMemory({
		...args,
		providePlugins: providePluginsWithLocalPlugins,
		lixKeyValues: inlangId
			? // reversing the id to have distinguishable lix ids from inlang ids
				[{ key: "lix_id", value: inlangId }]
			: undefined,
		blob: await toBlob({ lix: tempLix }),
	});

	// Closing the temp lix
	await closeLix({ lix: tempLix });

	await syncLixFsFiles({
		fs: args.fs,
		path: args.path,
		lix: project.lix,
		syncInterval: args.syncInterval,
	});

	const allPlugins = await project.plugins.get();
	const { loadSavePlugins, importExportPlugins } =
		categorizePlugins(allPlugins);

	// TODO i guess we should move this validation logic into sdk2/src/project/loadProject.ts
	// Two scenarios could arise:
	// 1. set settings is called from an app - it should detect and reject the setting of settings -> app need to be able to validate before calling set
	// 2. the settings file loaded from disc here is corrupted -> user has to fix the file on disc
	if (loadSavePlugins.length > 1) {
		throw new Error(
			"Max one loadMessages (found: " +
				loadSavePlugins.length +
				") and one saveMessages plugins (found: " +
				loadSavePlugins.length +
				") are allowed "
		);
	}
	const importedResourceFileErrors: Error[] = [];

	// import files from local fs
	for (const plugin of importExportPlugins) {
		const files: ImportFile[] = [];
		if (plugin.toBeImportedFiles) {
			const toBeImportedFiles = await plugin.toBeImportedFiles({
				settings: await project.settings.get(),
			});
			for (const toBeImported of toBeImportedFiles) {
				const absolute = absolutePathFromProject(args.path, toBeImported.path);
				try {
					const data = await args.fs.promises.readFile(absolute);
					files.push({
						locale: toBeImported.locale,
						content: data,
						toBeImportedFilesMetadata: toBeImported.metadata,
					});
				} catch (e) {
					// https://github.com/opral/inlang-sdk/issues/202
					if ((e as any)?.code === "ENOENT") {
						continue;
					}
					importedResourceFileErrors.push(
						new ResourceFileImportError({
							cause: e as Error,
							path: toBeImported.path,
						})
					);
				}
			}
		}

		await project.importFiles({
			pluginKey: plugin.key,
			files,
		});
	}

	for (const plugin of loadSavePlugins) {
		await loadLegacyMessages({
			project,
			pluginKey: plugin.key ?? plugin.id,
			loadMessagesFn: plugin.loadMessages!,
			projectPath: args.path,
			fs: args.fs,
		});
	}

	return {
		...project,
		errors: {
			get: async () => {
				return [
					...filterLocalPluginImportErrors(await project.errors.get()),
					...localImport.errors,
					...importedResourceFileErrors,
				];
			},
			// subscribe: (
			// 	callback: Parameters<InlangProject["errors"]["subscribe"]>[0]
			// ) => {
			// 	return project.errors.subscribe((value) => {
			// 		callback([
			// 			...withLocallyImportedPluginWarning(value),
			// 			...localImport.errors,
			// 			...importedResourceFileErrors,
			// 		]);
			// 	});
			// },
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
		// @ts-expect-error - type mismatch
		nodeishFs: withAbsolutePaths(args.fs.promises, args.projectPath),
	});
	const upsertQueries = [];

	for (const legacyMessage of loadedLegacyMessages) {
		const messageBundle = fromMessageV1(legacyMessage);

		upsertQueries.push(
			upsertBundleNestedMatchByProperties(args.project.db, messageBundle)
		);
	}

	return await Promise.all(upsertQueries);
}

type FsFileState = Record<
	string,
	{
		/*mtime: number, hash: string, */ content: ArrayBuffer;
		state: "known" | "unknown" | "updated" | "gone";
	}
>;

function arrayBuffersEqual(a: ArrayBuffer, b: ArrayBuffer) {
	if (a.byteLength !== b.byteLength) return false;

	// Create views for byte-by-byte comparison
	const view1 = new Uint8Array(a);
	const view2 = new Uint8Array(b);

	// Compare each byte
	for (const [i, element] of view1.entries()) {
		if (element !== view2[i]) {
			return false;
		}
	}

	return true;
}

/**
 * Filters out errors that are related to local plugins because
 * `loadProjectFromDirectory()` can import local plugins.
 */
function filterLocalPluginImportErrors(
	errors: readonly Error[]
): readonly Error[] {
	return errors.filter((error) => {
		if (
			error instanceof PluginImportError &&
			error.plugin.startsWith("http") === false
		) {
			return false;
		}
		return true;
	});
}

/**
 * Watches a directory and copies files into lix, keeping them in sync.
 */
async function syncLixFsFiles(args: {
	fs: typeof fs;
	path: string;
	lix: Lix;
	syncInterval?: number;
}) {
	// NOTE this function is async - while it runs 100% sync in the naiv implementation - we may want to change to an async version to optimize
	async function checkFsStateRecursive(
		dirPath: string,
		currentState: FsFileState
	) {
		const entries = args.fs.readdirSync(dirPath, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = nodePath.join(dirPath, entry.name);
			if (entry.isDirectory()) {
				checkFsStateRecursive(fullPath, currentState);
			} else {
				// NOTE we could start with comparing the mdate and skip file read completely...
				const data = args.fs.readFileSync(fullPath) as unknown as ArrayBuffer;

				const relativePath = "/" + nodePath.relative(args.path, fullPath);

				if (!currentState[relativePath]) {
					currentState[relativePath] = {
						content: data,
						state: "unknown",
					};
				} else {
					if (arrayBuffersEqual(currentState[relativePath].content, data)) {
						currentState[relativePath].state = "known";
					} else {
						currentState[relativePath].state = "updated";
						currentState[relativePath].content = data;
					}
				}
			}
		}
	}

	async function checkLixState(currentLixState: FsFileState) {
		// go through all files in lix and check there state
		const filesInLix = await args.lix.db
			.selectFrom("file")
			.where("path", "not like", "%db.sqlite")
			.selectAll()
			.execute();

		for (const fileInLix of filesInLix) {
			const currentStateOfFileInLix = currentLixState[fileInLix.path];
			// NOTE we could start with comparing the mdate and skip file read completely...
			if (!currentStateOfFileInLix) {
				currentLixState[fileInLix.path] = {
					content: new Uint8Array(fileInLix.data).buffer,
					state: "unknown",
				};
			} else {
				if (
					arrayBuffersEqual(
						currentStateOfFileInLix.content,
						fileInLix.data.buffer as ArrayBuffer
					)
				) {
					currentStateOfFileInLix.state = "known";
				} else {
					currentStateOfFileInLix.state = "updated";
					currentStateOfFileInLix.content = fileInLix.data
						.buffer as ArrayBuffer;
				}
			}
		}
	}

	async function syncUpFsAndLixFiles(statesToSync: {
		fsFileStates: FsFileState;
		lixFileStates: FsFileState;
	}) {
		// for (const file of Object.keys(statesToSync.fsFileStates)) {
		// 	if (file.includes("gitignore"))
		// 		console.log(
		// 			"fsFileStates : " +
		// 				file +
		// 				" fs " +
		// 				statesToSync.fsFileStates[file]?.state +
		// 				" lix " +
		// 				statesToSync.lixFileStates[file]?.state
		// 		);
		// }

		// Sync cases:
		//                          fs - no state for file | fs - unkonwn   | fs - known    | fs - updated | fs - gone
		// lix - no state for file      	NOTHING	(1)	   | ADD TO LIX(2)  |  ERROR (3)    | ERROR  (4)   | ERROR (5)
		// lix - unknown					ADD TO FS (6)  | USE FS VER.(7) |  ERROR (8)    | CASE (9)     | CASE (10)
		// lix - known                      ERROR (11)     | ERROR (12)     |  NOTHING(13)  | ERROR (14)   | ERROR (15)
		// lix - updated					ERROR (16)     | ERROR (17)     | USE LIX (18)  | CASE (19)    | CASE (20)
		// lix - gone  						ERROR (21)     | ERROR (22)     | DELETE FS (23)| CASE (24)    | CASE (25)

		// TODO check export import from saveFileToDirectory

		for (const [path, fsState] of Object.entries(statesToSync.fsFileStates)) {
			// no state for file in LIX
			if (!statesToSync.lixFileStates[path]) {
				if (fsState.state === "unknown") {
					// ADD TO LIX(2)
					await upsertFileInLix(args, path, fsState.content);
					statesToSync.lixFileStates[path] = {
						state: "known",
						content: fsState.content,
					};
					fsState.state = "known";
				} else {
					// ERROR (3), ERROR (4), ERROR (5)
					// The file does not exist in lix but its state differs from unknown?
					throw new Error(
						"Illeagal lix<->fs sync state. The file [" +
							path +
							"] that was " +
							fsState.state +
							" on disc did not exit in lix"
					);
				}
			} else {
				const lixState = statesToSync.lixFileStates[path];
				if (fsState.state === "unknown") {
					if (lixState.state === "unknown") {
						if (arrayBuffersEqual(lixState.content, fsState.content)) {
							lixState.state = "known";
							fsState.state = "known";
						} else {
							await upsertFileInLix(args, path, fsState.content);
							lixState.content = fsState.content;
							lixState.state = "known";
							fsState.state = "known";
						}
					} else {
						// ERROR 12, 17, 22
						throw new Error(
							"Illeagal lix<->fs sync state. The file [" +
								path +
								"] that was " +
								fsState.state +
								" but did exist in lix already"
						);
					}
				} else if (fsState.state === "known") {
					if (lixState.state === "known") {
						// NO OP  - NOTHING(13)
					} else if (lixState.state === "updated") {
						// USE LIX (18)
						args.fs.writeFileSync(
							// TODO check platform dependent folder separator
							args.path + path,
							Buffer.from(lixState.content)
						);
						fsState.content = lixState.content;
						fsState.state = "known";
						lixState.state = "known";
					} else if (lixState.state === "gone") {
						// DELETE FS (23)
						args.fs.unlinkSync(args.path + path);
						fsState.state = "gone";
						lixState.state = "gone";
					}
				} else if (fsState.state === "updated") {
					if (lixState.state === "unknown") {
						// TODO A file was added to lix while a known file from fs was updated?
						throw new Error(
							"Illeagal lix<->fs sync state. The file [" +
								path +
								"] that was " +
								fsState.state +
								" but it was not known by lix yet?"
						);
					} else if (lixState.state === "known") {
						await upsertFileInLix(args, path, fsState.content);
						lixState.content = fsState.content;

						fsState.state = "known";
					} else if (lixState.state === "updated") {
						// seems like we saw an update on the file in fs while some changes on lix have not been reached fs? FS -> Winns?
						console.warn(
							"seems like we saw an update on the file " +
								path +
								" in fs while some changes on lix have not been reached fs? FS -> Winns?"
						);
						await upsertFileInLix(args, path, fsState.content);
						lixState.content = fsState.content;
						lixState.state = "known";
						fsState.state = "known";
					} else if (lixState.state === "gone") {
						console.warn(
							"seems like we saw an delete in lix while some changes on fs have not been reached fs? FS -> Winns?"
						);
						// TODO update the lix state
						lixState.content = fsState.content;
						lixState.state = "known";
						fsState.state = "known";
					}
				} else if (fsState.state === "gone") {
					if (lixState.state === "unknown") {
						// TODO A file was added to lix while a known file from fs was removed?
						throw new Error(
							"Illeagal lix<->fs sync state. The file [" +
								path +
								"] that was " +
								fsState.state +
								" but it was not known by lix yet?"
						);
					} else if (lixState.state === "known") {
						// file is in known state with lix - means we have only changes on the fs - easy
						await args.lix.db
							.deleteFrom("file")
							.where("path", "=", path)
							.execute();
						// NOTE: states where both are gone will get removed in the lix state loop
						lixState.state = "gone";
					} else if (lixState.state === "updated") {
						// seems like we saw an update on the file in fs while some changes on lix have not been reached fs? FS -> Winns?
						console.warn(
							"seems like we saw an update on the file in fs while some changes on lix have not been reached fs? FS -> Winns?"
						);
						await args.lix.db
							.deleteFrom("file")
							.where("path", "=", path)
							.execute();
						// NOTE: states where both are gone will get removed in the lix state loop
						lixState.state = "gone";
						fsState.state = "gone";
					} else if (lixState.state === "gone") {
						console.warn(
							"seems like we saw an delete in lix while we have a delete in lix simultaniously?"
						);
						lixState.state = "gone";
						fsState.state = "gone";
					}
				}
			}
		}

		for (const [path, lixState] of Object.entries(statesToSync.lixFileStates)) {
			// no state for file in fs
			if (!statesToSync.fsFileStates[path]) {
				if (lixState.state == "unknown") {
					// ADD TO FS (6)
					// create directory if not exists
					try {
						args.fs.mkdirSync(
							nodePath.dirname(nodePath.join(args.path, path)),
							{
								recursive: true,
							}
						);
					} catch (e) {
						// ignore if directory already exists
						// https://github.com/opral/inlang-paraglide-js/issues/377
						if ((e as any)?.code !== "EEXIST") {
							throw e;
						}
					}
					// write file
					args.fs.writeFileSync(
						nodePath.join(args.path, path),
						Buffer.from(lixState.content)
					);
					statesToSync.fsFileStates[path] = {
						state: "known",
						content: lixState.content,
					};
				} else {
					// ERROR (11) 16 21
					// The file does not exist on fs but its state differs from unknown?
					throw new Error(
						"Illeagal lix<->fs sync state. The file [" +
							path +
							"] that was in the state" +
							lixState.state +
							" for lix did not exist on disk"
					);
				}
			} else {
				if (
					lixState.state === "gone" &&
					statesToSync.fsFileStates[path].state === "gone"
				) {
					delete statesToSync.lixFileStates[path];
					delete statesToSync.fsFileStates[path];
				} else if (lixState.state !== statesToSync.fsFileStates[path].state) {
					throw new Error(
						"At this stage both states should be in sync lix state " +
							lixState.state +
							" fs state " +
							statesToSync.fsFileStates[path].state
					);
				}
			}
		}
	}

	async function syncFiles(
		dirPath: string,
		fileStates: {
			lixFileStates: FsFileState;
			fsFileStates: FsFileState;
		},
		interval?: number
	) {
		// mark all states as removed - checkFsStateRecursive will update those that exist on the disc correspondingly
		for (const fsState of Object.values(fileStates.fsFileStates)) {
			fsState.state = "gone";
		}

		// mark all states as removed - checkFsStateRecursive will update those that exist on the disc correspondingly
		for (const lixState of Object.values(fileStates.lixFileStates)) {
			lixState.state = "gone";
		}

		// read states from disc - detect changes
		await checkFsStateRecursive(dirPath, fileStates.fsFileStates);

		// read states form lix - detect changes
		await checkLixState(fileStates.lixFileStates);

		// sync fs<->lix
		await syncUpFsAndLixFiles(fileStates);

		if (interval) {
			setTimeout(() => {
				syncFiles(dirPath, fileStates, interval);
			}, interval);
		}

		return;
	}

	// Initial copy of all files
	await syncFiles(
		args.path,
		{ fsFileStates: {}, lixFileStates: {} },
		args.syncInterval
	);

	return;
}

async function upsertFileInLix(
	args: { fs: typeof fs; path: string; lix: Lix },
	path: string,
	data: ArrayBuffer
) {
	// force posix path when upserting into lix
	// https://github.com/opral/inlang-sdk/issues/229
	let posixPath = path.split(nodePath.win32.sep).join(nodePath.posix.sep);

	if (posixPath.startsWith("/") === false) {
		posixPath = "/" + posixPath;
	}

	const existing = await args.lix.db
		.selectFrom("file")
		.where("path", "=", posixPath)
		.select("id")
		.executeTakeFirst();

	if (existing) {
		await args.lix.db
			.updateTable("file")
			.set({ data: new Uint8Array(data) })
			.where("id", "=", existing.id)
			.execute();
		return;
	} else {
		await args.lix.db
			.insertInto("file") // change queue
			.values({
				path: posixPath,
				data: new Uint8Array(data),
			})
			.execute();
	}
}
/**
 * Filters legacy load and save messages plugins.
 *
 * Legacy plugins are plugins that implement loadMessages and saveMessages but not importFiles and exportFiles.
 */
function categorizePlugins(plugins: readonly InlangPlugin[]) {
	const loadSavePlugins: InlangPlugin[] = [];
	const importExportPlugins: InlangPlugin[] = [];

	for (const plugin of plugins) {
		if (
			plugin.loadMessages &&
			plugin.saveMessages &&
			!(plugin.importFiles && plugin.exportFiles)
		) {
			loadSavePlugins.push(plugin);
		} else if (plugin.importFiles || plugin.exportFiles) {
			importExportPlugins.push(plugin);
		}
	}

	return { loadSavePlugins, importExportPlugins };
}

/**
 * Imports local plugins for backwards compatibility.
 *
 * https://github.com/opral/inlang-sdk/issues/171
 */
async function importLocalPlugins(args: {
	fs: typeof fs;
	settings: ProjectSettings;
	path: string;
	preprocessPluginBeforeImport?: PreprocessPluginBeforeImportFunction;
}) {
	const errors: Error[] = [];
	const locallyImportedPlugins = [];
	for (const module of args.settings.modules ?? []) {
		if (module.startsWith("http")) {
			continue;
		}
		const modulePath = absolutePathFromProject(args.path, module);
		try {
			let moduleAsText = await args.fs.promises.readFile(modulePath, "utf8");
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
		// @ts-expect-error - node type mismatch
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
 *   absolutePathFromProject("/project.inlang", "./local-plugins/mock-plugin.js") -> "/local-plugins/mock-plugin.js"
 *
 *   absolutePathFromProject("/website/project.inlang", "./mock-plugin.js") -> "/website/mock-plugin.js"
 */
export function absolutePathFromProject(
	projectPath: string,
	filePath: string
): string {
	// Normalize paths for consistency across platforms
	const normalizedProjectPath = nodePath
		.normalize(projectPath)
		.replace(/\\/g, "/");
	const normalizedFilePath = nodePath.normalize(filePath).replace(/\\/g, "/");

	// Remove the last part of the project path (file name) to get the project root
	const projectRoot = nodePath.dirname(normalizedProjectPath);

	// If filePath is already absolute, return it directly
	if (nodePath.isAbsolute(normalizedFilePath)) {
		return normalizedFilePath;
	}

	// Compute absolute resolved path
	const resolvedPath = nodePath.resolve(projectRoot, normalizedFilePath);

	// Ensure final path always uses forward slashes
	return resolvedPath.replace(/\\/g, "/");
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
