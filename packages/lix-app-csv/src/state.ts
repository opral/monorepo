/* eslint-disable @typescript-eslint/ban-ts-comment */
import { openLixInMemory } from "@lix-js/sdk";
import { atom } from "jotai";
// import { jsonObjectFrom } from "kysely/helpers/sqlite";
import { isInSimulatedCurrentBranch } from "@lix-js/sdk";
import { plugin } from "@lix-js/plugin-csv";
import { getOriginPrivateDirectory } from "native-file-system-adapter";
import { lixCsvDemoFile } from "./helper/demo-lix-file/demoLixFile.ts";

export const selectedFileIdAtom = atom(async (get) => {
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

export const editorSelectionAtom = atom<{ row: string; col: string } | null>(
	null
);

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

	if (existingSafeLixToOpfsInterval) {
		clearInterval(existingSafeLixToOpfsInterval);
	}

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

	existingSafeLixToOpfsInterval = setInterval(async () => {
		const writable = await fileHandle.createWritable();
		const file = await lix.toBlob();
		await writable.write(file);
		await writable.close();
	}, 2000);

	return lix;
});

/**
 * Ugly ass workaround to get polled derived state.
 *
 * Search where the atom is set (likely in the layout/root component).
 */
export const withPollingAtom = atom(Date.now());



export const pendingChangesAtom = atom(async (get) => {
	get(withPollingAtom);
	const project = await get(lixAtom);
	if (!project) return [];
	const result = await project.db
		.selectFrom("change")
		.selectAll()
		// .where("commit_id", "is", null)
		// TODO remove after sequence concept on lix
		// https://linear.app/opral/issue/LIX-126/branching
		.where(isInSimulatedCurrentBranch)
		.execute();
	//console.log(result);
	// @ts-expect-error
	window.lix = lixAtom;
	return result;
});

// export const unresolvedConflictsAtom = atom(async (get) => {
// 	get(withPollingAtom);
// 	const project = await get(projectAtom);
// 	if (!project) return [];
// 	const result = await project.lix.db
// 		.selectFrom("conflict")
// 		.where("resolved_with_change_id", "is", null)
// 		.selectAll()
// 		.execute();

// 	//console.log(result);
// 	return result;
// });

/**
 * Get all conflicting changes.
 *
 * @example
 *   const [conflictingChanges] = useAtom(conflictingChangesAtom);
 *   conflictingChanges.find((change) => change.id === id);
 */
// export const conflictingChangesAtom = atom(async (get) => {
// 	get(withPollingAtom);
// 	const project = await get(projectAtom);
// 	const unresolvedConflicts = await get(unresolvedConflictsAtom);
// 	if (!project) return [];
// 	const result: Set<Change> = new Set();

// 	for (const conflict of unresolvedConflicts) {
// 		const change = await project.lix.db
// 			.selectFrom("change")
// 			.selectAll()
// 			.where("id", "=", conflict.change_id)
// 			.executeTakeFirstOrThrow();
// 		const conflicting = await project.lix.db
// 			.selectFrom("change")
// 			.selectAll()
// 			.where("id", "=", conflict.conflicting_change_id)
// 			.executeTakeFirstOrThrow();
// 		result.add(change);
// 		result.add(conflicting);
// 	}
// 	return [...result];
// });
