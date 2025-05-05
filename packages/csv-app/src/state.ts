import {
	Account,
	Lix,
	Version,
	openLixInMemory,
	switchAccount,
} from "@lix-js/sdk";
import { atom } from "jotai";
import { plugin as csvPlugin } from "@lix-js/plugin-csv";
import { getOriginPrivateDirectory } from "native-file-system-adapter";
import { lixCsvDemoFile } from "./helper/demo-lix-file/demoLixFile.ts";
import { saveLixToOpfs } from "./helper/saveLixToOpfs.ts";
import { initLixInspector } from "@lix-js/inspector";

export const withPollingAtom = atom(Date.now());

export const lixIdSearchParamsAtom = atom((get) => {
	get(withPollingAtom);
	const searchParams = new URL(window.location.href).searchParams;
	return searchParams.get("lix") || undefined;
});

export const fileIdSearchParamsAtom = atom((get) => {
	get(withPollingAtom);
	const searchParams = new URL(window.location.href).searchParams;
	return searchParams.get("f") || undefined;
});

export const lixAtom = atom(async (get) => {
	const lixIdSearchParam = get(lixIdSearchParamsAtom);
	const rootHandle = await getOriginPrivateDirectory();

	let lixBlob: Blob;

	if (lixIdSearchParam) {
		try {
			const fileHandle = await rootHandle.getFileHandle(
				`${lixIdSearchParam}.lix`
			);
			const file = await fileHandle.getFile();
			lixBlob = new Blob([await file.arrayBuffer()]);
		} catch {
			try {
				const response = await fetch(
					new Request(
						import.meta.env.PROD
							? "https://lix-host/lsp/get-v1"
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
					const lix = await openLixInMemory({
						blob,
						providePlugins: [csvPlugin],
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
		if (availableLixFiles.length > 0) {
			const fileHandle = await rootHandle.getFileHandle(
				availableLixFiles[0].name
			);
			const file = await fileHandle.getFile();
			lixBlob = new Blob([await file.arrayBuffer()]);
		} else {
			lixBlob = await lixCsvDemoFile();
		}
	}

	let lix: Lix;

	try {
		lix = await openLixInMemory({
			blob: lixBlob!,
			providePlugins: [csvPlugin],
		});
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

	const storedActiveAccount = localStorage.getItem(ACTIVE_ACCOUNT_STORAGE_KEY);

	if (storedActiveAccount) {
		const activeAccount = JSON.parse(storedActiveAccount);
		await switchActiveAccount(lix, activeAccount);
	}

	// TODO use env varibale
	// const serverUrl = import.meta.env.PROD
	// ? "https://lix.host"
	// : "http://localhost:3005";
	const serverUrl = import.meta.env.PROD
		? "https://lix.host"
		: "http://localhost:3005";

	await lix.db
		.insertInto("key_value")
		.values({
			key: "lix_server_url",
			value: serverUrl,
		})
		.onConflict((oc) => oc.doUpdateSet({ value: serverUrl }))
		.execute();

	await saveLixToOpfs({ lix });

	if (lixId.value !== lixIdSearchParam) {
		const url = new URL(window.location.href);
		url.searchParams.set("lix", lixId.value);
		window.location.href = url.toString();
	}

	await initLixInspector({
		lix,
		show: import.meta.env.DEV,
	});

	return lix;
});

export const currentVersionAtom = atom<
	Promise<Version & { targets: Version[] }>
>(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);

	const currentVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	// const targets = await lix.db
	// 	.selectFrom("branch_target")
	// 	.where("source_branch_id", "=", currentVersion.id)
	// 	.innerJoin("branch", "branch_target.target_branch_id", "branch.id")
	// 	.selectAll("branch")
	// 	.execute();

	return { ...currentVersion, targets: [] };
});

export const existingVersionsAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);

	return await lix.db.selectFrom("version").selectAll().execute();
});

export const activeAccountsAtom = atom(async (get) => {
	const lix = await get(lixAtom);

	return await lix.db
		.selectFrom("active_account")
		.innerJoin("account", "active_account.id", "account.id")
		.selectAll()
		.execute();
});

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
