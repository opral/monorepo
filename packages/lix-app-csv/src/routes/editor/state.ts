import { atom } from "jotai";
import { lixAtom, selectedFileIdAtom, withPollingAtom } from "../../state.ts";
import Papa from "papaparse";

export const parsedCsvAtom = atom(async (get) => {
	get(withPollingAtom);
	const fileId = await get(selectedFileIdAtom);

	if (!fileId) {
		// Not the best UX to implicitly route to the root
		// but fine for now.
		window.location.href = "/";
		return [];
	}

	const lix = await get(lixAtom);

	const csvFile = await lix.db
		.selectFrom("file")
		.select("data")
		.where("id", "=", fileId)
		.executeTakeFirstOrThrow();

	return Papa.parse(new TextDecoder().decode(csvFile.data), {
		header: true,
		skipEmptyLines: true,
	}).data as [{ [key: string]: string }];
});
