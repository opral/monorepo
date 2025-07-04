import {
	openLix,
	switchAccount,
	Lix,
	Version,
	Account,
} from "@lix-js/sdk";
import { atom, createStore } from "jotai";
import { getOriginPrivateDirectory } from "native-file-system-adapter";
import { saveLixToOpfs } from "./helper/saveLixToOpfs.ts";
import { updateUrlParams } from "./helper/updateUrlParams.ts";
import { setupWelcomeFile } from "./helper/welcomeLixFile.ts";
import { plugin as txtPlugin } from "@lix-js/plugin-txt";
import { findLixFileInOpfs } from "./helper/findLixInOpfs";
import { initLixInspector } from "@lix-js/inspector";

export const store = createStore();

export const fileIdSearchParamsAtom = atom((get) => {
	get(withPollingAtom);
	const searchParams = new URL(window.location.href).searchParams;
	return searchParams.get("f") || undefined;
});

export const lixIdSearchParamsAtom = atom((get) => {
	get(withPollingAtom);
	const searchParams = new URL(window.location.href).searchParams;
	return searchParams.get("lix") || undefined;
});

export const threadSearchParamsAtom = atom(async (get) => {
	get(withPollingAtom);
	const searchParams = new URL(window.location.href).searchParams;
	return searchParams.get("t");
});

export const availableLixFilesInOpfsAtom = atom(async (get) => {
	get(withPollingAtom);

	const rootHandle = await getOriginPrivateDirectory();
	const availableLixFiles: string[] = [];
	for await (const [name, handle] of rootHandle) {
		if (handle.kind === "file" && name.endsWith(".lix")) {
			availableLixFiles.push(handle.name);
		}
	}
	return availableLixFiles;
});

export const lixAtom = atom(async (get) => {
	const lixIdSearchParam = get(lixIdSearchParamsAtom);

	const rootHandle = await getOriginPrivateDirectory();

	let lixBlob: Blob;

	if (lixIdSearchParam) {
		// try reading the lix file from OPFS
		try {
			// Import the helper function dynamically to avoid circular dependencies
			const { findLixFileInOpfs } = await import("./helper/findLixInOpfs");

			// Find the Lix file with the specified ID
			const lixFile = await findLixFileInOpfs(lixIdSearchParam, [txtPlugin]);

			if (!lixFile) {
				throw new Error("Lix file not found with ID: " + lixIdSearchParam);
			}

			console.log(
				`Found lix with ID ${lixIdSearchParam} in file: ${lixFile.fullName}`
			);

			const file = await lixFile.handle.getFile();
			lixBlob = new Blob([await file.arrayBuffer()]);
		} catch {
			// Try server if lix doesn't exist in OPFS
			try {
				const response = await fetch(
					new Request(
						import.meta.env.PROD
							? "https://lix.host/lsa/get-v1"
							: "http://localhost:3005/lsa/get-v1",
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify({ lix_id: lixIdSearchParam }),
						}
					)
				);
				if (response.ok) {
					const blob = await response.blob();
					const lix = await openLix({
						blob,
						providePlugins: [txtPlugin],
					});
					await saveLixToOpfs({ lix });
					return lix;
				}
			} catch (error) {
				console.error("Failed to fetch from server:", error);
			}
		}
	} else {
		const availableLixFiles: FileSystemHandle[] = [];
		for await (const [name, handle] of rootHandle) {
			if (handle.kind === "file" && name.endsWith(".lix")) {
				availableLixFiles.push(handle);
			}
		}
		// naively pick the first lix file
		if (availableLixFiles.length > 0) {
			const fileHandle = await rootHandle.getFileHandle(
				availableLixFiles[0].name
			);
			const file = await fileHandle.getFile();
			lixBlob = new Blob([await file.arrayBuffer()]);
		} else {
			const welcomeLix = await setupWelcomeFile();
			lixBlob = welcomeLix.blob;
		}
	}

	let lix: Lix;
	const storedActiveAccount = localStorage.getItem(ACTIVE_ACCOUNT_STORAGE_KEY);

	try {
		if (storedActiveAccount) {
			lix = await openLix({
				blob: lixBlob!,
				providePlugins: [txtPlugin],
				account: JSON.parse(storedActiveAccount),
			});
		} else {
			lix = await openLix({
				blob: lixBlob!,
				providePlugins: [txtPlugin],
			});
		}
	} catch {
		// https://linear.app/opral/issue/INBOX-199/fix-loading-lix-file-if-schema-changed
		// CLEAR OPFS. The lix file is likely corrupted.
		for await (const entry of rootHandle.values()) {
			if (entry.kind === "file") {
				await rootHandle.removeEntry(entry.name);
			}
		}
		window.location.reload();
		// tricksing the TS typechecker. This will never be reached.
		lix = {} as any;
	}

	const lixId = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow();

	if (storedActiveAccount) {
		const activeAccount = JSON.parse(storedActiveAccount);
		await switchActiveAccount(lix, activeAccount);
	}

	// TODO use env varibale
	// const serverUrl = import.meta.env.PROD
	// ? "https://lix.host"
	// : "http://localhost:3005";
	// const serverUrl = import.meta.env.PROD
	// 	? "https://lix.host"
	// 	: "http://localhost:3005";

	// await lix.db
	// 	.insertInto("key_value")
	// 	.values({
	// 		key: "lix_server_url",
	// 		value: serverUrl,
	// 	})
	// 	.onConflict((oc) => oc.doUpdateSet({ value: serverUrl }))
	// 	.execute();

	await saveLixToOpfs({ lix });

	// mismatch in id, update URL without full reload if possible
	if (lixId.value !== lixIdSearchParam) {
		// Try to update URL without full navigation
		const updateSuccessful = updateUrlParams({ lix: lixId.value });

		// If update failed, fall back to full navigation
		if (!updateSuccessful) {
			const url = new URL(window.location.href);
			url.searchParams.set("lix", lixId.value);
			window.location.href = url.toString();
		}
	}

	await initLixInspector({
		lix,
		show: localStorage.getItem("lix-inspector:show")
			? localStorage.getItem("lix-inspector:show") === "true"
			: import.meta.env.DEV,
	});

	// lix.sqlite.createFunction("handle_save_lix_to_opfs", () => {
	// 	saveLixToOpfs({ lix });
	// 	return 0;
	// });

	// lix.sqlite.exec(`
	// 	CREATE TEMP TRIGGER IF NOT EXISTS handle_save_lix_to_opfs
	// 	AFTER UPDATE ON version_v2
	// 	WHEN OLD.change_set_id != NEW.change_set_id
	// 	BEGIN
	// 		SELECT handle_save_lix_to_opfs();
	// 	END;
	// 	`);

	return lix;
});

/**
 * Ugly ass workaround to get polled derived state.
 *
 * Search where the atom is set (likely in the layout/root component).
 */
export const withPollingAtom = atom(Date.now());

/**
 * Global editor reference atom to access the editor outside Plate components
 */
export const editorRefAtom = atom<any>(null);

export const activeVersionAtom = atom<Promise<Version | null>>(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	if (!lix) return null;

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	return activeVersion;
});

export const existingVersionsAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	if (!lix) return [];

	return await lix.db.selectFrom("version").selectAll().execute();
});

export const filesAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	if (!lix) return [];
	return await lix.db.selectFrom("file").selectAll().execute();
});

export const activeAccountAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);

	return await lix.db
		.selectFrom("active_account")
		.selectAll()
		// assuming only one account active at a time
		.executeTakeFirstOrThrow();
});

export const accountsAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	if (!lix) return [];
	const accounts = await lix.db.selectFrom("account").selectAll().execute();
	return accounts;
});

const ACTIVE_ACCOUNT_STORAGE_KEY = "active_account";

// Helper function to switch active account
export const switchActiveAccount = async (lix: Lix, account: Account) => {
	await lix.db.transaction().execute(async (trx) => {
		// in case the user switched the lix and this lix does not have
		// the account yet, then insert it.
		try {
			await trx
				.insertInto("account")
				.values({ id: account.id, name: account.name })
				.execute();
		} catch {
			// do nothing, account already exists
		}

		// switch the active account
		await switchAccount({ lix: { ...lix, db: trx }, to: [account] });
	});
	localStorage.setItem(ACTIVE_ACCOUNT_STORAGE_KEY, JSON.stringify(account));
};

export const isSyncingAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);

	const sync = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_sync")
		.select("value")
		.executeTakeFirst();

	if (sync?.value === "true") {
		return true;
	} else {
		return false;
	}
});

export const currentLixNameAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);

	// Get the current Lix ID for finding its file
	const lixId = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow();

	// Find the actual filename in OPFS using our helper function
	try {
		// Find the Lix file with the specified ID
		const lixFile = await findLixFileInOpfs(lixId.value);

		// If found, return its name, otherwise fall back to the ID
		return lixFile ? lixFile.name : lixId.value;
	} catch (error) {
		console.error("Error getting current Lix name:", error);
		return lixId.value;
	}
});

export const availableLixesAtom = atom(async (get) => {
	get(withPollingAtom);

	try {
		// Import the helper function dynamically to avoid circular dependencies
		const { findLixFilesInOpfs } = await import("./helper/findLixInOpfs");

		// Get all Lix files in OPFS
		const lixFiles = await findLixFilesInOpfs();

		// Convert to the format expected by consumers of this atom
		// We'll use a map to ensure no duplicate IDs
		const lixMap = new Map();

		for (const file of lixFiles) {
			// If we've already seen this ID, skip it (shouldn't happen with our cleanup, but just in case)
			if (!lixMap.has(file.id)) {
				lixMap.set(file.id, {
					id: file.id,
					name: file.name,
				});
			}
		}

		// Convert the map values to an array
		return Array.from(lixMap.values());
	} catch (error) {
		console.error("Failed to load available lixes:", error);
		return [];
	}
});
