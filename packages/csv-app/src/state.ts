import { openLixInMemory } from "@lix-js/sdk";
import { atom } from "jotai";
import { plugin } from "@lix-js/plugin-csv";
import { getOriginPrivateDirectory } from "native-file-system-adapter";
import { lixCsvDemoFile } from "./helper/demo-lix-file/demoLixFile.ts";

export const fileIdSearchParamsAtom = atom(async (get) => {
	get(withPollingAtom);
	// Using window is a limitation of react router v6.
	//
	// No programmatic routing possibility exists outside of
	// the react component tree. A better solution is to
	// let react router handle the re-direct in the route
	// config. But for now, this works.
	const searchParams = new URL(window.location.href).searchParams;
	return searchParams.get("f");
});

let existingSafeLixToOpfsInterval: ReturnType<typeof setInterval> | undefined;

/**
 * Force reload the project.
 *
 * Search for `setReloadProject` to see where this atom is set.
 */
export const forceReloadLixAtom = atom<ReturnType<typeof Date.now> | undefined>(
	undefined
);

export const lixAtom = atom(async (get) => {
	// listen to forceReloadProjectAtom to reload the project
	// workaround for https://github.com/opral/lix-sdk/issues/47
	get(forceReloadLixAtom);

	// if (existingSafeLixToOpfsInterval) {
	// 	clearInterval(existingSafeLixToOpfsInterval);
	// }

	const rootHandle = await getOriginPrivateDirectory();
	const fileHandle = await rootHandle.getFileHandle("demo.lix", {
		create: true,
	});
	const file = await fileHandle.getFile();
	const isNewLix = file.size === 0;
	const lix = await openLixInMemory({
		blob: isNewLix ? await lixCsvDemoFile() : file,
		providePlugins: [plugin],
	});

	// * naive set interval leads to bugs.
	// * search for `saveLixToOpfs` in the code base
	// existingSafeLixToOpfsInterval = setInterval(async () => {
	// 	const writable = await fileHandle.createWritable();
	// 	const file = await lix.toBlob();
	// 	await writable.write(file);
	// 	await writable.close();
	// }, 5000);

	// @ts-expect-error - Expose for debugging.
	window.deleteLix = async () => {
		clearInterval(existingSafeLixToOpfsInterval);
		await rootHandle.removeEntry("demo.lix");
	};

	return lix;
});

/**
 * Ugly ass workaround to get polled derived state.
 *
 * Search where the atom is set (likely in the layout/root component).
 */
export const withPollingAtom = atom(Date.now());

export const currentBranchAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);

	const currentBranch = await lix.db
		.selectFrom("current_branch")
		.innerJoin("branch", "branch.id", "current_branch.id")
		.selectAll("branch")
		.executeTakeFirstOrThrow();

	return currentBranch;
});

export const existingBranchesAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);

	return await lix.db.selectFrom("branch").selectAll().execute();
});
