/**
 * State atoms for an active file
 */

import { atom } from "jotai";
import {
	lixAtom,
	fileIdSearchParamsAtom,
	withPollingAtom,
	activeVersionAtom,
	threadSearchParamsAtom,
} from "./state.ts";
import {
	changeSetElementIsLeafOf,
	commitIsAncestorOf,
	jsonArrayFrom,
	Lix,
	sql,
	UiDiffComponentProps,
	ebEntity,
} from "@lix-js/sdk";
import { redirect } from "react-router-dom";

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

/**
 * Get working change set for a specific file
 * This is extracted to be reusable across the application
 */
export const getWorkingChangeSet = async (lix: Lix, fileId: string) => {
	// Get the active version with working change set id
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.selectAll("version")
		.executeTakeFirst();

	if (!activeVersion) return null;

	// Get the working commit and its change set
	const workingCommit = await lix.db
		.selectFrom("commit")
		.where("id", "=", activeVersion.working_commit_id)
		.selectAll()
		.executeTakeFirst();

	if (!workingCommit) return null;

	// Get the working change set
	return await lix.db
		.selectFrom("change_set")
		.where("id", "=", workingCommit.change_set_id)
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

// The file manager app treats changes that are not in a change set as intermediate changes.
export const intermediateChangesAtom = atom<
	Promise<UiDiffComponentProps["diffs"]>
>(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	const activeFile = await get(activeFileAtom);
	const activeVersion = await get(activeVersionAtom);
	const checkpointChanges = await get(checkpointChangeSetsAtom);
	if (!activeVersion) return [];

	// Get the working commit and its change set
	const workingCommit = await lix.db
		.selectFrom("commit")
		.where("id", "=", activeVersion.working_commit_id)
		.selectAll()
		.executeTakeFirst();

	if (!workingCommit) return [];

	const workingChangeSetId = workingCommit.change_set_id;

	// Get changes that are in the working change set
	const queryIntermediateLeafChanges = lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where(changeSetElementIsLeafOf([{ id: workingChangeSetId }])) // Only get leaf changes
		.where("change_set_element.change_set_id", "=", workingChangeSetId)
		.where("change.file_id", "!=", "lix_own_change_control")
		.select([
			"change.id",
			"change.entity_id",
			"change.file_id",
			"change.plugin_key",
			"change.schema_key",
			"change.created_at",
			"change.snapshot_content as snapshot_content_after",
		]);

	if (activeFile) {
		queryIntermediateLeafChanges.where("change.file_id", "=", activeFile.id);
	}

	const intermediateLeafChanges = await queryIntermediateLeafChanges.execute();

	const latestCheckpointChangeSetId = checkpointChanges?.[0]?.id;
	// If there are no checkpoint changes, we can't get the before snapshot

	const changesWithBeforeSnapshots: UiDiffComponentProps["diffs"] =
		await Promise.all(
			intermediateLeafChanges.map(async (change) => {
				let snapshotBefore = null;

				// First try to find the entity in the latest checkpoint change set
				if (latestCheckpointChangeSetId) {
					let snapshotBeforeQuery = lix.db
						.selectFrom("change")
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
						.select("change.snapshot_content as snapshot_content_before")
						.orderBy("change.created_at", "desc")
						.limit(1);

					if (activeFile) {
						snapshotBeforeQuery = snapshotBeforeQuery.where(
							"change.file_id",
							"=",
							activeFile.id
						);
					}
					snapshotBefore = await snapshotBeforeQuery.executeTakeFirst();
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
	if (!activeVersion) return [];

	// Get change sets that have the checkpoint label and are ancestors of the active version's commit
	// Also include the commit ID so we can query threads
	let query = lix.db
		.selectFrom("change_set")
		.innerJoin("commit", "commit.change_set_id", "change_set.id")
		.where(ebEntity("change_set").hasLabel({ name: "checkpoint" }))
		.where(commitIsAncestorOf({ id: activeVersion.commit_id }, { includeSelf: true }))
		.leftJoin(
			"change_set_element",
			"change_set.id",
			"change_set_element.change_set_id"
		)
		.selectAll("change_set")
		.select("commit.id as commit_id")
		.groupBy(["change_set.id", "commit.id"])
		.select((eb) => [
			eb.fn.count<number>("change_set_element.change_id").as("change_count"),
		])
		.select((eb) =>
			eb
				.selectFrom("change")
				.where("change.schema_key", "=", "lix_change_set_label_table")
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
		.orderBy("created_at", "desc");

	if (activeFile) {
		query = query.where("file_id", "=", activeFile.id);
	}

	return await query.execute();
});

export const getChangeDiffs = async (
	lix: Lix,
	changeSetId: string,
	changeSetBeforeId?: string | null,
	activeFileId?: string | null
): Promise<UiDiffComponentProps["diffs"]> => {
	// Get active version to filter by current version
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.selectAll("version")
		.executeTakeFirst();

	if (!activeVersion) {
		return [];
	}

	let checkpointChangesQuery = lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where("change_set_element.change_set_id", "=", changeSetId)
		.where(changeSetElementIsLeafOf([{ id: changeSetId }])) // Only get leaf changes
		.where(ebEntity("change").hasLabel({ name: "checkpoint" }))
		.selectAll("change")
		.select(sql`json(snapshot.content)`.as("snapshot_content_after"));

	if (activeFileId) {
		checkpointChangesQuery = checkpointChangesQuery.where(
			"change.file_id",
			"=",
			activeFileId
		);
	}

	const checkpointChanges = await checkpointChangesQuery.execute();

	// Process each change to include before snapshots
	const changesWithBeforeSnapshot: UiDiffComponentProps["diffs"] =
		await Promise.all(
			checkpointChanges.map(async (change) => {
				let snapshotBefore = null;

				// If we have a previous change set, look for the same entity in it
				if (changeSetBeforeId) {
					let snapshotBeforeQuery = lix.db
						.selectFrom("change")
						.innerJoin(
							"change_set_element",
							"change_set_element.change_id",
							"change.id"
						)
						.where(changeSetElementIsLeafOf([{ id: changeSetBeforeId }]))
						.where("change.entity_id", "=", change.entity_id)
						.where("change.schema_key", "=", change.schema_key)
						.where(ebEntity("change").hasLabel({ name: "checkpoint" }))
						.select(sql`json(snapshot.content)`.as("snapshot_content_before"))
						.orderBy("change.created_at", "desc")
						.limit(1);

					if (activeFileId) {
						snapshotBeforeQuery = snapshotBeforeQuery.where(
							"change.file_id",
							"=",
							activeFileId
						);
					}

					snapshotBefore = await snapshotBeforeQuery.executeTakeFirst();
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

export const getThreads = async (lix: Lix, commitId: string) => {
	if (!commitId || !lix) return null;

	return await lix.db
		.selectFrom("thread")
		.leftJoin("entity_thread", "thread.id", "entity_thread.thread_id")
		.where("entity_thread.entity_id", "=", commitId)
		.where("entity_thread.schema_key", "=", "lix_commit")
		.where("entity_thread.file_id", "=", "lix")
		.select((eb) => [
			jsonArrayFrom(
				eb
					.selectFrom("thread_comment")
					.innerJoin("change", "change.entity_id", "thread_comment.id")
					.innerJoin("change_author", "change_author.change_id", "change.id")
					.innerJoin("account", "account.id", "change_author.account_id")
					.select([
						"thread_comment.id",
						"thread_comment.body",
						"thread_comment.thread_id",
						"thread_comment.parent_id",
					])
					.select(["change.created_at", "account.name as author_name"])
					.whereRef("thread_comment.thread_id", "=", "thread.id")
			).as("comments"),
		])
		.selectAll("thread")
		.execute();
};

export const selectedChangeIdsAtom = atom<string[]>([]);

export const activeThreadAtom = atom(async (get) => {
	const lix = await get(lixAtom);
	const activeVersion = await get(activeVersionAtom);
	const fileIdSearchParams = get(fileIdSearchParamsAtom);
	if (!fileIdSearchParams || !activeVersion) return null;
	const threadSearchParams = await get(threadSearchParamsAtom);
	if (!threadSearchParams) return null;

	// Fetch the thread and its comments in a single query
	const threadsWithComments = await lix.db
		.selectFrom("thread")
		.where("thread.id", "=", threadSearchParams)
		.select((eb) => [
			"thread.id",
			jsonArrayFrom(
				eb
					.selectFrom("thread_comment")
					.innerJoin("change", (join) =>
						join
							.onRef("change.entity_id", "=", "thread_comment.id")
							.on("change.schema_key", "=", "lix_comment_table")
					)
					.leftJoin("change_author", "change_author.change_id", "change.id")
					.innerJoin("account", "account.id", "change_author.account_id")
					.select([
						"thread_comment.id",
						"thread_comment.body",
						"change.created_at",
						"account.id as account_id",
						"account.name as account_name",
						// "comment.created_at",
						// "account.id as account_id",
						// "account.name as account_name",
					])
					.whereRef("thread_comment.thread_id", "=", "thread.id")
					.orderBy("change.created_at", "asc")
			).as("comments"),
		])
		.execute();

	if (!threadsWithComments.length) return null;

	return threadsWithComments[0];
});
