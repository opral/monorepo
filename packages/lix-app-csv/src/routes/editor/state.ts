/**
 * State atoms for the editor route.
 */

import { atom } from "jotai";
import { lixAtom, selectedFileIdAtom, withPollingAtom } from "../../state.ts";
import Papa from "papaparse";

export const selectedFileAtom = atom(async (get) => {
	get(withPollingAtom);
	const fileId = await get(selectedFileIdAtom);

	if (!fileId) {
		// Not the best UX to implicitly route to the root
		// but fine for now.
		window.location.href = "/";
		return;
	}

	const lix = await get(lixAtom);

	return await lix.db
		.selectFrom("file")
		.selectAll()
		.where("id", "=", fileId)
		.executeTakeFirstOrThrow();
});

export const parsedCsvAtom = atom(async (get) => {
	const file = await get(selectedFileAtom);
	if (!file) throw new Error("No file selected");
	const data = await new Blob([file.data]).text();
	const parsed = Papa.parse(data, { header: true });
	return parsed as Papa.ParseResult<Record<string, string>>;
});

export const uniqueColumnAtom = atom(async (get) => {
	const file = await get(selectedFileAtom);
	if (!file) return undefined;
	return file.metadata?.unique_column;
});

/**
 * The entity id that is selected in the editor.
 */
export const activeEntityIdAtom = atom<string | undefined>(undefined);
