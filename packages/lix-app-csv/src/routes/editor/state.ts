import { atom } from "jotai";
import { lixAtom, withPollingAtom } from "../../state.ts";
import Papa from "papaparse";

export const parsedCsvAtom = atom(async (get) => {
	get(withPollingAtom);
	const fileId = "";

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
