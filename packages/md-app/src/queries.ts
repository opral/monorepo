import {
	switchAccount,
	Lix,
	Account,
	changeSetHasLabel,
	jsonArrayFrom,
	ChangeSet,
	LixFileDescriptor,
} from "@lix-js/sdk";
import {
	MarkdownNodeSchemaV1,
	MarkdownRootSchemaV1,
	plugin as mdPlugin,
} from "@lix-js/plugin-md";

/**
 * Selects the current version
 */
export const selectActiveVersion = (lix: Lix) =>
	lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.selectAll("version");

/**
 * Selects all versions
 */
export const selectVersions = (lix: Lix) =>
	lix.db.selectFrom("version").selectAll().where("hidden", "=", false);

/**
 * Selects all files (metadata only, no content)
 */
export const selectFiles = (lix: Lix) =>
	lix.db.selectFrom("file").select(["id", "path", "metadata"]);

/**
 * Selects the active file based on URL parameters
 */
export const selectActiveFile = (lix: Lix) =>
	lix.db
		.selectFrom("file")
		.where(
			"id",
			"=",
			lix.db
				.selectFrom("key_value")
				.where("key", "=", "flashtype_active_file")
				.select("value")
		)
		.select(["id", "path", "metadata"]);

/**
 * Selects all accounts
 */
export const selectAccounts = (lix: Lix) =>
	lix.db.selectFrom("account").selectAll();

/**
 * Selects the current active account
 */
export const selectActiveAccount = (lix: Lix) =>
	lix.db.selectFrom("active_account").selectAll();

/**
 * Selects checkpoints for the active file
 */
export function selectCheckpoints(lix: Lix) {
	// This function needs to work with the changeSetIsAncestorOf helper
	// For now, let's simplify it to just get checkpoints
	return (
		lix.db
			.selectFrom("change_set")
			.where(changeSetHasLabel({ name: "checkpoint" }))
			// left join in case the change set has no elements
			.leftJoin(
				"change_set_element",
				"change_set.id",
				"change_set_element.change_set_id"
			)
			.where(
				"file_id",
				"=",
				lix.db
					.selectFrom("key_value")
					.where("key", "=", "flashtype_active_file")
					.select("value")
			)
			.selectAll("change_set")
			.groupBy("change_set.id")
			.select((eb) => [
				eb.fn.count<number>("change_set_element.change_id").as("change_count"),
				eb
					.selectFrom("change_set_label")
					.innerJoin("label", "label.id", "change_set_label.label_id")
					.where("change_set_label.change_set_id", "=", eb.ref("change_set.id"))
					.where("label.name", "=", "checkpoint")
					.select("change_set_label.lixcol_created_at")
					.as("checkpoint_created_at"),
			])
			.orderBy("checkpoint_created_at", "desc")
	);
}

// export async function selectCheckpointChangeSets(): Promise<
// 	Array<
// 		ChangeSet & {
// 			change_count: number;
// 			created_at: string | null;
// 			author_name: string | null;
// 		}
// 	>
// > {
// 	const lix = await ensureLix();
// 	const activeFile = await selectActiveVersion(lix).executeTakeFirst();
// 	const activeVersion =
// 		await selectActiveVersion(lix).executeTakeFirstOrThrow();

// 	if (!activeFile || !activeVersion) return [];

// 	const result = await lix.db
// 		.selectFrom("change_set")
// 		.where(changeSetHasLabel({ name: "checkpoint" }))
// 		.where(
// 			changeSetIsAncestorOf(
// 				{ id: activeVersion.change_set_id },
// 				// in case the checkpoint is the active version's change set
// 				{ includeSelf: true }
// 			)
// 		)
// 		// left join in case the change set has no elements
// 		.leftJoin(
// 			"change_set_element",
// 			"change_set.id",
// 			"change_set_element.change_set_id"
// 		)
// 		.where("file_id", "=", activeFile.id)
// 		.selectAll("change_set")
// 		.groupBy("change_set.id")
// 		.select((eb) => [
// 			eb.fn.count<number>("change_set_element.change_id").as("change_count"),
// 		])
// 		.select((eb) =>
// 			eb
// 				.selectFrom("change")
// 				.where("change.schema_key", "=", "lix_change_set_label_table")
// 				.where(
// 					// @ts-expect-error - this is a workaround for the type system
// 					(eb) => eb.ref("change.snapshot_content", "->>").key("change_set_id"),
// 					"=",
// 					eb.ref("change_set.id")
// 				)
// 				.select("change.created_at")
// 				.as("created_at")
// 		)
// 		.select((eb) =>
// 			eb
// 				.selectFrom("change_author")
// 				.innerJoin("change", "change.id", "change_author.change_id")
// 				.innerJoin("account", "account.id", "change_author.account_id")
// 				.where("change.schema_key", "=", "lix_change_set_label_table")
// 				.where(
// 					// @ts-expect-error - this is a workaround for the type system
// 					(eb) => eb.ref("change.snapshot_content", "->>").key("change_set_id"),
// 					"=",
// 					eb.ref("change_set.id")
// 				)
// 				.select("account.name")
// 				.as("author_name")
// 		)
// 		.orderBy("created_at", "desc")
// 		.execute();

// 	return result;
// }

/**
 * Special change set which describes the current changes
 * that are not yet checkpointed.
 */
export function selectWorkingChangeSet(lix: Lix) {
	return (
		lix.db
			.selectFrom("change_set")
			.where(
				"id",
				"=",
				lix.db
					.selectFrom("active_version")
					.innerJoin("version", "active_version.version_id", "version.id")
					.select("version.working_change_set_id")
			)
			// left join in case the change set has no elements
			.leftJoin(
				"change_set_element",
				"change_set.id",
				"change_set_element.change_set_id"
			)
			.where(
				"file_id",
				"=",
				lix.db
					.selectFrom("key_value")
					.where("key", "=", "flashtype_active_file")
					.select("value")
			)
			.selectAll("change_set")
			.groupBy("change_set.id")
			.select((eb) => [
				eb.fn.count<number>("change_set_element.change_id").as("change_count"),
			])
	);
}

/**
 * Selects intermediate changes (changes in working change set)
 */

export function selectWorkingChanges(lix: Lix) {
	return lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where(
			"change_set_element.change_set_id",
			"=",
			lix.db
				.selectFrom("active_version")
				.innerJoin("version", "active_version.version_id", "version.id")
				.select("version.working_change_set_id")
		)
		.where(
			"change.file_id",
			"=",
			lix.db
				.selectFrom("key_value")
				.where("key", "=", "flashtype_active_file")
				.select("value")
		)
		.select([
			"change.id",
			"change.entity_id",
			"change.file_id",
			"change.plugin_key",
			"change.schema_key",
			"change.created_at",
			"change.snapshot_content as snapshot_content_after",
		])
		.select((eb) =>
			eb
				.selectFrom("change as before_change")
				.innerJoin(
					"change_set_element as before_cse",
					"before_cse.change_id",
					"before_change.id"
				)
				.where(
					"before_cse.change_set_id",
					"=",
					eb
						.selectFrom("change_set")
						.leftJoin(
							"change_set_element as cse_checkpoint",
							"change_set.id",
							"cse_checkpoint.change_set_id"
						)
						.where(changeSetHasLabel({ name: "checkpoint" }))
						.where(
							"cse_checkpoint.file_id",
							"=",
							eb
								.selectFrom("key_value")
								.where("key", "=", "flashtype_active_file")
								.select("value")
						)
						.select("change_set.id")
						.orderBy("change_set.lixcol_updated_at", "desc")
						.limit(1)
				)
				.where("before_change.entity_id", "=", eb.ref("change.entity_id"))
				.where("before_change.schema_key", "=", eb.ref("change.schema_key"))
				.where("before_change.plugin_key", "=", eb.ref("change.plugin_key"))
				.where("before_change.file_id", "=", eb.ref("change.file_id"))
				.select("before_change.snapshot_content")
				.orderBy("before_change.created_at", "desc")
				.limit(1)
				.as("snapshot_content_before")
		);
}

// export async function selectIntermediateChanges(): Promise<
// 	UiDiffComponentProps["diffs"]
// > {
// 	const lix = await ensureLix();
// 	const activeFile = await selectActiveFile();
// 	const activeVersion =
// 		await selectActiveVersion(lix).executeTakeFirstOrThrow();
// 	const checkpointChanges = await selectCheckpointChangeSets();

// 	if (!activeVersion || !activeFile) return [];

// 	// Get all changes in the working change set
// 	const workingChangeSetId = activeVersion.working_change_set_id;

// 	// Get changes that are in the working change set
// 	const intermediateChanges = await lix.db
// 		.selectFrom("change")
// 		.innerJoin(
// 			"change_set_element",
// 			"change_set_element.change_id",
// 			"change.id"
// 		)
// 		.where("change_set_element.change_set_id", "=", workingChangeSetId)
// 		.where("change.file_id", "=", activeFile.id)
// 		.select([
// 			"change.id",
// 			"change.entity_id",
// 			"change.file_id",
// 			"change.plugin_key",
// 			"change.schema_key",
// 			"change.created_at",
// 			"change.snapshot_content as snapshot_content_after",
// 		])
// 		.execute();

// 	const latestCheckpointChangeSetId = checkpointChanges?.[0]?.id;

// 	// Optimize by getting all before snapshots in a single query instead of N+1 queries
// 	const beforeSnapshotMap = new Map<string, any>();

// 	if (latestCheckpointChangeSetId && intermediateChanges.length > 0) {
// 		const entityIds = intermediateChanges.map((c) => c.entity_id);
// 		const schemaKeys = [
// 			...new Set(intermediateChanges.map((c) => c.schema_key)),
// 		];

// 		const beforeSnapshots = await lix.db
// 			.selectFrom("change")
// 			.innerJoin(
// 				"change_set_element",
// 				"change_set_element.change_id",
// 				"change.id"
// 			)
// 			.where(
// 				"change_set_element.change_set_id",
// 				"=",
// 				latestCheckpointChangeSetId
// 			)
// 			.where("change.entity_id", "in", entityIds)
// 			.where("change.schema_key", "in", schemaKeys)
// 			.where("change.file_id", "=", activeFile.id)
// 			.select([
// 				"change.entity_id",
// 				"change.schema_key",
// 				"change.snapshot_content as snapshot_content_before",
// 				"change.created_at",
// 			])
// 			.orderBy("change.created_at", "desc")
// 			.execute();

// 		// Create a map for quick lookup, keeping only the latest change per entity+schema combination
// 		beforeSnapshots.forEach((snapshot) => {
// 			const key = `${snapshot.entity_id}_${snapshot.schema_key}`;
// 			if (!beforeSnapshotMap.has(key)) {
// 				beforeSnapshotMap.set(key, snapshot.snapshot_content_before);
// 			}
// 		});
// 	}

// 	const changesWithBeforeSnapshots: UiDiffComponentProps["diffs"] =
// 		intermediateChanges.map((change) => {
// 			const beforeKey = `${change.entity_id}_${change.schema_key}`;
// 			const snapshotBefore = beforeSnapshotMap.get(beforeKey);

// 			// eslint-disable-next-line @typescript-eslint/no-unused-vars
// 			const { id, ...rest } = change;

// 			return {
// 				...rest,
// 				snapshot_content_after: change.snapshot_content_after
// 					? typeof change.snapshot_content_after === "string"
// 						? JSON.parse(change.snapshot_content_after)
// 						: change.snapshot_content_after
// 					: null,
// 				snapshot_content_before: snapshotBefore
// 					? typeof snapshotBefore === "string"
// 						? JSON.parse(snapshotBefore)
// 						: snapshotBefore
// 					: null,
// 			};
// 		});

// 	return changesWithBeforeSnapshots;
// }

/**
 * Selects current lix name
 */
export const selectCurrentLixName = (lix: Lix) =>
	lix.db.selectFrom("key_value").where("key", "=", "lix_name").select("value");

// Helper functions

const ACTIVE_ACCOUNT_STORAGE_KEY = "active_account";

// Helper function to switch active account
export const switchActiveAccount = async (lix: Lix, account: Account) => {
	await lix.db.transaction().execute(async (trx) => {
		// in case the user switched the lix and this lix does not have
		// the account yet, then insert it.
		try {
			await trx
				.insertInto("account")
				.values({ id: account.id, name: account.name })
				.execute();
		} catch {
			// do nothing, account already exists
		}

		// switch the active account
		await switchAccount({ lix: { ...lix, db: trx }, to: [account] });
	});
	localStorage.setItem(ACTIVE_ACCOUNT_STORAGE_KEY, JSON.stringify(account));
};

/**
 * Get threads for a specific change set
 */
export function selectThreads(
	lix: Lix,
	args: { changeSetId: ChangeSet["id"] }
) {
	return lix.db
		.selectFrom("thread")
		.leftJoin("change_set_thread", "thread.id", "change_set_thread.thread_id")
		.where("change_set_thread.change_set_id", "=", args.changeSetId)
		.select((eb) => [
			jsonArrayFrom(
				eb
					.selectFrom("thread_comment")
					.innerJoin(
						"change_author",
						"thread_comment.lixcol_change_id",
						"change_author.change_id"
					)
					.innerJoin("account", "account.id", "change_author.account_id")
					.select([
						"thread_comment.id",
						"thread_comment.body",
						"thread_comment.thread_id",
						"thread_comment.parent_id",
						"thread_comment.lixcol_created_at",
						"thread_comment.lixcol_updated_at",
					])
					.select("account.name as author_name")
					.orderBy("thread_comment.lixcol_created_at", "asc")
					.whereRef("thread_comment.thread_id", "=", "thread.id")
			).as("comments"),
		])
		.selectAll("thread");
}

/**
 * Get change diffs for a specific change set
 */
export function selectChangeDiffs(
	lix: Lix,
	changeSetId: string,
	changeSetBeforeId?: string | null
) {
	return lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where("change_set_element.change_set_id", "=", changeSetId)
		.where(
			"change.file_id",
			"=",
			lix.db
				.selectFrom("key_value")
				.where("key", "=", "flashtype_active_file")
				.select("value")
		)
		.select([
			"change.id",
			"change.entity_id",
			"change.file_id",
			"change.plugin_key",
			"change.schema_key",
			"change.created_at",
			"change.snapshot_content as snapshot_content_after",
		])
		.select((eb) =>
			changeSetBeforeId
				? eb
						.selectFrom("change as before_change")
						.innerJoin(
							"change_set_element as before_cse",
							"before_cse.change_id",
							"before_change.id"
						)
						.where("before_cse.change_set_id", "=", changeSetBeforeId)
						.where("before_change.entity_id", "=", eb.ref("change.entity_id"))
						.where("before_change.schema_key", "=", eb.ref("change.schema_key"))
						.where("before_change.plugin_key", "=", eb.ref("change.plugin_key"))
						.where("before_change.file_id", "=", eb.ref("change.file_id"))
						.select("before_change.snapshot_content")
						.orderBy("before_change.created_at", "desc")
						.limit(1)
						.as("snapshot_content_before")
				: eb.val(null).as("snapshot_content_before")
		);
}

/**
 * Interface for MD-AST entities as stored in lix
 */
export interface MdAstEntity {
	entity_id: string;
	mdast_id: string;
	type: string;
	children?: MdAstEntity[] | string[]; // Can be inline entities or references to other entities
	value?: string;
	depth?: number;
	ordered?: boolean;
	url?: string;
	alt?: string;
	title?: string;
	lang?: string;
	meta?: string;
	align?: Array<"left" | "right" | "center" | null>;
	position?: {
		start: { line: number; column: number; offset?: number };
		end: { line: number; column: number; offset?: number };
	};
}

/**
 * Interface for document order
 */
export interface MdAstDocumentOrder {
	order: string[];
}

export function selectMdAstRoot(lix: Lix) {
	return lix.db
		.selectFrom("state")
		.where("schema_key", "=", MarkdownRootSchemaV1["x-lix-key"])
		.where(
			"file_id",
			"=",
			lix.db
				.selectFrom("key_value")
				.where("key", "=", "flashtype_active_file")
				.select("value")
		)
		.selectAll();
}

export function selectMdAstNodes(lix: Lix) {
	return lix.db
		.selectFrom("state")
		.where("schema_key", "=", MarkdownNodeSchemaV1["x-lix-key"])
		.where(
			"file_id",
			"=",
			lix.db
				.selectFrom("key_value")
				.where("key", "=", "flashtype_active_file")
				.select("value")
		)
		.selectAll();
}

export function selectActiveFileData(lix: Lix) {
	return lix.db
		.selectFrom("file")
		.where(
			"id",
			"=",
			lix.db
				.selectFrom("key_value")
				.where("key", "=", "flashtype_active_file")
				.select("value")
		)
		.select("data");
}

/**
 * Updates MD-AST entities in lix state using proper lix entity operations
 */
export async function updateMdAstEntities(
	lix: Lix,
	activeFile: LixFileDescriptor | null,
	entities: MdAstEntity[],
	order: string[]
): Promise<void> {
	if (!activeFile) return;
	try {
		await lix.db.transaction().execute(async (trx) => {
			console.log("opening transaction to write md ast");
			// deleting all nodes avoids diffing delete changes
			// if this leads to bugs, this is a bug in the lix state
			// handler and should be reported
			// await trx
			// 	.deleteFrom("state")
			// 	.where("schema_key", "=", MarkdownNodeSchemaV1["x-lix-key"])
			// 	.where(
			// 		// @ts-expect-error - https://github.com/opral/lix-sdk/issues/331
			// 		"version_id",
			// 		"=",
			// 		trx.selectFrom("active_version").select("version_id")
			// 	)
			// 	.where("file_id", "=", activeFile.id)
			// 	.execute();
			for (const entity of entities) {
				await trx
					.insertInto("state")
					.values({
						entity_id: entity.entity_id,
						file_id: activeFile.id,
						schema_key: MarkdownNodeSchemaV1["x-lix-key"],
						schema_version: MarkdownNodeSchemaV1["x-lix-version"],
						plugin_key: mdPlugin.key,
						snapshot_content: entity,
					})
					.execute();
			}
			const existingRoot = await trx
				.selectFrom("state")
				.where("file_id", "=", activeFile.id)
				.where("schema_key", "=", MarkdownRootSchemaV1["x-lix-key"])
				.selectAll()
				.executeTakeFirst();

			if (existingRoot) {
				await trx
					.updateTable("state")
					.where("file_id", "=", activeFile.id)
					.where("schema_key", "=", MarkdownRootSchemaV1["x-lix-key"])
					.set({ snapshot_content: { order } })
					.execute();
			} else {
				await trx
					.insertInto("state")
					.values({
						entity_id: "root",
						file_id: activeFile.id,
						schema_key: MarkdownRootSchemaV1["x-lix-key"],
						schema_version: MarkdownRootSchemaV1["x-lix-version"],
						plugin_key: mdPlugin.key,
						snapshot_content: { order },
					})
					.execute();
			}
			console.log("closing transaction to write mdast");
		});
	} catch (error) {
		console.error("Failed to update MD-AST entities:", error);
		throw error;
	}
}
