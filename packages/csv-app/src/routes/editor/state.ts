/**
 * State atoms for the editor route.
 */

import { atom } from "jotai";
import {
	lixAtom,
	fileIdSearchParamsAtom,
	withPollingAtom,
} from "../../state.ts";
import Papa from "papaparse";

export const activeFileAtom = atom(async (get) => {
	get(withPollingAtom);
	const fileId = await get(fileIdSearchParamsAtom);

	if (!fileId) {
		// Not the best UX to implicitly route to the root
		// but fine for now.
		window.location.href = "/";
		throw new Error("no active file. reroute should avoid this throw");
	}

	const lix = await get(lixAtom);

	return await lix.db
		.selectFrom("file")
		.selectAll()
		.where("id", "=", fileId)
		.executeTakeFirstOrThrow();
});

export const parsedCsvAtom = atom(async (get) => {
	const file = await get(activeFileAtom);
	if (!file) throw new Error("No file selected");
	const data = await new Blob([file.data]).text();
	const parsed = Papa.parse(data, { header: true });
	return parsed as Papa.ParseResult<Record<string, string>>;
});

export const uniqueColumnAtom = atom<Promise<string | undefined>>(async (get) => {
	const file = await get(activeFileAtom);
	if (!file) return undefined;
	return file.metadata?.unique_column as string | undefined;
});

/**
 * The entity id that is selected in the editor.
 */
export const activeCellAtom = atom<{
	colId?: string;
	col: number;
	row: number;
} | null>(null);

/**
 * The entity (row) id that is selected in the editor.
 */
export const activeRowEntityIdAtom = atom(async (get) => {
	const activeCell = get(activeCellAtom);
	const parsedCsv = await get(parsedCsvAtom);
	const uniqueColumn = await get(uniqueColumnAtom);
	if (!activeCell || !uniqueColumn) return null;
	const uniqueColumnValue = parsedCsv.data[activeCell.row][uniqueColumn];
	return `${uniqueColumn}:${uniqueColumnValue}`;
});

/**
 * All changes for a given row.
 */
export const activeRowChangesAtom = atom(async (get) => {
	get(withPollingAtom);
	const activeFile = await get(activeFileAtom);
	const activeRowEntityId = await get(activeRowEntityIdAtom);
	const lix = await get(lixAtom);
	if (!activeRowEntityId) return [];
	return await lix.db
		.selectFrom("change")
		.where("change.type", "=", "row")
		.where("change.entity_id", "=", activeRowEntityId)
		.where("change.file_id", "=", activeFile.id)
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.selectAll("change")
		.select("snapshot.content")
		.orderBy("change.created_at", "desc")
		.execute();
});