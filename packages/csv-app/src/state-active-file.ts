/**
 * State atoms for an active file
 */

import { atom } from "jotai";
import {
	lixAtom,
	fileIdSearchParamsAtom,
	withPollingAtom,
	currentVersionAtom,
} from "./state.ts";
import Papa from "papaparse";
import {
	changeConflictInVersion,
	changeHasLabel,
	changeInVersion,
	changeIsLeafInVersion,
} from "@lix-js/sdk";
import { CellSchema } from "@lix-js/plugin-csv-column-based";

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

export const uniqueColumnAtom = atom<Promise<string | undefined>>(
	async (get) => {
		const file = await get(activeFileAtom);
		if (!file) return undefined;
		return file.metadata?.unique_column as string | undefined;
	}
);

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
	const uniqueColumnValue = parsedCsv.data[activeCell.row]?.[uniqueColumn];
	return `${uniqueColumn}|${uniqueColumnValue}`;
});

/**
 * The cell entity_id that is selected in the editor.
 */
export const activeCellEntityIdAtom = atom(async (get) => {
	const activeCell = get(activeCellAtom);
	const parsedCsv = await get(parsedCsvAtom);
	const activeRowEntityId = await get(activeRowEntityIdAtom);
	if (!activeCell || !activeRowEntityId) return null;
	const columName = parsedCsv.meta.fields![activeCell.col];
	return `${activeRowEntityId}|${columName}`;
});

/**
 * All changes for a given row.
 */
export const activeCellChangesAtom = atom(async (get) => {
	get(withPollingAtom);
	const activeFile = await get(activeFileAtom);
	const cellEntityId = await get(activeCellEntityIdAtom);
	const currentBranch = await get(currentVersionAtom);
	const lix = await get(lixAtom);
	if (!cellEntityId) return [];
	const changes = await lix.db
		.selectFrom("change")
		.where("change.schema_key", "=", CellSchema.key)
		.where("change.entity_id", "=", cellEntityId)
		.where("change.file_id", "=", activeFile.id)
		.where(changeInVersion(currentBranch))
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		// .innerJoin("change_set_item", "change_set_item.change_id", "change.id")
		// .innerJoin("change_set", "change_set.id", "change_set_item.change_set_id")
		// .innerJoin("discussion", "discussion.change_set_id", "change_set.id")
		// .innerJoin("comment", "comment.discussion_id", "discussion.id")
		// .selectAll("change")
		// .select((eb) => eb.fn.count("comment.id").as("comment_count"))
		.select("snapshot.content")
		.selectAll("change")
		.orderBy("change.created_at", "desc")
		.execute();

	for (const change of changes) {
		const labels = await lix.db
			.selectFrom("label")
			.innerJoin("change_set_label", "change_set_label.label_id", "label.id")
			.innerJoin(
				"change_set",
				"change_set.id",
				"change_set_label.change_set_id"
			)
			.innerJoin(
				"change_set_element",
				"change_set_element.change_set_id",
				"change_set.id"
			)
			.where("change_set_element.change_id", "=", change.id)
			.select("label.name")
			.execute();

		// @ts-expect-error - labels is not in the type
		change.labels = labels.map((label) => label.name);
	}
	return changes;
});

// The CSV app treats changes that are not in a change set as unconfirmed changes.
export const unconfirmedChangesAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	const activeFile = await get(activeFileAtom);
	const currentBranch = await get(currentVersionAtom);

	return await lix.db
		.selectFrom("change")
		.where("change.file_id", "=", activeFile.id)
		.where(changeIsLeafInVersion(currentBranch))
		.where((eb) => eb.not(changeHasLabel("confirmed")))
		.selectAll("change")
		.execute();
});

export const allChangesAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	const activeFile = await get(activeFileAtom);
	// const currentBranch = await get(currentBranchAtom);
	return await lix.db
		.selectFrom("change")
		.where("change.file_id", "=", activeFile.id)
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		// .where(changeInVersion(currentBranch))
		.selectAll("change")
		.select("snapshot.content as snapshot_content")
		.execute();
});

export const changesCurrentVersionAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	const activeFile = await get(activeFileAtom);
	const currentBranch = await get(currentVersionAtom);
	return await lix.db
		.selectFrom("change")
		.where("change.file_id", "=", activeFile.id)
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.where(changeInVersion(currentBranch))
		.selectAll("change")
		.select("snapshot.content as snapshot_content")
		.execute();
});

export const allEdgesAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	const activeFile = await get(activeFileAtom);
	return await lix.db
		.selectFrom("change_edge")
		.innerJoin("change", "change.id", "change_edge.parent_id")
		.where("change.file_id", "=", activeFile.id)
		.selectAll("change_edge")
		.execute();
});

export const changeConflictsAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	const activeFile = await get(activeFileAtom);
	const currentBranch = await get(currentVersionAtom);
	const changeConflictElements = await lix.db
		.selectFrom("change_set_element")
		.innerJoin(
			"change_conflict",
			"change_conflict.change_set_id",
			"change_set_element.change_set_id"
		)
		.innerJoin("change", "change.id", "change_set_element.change_id")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.leftJoin("change_set_element as branch_change", (join) =>
			join
				.onRef("branch_change.change_id", "=", "change.id")
				.on("branch_change.change_set_id", "=", currentBranch.change_set_id)
		)
		.where("change.file_id", "=", activeFile.id)
		.where(changeConflictInVersion(currentBranch))
		.selectAll("change_set_element")
		.select([
			"change_conflict.id as change_conflict_id",
			"change_conflict.change_set_id as change_conflict_change_set_id",
		])
		.selectAll("change")
		.select((eb) =>
			eb
				.case()
				.when("branch_change.change_id", "is not", null)
				// using boolean still returns 0 or 1
				// for typesafety, number is used
				.then(1)
				.else(0)
				.end()
				.as("is_current_branch_pointer")
		)
		.select((eb) =>
			eb
				.case()
				.when(changeInVersion(currentBranch))
				.then(1)
				.else(0)
				.end()
				.as("is_in_current_branch")
		)
		.select("snapshot.content as snapshot_content")
		.select("change_conflict.key as change_conflict_key")
		.execute();

	const groupedByConflictId: { [key: string]: typeof changeConflictElements } =
		{};

	for (const element of changeConflictElements) {
		const conflictId = element.change_conflict_id;
		if (!groupedByConflictId[conflictId]) {
			groupedByConflictId[conflictId] = [];
		}
		groupedByConflictId[conflictId].push(element);
	}

	return groupedByConflictId;
});
