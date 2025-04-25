/**
 * State atoms for an active file
 */

import { atom } from "jotai";
import {
	lixAtom,
	fileIdSearchParamsAtom,
	withPollingAtom,
	currentVersionAtom,
	discussionSearchParamsAtom,
} from "./state.ts";
import Papa from "papaparse";
import {
	changeConflictInVersion,
	changeHasLabel,
	changeInVersion,
	changeIsLeafInVersion,
	jsonArrayFrom,
	Lix,
	sql,
	UiDiffComponentProps,
	Version,
} from "@lix-js/sdk";
import { CellSchemaV1 } from "@lix-js/plugin-csv";
import { redirect } from "react-router-dom";

export const activeFileAtom = atom(async (get) => {
	get(withPollingAtom);
	const fileId = await get(fileIdSearchParamsAtom);

	if (!fileId) {
		redirect("/");
		return null;
	}

	const lix = await get(lixAtom);

	const fileAtom = await lix.db
		.selectFrom("file")
		.selectAll()
		.where("id", "=", fileId)
		.executeTakeFirst();

	if (!fileAtom) {
		redirect("/");
		return null;
	}
	return fileAtom;
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
	if (!activeFile) return [];
	const cellEntityId = await get(activeCellEntityIdAtom);
	const currentBranch = await get(currentVersionAtom);
	if (!currentBranch) return [];
	const lix = await get(lixAtom);
	if (!cellEntityId) return [];
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

// The file manager app treats changes that are not in a change set as intermediate changes.
export const intermediateChangesAtom = atom<
	Promise<UiDiffComponentProps["diffs"]>
>(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	const activeFile = await get(activeFileAtom);
	const currentVersion = await get(currentVersionAtom);
	if (!currentVersion) return [];

	const queryIntermediateLeafChanges = lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.where(changeIsLeafInVersion(currentVersion))
		.where((eb) => eb.not(changeHasLabel({ name: "checkpoint" })))
		.where("change.file_id", "!=", "lix_own_change_control")
		.select([
			"change.entity_id",
			"change.file_id",
			"change.plugin_key",
			"change.schema_key",
			sql`json(snapshot.content)`.as("snapshot_content_after"),
		]);

	if (activeFile) {
		queryIntermediateLeafChanges.where("change.file_id", "=", activeFile.id);
	}

	const intermediateLeafChanges = await queryIntermediateLeafChanges.execute();

	const changesWithBeforeSnapshots: UiDiffComponentProps["diffs"] =
		await Promise.all(
			intermediateLeafChanges.map(async (change) => {
				const snapshotBefore = await lix.db
					.selectFrom("change")
					.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
					.where(changeInVersion(currentVersion))
					.where(changeHasLabel({ name: "checkpoint" }))
					.where("change.entity_id", "=", change.entity_id)
					.where("change.schema_key", "=", change.schema_key)
					.select(sql`json(snapshot.content)`.as("snapshot_content_before"))
					.executeTakeFirst();

				return {
					...change,
					snapshot_content_after: change.snapshot_content_after
						? JSON.parse(change.snapshot_content_after as string)
						: null,
					snapshot_content_before: snapshotBefore?.snapshot_content_before
						? JSON.parse(snapshotBefore.snapshot_content_before as string)
						: null,
				};
			})
		);

	return changesWithBeforeSnapshots;
});

export const intermediateChangeIdsAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	const activeFile = await get(activeFileAtom);
	const currentVersion = await get(currentVersionAtom);
	if (!currentVersion) return [];

	const queryIntermediateLeafChangeIds = lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.where(changeIsLeafInVersion(currentVersion))
		.where("change.plugin_key", "!=", "lix_own_change_control")
		.where((eb) => eb.not(changeHasLabel({ name: "checkpoint" })))
		.select("change.id");

	if (activeFile) {
		queryIntermediateLeafChangeIds.where("change.file_id", "=", activeFile.id);
	}

	const intermediateLeafChangeIds =
		await queryIntermediateLeafChangeIds.execute();

	return intermediateLeafChangeIds;
});

export const checkpointChangeSetsAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	const activeFile = await get(activeFileAtom);
	const query = lix.db
		.selectFrom("change_set")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_set_id",
			"change_set.id"
		)
		.leftJoin("change", "change.id", "change_set_element.change_id")
		.innerJoin("change as own_change", (join) =>
			join
				.onRef("own_change.entity_id", "=", "change_set.id")
				.on("own_change.schema_key", "=", "lix_change_set_table")
		)
		.innerJoin("change_author", "own_change.id", "change_author.change_id")
		.innerJoin("account", "change_author.account_id", "account.id")
		.leftJoin("discussion", "discussion.change_set_id", "change_set.id")
		// Join with the `comment` table, filtering for first-level comments
		.leftJoin("comment", "comment.discussion_id", "discussion.id")
		.where("comment.parent_id", "is", null) // Filter to get only the first comment
		.where(changeHasLabel({ name: "checkpoint" }))
		.groupBy("change_set.id")
		.orderBy("change.created_at", "desc")
		.select("change_set.id")
		.select("discussion.id as discussion_id")
		.select("comment.content as first_comment_content") // Get the first comment's content
		.select("account.name as author_name")
		.select("own_change.created_at as checkpoint_created_at"); // Get the change set's creation time

	if (activeFile) {
		query.where("change.file_id", "=", activeFile.id);
	}

	return await query.execute();
});

export const getChanges = async (
	lix: Lix,
	changeSetId: string,
	currentVersion: Version,
	activeFile: { id: string } | null
): Promise<UiDiffComponentProps["diffs"]> => {
	const queryCheckpointChanges = lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.leftJoin("change_edge", "change_edge.child_id", "change.id")
		.leftJoin(
			"change as parent_change",
			"parent_change.id",
			"change_edge.parent_id"
		)
		.leftJoin(
			"snapshot as parent_snapshot",
			"parent_snapshot.id",
			"parent_change.snapshot_id"
		)
		.where("change_set_element.change_set_id", "=", changeSetId)
		.where(changeInVersion(currentVersion))
		.where(changeHasLabel({ name: "checkpoint" }))
		.select("change.id")
		.select("change.plugin_key")
		.select("change.schema_key")
		.select("change.entity_id")
		.select(sql`json(snapshot.content)`.as("snapshot_content_after"));

	if (activeFile) {
		queryCheckpointChanges.where("change.file_id", "=", activeFile.id);
	}

	const checkpointChanges = await queryCheckpointChanges.execute();

	const changesWithBeforeSnapshot: UiDiffComponentProps["diffs"] =
		await Promise.all(
			checkpointChanges.map(async (change) => {
				const snapshotBefore = await lix.db
					.selectFrom("change")
					.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
					.innerJoin("change_edge", "change_edge.parent_id", "change.id")
					.where("change_edge.child_id", "=", change.id)
					.where(changeHasLabel({ name: "checkpoint" }))
					.where(changeInVersion(currentVersion))
					.where("change.entity_id", "=", change.entity_id)
					.where("change.schema_key", "=", change.schema_key)
					.select(sql`json(snapshot.content)`.as("snapshot_content_before"))
					.executeTakeFirst();

				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { id, ...rest } = change;

				return {
					...rest,
					snapshot_content_after: change.snapshot_content_after
						? JSON.parse(change.snapshot_content_after as string)
						: null,
					snapshot_content_before: snapshotBefore?.snapshot_content_before
						? JSON.parse(snapshotBefore.snapshot_content_before as string)
						: null,
				};
			})
		);

	return changesWithBeforeSnapshot;
};

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
	const activeFile = await get(activeFileAtom);
	if (!activeFile) return [];
	const currentBranch = await get(currentVersionAtom);
	if (!currentBranch) return [];
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
				.on("version_change.version_id", "=", currentBranch.id)
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
				.when(changeInVersion(currentBranch))
				.then(1)
				.else(0)
				.end()
				.as("is_in_current_version")
		)
		.select("snapshot.content as snapshot_content_after")
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

export const selectedChangeIdsAtom = atom<string[]>([]);

export const activeDiscussionAtom = atom(async (get) => {
	const lix = await get(lixAtom);
	const currentVersion = await get(currentVersionAtom);
	const fileIdSearchParams = await get(fileIdSearchParamsAtom);
	if (!fileIdSearchParams || !currentVersion) return null;
	const discussionSearchParams = await get(discussionSearchParamsAtom);
	if (!discussionSearchParams) return null;

	// Fetch the discussion and its comments in a single query
	const discussionWithComments = await lix.db
		.selectFrom("discussion")
		.where("discussion.id", "=", discussionSearchParams)
		.select((eb) => [
			"discussion.id",
			jsonArrayFrom(
				eb
					.selectFrom("comment")
					.innerJoin("change", (join) =>
						join
							.onRef("change.entity_id", "=", "comment.id")
							.on("change.schema_key", "=", "lix_comment_table")
					)
					.where(changeInVersion(currentVersion))
					.leftJoin("change_author", "change_author.change_id", "change.id")
					.innerJoin("account", "account.id", "change_author.account_id")
					.select([
						"comment.id",
						"comment.content",
						"change.created_at",
						"account.id as account_id",
						"account.name as account_name",
						// "comment.created_at",
						// "account.id as account_id",
						// "account.name as account_name",
					])
					.whereRef("comment.discussion_id", "=", "discussion.id")
					.orderBy("change.created_at", "asc")
			).as("comments"),
		])
		.execute();

	if (!discussionWithComments.length) return null;

	return discussionWithComments[0];
});
