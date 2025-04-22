/**
 * State atoms for an active file
 */

import { atom } from "jotai";
import {
	lixAtom,
	fileIdSearchParamsAtom,
	withPollingAtom,
	activeVersionAtom,
} from "./state.ts";
import {
	changeHasLabel,
	changeSetElementIsLeafOf,
	changeSetHasLabel,
	changeSetIsAncestorOf,
	jsonArrayFrom,
	Lix,
	sql,
	UiDiffComponentProps,
} from "@lix-js/sdk";
import { redirect } from "react-router-dom";
// import { parseMdBlocks } from "@lix-js/plugin-md";

export const activeFileAtom = atom(async (get) => {
	get(withPollingAtom);
	const fileId = get(fileIdSearchParamsAtom);

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

export const loadedMdAtom = atom(async (get) => {
	const file = await get(activeFileAtom);
	if (!file) throw new Error("No file selected");
	const data = await new Blob([file.data]).text();
	// console.log(parseMdBlocks(new TextEncoder().encode(data)));
	return data;
});

/**
 * Get working change set for a specific file
 * This is extracted to be reusable across the application
 */
export const getWorkingChangeSet = async (lix: Lix, fileId: string) => {
	// Get the active version with working change set id
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version_v2", "active_version.version_id", "version_v2.id")
		.selectAll("version_v2")
		.executeTakeFirst();

	if (!activeVersion) return null;

	// Get the working change set
	return await lix.db
		.selectFrom("change_set")
		.where("id", "=", activeVersion.working_change_set_id)
		// left join in case the change set has no elements
		.leftJoin(
			"change_set_element",
			"change_set.id",
			"change_set_element.change_set_id"
		)
		.where("file_id", "=", fileId)
		.selectAll("change_set")
		.groupBy("change_set.id")
		.select((eb) => [
			eb.fn.count<number>("change_set_element.change_id").as("change_count"),
		])
		.executeTakeFirst();
};

/**
 * Special change set which describes the current changes
 * that are not yet checkpointed.
 */
export const workingChangeSetAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	const activeFile = await get(activeFileAtom);
	if (!lix || !activeFile) return null;

	return await getWorkingChangeSet(lix, activeFile.id);
});

// The file manager app treats changes that are in the working change set as intermediate changes.
export const intermediateChangesAtom = atom<
	Promise<UiDiffComponentProps["diffs"]>
>(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	const activeFile = await get(activeFileAtom);
	const currentVersion = await get(activeVersionAtom);
	const checkpointChanges = await get(checkpointChangeSetsAtom);
	if (!currentVersion || !activeFile) return [];

	// Get all changes in the working change set
	const workingChangeSetId = currentVersion.working_change_set_id;

	// Get changes that are in the working change set
	const intermediateChanges = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where("change_set_element.change_set_id", "=", workingChangeSetId)
		.where("change.file_id", "=", activeFile.id)
		.where("change.file_id", "!=", "lix_own_change_control")
		.select([
			"change.id",
			"change.entity_id",
			"change.file_id",
			"change.plugin_key",
			"change.schema_key",
			"change.created_at",
			sql`json(snapshot.content)`.as("snapshot_content_after"),
		])
		.execute();

	const latestCheckpointChangeSetId = checkpointChanges?.[0]?.id;
	// If there are no checkpoint changes, we can't get the before snapshot

	const changesWithBeforeSnapshots: UiDiffComponentProps["diffs"] =
		await Promise.all(
			intermediateChanges.map(async (change) => {
				let snapshotBefore = null;

				// First try to find the entity in the latest checkpoint change set
				if (latestCheckpointChangeSetId) {
					snapshotBefore = await lix.db
						.selectFrom("change")
						.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
						.innerJoin(
							"change_set_element",
							"change_set_element.change_id",
							"change.id"
						)
						.where(
							"change_set_element.change_set_id",
							"=",
							latestCheckpointChangeSetId
						)
						.where("change.entity_id", "=", change.entity_id)
						.where("change.schema_key", "=", change.schema_key)
						.where("change.file_id", "=", activeFile.id)
						.select(sql`json(snapshot.content)`.as("snapshot_content_before"))
						.orderBy("change.created_at", "desc")
						.limit(1)
						.executeTakeFirst();
				}

				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { id, ...rest } = change;

				return {
					...rest,
					snapshot_content_after: change.snapshot_content_after
						? typeof change.snapshot_content_after === "string"
							? JSON.parse(change.snapshot_content_after)
							: change.snapshot_content_after
						: null,
					snapshot_content_before: snapshotBefore?.snapshot_content_before
						? typeof snapshotBefore.snapshot_content_before === "string"
							? JSON.parse(snapshotBefore.snapshot_content_before)
							: snapshotBefore.snapshot_content_before
						: null,
				};
			})
		);

	return changesWithBeforeSnapshots;
});

export const checkpointChangeSetsAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	const activeFile = await get(activeFileAtom);
	const activeVersion = await get(activeVersionAtom);
	if (!activeFile || !activeVersion) return [];

	return await lix.db
		.selectFrom("change_set")
		.where(changeSetHasLabel({ name: "checkpoint" }))
		.where(
			changeSetIsAncestorOf(
				{ id: activeVersion.change_set_id },
				// in case the checkpoint is the active version's change set
				{ includeSelf: true }
			)
		)
		// left join in case the change set has no elements
		.leftJoin(
			"change_set_element",
			"change_set.id",
			"change_set_element.change_set_id"
		)
		.where("file_id", "=", activeFile.id)
		.selectAll("change_set")
		.groupBy("change_set.id")
		.select((eb) => [
			eb.fn.count<number>("change_set_element.change_id").as("change_count"),
		])
		.select((eb) =>
			eb
				.selectFrom("change")
				.where("change.schema_key", "=", "lix_change_set_label_table")
				.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
				.where(
					// @ts-expect-error - this is a workaround for the type system
					(eb) => eb.ref("snapshot.content", "->>").key("change_set_id"),
					"=",
					eb.ref("change_set.id")
				)
				.select("change.created_at")
				.as("created_at")
		)
		.select((eb) =>
			eb
				.selectFrom("change_author")
				.innerJoin("change", "change.id", "change_author.change_id")
				.innerJoin("account", "account.id", "change_author.account_id")
				.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
				.where("change.schema_key", "=", "lix_change_set_label_table")
				.where(
					// @ts-expect-error - this is a workaround for the type system
					(eb) => eb.ref("snapshot.content", "->>").key("change_set_id"),
					"=",
					eb.ref("change_set.id")
				)
				.select("account.name")
				.as("author_name")
		)
		.orderBy("created_at", "desc")
		.execute();
});

export const getChangeDiffs = async (
	lix: Lix,
	activeFileId: string,
	changeSetId: string,
	changeSetBeforeId?: string
): Promise<UiDiffComponentProps["diffs"]> => {
	// Get leaf changes for this change set
	const checkpointChanges = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where("change_set_element.change_set_id", "=", changeSetId)
		.where(changeSetElementIsLeafOf([{ id: changeSetId }])) // Only get leaf changes
		.where(changeHasLabel({ name: "checkpoint" }))
		.where("change.file_id", "=", activeFileId)
		.select([
			"change.id",
			"change.created_at",
			"change.plugin_key",
			"change.schema_key",
			"change.entity_id",
			"change.file_id",
		])
		.select(sql`json(snapshot.content)`.as("snapshot_content_after"))
		.execute();

	// Process each change to include before snapshots
	const changesWithBeforeSnapshot: UiDiffComponentProps["diffs"] =
		await Promise.all(
			checkpointChanges.map(async (change) => {
				let snapshotBefore = null;

				// If we have a previous change set, look for the same entity in it
				if (changeSetBeforeId) {
					snapshotBefore = await lix.db
						.selectFrom("change")
						.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
						.innerJoin(
							"change_set_element",
							"change_set_element.change_id",
							"change.id"
						)
						.where("change_set_element.change_set_id", "=", changeSetBeforeId)
						.where("change.entity_id", "=", change.entity_id)
						.where("change.schema_key", "=", change.schema_key)
						.where("change.file_id", "=", activeFileId)
						.where(changeHasLabel({ name: "checkpoint" }))
						.select(sql`json(snapshot.content)`.as("snapshot_content_before"))
						.orderBy("change.created_at", "desc")
						.limit(1)
						.executeTakeFirst();
				}

				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { id, ...rest } = change;

				return {
					...rest,
					snapshot_content_after: change.snapshot_content_after
						? typeof change.snapshot_content_after === "string"
							? JSON.parse(change.snapshot_content_after)
							: change.snapshot_content_after
						: null,
					snapshot_content_before: snapshotBefore?.snapshot_content_before
						? typeof snapshotBefore.snapshot_content_before === "string"
							? JSON.parse(snapshotBefore.snapshot_content_before)
							: snapshotBefore.snapshot_content_before
						: null,
				};
			})
		);

	return changesWithBeforeSnapshot;
};

export const getDiscussion = async (lix: Lix, changeSetId: string) => {
	if (!changeSetId || !lix) return null;

	return await lix.db
		.selectFrom("discussion")
		.where("change_set_id", "=", changeSetId)
		.select((eb) => [
			jsonArrayFrom(
				eb
					.selectFrom("comment")
					.select(["comment.content", "comment.id", "comment.discussion_id"])
					.innerJoin("change", "change.entity_id", "comment.id")
					.innerJoin("change_author", "change_author.change_id", "change.id")
					.innerJoin("account", "account.id", "change_author.account_id")
					.select(["change.created_at", "account.name as author_name"])
					.whereRef("comment.discussion_id", "=", "discussion.id")
			).as("comments"),
		])
		.selectAll("discussion")
		.executeTakeFirst();
};
