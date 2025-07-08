import {
	openLix,
	switchAccount,
	Lix,
	Account,
	changeSetIsAncestorOf,
	changeSetHasLabel,
	changeSetElementIsLeafOf,
	changeHasLabel,
	jsonArrayFrom,
	UiDiffComponentProps,
	ChangeSet,
	nanoid,
	OpfsStorage,
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
 * Selects the working change set for the active file
 */
export async function selectWorkingChangeSet(): Promise<
	(ChangeSet & { change_count: number }) | null
> {
	return null;
	// const lix = await ensureLix();
	// const activeFile = await selectActiveFile();
	// const activeVersion =
	// 	await selectActiveVersion(lix).executeTakeFirstOrThrow();

	// if (!activeFile) return null;

	// const result = await lix.db
	// 	.selectFrom("change_set")
	// 	.where("id", "=", activeVersion.working_change_set_id)
	// 	// left join in case the change set has no elements
	// 	.leftJoin(
	// 		"change_set_element",
	// 		"change_set.id",
	// 		"change_set_element.change_set_id"
	// 	)
	// 	.where("file_id", "=", activeFile.id)
	// 	.selectAll("change_set")
	// 	.groupBy("change_set.id")
	// 	.select((eb) => [
	// 		eb.fn.count<number>("change_set_element.change_id").as("change_count"),
	// 	])
	// 	.executeTakeFirst();

	// return result || null;
}

/**
 * Selects intermediate changes (changes in working change set)
 */
export async function selectIntermediateChanges(): Promise<
	UiDiffComponentProps["diffs"]
> {
	return [];
	// const lix = await ensureLix();
	// const activeFile = await selectActiveFile();
	// const activeVersion =
	// 	await selectActiveVersion(lix).executeTakeFirstOrThrow();
	// const checkpointChanges = await selectCheckpointChangeSets();

	// if (!activeVersion || !activeFile) return [];

	// // Get all changes in the working change set
	// const workingChangeSetId = activeVersion.working_change_set_id;

	// // Get changes that are in the working change set
	// const intermediateChanges = await lix.db
	// 	.selectFrom("change")
	// 	.innerJoin(
	// 		"change_set_element",
	// 		"change_set_element.change_id",
	// 		"change.id"
	// 	)
	// 	.where("change_set_element.change_set_id", "=", workingChangeSetId)
	// 	.where("change.file_id", "=", activeFile.id)
	// 	.where("change.file_id", "!=", "lix_own_change_control")
	// 	.select([
	// 		"change.id",
	// 		"change.entity_id",
	// 		"change.file_id",
	// 		"change.plugin_key",
	// 		"change.schema_key",
	// 		"change.created_at",
	// 		"change.snapshot_content as snapshot_content_after",
	// 	])
	// 	.execute();

	// const latestCheckpointChangeSetId = checkpointChanges?.[0]?.id;

	// // Optimize by getting all before snapshots in a single query instead of N+1 queries
	// const beforeSnapshotMap = new Map<string, any>();

	// if (latestCheckpointChangeSetId && intermediateChanges.length > 0) {
	// 	const entityIds = intermediateChanges.map((c) => c.entity_id);
	// 	const schemaKeys = [
	// 		...new Set(intermediateChanges.map((c) => c.schema_key)),
	// 	];

	// 	const beforeSnapshots = await lix.db
	// 		.selectFrom("change")
	// 		.innerJoin(
	// 			"change_set_element",
	// 			"change_set_element.change_id",
	// 			"change.id"
	// 		)
	// 		.where(
	// 			"change_set_element.change_set_id",
	// 			"=",
	// 			latestCheckpointChangeSetId
	// 		)
	// 		.where("change.entity_id", "in", entityIds)
	// 		.where("change.schema_key", "in", schemaKeys)
	// 		.where("change.file_id", "=", activeFile.id)
	// 		.select([
	// 			"change.entity_id",
	// 			"change.schema_key",
	// 			"change.snapshot_content as snapshot_content_before",
	// 			"change.created_at",
	// 		])
	// 		.orderBy("change.created_at", "desc")
	// 		.execute();

	// 	// Create a map for quick lookup, keeping only the latest change per entity+schema combination
	// 	beforeSnapshots.forEach((snapshot) => {
	// 		const key = `${snapshot.entity_id}_${snapshot.schema_key}`;
	// 		if (!beforeSnapshotMap.has(key)) {
	// 			beforeSnapshotMap.set(key, snapshot.snapshot_content_before);
	// 		}
	// 	});
	// }

	// const changesWithBeforeSnapshots: UiDiffComponentProps["diffs"] =
	// 	intermediateChanges.map((change) => {
	// 		const beforeKey = `${change.entity_id}_${change.schema_key}`;
	// 		const snapshotBefore = beforeSnapshotMap.get(beforeKey);

	// 		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	// 		const { id, ...rest } = change;

	// 		return {
	// 			...rest,
	// 			snapshot_content_after: change.snapshot_content_after
	// 				? typeof change.snapshot_content_after === "string"
	// 					? JSON.parse(change.snapshot_content_after)
	// 					: change.snapshot_content_after
	// 				: null,
	// 			snapshot_content_before: snapshotBefore
	// 				? typeof snapshotBefore === "string"
	// 					? JSON.parse(snapshotBefore)
	// 					: snapshotBefore
	// 				: null,
	// 		};
	// 	});

	// return changesWithBeforeSnapshots;
}

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

// const setFirstMarkdownFile = async (lix: Lix) => {
// 	try {
// 		if (!lix) return null;

// 		// Get file metadata and filter for markdown files
// 		const files =
// 			(await lix.db
// 				.selectFrom("file")
// 				.select(["id", "path", "metadata"])
// 				.execute()) ?? [];
// 		const markdownFiles = files.filter(
// 			(file) => file.path && file.path.endsWith(".md")
// 		);

// 		// If no markdown files exist, create an empty file
// 		if (markdownFiles.length === 0) {
// 			const newFileId = nanoid();

// 			// Create empty markdown file
// 			await lix.db
// 				.insertInto("file")
// 				.values({
// 					id: newFileId,
// 					path: "/document.md",
// 					data: new TextEncoder().encode(""),
// 				})
// 				.execute();

// 			const newFile = {
// 				id: newFileId,
// 				path: "/document.md",
// 				metadata: null,
// 			};

// 			updateUrlParams({ f: newFileId });
// 			return newFile;
// 		}

// 		if (markdownFiles.length > 0) {
// 			updateUrlParams({ f: markdownFiles[0].id });
// 			return markdownFiles[0];
// 		}

// 		return null;
// 	} catch (error) {
// 		console.error("Error setting first markdown file: ", error);
// 		return null;
// 	}
// };

// function getLixIdFromUrl(): string | undefined {
// 	const searchParams = new URL(window.location.href).searchParams;
// 	return searchParams.get("lix") || undefined;
// }

// function getFileIdFromUrl(): string | undefined {
// 	const searchParams = new URL(window.location.href).searchParams;
// 	return searchParams.get("f") || undefined;
// }

/**
 * Get threads for a specific change set
 */
export async function selectThreads(args: { changeSetId: ChangeSet["id"] }) {
	return [];
	// const lix = await ensureLix();

	// return await lix.db
	// 	.selectFrom("thread")
	// 	.leftJoin("change_set_thread", "thread.id", "change_set_thread.thread_id")
	// 	.where("change_set_thread.change_set_id", "=", args.changeSetId)
	// 	.select((eb) => [
	// 		jsonArrayFrom(
	// 			eb
	// 				.selectFrom("thread_comment")
	// 				.innerJoin("change", "change.entity_id", "thread_comment.id")
	// 				.innerJoin("change_author", "change_author.change_id", "change.id")
	// 				.innerJoin("account", "account.id", "change_author.account_id")
	// 				.select([
	// 					"thread_comment.id",
	// 					"thread_comment.body",
	// 					"thread_comment.thread_id",
	// 					"thread_comment.parent_id",
	// 				])
	// 				.select(["change.created_at", "account.name as author_name"])
	// 				.whereRef("thread_comment.thread_id", "=", "thread.id")
	// 		).as("comments"),
	// 	])
	// 	.selectAll("thread")
	// 	.execute();
}

/**
 * Get change diffs for a specific change set
 */
export async function selectChangeDiffs(
	changeSetId: string,
	changeSetBeforeId?: string | null
): Promise<UiDiffComponentProps["diffs"]> {
	return [];
	// const lix = await ensureLix();
	// const activeFile = await selectActiveFile();

	// if (!activeFile) return [];

	// // Get leaf changes for this change set
	// const checkpointChanges = await lix.db
	// 	.selectFrom("change")
	// 	.innerJoin(
	// 		"change_set_element",
	// 		"change_set_element.change_id",
	// 		"change.id"
	// 	)
	// 	.where("change_set_element.change_set_id", "=", changeSetId)
	// 	.where(changeSetElementIsLeafOf([{ id: changeSetId }])) // Only get leaf changes
	// 	.where(changeHasLabel({ name: "checkpoint" }))
	// 	.where("change.file_id", "=", activeFile.id)
	// 	.select([
	// 		"change.id",
	// 		"change.created_at",
	// 		"change.plugin_key",
	// 		"change.schema_key",
	// 		"change.entity_id",
	// 		"change.file_id",
	// 		"change.snapshot_content as snapshot_content_after",
	// 	])
	// 	.execute();

	// // Process each change to include before snapshots
	// const changesWithBeforeSnapshot: UiDiffComponentProps["diffs"] =
	// 	await Promise.all(
	// 		checkpointChanges.map(async (change) => {
	// 			let snapshotBefore = null;

	// 			// If we have a previous change set, look for the same entity in it
	// 			if (changeSetBeforeId) {
	// 				snapshotBefore = await lix.db
	// 					.selectFrom("change")
	// 					.innerJoin(
	// 						"change_set_element",
	// 						"change_set_element.change_id",
	// 						"change.id"
	// 					)
	// 					.where("change_set_element.change_set_id", "=", changeSetBeforeId)
	// 					.where("change.entity_id", "=", change.entity_id)
	// 					.where("change.schema_key", "=", change.schema_key)
	// 					.where("change.file_id", "=", activeFile.id)
	// 					.where(changeHasLabel({ name: "checkpoint" }))
	// 					.select("change.snapshot_content as snapshot_content_before")
	// 					.orderBy("change.created_at", "desc")
	// 					.executeTakeFirst();
	// 			}

	// 			// eslint-disable-next-line @typescript-eslint/no-unused-vars
	// 			const { id, ...rest } = change;

	// 			return {
	// 				...rest,
	// 				snapshot_content_after: change.snapshot_content_after
	// 					? typeof change.snapshot_content_after === "string"
	// 						? JSON.parse(change.snapshot_content_after)
	// 						: change.snapshot_content_after
	// 					: null,
	// 				snapshot_content_before: snapshotBefore?.snapshot_content_before
	// 					? typeof snapshotBefore.snapshot_content_before === "string"
	// 						? JSON.parse(snapshotBefore.snapshot_content_before)
	// 						: snapshotBefore.snapshot_content_before
	// 					: null,
	// 			};
	// 		})
	// 	);

	// return changesWithBeforeSnapshot;
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

/**
 * Selects MD-AST entities for the active file from lix state
 */
export async function selectMdAstEntities(): Promise<MdAstEntity[]> {
	return [];
	// const lix = await ensureLix();
	// const activeFile = await selectActiveFile();
	// const activeVersion =
	// 	await selectActiveVersion(lix).executeTakeFirstOrThrow();

	// if (!activeFile || !activeVersion) return [];

	// // Get all md-ast node entities for the file
	// const nodeChanges = await lix.db
	// 	.selectFrom("change")
	// 	.innerJoin(
	// 		"change_set_element",
	// 		"change_set_element.change_id",
	// 		"change.id"
	// 	)
	// 	.where("change_set_element.change_set_id", "=", activeVersion.change_set_id)
	// 	.where("change.file_id", "=", activeFile.id)
	// 	.where("change.schema_key", "=", "lix_plugin_md_node")
	// 	.select(["change.entity_id", "change.snapshot_content"])
	// 	.execute();

	// // Parse entities from snapshot content
	// const entities: MdAstEntity[] = nodeChanges.map((change) => {
	// 	const content =
	// 		typeof change.snapshot_content === "string"
	// 			? JSON.parse(change.snapshot_content)
	// 			: change.snapshot_content;

	// 	return {
	// 		entity_id: change.entity_id,
	// 		...content,
	// 	};
	// });

	// return entities;
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
	// return lix.db.with("document_root", (db) =>
	// 	db
	// 		.selectFrom("state")
	// 		.where("schema_key", "=", "lix_plugin_md_root")
	// 		.where(
	// 			"file_id",
	// 			"=",
	// 			db
	// 				.selectFrom("key_value")
	// 				.where("key", "=", "flashtype_active_file")
	// 				.select("value")
	// 		)
	// );
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
						// @ts-expect-error - https://github.com/opral/lix-sdk/issues/331
						version_id: trx.selectFrom("active_version").select("version_id"),
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
						// @ts-expect-error - https://github.com/opral/lix-sdk/issues/331
						version_id: trx.selectFrom("active_version").select("version_id"),
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
