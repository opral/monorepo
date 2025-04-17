/**
 * State atoms for an active file
 */

import { atom } from "jotai";
import {
	lixAtom,
	fileIdSearchParamsAtom,
	withPollingAtom,
	activeVersionAtom,
	store,
} from "./state.ts";
import {
	changeHasLabel,
	changeSetElementInAncestryOf,
	changeSetHasLabel,
	changeSetIsAncestorOf,
	jsonArrayFrom,
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
 * Special change set which describes the current changes
 * that are not yet checkpointed.
 */
export const workingChangeSetAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	const activeFile = await get(activeFileAtom);
	if (!lix || !activeFile) return null;

	return await lix.db
		.selectFrom("change_set")
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
		.executeTakeFirst();
});

// The file manager app treats changes that are not in a change set as intermediate changes.
export const intermediateChangesAtom = atom<
	Promise<UiDiffComponentProps["diffs"]>
>(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	const activeFile = await get(activeFileAtom);
	const currentVersion = await get(activeVersionAtom);
	if (!currentVersion || !activeFile) return [];

	const intermediateLeafChanges = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		// .where(changeIsLeafInVersion(currentVersion))
		.where((eb) => eb.not(changeHasLabel({ name: "checkpoint" })))
		.where("change.file_id", "!=", "lix_own_change_control")
		.where("change.file_id", "=", activeFile.id)
		.select([
			"change.entity_id",
			"change.file_id",
			"change.plugin_key",
			"change.schema_key",
			sql`json(snapshot.content)`.as("snapshot_content_after"),
		])
		.execute();

	const changesWithBeforeSnapshots: UiDiffComponentProps["diffs"] =
		await Promise.all(
			intermediateLeafChanges.map(async (change) => {
				const snapshotBefore = await lix.db
					.selectFrom("change")
					.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
					// .where(changeInVersion(currentVersion))
					.where(changeHasLabel({ name: "checkpoint" }))
					.where("change.entity_id", "=", change.entity_id)
					.where("change.schema_key", "=", change.schema_key)
					.where("change.file_id", "=", activeFile.id)
					.orderBy("change.created_at", "desc")
					.limit(1)
					.select(sql`json(snapshot.content)`.as("snapshot_content_before"))
					.executeTakeFirst();

				return {
					...change,
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
				.where("change.schema_key", "=", "lix_change_set_table")
				.whereRef("change.entity_id", "=", "change_set.id")
				.select("change.created_at")
				.as("created_at")
		)
		.select((eb) =>
			eb
				.selectFrom("change_author")
				.innerJoin("change", "change.id", "change_author.change_id")
				.innerJoin("account", "account.id", "change_author.account_id")
				.whereRef("change.entity_id", "=", "change_set.id")
				.select("account.name")
				.as("author_name")
		)
		.orderBy("created_at", "desc")
		.execute();
});

// export const checkpointChangeSetsAtom = atom(async (get) => {
// 	get(withPollingAtom);
// 	const lix = await get(lixAtom);
// 	const activeFile = await get(activeFileAtom);
// 	if (!activeFile) return [];

// 	const checkpointChangeSets = await lix.db
// 		.selectFrom("change_set")
// 		.innerJoin(
// 			"change_set_element",
// 			"change_set_element.change_set_id",
// 			"change_set.id"
// 		)
// 		.leftJoin("change", "change.id", "change_set_element.change_id")
// 		.innerJoin("change as own_change", (join) =>
// 			join
// 				.onRef("own_change.entity_id", "=", "change_set.id")
// 				.on("own_change.schema_key", "=", "lix_change_set_table")
// 		)
// 		.innerJoin("change_author", "own_change.id", "change_author.change_id")
// 		.innerJoin("account", "change_author.account_id", "account.id")
// 		.leftJoin("discussion", "discussion.change_set_id", "change_set.id")
// 		// Join with the `comment` table, filtering for first-level comments
// 		.leftJoin("comment", "comment.discussion_id", "discussion.id")
// 		.where("comment.parent_id", "is", null) // Filter to get only the first comment
// 		.where(changeHasLabel({ name: "checkpoint" }))
// 		.where("change.file_id", "=", activeFile.id)
// 		.groupBy("change_set.id")
// 		.orderBy("change.created_at", "desc")
// 		.select("change_set.id")
// 		.select("discussion.id as discussion_id")
// 		.select("comment.content as first_comment_content") // Get the first comment's content
// 		.select("account.name as author_name")
// 		.select("own_change.created_at as checkpoint_created_at") // Get the change set's creation time
// 		.execute();

// 	return checkpointChangeSets;
// });

export const getChangeDiffs = async (
	changeSetId: string
): Promise<UiDiffComponentProps["diffs"]> => {
	const lix = await store.get(lixAtom);
	const activeFile = await store.get(activeFileAtom);

	if (!lix || !activeFile) return [];

	const checkpointChanges = await lix.db
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
		.where(changeSetElementInAncestryOf([{ id: changeSetId }]))
		.where(changeHasLabel({ name: "checkpoint" }))
		.where("change.file_id", "=", activeFile.id)
		.select("change.id")
		.select("change.created_at")
		.select("change.plugin_key")
		.select("change.schema_key")
		.select("change.entity_id")
		.select("change.file_id")
		.select(sql`json(snapshot.content)`.as("snapshot_content_after"))
		.execute();

	const changesWithBeforeSnapshot: UiDiffComponentProps["diffs"] =
		await Promise.all(
			checkpointChanges.map(async (change) => {
				const snapshotBefore = await lix.db
					.selectFrom("change")
					.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
					.innerJoin("change_edge", "change_edge.parent_id", "change.id")
					.innerJoin(
						"change as ancestors",
						"ancestors.id",
						"change_edge.parent_id"
					) // Ensure we traverse the hierarchy
					.where("ancestors.created_at", "<", change.created_at) // Ensure the ancestor is before the change
					.where("ancestors.entity_id", "=", change.entity_id)
					.where("ancestors.schema_key", "=", change.schema_key)
					.where("ancestors.file_id", "=", activeFile.id)
					.where(changeHasLabel({ name: "checkpoint" }))
					// .where(changeInVersion(currentVersion))
					.orderBy("ancestors.created_at", "desc")
					.limit(1)
					.select(sql`json(snapshot.content)`.as("snapshot_content_before"))
					.executeTakeFirst();

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

export const getDiscussion = async (changeSetId: string) => {
	const lix = await store.get(lixAtom);
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
