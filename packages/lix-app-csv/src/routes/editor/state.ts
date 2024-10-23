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

export const parsedCsvAtom = atom<Promise<any>>(async (get) => {
	const file = await get(selectedFileAtom);
	if (!file) return [];
	const data = await new Blob([file.data]).text();
	const parsed = Papa.parse(data, { header: true });
	return parsed.data;
});

export const uniqueColumnAtom = atom(async (get) => {
	const file = await get(selectedFileAtom);
	if (!file) return "";
	return file.metadata?.unique_column;
});