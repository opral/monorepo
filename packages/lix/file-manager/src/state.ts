import { openLix, Account, switchAccount, Lix, LixVersion } from "@lix-js/sdk";
import { atom } from "jotai";
import { plugin as csvPlugin } from "@lix-js/plugin-csv";
import { getOriginPrivateDirectory } from "native-file-system-adapter";
import { lixCsvDemoFile } from "./helper/demo-lix-file/demo-lix-file.ts";
import { saveLixToOpfs } from "./helper/saveLixToOpfs.ts";
import { initLixInspector } from "@lix-js/inspector";

// plugin, file and app configuration (add supported apps to list in lix-website-server)
export const supportedFileTypes = [
	{
		plugin: csvPlugin,
		extension: ".csv",
		route: "/csv/editor",
		appName: "CSV app",
	},
];

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

export const conversationSearchParamsAtom = atom(async (get) => {
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
			const fileHandle = await rootHandle.getFileHandle(
				`${lixIdSearchParam}.lix`
			);
			const file = await fileHandle.getFile();
			lixBlob = new Blob([await file.arrayBuffer()]);
		} catch {
			// Try server if lix doesn't exist in OPFS
			try {
				const response = await fetch(
					new Request(
						import.meta.env.PROD
							? "https://lix.host/lsp/get-v1"
							: "http://localhost:3005/lsp/get-v1",
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
						providePlugins: supportedFileTypes.map((type) => type.plugin),
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
		}
		// create a demo lix
		else {
			const demoFile = await lixCsvDemoFile();
			lixBlob = demoFile.blob;
		}
	}

	let lix: Lix;
	const storedActiveAccount = localStorage.getItem(ACTIVE_ACCOUNT_STORAGE_KEY);

	try {
		if (storedActiveAccount) {
			lix = await openLix({
				blob: lixBlob!,
				providePlugins: supportedFileTypes.map((type) => type.plugin),
				account: JSON.parse(storedActiveAccount),
			});
		} else {
			lix = await openLix({
				blob: lixBlob!,
				providePlugins: supportedFileTypes.map((type) => type.plugin),
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

	// mismatch in id, load correct url
	if (lixId.value !== lixIdSearchParam) {
		const url = new URL(window.location.href);
		url.searchParams.set("lix", lixId.value);
		// need to use window.location because react router complains otherwise
		window.location.href = url.toString();
	}

	await initLixInspector({
		lix,
		show: localStorage.getItem("lix-inspector:show")
			? localStorage.getItem("lix-inspector:show") === "true"
			: import.meta.env.DEV,
	});

	return lix;
});

/**
 * Ugly ass workaround to get polled derived state.
 *
 * Search where the atom is set (likely in the layout/root component).
 */
export const withPollingAtom = atom(Date.now());

export const activeVersionAtom = atom<Promise<LixVersion | null>>(
	async (get) => {
		get(withPollingAtom);
		const lix = await get(lixAtom);
		if (!lix) return null;

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "active_version.version_id", "version.id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		return activeVersion;
	}
);

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
		.selectFrom("active_account as aa")
		.innerJoin("account_by_version as a", "a.id", "aa.account_id")
		.where("a.lixcol_version_id", "=", "global")
		.select(["aa.account_id as id", "a.name"])
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
