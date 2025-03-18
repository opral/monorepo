import type { Version, Account, Lix } from "@lix-js/sdk";
import { openLixInMemory, switchAccount } from "@lix-js/sdk";
import { plugin as prosemirrorPlugin } from "@lix-js/plugin-prosemirror";
import { getOriginPrivateDirectory } from "native-file-system-adapter";
import { atom } from "jotai";
import { saveLixToOpfs } from "./helper/saveLixToOpfs";
import { setupProsemirrorDemo } from "./helper/demo-lix-file/demo-lix-file";

/**
 * Polling workaround for reactive state updates
 */
export const withPollingAtom = atom(Date.now());

/**
 * Get lix ID from URL search parameters
 */
export const lixIdSearchParamsAtom = atom((get) => {
	get(withPollingAtom);
	const searchParams = new URL(window.location.href).searchParams;
	return searchParams.get("l") || undefined;
});

/**
 * Get file ID from URL search parameters
 */
export const fileIdSearchParamsAtom = atom((get) => {
	get(withPollingAtom);
	const searchParams = new URL(window.location.href).searchParams;
	return searchParams.get("f") || undefined;
});

/**
 * List all available lix files in OPFS
 */
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

/**
 * Main lix atom that handles loading from OPFS, server, or creating a new instance
 */
export const lixAtom = atom(async (get) => {
	const lixIdSearchParam = get(lixIdSearchParamsAtom);
	const rootHandle = await getOriginPrivateDirectory();

	let lixBlob: Blob;

	if (lixIdSearchParam) {
		// try reading the lix file from OPFS
		try {
			console.log(`Attempting to load lix from OPFS: ${lixIdSearchParam}.lix`);
			const fileHandle = await rootHandle.getFileHandle(
				`${lixIdSearchParam}.lix`,
			);
			const file = await fileHandle.getFile();
			lixBlob = new Blob([await file.arrayBuffer()]);
			console.log(`Successfully loaded lix from OPFS: ${lixIdSearchParam}.lix`);
		} catch (error) {
			console.error(
				`Failed to load lix from OPFS: ${lixIdSearchParam}.lix`,
				error,
			);
			// Try server if lix doesn't exist in OPFS
			try {
				console.log(`Attempting to fetch lix from server: ${lixIdSearchParam}`);
				const response = await fetch(
					new Request(
						import.meta.env.PROD
							? "https://lix.host/lsa/get-v1"
							: "http://localhost:3000/lsa/get-v1",
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify({ lix_id: lixIdSearchParam }),
						},
					),
				);
				if (response.ok) {
					const blob = await response.blob();
					const lix = await openLixInMemory({
						blob,
						providePlugins: [prosemirrorPlugin],
					});
					await saveLixToOpfs({ lix });
					console.log(
						`Successfully fetched lix from server: ${lixIdSearchParam}`,
					);
					return lix;
				} else {
					console.error(`Server returned error for lix: ${lixIdSearchParam}`);
				}
			} catch (error) {
				console.error("Failed to fetch from server:", error);
			}
		}
	} else {
		// No specific lix ID requested, try to find any lix file
		console.log("No lix ID in URL, looking for available lix files in OPFS");
		const availableLixFiles: FileSystemHandle[] = [];
		for await (const [name, handle] of rootHandle) {
			if (handle.kind === "file" && name.endsWith(".lix")) {
				availableLixFiles.push(handle);
			}
		}
		// naively pick the first lix file
		if (availableLixFiles.length > 0) {
			console.log(`Found lix file in OPFS: ${availableLixFiles[0].name}`);
			const fileHandle = await rootHandle.getFileHandle(
				availableLixFiles[0].name,
			);
			const file = await fileHandle.getFile();
			lixBlob = new Blob([await file.arrayBuffer()]);
		} else {
			// No lix files found, create a new instance
			console.log("No lix files found in OPFS, creating a demo instance");
			const { lixProsemirrorDemoFile } = await import(
				"./helper/demo-lix-file/demo-lix-file"
			);
			const demoLix = await lixProsemirrorDemoFile();
			lixBlob = demoLix.blob;
		}
	}

	let lix: Lix;
	const ACTIVE_ACCOUNT_STORAGE_KEY = "active_account";
	const storedActiveAccount = localStorage.getItem(ACTIVE_ACCOUNT_STORAGE_KEY);

	try {
		if (storedActiveAccount) {
			console.log("Using stored active account");
			lix = await openLixInMemory({
				blob: lixBlob!,
				providePlugins: [prosemirrorPlugin],
				account: JSON.parse(storedActiveAccount),
			});
		} else {
			console.log("No stored active account, opening lix without account");
			lix = await openLixInMemory({
				blob: lixBlob!,
				providePlugins: [prosemirrorPlugin],
			});
		}
	} catch (error) {
		console.error("Error opening lix from blob:", error);
		// CLEAR OPFS. The lix file is likely corrupted.
		console.log("Clearing OPFS due to potential schema change or corruption");
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

	// Set server URL
	const serverUrl = import.meta.env.PROD
		? "https://lix.host"
		: "http://localhost:3000";

	await lix.db
		.insertInto("key_value")
		.values({
			key: "lix_server_url",
			value: serverUrl,
		})
		.onConflict((oc) => oc.doUpdateSet({ value: serverUrl }))
		.execute();

	// Check if there is a prosemirror.json file in lix
	let file = await lix.db
		.selectFrom("file")
		.where("file.path", "=", "/prosemirror.json")
		.selectAll()
		.executeTakeFirst();

	if (!file) {
		console.log("No prosemirror.json file found, setting up demo");
		file = await setupProsemirrorDemo(lix);
	}

	if (!get(fileIdSearchParamsAtom)) {
		// Set the file ID as searchParams
		const url = new URL(window.location.href);
		url.searchParams.set("f", file.id);
		window.history.replaceState({}, "", url.toString());
	}

	await saveLixToOpfs({ lix });

	// mismatch in id, load correct url
	if (lixId.value !== lixIdSearchParam) {
		const url = new URL(window.location.href);
		url.searchParams.set("l", lixId.value);
		// need to use window.location because react router complains otherwise
		window.location.href = url.toString();
	}

	return lix;
});

// Helper function to switch active account
export const switchActiveAccount = async (lix: Lix, account: Account) => {
	const ACTIVE_ACCOUNT_STORAGE_KEY = "active_account";

	await lix.db.transaction().execute(async (trx) => {
		// in case the user switched the lix and this lix does not have
		// the account yet, then insert it.
		await trx
			.insertInto("account")
			.values(account)
			.onConflict((oc) => oc.doNothing())
			.execute();

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

export const currentVersionAtom = atom<Promise<Version | null>>(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	if (!lix) return null;

	const currentVersion = await lix.db
		.selectFrom("current_version")
		.innerJoin("version", "version.id", "current_version.id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	return currentVersion;
});

export const existingVersionsAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	if (!lix) return [];

	return await lix.db.selectFrom("version").selectAll().execute();
});

/**
 * Polling interval for changes
 * Using a higher value to prevent focus issues during editing
 */
export const pollingInterval = 2000; // 2 seconds instead of 250ms

/**
 * Changes atom that updates based on polling interval
 */
export const changesAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	if (!lix) return [];

	return await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
		.innerJoin("file", "change.file_id", "file.id")
		.where("file.path", "=", "/prosemirror.json")
		.selectAll("change")
		.select("snapshot.content")
		.execute();
});

/**
 * ProseMirror document atom that updates based on polling interval
 */
export const prosemirrorDocumentAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	if (!lix) return { type: "doc", content: [] };

	const blob = await lix.db
		.selectFrom("file")
		.where("file.path", "=", "/prosemirror.json")
		.select("data")
		.executeTakeFirst();

	if (blob) {
		try {
			return JSON.parse(new TextDecoder().decode(blob.data));
		} catch (error) {
			console.error("Error parsing prosemirror document:", error);
			return { type: "doc", content: [] };
		}
	}

	return { type: "doc", content: [] };
});
