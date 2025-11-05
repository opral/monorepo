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
import { jsonArrayFrom, Lix, sql, RenderDiffArgs, ebEntity } from "@lix-js/sdk";
import { CellSchemaV1 } from "@lix-js/plugin-csv";

export const activeFileAtom = atom(async (get) => {
	get(withPollingAtom);
	const fileId = get(fileIdSearchParamsAtom);

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
	const data = await new Blob([file.data as any]).text();
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
	const lix = await get(lixAtom);
	const activeFile = await get(activeFileAtom);
	const cellEntityId = await get(activeCellEntityIdAtom);
	// const currentVersion = await get(currentVersionAtom);
	if (!cellEntityId || !activeFile) return [];
	const changes = await lix.db
		.selectFrom("change")
		.where("change.schema_key", "=", CellSchemaV1["x-lix-key"])
		.where("change.entity_id", "=", cellEntityId)
		.where("change.file_id", "=", activeFile.id)
		// .leftJoin("version_change", "version_change.change_id", "change.id")
		// .where((eb) =>
		// 	eb.or([
		// 		eb("version_change.version_id", "=", currentVersion.id),
		// 		eb("version_change.change_id", "is", null),
		// 	])
		// )
		// .innerJoin("change_set_item", "change_set_item.change_id", "change.id")
		// .innerJoin("change_set", "change_set.id", "change_set_item.change_set_id")
		// .innerJoin("discussion", "discussion.change_set_id", "change_set.id")
		// .innerJoin("comment", "comment.discussion_id", "discussion.id")
		// .selectAll("change")
		// .select((eb) => eb.fn.count("comment.id").as("comment_count"))
		.selectAll("change")
		.orderBy("change.created_at", "desc")
		.execute();

	for (const change of changes) {
		const labels = await lix.db
			.selectFrom("label")
			// .innerJoin("change_set_label", "change_set_label.label_id", "label.id")
			// .innerJoin(
			// "change_set",
			// "change_set.id",
			// "change_set_label.change_set_id"
			// )
			// .innerJoin(
			// "change_set_element",
			// "change_set_element.change_set_id",
			// "change_set.id"
			// )
			// .where("change_set_element.change_id", "=", change.id)
			.select("label.name")
			.execute();

		// @ts-expect-error - labels is not in the type
		change.labels = labels.map((label) => label.name);
	}
	return changes;
});

/**
 * Get working change set for a specific file
 * This is extracted to be reusable across the application
 */
export const getWorkingChangeSet = async (lix: Lix, fileId: string) => {
	// Get the active version with working commit id
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.selectAll("version")
		.executeTakeFirst();

	if (!activeVersion) return null;

	// Get the working commit
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

// The file manager app treats changes that are in the working change set as intermediate changes.
export const intermediateChangesAtom = atom<Promise<RenderDiffArgs["diffs"]>>(
	async (get) => {
		get(withPollingAtom);
		const lix = await get(lixAtom);
		const activeFile = await get(activeFileAtom);
		const activeVersion = await get(currentVersionAtom);
		const checkpointChanges = await get(checkpointChangeSetsAtom);
		if (!activeVersion || !activeFile) return [];

		// Get the working commit
		const workingCommit = await lix.db
			.selectFrom("commit")
			.where("id", "=", activeVersion.working_commit_id)
			.selectAll()
			.executeTakeFirst();

		if (!workingCommit) return [];

		// Get all changes in the working change set
		const workingChangeSetId = workingCommit.change_set_id;

		// Get changes that are in the working change set
		const intermediateChanges = await lix.db
			.selectFrom("change")
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

		const changesWithBeforeSnapshots: RenderDiffArgs["diffs"] =
			await Promise.all(
				intermediateChanges.map(async (change) => {
					let snapshotBefore = null;

					// First try to find the entity in the latest checkpoint change set
					if (latestCheckpointChangeSetId) {
						snapshotBefore = await lix.db
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
							.where("change.file_id", "=", activeFile.id)
							.select(
								sql`json(change.snapshot_content)`.as("before_snapshot_content")
							)
							.orderBy("change.created_at", "desc")
							.limit(1)
							.executeTakeFirst();
					}

					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const { id, ...rest } = change;

					return {
						...rest,
						after_snapshot_content: change.snapshot_content_after
							? typeof change.snapshot_content_after === "string"
								? JSON.parse(change.snapshot_content_after)
								: change.snapshot_content_after
							: null,
						before_snapshot_content: snapshotBefore?.before_snapshot_content
							? typeof snapshotBefore.before_snapshot_content === "string"
								? JSON.parse(snapshotBefore.before_snapshot_content)
								: snapshotBefore.before_snapshot_content
							: null,
					};
				})
			);

		return changesWithBeforeSnapshots;
	}
);

export const checkpointChangeSetsAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	const activeFile = await get(activeFileAtom);
	const activeVersion = await get(currentVersionAtom);
	if (!activeFile || !activeVersion) return [];

	// Query for commits that have the checkpoint label and are ancestors of current commit
	const checkpointCommits = await lix.db
		.selectFrom("commit")
		.where(ebEntity("commit").hasLabel({ name: "checkpoint" }))
		// Get commits that are ancestors of the current version's commit
		.where((eb) =>
			eb.exists(
				eb
					.selectFrom("commit_edge")
					.whereRef("commit_edge.parent_id", "=", "commit.id")
					.where((eb) =>
						eb.or([
							// Direct parent
							eb("commit_edge.child_id", "=", activeVersion.commit_id),
							// Or transitive ancestor
							eb.exists(
								eb
									.selectFrom("commit_edge as ce2")
									.whereRef("ce2.parent_id", "=", "commit_edge.child_id")
									.where("ce2.child_id", "=", activeVersion.commit_id)
							),
						])
					)
			)
		)
		// Get the associated change set data
		.innerJoin("change_set", "change_set.id", "commit.change_set_id")
		// left join in case the change set has no elements
		.leftJoin(
			"change_set_element",
			"change_set.id",
			"change_set_element.change_set_id"
		)
		.where("file_id", "=", activeFile.id)
		.select([
			"change_set.id",
			sql`commit.id`.as("commit_id"),
			sql`commit.created_at`.as("created_at"),
		])
		.select((eb) =>
			eb.fn.count<number>("change_set_element.change_id").as("change_count")
		)
		.select(() => sql<string | null>`NULL`.as("author_name"))
		.groupBy(["change_set.id", "commit.id"])
		.orderBy("created_at", "desc")
		.execute();

	return checkpointCommits;
});

export const allChangesAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	const activeFile = await get(activeFileAtom);
	// const currentVersion = await get(currentVersionAtom);

	if (!activeFile) return [];
	return await lix.db
		.selectFrom("change")
		.where("change.file_id", "=", activeFile.id)
		// .leftJoin("version_change", "version_change.change_id", "change.id")
		// .where((eb) =>
		// 	eb.or([
		// 		eb("version_change.version_id", "=", currentVersion.id),
		// 		eb("version_change.change_id", "is", null),
		// 	])
		// )
		.selectAll("change")
		.execute();
});

export const changesCurrentVersionAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	const activeFile = await get(activeFileAtom);
	// const currentVersion = await get(currentVersionAtom);

	if (!activeFile) return [];

	return await lix.db
		.selectFrom("change")
		.where("change.file_id", "=", activeFile.id)
		// .leftJoin("version_change", "version_change.change_id", "change.id")
		// .where((eb) =>
		// 	eb.or([
		// 		eb("version_change.version_id", "=", currentVersion.id),
		// 		eb("version_change.change_id", "is", null),
		// 	])
		// )
		.selectAll("change")
		.execute();
});

export const getConversations = async (lix: Lix, changeSetId: string) => {
	if (!changeSetId || !lix) return null;

	// Get the commit associated with the change set
	const commit = await lix.db
		.selectFrom("commit")
		.where("change_set_id", "=", changeSetId)
		.selectAll()
		.executeTakeFirst();

	if (!commit) return [];

	// Query conversations attached to the commit using the entity_conversation system
	return await lix.db
		.selectFrom("conversation")
		.innerJoin(
			"entity_conversation",
			"conversation.id",
			"entity_conversation.conversation_id"
		)
		.where("entity_conversation.entity_id", "=", commit.id)
		.where("entity_conversation.schema_key", "=", "lix_commit")
		.where("entity_conversation.file_id", "=", "lix")
		.select((eb) => [
			jsonArrayFrom(
				eb
					.selectFrom("conversation_message")
					.innerJoin("change", "change.entity_id", "conversation_message.id")
					.innerJoin("change_author", "change_author.change_id", "change.id")
					.innerJoin("account", "account.id", "change_author.account_id")
					.select([
						"conversation_message.id",
						"conversation_message.body",
						"conversation_message.conversation_id",
						"conversation_message.parent_id",
					])
					.select(["change.created_at", "account.name as author_name"])
					.whereRef(
						"conversation_message.conversation_id",
						"=",
						"conversation.id"
					)
			).as("comments"),
		])
		.selectAll("conversation")
		.execute();
};

export const allEdgesAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	const activeFile = await get(activeFileAtom);

	if (!activeFile) return [];

	// Query for commit edges instead of change set edges
	return await lix.db
		.selectFrom("commit_edge")
		.innerJoin("commit", "commit.id", "commit_edge.parent_id")
		.innerJoin("change_set", "change_set.id", "commit.change_set_id")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_set_id",
			"change_set.id"
		)
		.innerJoin("change", "change.id", "change_set_element.change_id")
		.where("change.file_id", "=", activeFile.id)
		.select(["commit_edge.parent_id", "commit_edge.child_id"])
		.distinct()
		.execute();
});

// Conflict resolution is not yet implemented
// export const changeConflictsAtom = atom(async (get) => {
// 	get(withPollingAtom);
// 	const lix = await get(lixAtom);
// 	// const activeFile = await get(activeFileAtom);
// 	const currentVersion = await get(currentVersionAtom);

// 	const changeConflictElements = await lix.db
// 		.selectFrom("change_set_element")
// 		.innerJoin(
// 			"change_conflict",
// 			"change_conflict.change_set_id",
// 			"change_set_element.change_set_id"
// 		)
// 		.innerJoin("change", "change.id", "change_set_element.change_id")
// 		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
// 		.leftJoin("version_change", (join) =>
// 			join
// 				.onRef("version_change.change_id", "=", "change.id")
// 				.on("version_change.version_id", "=", currentVersion.id)
// 		)
// 		// .where((eb) =>
// 		// 	eb.or([
// 		// 		eb("change.file_id", "=", activeFile.id),
// 		// 		eb("change.file_id", "=", "null"),
// 		// 	])
// 		// )
// 		// .where(changeConflictInVersion(currentVersion))
// 		.selectAll("change_set_element")
// 		.select([
// 			"change_conflict.id as change_conflict_id",
// 			"change_conflict.change_set_id as change_conflict_change_set_id",
// 		])
// 		.selectAll("change")
// 		.select((eb) =>
// 			eb
// 				.case()
// 				.when("version_change.change_id", "is not", null)
// 				// using boolean still returns 0 or 1
// 				// for typesafety, number is used
// 				.then(1)
// 				.else(0)
// 				.end()
// 				.as("is_current_version_change")
// 		)
// 		.select((eb) =>
// 			eb
// 				.case()
// 				.when(
// 					eb.exists(
// 						eb
// 							.selectFrom("version_change")
// 							.whereRef("version_change.change_id", "=", "change.id")
// 							.where("version_change.version_id", "=", currentVersion.id)
// 					)
// 				)
// 				.then(1)
// 				.else(0)
// 				.end()
// 				.as("is_in_current_version")
// 		)
// 		.select("snapshot.content")
// 		.select("change_conflict.key as change_conflict_key")
// 		.execute();

// 	const groupedByConflictId: { [key: string]: typeof changeConflictElements } =
// 		{};

// 	for (const element of changeConflictElements) {
// 		const conflictId = element.change_conflict_id;
// 		if (!groupedByConflictId[conflictId]) {
// 			groupedByConflictId[conflictId] = [];
// 		}
// 		groupedByConflictId[conflictId].push(element);
// 	}

// 	return groupedByConflictId;
// });
