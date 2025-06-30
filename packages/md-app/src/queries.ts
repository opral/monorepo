import {
	openLix,
	switchAccount,
	Lix,
	Version,
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
} from "@lix-js/sdk";
import { updateUrlParams } from "./helper/updateUrlParams";
import { plugin as mdPlugin } from "@lix-js/plugin-md";
import { findLixFileInOpfs } from "./helper/findLixInOpfs";
import { initLixInspector } from "@lix-js/inspector";

// Global lix instance - this will be managed by the state layer
let globalLix: Lix | null = null;
let lixInitializationPromise: Promise<Lix> | null = null;

/**
 * Helper function to ensure lix is initialized
 */
async function ensureLix(): Promise<Lix> {
	if (!globalLix) {
		await selectLix(); // Initialize if needed
	}
	return globalLix!;
}

/**
 * Initialize and return the lix instance
 * This replaces the lixAtom functionality
 */
export async function selectLix(): Promise<Lix> {
	if (globalLix) {
		return globalLix;
	}

	// If initialization is already in progress, wait for it
	if (lixInitializationPromise) {
		return await lixInitializationPromise;
	}

	console.log("Initializing new lix instance...");

	// Create the initialization promise
	lixInitializationPromise = (async () => {
		const lixIdSearchParam = getLixIdFromUrl();
		const storedActiveAccount = localStorage.getItem(ACTIVE_ACCOUNT_STORAGE_KEY);
		
		let lix: Lix;
		let lixFileName = "Untitled.lix";

		try {
			// Try to load from server if lix ID is provided and file doesn't exist locally
			let blob: Blob | undefined;
			if (lixIdSearchParam) {
				try {
					const response = await fetch(
						new Request(
							import.meta.env.PROD
								? "https://lix.host/lsa/get-v1"
								: "http://localhost:3005/lsa/get-v1",
							{
								method: "POST",
								headers: {
									"Content-Type": "application/json",
								},
								body: JSON.stringify({ lix_id: lixIdSearchParam }),
							}
						)
					);
					if (response.ok) {
						blob = await response.blob();
						lixFileName = `${lixIdSearchParam}.lix`;
					}
				} catch (error) {
					console.warn("Failed to fetch from server:", error);
				}
			}

			// Open lix with OpfsStorage
			lix = await openLix({
				blob,
				providePlugins: [mdPlugin],
				account: storedActiveAccount ? JSON.parse(storedActiveAccount) : undefined,
				storage: new OpfsStorage({ path: lixFileName }),
			});

			console.log("Lix opened successfully with OpfsStorage");
		} catch (error) {
			console.error("Error opening lix:", error);
			// CLEAR OPFS. The lix file is likely corrupted.
			// https://linear.app/opral/issue/INBOX-199/fix-loading-lix-file-if-schema-changed
			try {
				const opfsRoot = await navigator.storage.getDirectory();
				// @ts-expect-error - FileSystemDirectoryHandle is iterable
				for await (const [name, entry] of opfsRoot) {
					if (entry.kind === "file" && name.endsWith(".lix")) {
						await opfsRoot.removeEntry(name);
					}
				}
			} catch (cleanupError) {
				console.error("Failed to clean up OPFS:", cleanupError);
			}
			window.location.reload();
			// tricksing the TS typechecker. This will never be reached.
			lix = {} as any;
		}

		const lixId = await lix.db
			.selectFrom("key_value")
			.where("key", "=", "lix_id")
			.select("value")
			.executeTakeFirstOrThrow();

		if (storedActiveAccount) {
			const activeAccount = JSON.parse(storedActiveAccount);
			await switchActiveAccount(lix, activeAccount);
		}

		// mismatch in id, update URL without full reload if possible
		if (lixId.value !== lixIdSearchParam) {
			// Try to update URL without full navigation
			const updateSuccessful = updateUrlParams({ lix: lixId.value });

			// If update failed, fall back to full navigation
			if (!updateSuccessful) {
				const url = new URL(window.location.href);
				url.searchParams.set("lix", lixId.value);
				window.location.href = url.toString();
			}
		}

		await initLixInspector({
			lix,
			show: localStorage.getItem("lix-inspector:show")
				? localStorage.getItem("lix-inspector:show") === "true"
				: import.meta.env.DEV,
		});

		globalLix = lix;
		console.log("Lix instance stored globally");
		return lix;
	})();

	try {
		const result = await lixInitializationPromise;
		lixInitializationPromise = null; // Reset for future use
		return result;
	} catch (error) {
		lixInitializationPromise = null; // Reset on error
		throw error;
	}
}

/**
 * Selects the current active version
 */
export async function selectActiveVersion(): Promise<Version> {
	const lix = await ensureLix();

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	return activeVersion;
}

/**
 * Selects all versions
 */
export async function selectVersions(): Promise<Version[]> {
	const lix = await ensureLix();
	return await lix.db.selectFrom("version").selectAll().execute();
}

/**
 * Selects all files (metadata only, no content)
 */
export async function selectFiles() {
	const lix = await ensureLix();
	return await lix.db
		.selectFrom("file")
		.select(["id", "path", "metadata"])
		.execute();
}

/**
 * Selects the active account
 */
export async function selectActiveAccount() {
	const lix = await ensureLix();

	return await lix.db
		.selectFrom("active_account")
		.selectAll()
		// assuming only one account active at a time
		.executeTakeFirstOrThrow();
}

/**
 * Selects all accounts
 */
export async function selectAccounts(): Promise<Account[]> {
	const lix = await ensureLix();
	const accounts = await lix.db.selectFrom("account").selectAll().execute();
	return accounts;
}

/**
 * Selects the active file based on URL parameters
 */
export async function selectActiveFile() {
	const fileId = getFileIdFromUrl();
	const lix = await ensureLix();

	if (!fileId) {
		return await setFirstMarkdownFile(lix);
	}

	const file = await lix.db
		.selectFrom("file")
		.select(["id", "path", "metadata"])
		.where("id", "=", fileId)
		.executeTakeFirst();

	if (!file || !file.path || !file.path.endsWith(".md")) {
		return await setFirstMarkdownFile(lix);
	}
	return file;
}

/**
 * Selects checkpoints for the active file
 */
export async function selectCheckpointChangeSets(): Promise<
	Array<
		ChangeSet & {
			change_count: number;
			created_at: string | null;
			author_name: string | null;
		}
	>
> {
	const lix = await ensureLix();
	const activeFile = await selectActiveFile();
	const activeVersion = await selectActiveVersion();

	if (!activeFile || !activeVersion) return [];

	const result = await lix.db
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
				.where(
					// @ts-expect-error - this is a workaround for the type system
					(eb) => eb.ref("change.snapshot_content", "->>").key("change_set_id"),
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
					(eb) => eb.ref("change.snapshot_content", "->>").key("change_set_id"),
					"=",
					eb.ref("change_set.id")
				)
				.select("account.name")
				.as("author_name")
		)
		.orderBy("created_at", "desc")
		.execute();

	return result;
}

/**
 * Selects the working change set for the active file
 */
export async function selectWorkingChangeSet(): Promise<
	(ChangeSet & { change_count: number }) | null
> {
	const lix = await ensureLix();
	const activeFile = await selectActiveFile();
	const activeVersion = await selectActiveVersion();

	if (!activeFile) return null;

	const result = await lix.db
		.selectFrom("change_set")
		.where("id", "=", activeVersion.working_change_set_id)
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

	return result || null;
}

/**
 * Selects intermediate changes (changes in working change set)
 */
export async function selectIntermediateChanges(): Promise<
	UiDiffComponentProps["diffs"]
> {
	const lix = await ensureLix();
	const activeFile = await selectActiveFile();
	const activeVersion = await selectActiveVersion();
	const checkpointChanges = await selectCheckpointChangeSets();

	if (!activeVersion || !activeFile) return [];

	// Get all changes in the working change set
	const workingChangeSetId = activeVersion.working_change_set_id;

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
			"change.snapshot_content as snapshot_content_after",
		])
		.execute();

	const latestCheckpointChangeSetId = checkpointChanges?.[0]?.id;

	// Optimize by getting all before snapshots in a single query instead of N+1 queries
	const beforeSnapshotMap = new Map<string, any>();

	if (latestCheckpointChangeSetId && intermediateChanges.length > 0) {
		const entityIds = intermediateChanges.map((c) => c.entity_id);
		const schemaKeys = [
			...new Set(intermediateChanges.map((c) => c.schema_key)),
		];

		const beforeSnapshots = await lix.db
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
			.where("change.entity_id", "in", entityIds)
			.where("change.schema_key", "in", schemaKeys)
			.where("change.file_id", "=", activeFile.id)
			.select([
				"change.entity_id",
				"change.schema_key",
				"change.snapshot_content as snapshot_content_before",
				"change.created_at",
			])
			.orderBy("change.created_at", "desc")
			.execute();

		// Create a map for quick lookup, keeping only the latest change per entity+schema combination
		beforeSnapshots.forEach((snapshot) => {
			const key = `${snapshot.entity_id}_${snapshot.schema_key}`;
			if (!beforeSnapshotMap.has(key)) {
				beforeSnapshotMap.set(key, snapshot.snapshot_content_before);
			}
		});
	}

	const changesWithBeforeSnapshots: UiDiffComponentProps["diffs"] =
		intermediateChanges.map((change) => {
			const beforeKey = `${change.entity_id}_${change.schema_key}`;
			const snapshotBefore = beforeSnapshotMap.get(beforeKey);

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { id, ...rest } = change;

			return {
				...rest,
				snapshot_content_after: change.snapshot_content_after
					? typeof change.snapshot_content_after === "string"
						? JSON.parse(change.snapshot_content_after)
						: change.snapshot_content_after
					: null,
				snapshot_content_before: snapshotBefore
					? typeof snapshotBefore === "string"
						? JSON.parse(snapshotBefore)
						: snapshotBefore
					: null,
			};
		});

	return changesWithBeforeSnapshots;
}

/**
 * Selects sync status
 */
export async function selectIsSyncing(): Promise<boolean> {
	const lix = await ensureLix();

	const sync = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_sync")
		.select("value")
		.executeTakeFirst();

	if (sync?.value === "true") {
		return true;
	} else {
		return false;
	}
}

/**
 * Selects current lix name
 */
export async function selectCurrentLixName(): Promise<string> {
	const lix = await ensureLix();

	// Get the current Lix ID for finding its file
	const lixId = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow();

	// Find the actual filename in OPFS using our helper function
	try {
		// Find the Lix file with the specified ID
		const lixFile = await findLixFileInOpfs(lixId.value);

		// If found, return its name, otherwise fall back to the ID
		return lixFile ? lixFile.name : lixId.value;
	} catch (error) {
		console.error("Error getting current Lix name:", error);
		return lixId.value;
	}
}

/**
 * Selects available lix files
 */
export async function selectAvailableLixes(): Promise<
	Array<{ id: string; name: string }>
> {
	try {
		// Import the helper function dynamically to avoid circular dependencies
		const { findLixFilesInOpfs } = await import("./helper/findLixInOpfs");

		// Get all Lix files in OPFS
		const lixFiles = await findLixFilesInOpfs();

		// Convert to the format expected by consumers
		// We'll use a map to ensure no duplicate IDs
		const lixMap = new Map();

		for (const file of lixFiles) {
			// If we've already seen this ID, skip it (shouldn't happen with our cleanup, but just in case)
			if (!lixMap.has(file.id)) {
				lixMap.set(file.id, {
					id: file.id,
					name: file.name,
				});
			}
		}

		// Convert the map values to an array
		return Array.from(lixMap.values());
	} catch (error) {
		console.error("Failed to load available lixes:", error);
		return [];
	}
}

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

const setFirstMarkdownFile = async (lix: Lix) => {
	try {
		if (!lix) return null;

		// Get file metadata and filter for markdown files
		const files =
			(await lix.db
				.selectFrom("file")
				.select(["id", "path", "metadata"])
				.execute()) ?? [];
		const markdownFiles = files.filter(
			(file) => file.path && file.path.endsWith(".md")
		);

		// If no markdown files exist, create an empty file
		if (markdownFiles.length === 0) {
			const newFileId = nanoid();

			// Create empty markdown file
			await lix.db
				.insertInto("file")
				.values({
					id: newFileId,
					path: "/document.md",
					data: new TextEncoder().encode(""),
				})
				.execute();

			const newFile = {
				id: newFileId,
				path: "/document.md",
				metadata: null,
			};

			updateUrlParams({ f: newFileId });
			return newFile;
		}

		if (markdownFiles.length > 0) {
			updateUrlParams({ f: markdownFiles[0].id });
			return markdownFiles[0];
		}

		return null;
	} catch (error) {
		console.error("Error setting first markdown file: ", error);
		return null;
	}
};

function getLixIdFromUrl(): string | undefined {
	const searchParams = new URL(window.location.href).searchParams;
	return searchParams.get("lix") || undefined;
}

function getFileIdFromUrl(): string | undefined {
	const searchParams = new URL(window.location.href).searchParams;
	return searchParams.get("f") || undefined;
}


/**
 * Get threads for a specific change set
 */
export async function selectThreads(args: { changeSetId: ChangeSet["id"] }) {
	const lix = await ensureLix();
	
	return await lix.db
		.selectFrom("thread")
		.leftJoin("change_set_thread", "thread.id", "change_set_thread.thread_id")
		.where("change_set_thread.change_set_id", "=", args.changeSetId)
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
}

/**
 * Get change diffs for a specific change set
 */
export async function selectChangeDiffs(
	changeSetId: string,
	changeSetBeforeId?: string | null
): Promise<UiDiffComponentProps["diffs"]> {
	const lix = await ensureLix();
	const activeFile = await selectActiveFile();
	
	if (!activeFile) return [];

	// Get leaf changes for this change set
	const checkpointChanges = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where("change_set_element.change_set_id", "=", changeSetId)
		.where(changeSetElementIsLeafOf([{ id: changeSetId }])) // Only get leaf changes
		.where(changeHasLabel({ name: "checkpoint" }))
		.where("change.file_id", "=", activeFile.id)
		.select([
			"change.id",
			"change.created_at",
			"change.plugin_key",
			"change.schema_key",
			"change.entity_id",
			"change.file_id",
			"change.snapshot_content as snapshot_content_after",
		])
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
						.innerJoin(
							"change_set_element",
							"change_set_element.change_id",
							"change.id"
						)
						.where("change_set_element.change_set_id", "=", changeSetBeforeId)
						.where("change.entity_id", "=", change.entity_id)
						.where("change.schema_key", "=", change.schema_key)
						.where("change.file_id", "=", activeFile.id)
						.where(changeHasLabel({ name: "checkpoint" }))
						.select("change.snapshot_content as snapshot_content_before")
						.orderBy("change.created_at", "desc")
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
}

/**
 * Reset the global lix instance (useful for testing or when switching lix files)
 */
export function resetLixInstance() {
	globalLix = null;
	lixInitializationPromise = null;
}

/**
 * Get the current lix instance (for debugging)
 */
export function getCurrentLixInstance() {
	return globalLix;
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
	const lix = await ensureLix();
	const activeFile = await selectActiveFile();
	const activeVersion = await selectActiveVersion();
	
	if (!activeFile || !activeVersion) return [];

	// Get all md-ast node entities for the file
	const nodeChanges = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where("change_set_element.change_set_id", "=", activeVersion.change_set_id)
		.where("change.file_id", "=", activeFile.id)
		.where("change.schema_key", "=", "lix_plugin_md_node")
		.select([
			"change.entity_id",
			"change.snapshot_content",
		])
		.execute();

	// Parse entities from snapshot content
	const entities: MdAstEntity[] = nodeChanges.map((change) => {
		const content = typeof change.snapshot_content === "string" 
			? JSON.parse(change.snapshot_content) 
			: change.snapshot_content;
		
		return {
			entity_id: change.entity_id,
			...content
		};
	});

	return entities;
}

/**
 * Selects the document order for the active file
 */
export async function selectMdAstDocumentOrder(): Promise<string[]> {
	const lix = await ensureLix();
	const activeFile = await selectActiveFile();
	const activeVersion = await selectActiveVersion();
	
	if (!activeFile || !activeVersion) return [];

	// Get the root order entity
	const orderChange = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where("change_set_element.change_set_id", "=", activeVersion.change_set_id)
		.where("change.file_id", "=", activeFile.id)
		.where("change.schema_key", "=", "lix_plugin_md_root")
		.where("change.entity_id", "=", "root")
		.select("change.snapshot_content")
		.executeTakeFirst();

	if (!orderChange) return [];

	const content = typeof orderChange.snapshot_content === "string" 
		? JSON.parse(orderChange.snapshot_content) 
		: orderChange.snapshot_content;

	return content?.order || [];
}

/**
 * Selects complete MD-AST structure for the active file (entities + order)
 */
export async function selectMdAstDocument(): Promise<{
	entities: MdAstEntity[];
	order: string[];
}> {
	const [entities, order] = await Promise.all([
		selectMdAstEntities(),
		selectMdAstDocumentOrder()
	]);

	return { entities, order };
}

/**
 * Updates MD-AST entities in lix state using proper lix entity operations
 */
export async function updateMdAstEntities(entities: MdAstEntity[], order: string[]): Promise<void> {
	const lix = await ensureLix();
	const activeFile = await selectActiveFile();
	
	if (!activeFile) {
		throw new Error("No active file to update");
	}

	try {
		// Delete existing MD-AST entities for this file
		await lix.db
			.deleteFrom("state")
			.where("file_id", "=", activeFile.id)
			.where("schema_key", "in", ["lix_plugin_md_node", "lix_plugin_md_root"])
			.execute();

		// Insert new node entities
		if (entities.length > 0) {
			await lix.db
				.insertInto("state")
				.values(
					entities.map(entity => ({
						entity_id: entity.mdast_id,
						file_id: activeFile.id,
						schema_key: "lix_plugin_md_node",
						plugin_key: "lix_plugin_md",
						snapshot_content: entity as any, // Store as object, not string
						schema_version: "1.0",
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
					}))
				)
				.execute();
		}

		// Insert root order entity
		if (order.length > 0) {
			await lix.db
				.insertInto("state")
				.values({
					entity_id: "root",
					file_id: activeFile.id,
					schema_key: "lix_plugin_md_root",
					plugin_key: "lix_plugin_md",
					snapshot_content: { order } as any, // Store as object, not string
					schema_version: "1.0",
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				})
				.execute();
		}

		console.log(`Updated ${entities.length} MD-AST entities for file ${activeFile.path}`);
	} catch (error) {
		console.error("Failed to update MD-AST entities:", error);
		throw error;
	}
}