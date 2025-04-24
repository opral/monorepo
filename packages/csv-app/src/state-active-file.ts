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
import { CellSchemaV1 } from "@lix-js/plugin-csv";

export const activeFileAtom = atom(async (get) => {
	get(withPollingAtom);
	const fileId = await get(fileIdSearchParamsAtom);

	if (!fileId) {
		// Not the best UX to implicitly route to the root
		// but fine for now.
		window.location.href = "/";
		// throw new Error("no active file. reroute should avoid this throw");
		return undefined;
	}

	const lix = await get(lixAtom);

	return await lix.db
		.selectFrom("file")
		.selectAll()
		.where("id", "=", fileId)
		.executeTakeFirst();
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
	if (!cellEntityId || !activeFile) return [];
	const changes = await lix.db
		.selectFrom("change")
		.where("change.schema_key", "=", CellSchemaV1.key)
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

// The CSV app treats changes that are not in a change set as intermediate changes.
export const intermediateChangesAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	const activeFile = await get(activeFileAtom);
	const currentBranch = await get(currentVersionAtom);

	if (!activeFile) return [];

	return await lix.db
		.selectFrom("change")
		.where("change.file_id", "=", activeFile.id)
		.where(changeIsLeafInVersion(currentBranch))
		.where((eb) => eb.not(changeHasLabel({ name: "checkpoint" })))
		.selectAll("change")
		.execute();
});

export const allChangesAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	const activeFile = await get(activeFileAtom);

	if (!activeFile) return [];
	// const currentBranch = await get(currentBranchAtom);
	return await lix.db
		.selectFrom("change")
		.where("change.file_id", "=", activeFile.id)
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		// .where(changeInVersion(currentBranch))
		.selectAll("change")
		.select("snapshot.content")
		.execute();
});

export const changesCurrentVersionAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	const activeFile = await get(activeFileAtom);
	const currentBranch = await get(currentVersionAtom);

	if (!activeFile) return [];

	return await lix.db
		.selectFrom("change")
		.where("change.file_id", "=", activeFile.id)
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.where(changeInVersion(currentBranch))
		.selectAll("change")
		.select("snapshot.content")
		.execute();
});

export const allEdgesAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	const activeFile = await get(activeFileAtom);

	if (!activeFile) return [];

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
	// const activeFile = await get(activeFileAtom);
	const currentVersion = await get(currentVersionAtom);

	const changeConflictElements = await lix.db
		.selectFrom("change_set_element")
		.innerJoin(
			"change_conflict",
			"change_conflict.change_set_id",
			"change_set_element.change_set_id"
		)
		.innerJoin("change", "change.id", "change_set_element.change_id")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.leftJoin("version_change", (join) =>
			join
				.onRef("version_change.change_id", "=", "change.id")
				.on("version_change.version_id", "=", currentVersion.id)
		)
		// .where((eb) =>
		// 	eb.or([
		// 		eb("change.file_id", "=", activeFile.id),
		// 		eb("change.file_id", "=", "null"),
		// 	])
		// )
		.where(changeConflictInVersion(currentVersion))
		.selectAll("change_set_element")
		.select([
			"change_conflict.id as change_conflict_id",
			"change_conflict.change_set_id as change_conflict_change_set_id",
		])
		.selectAll("change")
		.select((eb) =>
			eb
				.case()
				.when("version_change.change_id", "is not", null)
				// using boolean still returns 0 or 1
				// for typesafety, number is used
				.then(1)
				.else(0)
				.end()
				.as("is_current_version_change")
		)
		.select((eb) =>
			eb
				.case()
				.when(changeInVersion(currentVersion))
				.then(1)
				.else(0)
				.end()
				.as("is_in_current_version")
		)
		.select("snapshot.content")
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
