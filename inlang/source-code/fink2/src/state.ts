import { atom } from "jotai";
import { loadProjectInMemory, selectBundleNested } from "@inlang/sdk2";
import { atomWithStorage } from "jotai/utils";

export const selectedProjectPathAtom = atomWithStorage<string | undefined>(
	"selected-project-path",
	undefined
);

let safeProjectToOpfsInterval: number;

export const projectAtom = atom(async (get) => {
	if (safeProjectToOpfsInterval) {
		clearInterval(safeProjectToOpfsInterval);
	}
	try {
		const path = get(selectedProjectPathAtom);
		if (!path) return undefined;
		const opfsRoot = await navigator.storage.getDirectory();
		const fileHandle = await opfsRoot.getFileHandle(path);
		const file = await fileHandle.getFile();
		const project = await loadProjectInMemory({ blob: file });
		safeProjectToOpfsInterval = setInterval(async () => {
			const writable = await fileHandle.createWritable();
			const file = await project.toBlob();
			await writable.write(file);
			await writable.close();
		}, 2000);
		return project;
	} catch (e) {
		console.error(e);
		return undefined;
	}
});

/**
 * Ugly ass workaround to get polled derived state.
 *
 * Search where the atom is set (likely in the layout/root component).
 */
export const withPollingAtom = atom(Date.now());

export const bundlesNestedAtom = atom(async (get) => {
	get(withPollingAtom);
	const project = await get(projectAtom);
	if (!project) return [];
	return await selectBundleNested(project.db).execute();
});

export const committedChangesAtom = atom(async (get) => {
	get(withPollingAtom);
	const project = await get(projectAtom);
	if (!project) return [];
	return await project.lix.db
		.selectFrom("change")
		.selectAll()
		.where("commit_id", "is not", null)
		.innerJoin("commit", "commit.id", "change.commit_id")
		.orderBy("commit.zoned_date_time desc")
		.execute();
});

export const pendingChangesAtom = atom(async (get) => {
	get(withPollingAtom);
	const project = await get(projectAtom);
	if (!project) return [];
	return await project.lix.db
		.selectFrom("change")
		.selectAll()
		.where("commit_id", "is", null)
		.execute();
});

export const commitsAtom = atom(async (get) => {
	get(withPollingAtom);
	const project = await get(projectAtom);
	if (!project) return [];
	return await project.lix.db.selectFrom("commit").selectAll().execute();
});

