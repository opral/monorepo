import { Version, openLixInMemory } from "@lix-js/sdk";
import { atom } from "jotai";
import { plugin as csvPlugin } from "@lix-js/plugin-csv";
import { getOriginPrivateDirectory } from "native-file-system-adapter";
import { lixCsvDemoFile } from "./helper/demo-lix-file/demoLixFile.ts";
import { saveLixToOpfs } from "./helper/saveLixToOpfs.ts";

export const withPollingAtom = atom(Date.now());

export const lixIdSearchParamsAtom = atom((get) => {
	get(withPollingAtom);
	const searchParams = new URL(window.location.href).searchParams;
	return searchParams.get("l") || undefined;
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
					new Request("http://localhost:3000/lsa/get-v1", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ lix_id: lixIdSearchParam }),
					})
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

	const lix = await openLixInMemory({
		blob: lixBlob!,
		providePlugins: [csvPlugin],
	});

	const lixId = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow();

	await saveLixToOpfs({ lix });

	if (lixId.value !== lixIdSearchParam) {
		const url = new URL(window.location.href);
		url.searchParams.set("l", lixId.value);
		window.location.href = url.toString();
	}

	return lix;
});

export const currentVersionAtom = atom<
	Promise<Version & { targets: Version[] }>
>(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);

	const currentVersion = await lix.db
		.selectFrom("current_version")
		.innerJoin("version", "version.id", "current_version.id")
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

export const serverUrlAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);

	const syncServerUrl = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_experimental_server_url")
		.select("value")
		.executeTakeFirst();

	return syncServerUrl?.value;
});