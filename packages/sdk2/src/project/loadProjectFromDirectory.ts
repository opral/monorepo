import { newProject } from "./newProject.js";
import { loadProjectInMemory } from "./loadProjectInMemory.js";
import { type Lix } from "@lix-js/sdk";
// eslint-disable-next-line no-restricted-imports
import fs from "node:fs";
// eslint-disable-next-line no-restricted-imports
import nodePath from "node:path";
import type { InlangPlugin } from "../plugin/schema.js";
import { insertBundleNested } from "../query-utilities/insertBundleNested.js";
import { fromMessageV1 } from "../json-schema/old-v1-message/fromMessageV1.js";

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
	const project = await loadProjectInMemory({
		...args,
		blob: await newProject(),
	});

	await syncFiles({
		fs: args.fs,
		path: args.path,
		lix: project.lix,
		syncInterval: args.syncInterval,
	});

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
 * Watches a directory and copies files into lix, keeping them in sync.
 */
async function syncFiles(args: {
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
				const data = args.fs.readFileSync(fullPath);

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
			.selectFrom("file_internal")
			.where("path", "not like", "%db.sqlite")
			.selectAll()
			.execute();

		console.log(filesInLix.map((f) => f.path).join(", "));
		for (const fileInLix of filesInLix) {
			const currentStateOfFileInLix = currentLixState[fileInLix.path];
			// NOTE we could start with comparing the mdate and skip file read completely...
			if (!currentStateOfFileInLix) {
				currentLixState[fileInLix.path] = {
					content: new Uint8Array(fileInLix.data),
					state: "unknown",
				};
			} else {
				if (
					arrayBuffersEqual(currentStateOfFileInLix.content, fileInLix.data)
				) {
					currentStateOfFileInLix.state = "known";
				} else {
					currentStateOfFileInLix.state = "updated";
					currentStateOfFileInLix.content = fileInLix.data;
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
							.deleteFrom("file_internal")
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
							.deleteFrom("file_internal")
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
					args.fs.writeFileSync(
						// TODO check platform dependent folder separator
						args.path + path,
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
	// file is in known state with lix - means we have only changes on the fs - easy
	// NOTE we use file_internal for now see: https://linear.app/opral/issue/LIXDK-102/re-visit-simplifying-the-change-queue-implementation#comment-65eb3485
	// This means we don't see changes for the file we update via this method!
	await args.lix.db
		.insertInto("file_internal") // change queue
		.values({
			path: path,
			data,
		})
		.onConflict((oc) => oc.column("path").doUpdateSet({ data }))
		.execute();
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
