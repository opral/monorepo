import { newProject } from "./newProject.js";
import { loadProjectInMemory } from "./loadProjectInMemory.js";
import {
	openLix,
	withWriterKey,
	type Lix,
	type StateCommitChange,
} from "@lix-js/sdk";
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
	args: { path: string; fs: typeof fs } & Omit<
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

	const tempLix = await openLix({ blob: newLix });

	const stopTempSync = await syncLixFsFiles({
		fs: args.fs,
		path: args.path,
		lix: tempLix,
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
				[{ key: "lix_id", value: inlangId, lixcol_version_id: "global" }]
			: undefined,
		blob: await tempLix.toBlob(),
	});

	// Closing the temp lix
	stopTempSync();
	await tempLix.close();

	const stopMainSync = await syncLixFsFiles({
		fs: args.fs,
		path: args.path,
		lix: project.lix,
	});

	const originalClose = project.close.bind(project);
	project.close = async () => {
		stopMainSync();
		await originalClose();
	};

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
			upsertBundleNestedMatchByProperties(args.project, messageBundle)
		);
	}

	return await Promise.all(upsertQueries);
}

type FsFileState = Record<
	string,
	{
		content: ArrayBuffer;
		state: "known" | "unknown" | "updated" | "gone";
		mtimeMs?: number;
		size?: number;
		writerKey?: string | null;
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
async function syncLixFsFiles(args: { fs: typeof fs; path: string; lix: Lix }) {
	let stopped = false;
	let syncing = false;
	let scheduled = false;
	let pendingFsScan = false;
	let pendingLixScan = false;
	let fullFsScanPending = true;
	let fullLixScanPending = true;

	const fsPendingPaths = new Set<string>();
	const lixPendingPaths = new Set<string>();

	const fileStates = {
		fsFileStates: {} as FsFileState,
		lixFileStates: {} as FsFileState,
	};

	const supportsWatch =
		typeof (args.fs as Partial<typeof fs>).watch === "function";
	const directoryWatchers = supportsWatch
		? new Map<string, { close: () => void }>()
		: undefined;

	const ensureDirectoryWatcher = (dirPath: string) => {
		if (!supportsWatch || !directoryWatchers) {
			return;
		}
		if (directoryWatchers.has(dirPath)) {
			return;
		}

		const callback = (_eventType: unknown, filename: unknown) => {
			if (stopped) {
				return;
			}
			if (!filename) {
				scheduleSync({ scanFs: true });
				return;
			}
			const candidate = nodePath.join(dirPath, filename.toString());
			try {
				const stats = args.fs.statSync(candidate);
				if (stats.isDirectory()) {
					ensureDirectoryWatcher(candidate);
				}
			} catch {
				// File or directory might have been removed before the stat call completes – ignore.
			}
			const relative = toRelativePath(candidate);
			if (relative) {
				fsPendingPaths.add(relative);
			}
			scheduleSync({ scanFs: true });
		};

		let watcher: { close: () => void } | undefined = undefined;
		try {
			watcher = args.fs.watch(
				dirPath,
				{ persistent: false },
				callback as any
			) as unknown as { close: () => void };
		} catch {
			try {
				watcher = args.fs.watch(dirPath, callback as any) as unknown as {
					close: () => void;
				};
			} catch {
				watcher = undefined;
			}
		}

		if (!watcher) {
			return;
		}

		directoryWatchers.set(dirPath, watcher);
	};

	const resolveToFsPath = (relative: string) => {
		const startsWithSlash =
			relative.startsWith("/") || relative.startsWith("\\");
		const normalized = startsWithSlash
			? "." + relative
			: relative.startsWith("./") || relative.startsWith("../")
				? relative
				: "./" + relative;
		return nodePath.resolve(args.path, normalized);
	};

	const toRelativePath = (absolute: string) => {
		const relative = nodePath.relative(args.path, absolute);
		if (!relative || relative.startsWith("..")) {
			return undefined;
		}
		return "/" + relative.split(nodePath.sep).join("/");
	};

	// NOTE this function is async - while it runs 100% sync in the naive implementation - we may want to change to an async version to optimize
	async function checkFsStateRecursive(
		dirPath: string,
		currentState: FsFileState
	) {
		ensureDirectoryWatcher(dirPath);

		let entries: fs.Dirent[];
		try {
			entries = args.fs.readdirSync(dirPath, { withFileTypes: true });
		} catch {
			return;
		}

		for (const entry of entries) {
			const fullPath = nodePath.join(dirPath, entry.name);
			if (entry.isDirectory()) {
				ensureDirectoryWatcher(fullPath);
				await checkFsStateRecursive(fullPath, currentState);
				continue;
			}

			let stat;
			try {
				stat = args.fs.statSync(fullPath);
			} catch {
				// treat missing file as gone in subsequent passes
				continue;
			}

			const relativeWithoutPrefix = nodePath.relative(args.path, fullPath);
			if (relativeWithoutPrefix.startsWith("..")) {
				continue;
			}
			const relativePath =
				"/" + relativeWithoutPrefix.split(nodePath.sep).join("/");
			const previousState = currentState[relativePath];

			const fileData = args.fs.readFileSync(fullPath) as Buffer;
			const data = fileData.buffer.slice(
				fileData.byteOffset,
				fileData.byteOffset + fileData.byteLength
			) as ArrayBuffer;

			if (!previousState) {
				currentState[relativePath] = {
					content: data,
					state: "unknown",
					mtimeMs: stat.mtimeMs,
					size: stat.size,
				};
			} else {
				const mtimeChanged = previousState.mtimeMs !== stat.mtimeMs;
				const sizeChanged = previousState.size !== stat.size;
				if (!mtimeChanged && !sizeChanged) {
					previousState.state = "known";
					continue;
				}

				if (arrayBuffersEqual(previousState.content, data)) {
					previousState.state = "known";
					previousState.mtimeMs = stat.mtimeMs;
					previousState.size = stat.size;
				} else {
					previousState.state = "updated";
					previousState.content = data;
					previousState.mtimeMs = stat.mtimeMs;
					previousState.size = stat.size;
				}
			}
		}
	}

	async function checkLixState(currentLixState: FsFileState) {
		// go through all files in lix and check there state
		const filesInLix = await args.lix.db
			.selectFrom("file" as any)
			.where("path", "not like", "%db.sqlite")
			.select(["path", "data", "lixcol_writer_key"])
			.execute();

		for (const fileInLix of filesInLix) {
			const writerKey = (fileInLix as any).lixcol_writer_key ?? null;
			const dataView = new Uint8Array(fileInLix.data as Uint8Array);
			const buffer = dataView.slice().buffer as ArrayBuffer;
			const currentStateOfFileInLix = currentLixState[fileInLix.path];
			if (!currentStateOfFileInLix) {
				currentLixState[fileInLix.path] = {
					content: buffer,
					state: "unknown",
					writerKey,
				};
				continue;
			}

			currentStateOfFileInLix.writerKey = writerKey;
			if (arrayBuffersEqual(currentStateOfFileInLix.content, buffer)) {
				currentStateOfFileInLix.state = "known";
			} else {
				currentStateOfFileInLix.state = "updated";
				currentStateOfFileInLix.content = buffer;
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
					await upsertFileInLix(args, path, fsState.content, FS_WRITER_KEY);
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
				if (
					lixState.writerKey === FS_WRITER_KEY &&
					fsState.state === "known" &&
					lixState.state === "known"
				) {
					lixState.state = "known";
					continue;
				}
				if (fsState.state === "unknown") {
					if (lixState.state === "unknown") {
						if (arrayBuffersEqual(lixState.content, fsState.content)) {
							lixState.state = "known";
							fsState.state = "known";
						} else {
							await upsertFileInLix(args, path, fsState.content, FS_WRITER_KEY);
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
						const targetPath = resolveToFsPath(path);
						args.fs.writeFileSync(targetPath, Buffer.from(lixState.content));
						fsState.content = lixState.content;
						fsState.state = "known";
						try {
							const stat = args.fs.statSync(targetPath);
							fsState.mtimeMs = stat.mtimeMs;
							fsState.size = stat.size;
						} catch {
							fsState.mtimeMs = undefined;
							fsState.size = undefined;
						}
						lixState.state = "known";
					} else if (lixState.state === "gone") {
						// DELETE FS (23)
						args.fs.unlinkSync(resolveToFsPath(path));
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
						await upsertFileInLix(args, path, fsState.content, FS_WRITER_KEY);
						lixState.content = fsState.content;
						lixState.writerKey = FS_WRITER_KEY;
						fsState.state = "known";
					} else if (lixState.state === "updated") {
						// seems like we saw an update on the file in fs while some changes on lix have not been reached fs? FS -> Winns?
						console.warn(
							"seems like we saw an update on the file " +
								path +
								" in fs while some changes on lix have not been reached fs? FS -> Winns?"
						);
						await upsertFileInLix(args, path, fsState.content, FS_WRITER_KEY);
						lixState.content = fsState.content;
						lixState.writerKey = FS_WRITER_KEY;
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
					const destination = resolveToFsPath(path);
					try {
						args.fs.mkdirSync(nodePath.dirname(destination), {
							recursive: true,
						});
						ensureDirectoryWatcher(nodePath.dirname(destination));
					} catch (e) {
						// ignore if directory already exists
						// https://github.com/opral/inlang-paraglide-js/issues/377
						if ((e as any)?.code !== "EEXIST") {
							throw e;
						}
					}
					// write file
					args.fs.writeFileSync(destination, Buffer.from(lixState.content));
					let mtimeMs: number | undefined;
					let size: number | undefined;
					try {
						const stat = args.fs.statSync(destination);
						mtimeMs = stat.mtimeMs;
						size = stat.size;
					} catch {
						mtimeMs = undefined;
						size = undefined;
					}
					statesToSync.fsFileStates[path] = {
						state: "known",
						content: lixState.content,
						mtimeMs,
						size,
					};
					lixState.state = "known";
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

	const markDirectoryTreeAsGone = (stateMap: FsFileState, prefix: string) => {
		const normalizedPrefix = prefix.endsWith("/") ? prefix : prefix + "/";
		for (const [path, state] of Object.entries(stateMap)) {
			if (path === prefix || path.startsWith(normalizedPrefix)) {
				state.state = "gone";
			}
		}
	};

	async function refreshFsEntry(relativePath: string) {
		const absolute = resolveToFsPath(relativePath);
		try {
			const stat = args.fs.statSync(absolute);
			if (stat.isDirectory()) {
				ensureDirectoryWatcher(absolute);
				markDirectoryTreeAsGone(fileStates.fsFileStates, relativePath);
				await checkFsStateRecursive(absolute, fileStates.fsFileStates);
				return;
			}
			const fileData = args.fs.readFileSync(absolute) as Buffer;
			const data = fileData.buffer.slice(
				fileData.byteOffset,
				fileData.byteOffset + fileData.byteLength
			) as ArrayBuffer;
			const current = fileStates.fsFileStates[relativePath];
			if (!current) {
				fileStates.fsFileStates[relativePath] = {
					content: data,
					state: "unknown",
					mtimeMs: stat.mtimeMs,
					size: stat.size,
				};
				return;
			}
			const mtimeChanged = current.mtimeMs !== stat.mtimeMs;
			const sizeChanged = current.size !== stat.size;
			if (!mtimeChanged && !sizeChanged) {
				current.state = "known";
				return;
			}
			if (arrayBuffersEqual(current.content, data)) {
				current.state = "known";
				current.mtimeMs = stat.mtimeMs;
				current.size = stat.size;
			} else {
				current.state = "updated";
				current.content = data;
				current.mtimeMs = stat.mtimeMs;
				current.size = stat.size;
			}
		} catch {
			const current = fileStates.fsFileStates[relativePath];
			if (current) {
				current.state = "gone";
			}
			if (directoryWatchers?.has(absolute)) {
				try {
					directoryWatchers.get(absolute)?.close();
				} catch {
					// watcher already closed or invalid – safe to ignore
				}
				directoryWatchers.delete(absolute);
			}
		}
	}

	async function refreshLixEntry(path: string) {
		const row = await args.lix.db
			.selectFrom("file" as any)
			.select(["path", "data", "lixcol_writer_key"])
			.where("path", "=", path)
			.executeTakeFirst();

		const current = fileStates.lixFileStates[path];
		if (!row) {
			if (current) {
				current.state = "gone";
			}
			return;
		}

		const writerKey = (row as any).lixcol_writer_key ?? null;
		const dataView = new Uint8Array(row.data as Uint8Array);
		const buffer = dataView.slice().buffer as ArrayBuffer;
		if (!current) {
			fileStates.lixFileStates[path] = {
				content: buffer,
				state: "unknown",
				writerKey,
			};
			return;
		}
		current.writerKey = writerKey;
		if (arrayBuffersEqual(current.content, buffer)) {
			current.state = "known";
			return;
		}
		current.content = buffer;
		current.state = "updated";
	}

	async function syncFiles(options: { scanFs: boolean; scanLix: boolean }) {
		if (stopped) {
			return;
		}

		if (options.scanFs) {
			if (fullFsScanPending) {
				for (const fsState of Object.values(fileStates.fsFileStates)) {
					fsState.state = "gone";
				}
				await checkFsStateRecursive(args.path, fileStates.fsFileStates);
				fullFsScanPending = false;
				fsPendingPaths.clear();
			} else {
				const paths = Array.from(fsPendingPaths);
				fsPendingPaths.clear();
				for (const path of paths) {
					await refreshFsEntry(path);
				}
			}
		}

		if (options.scanLix) {
			if (fullLixScanPending) {
				for (const lixState of Object.values(fileStates.lixFileStates)) {
					lixState.state = "gone";
				}
				await checkLixState(fileStates.lixFileStates);
				fullLixScanPending = false;
				lixPendingPaths.clear();
			} else {
				const paths = Array.from(lixPendingPaths);
				lixPendingPaths.clear();
				for (const path of paths) {
					await refreshLixEntry(path);
				}
			}
		}

		await syncUpFsAndLixFiles(fileStates);
	}

	async function runSyncLoop() {
		if (stopped) {
			return;
		}
		if (syncing) {
			return;
		}
		syncing = true;
		try {
			while (!stopped && (pendingFsScan || pendingLixScan)) {
				const scanFs = pendingFsScan;
				const scanLix = pendingLixScan;
				pendingFsScan = false;
				pendingLixScan = false;
				await syncFiles({ scanFs, scanLix });
			}
		} finally {
			syncing = false;
			if (!stopped && (pendingFsScan || pendingLixScan)) {
				scheduleSync();
			}
		}
	}

	function scheduleSync(options?: { scanFs?: boolean; scanLix?: boolean }) {
		if (stopped) {
			return;
		}
		if (options?.scanFs) {
			pendingFsScan = true;
		}
		if (options?.scanLix) {
			pendingLixScan = true;
		}
		if (scheduled || syncing) {
			return;
		}
		if (!pendingFsScan && !pendingLixScan) {
			return;
		}
		scheduled = true;
		queueMicrotask(async () => {
			scheduled = false;
			await runSyncLoop();
		});
	}

	// Initial copy of all files (full scan)
	pendingFsScan = true;
	pendingLixScan = true;
	await runSyncLoop();

	const unsubscribeCommit = args.lix.hooks.onStateCommit(
		({ changes }: { changes: StateCommitChange[] }) => {
			if (stopped) {
				return;
			}
			let shouldScan = false;
			for (const change of changes) {
				if (!change.schema_key.startsWith("lix_file")) {
					continue;
				}
				if (change.writer_key === FS_WRITER_KEY) {
					continue;
				}
				const path = (change.snapshot_content as any)?.path as
					| string
					| undefined;
				if (typeof path === "string") {
					lixPendingPaths.add(path);
				} else {
					fullLixScanPending = true;
				}
				shouldScan = true;
			}
			if (shouldScan) {
				scheduleSync({ scanLix: true });
			}
		}
	);

	return () => {
		stopped = true;
		if (directoryWatchers) {
			for (const watcher of directoryWatchers.values()) {
				try {
					watcher.close();
				} catch {
					// ignore watcher close errors
				}
			}
			directoryWatchers.clear();
		}
		unsubscribeCommit();
	};
}

const FS_WRITER_KEY = "inlang_sdk_sync:fs";

async function upsertFileInLix(
	args: { fs: typeof fs; path: string; lix: Lix },
	path: string,
	data: ArrayBuffer,
	writerKey: string
) {
	// force posix path when upserting into lix
	// https://github.com/opral/inlang-sdk/issues/229
	let posixPath = path.split(nodePath.win32.sep).join(nodePath.posix.sep);

	if (posixPath.startsWith("/") === false) {
		posixPath = "/" + posixPath;
	}

	await withWriterKey(args.lix.db, writerKey, async (db) => {
		const existing = await db
			.selectFrom("file")
			.where("path", "=", posixPath)
			.select(["id", "data"])
			.executeTakeFirst();

		if (existing) {
			const existingView = new Uint8Array(existing.data as Uint8Array);
			const existingBuffer = existingView.slice().buffer as ArrayBuffer;
			if (arrayBuffersEqual(existingBuffer, data)) {
				return;
			}
			await db
				.updateTable("file")
				.set({ data: new Uint8Array(data) })
				.where("id", "=", existing.id)
				.execute();
			return;
		}

		await db
			.insertInto("file")
			.values({
				path: posixPath,
				data: new Uint8Array(data),
			})
			.execute();
	});
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
