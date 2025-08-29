import {
	type SqliteWasmDatabase,
	createInMemoryDatabase,
	importDatabase,
	contentFromDatabase,
} from "sqlite-wasm-kysely";
import type { LixStorageAdapter } from "./lix-storage-adapter.js";
import type { LixAccount } from "../../account/schema.js";
import type { Lix } from "../open-lix.js";
import { newLixFile } from "../new-lix.js";
import type { NewStateAll } from "../../entity-views/types.js";
import type { LixKeyValue } from "../../key-value/schema.js";
import { executeSync } from "../../database/execute-sync.js";

/**
 * OPFS (Origin Private File System) storage adapter for Lix.
 *
 * Provides persistent storage in the browser using the Origin Private File System API.
 * Data persists across browser sessions and page refreshes.
 *
 * Features auto-saving functionality when integrated with the hooks system.
 */
type OpfsIndex = {
	version: 1;
	names: Record<string, string>; // name -> id
};

export class OpfsStorage implements LixStorageAdapter {
	private static readonly INDEX_FILE = "lix_opfs_storage.json";
	/**
	 * Cleans the entire OPFS by removing all files.
	 * Useful for debugging and testing.
	 *
	 * TODO refactor to only delete opfs adapter related files
	 *      after https://github.com/opral/lix-sdk/issues/332 is implemented.
	 *
	 * @warning This will delete ALL files in OPFS, not just Lix files!
	 */
	static async clean(): Promise<void> {
		// Check if OPFS is supported
		if (
			!("navigator" in globalThis) ||
			!("storage" in navigator) ||
			!("getDirectory" in navigator.storage)
		) {
			throw new Error("OPFS is not supported in this environment");
		}

		const root = await navigator.storage.getDirectory();

		// List all entries in the root directory
		// @ts-expect-error - values() is not in the TypeScript definitions yet
		for await (const entry of root.values()) {
			if (entry.kind === "file") {
				await root.removeEntry(entry.name);
			} else if (entry.kind === "directory") {
				await root.removeEntry(entry.name, { recursive: true });
			}
		}
	}

	private database?: SqliteWasmDatabase;
	private path?: string;
	private opfsRoot?: FileSystemDirectoryHandle;
	private savePromise?: Promise<void>;
	private pendingSave = false;
	private activeAccounts?: Pick<LixAccount, "id" | "name">[];
	private activeAccountSubscription?: { unsubscribe(): void };
	private unsubscribeFromStateCommit?: () => void;
	private openPromise?: Promise<SqliteWasmDatabase>;

	// Creation/resolution mode
	private mode?:
		| { type: "byId"; id: string }
		| { type: "byName"; name: string };

	/**
	 * Creates a new OpfsStorage instance.
	 *
	 * @param args.path - Path/name of the file to store in OPFS
	 */
	private constructor() {
		// Check if OPFS is supported
		if (
			!("navigator" in globalThis) ||
			!("storage" in navigator) ||
			!("getDirectory" in navigator.storage)
		) {
			throw new Error("OPFS is not supported in this environment");
		}
	}

	/**
	 * Factory: open by id. Stores at `<id>.lix`.
	 */
	static byId(id: string): OpfsStorage {
		const s = new OpfsStorage();
		s.mode = { type: "byId", id };
		return s;
	}

	/**
	 * Factory: open by name. Resolves/creates mapping name -> id and stores at `<id>.lix`.
	 */
	static byName(name: string): OpfsStorage {
		const s = new OpfsStorage();
		s.mode = { type: "byName", name };
		return s;
	}

	/**
	 * Lists known lix entries from the name index.
	 */
	static async list(): Promise<{ id: string; name: string; path: string }[]> {
		const root = await navigator.storage.getDirectory();
		const index = await OpfsStorage.readIndexFile(root);
		return Object.entries(index.names).map(([name, id]) => ({
			id,
			name,
			path: `${id}.lix`,
		}));
	}

	/**
	 * Opens a database with OPFS persistence.
	 *
	 * Loads existing data from OPFS if available, otherwise creates a new lix.
	 * Returns the same database instance on subsequent calls.
	 */
	async open(args: {
		blob?: Blob;
		createBlob: () => Promise<Blob>;
	}): Promise<SqliteWasmDatabase> {
		if (this.openPromise) return this.openPromise;
		this.openPromise = (async () => {
			if (!this.database) {
				this.database = await createInMemoryDatabase({ readOnly: false });
				this.opfsRoot = await navigator.storage.getDirectory();

				// Resolve path if needed
				if (!this.path) {
					if (this.mode?.type === "byId") {
						this.path = `${this.mode.id}.lix`;
					} else if (this.mode?.type === "byName") {
						// Try to resolve via index
						const index = await OpfsStorage.readIndexFile(this.opfsRoot);
						const mappedId = index.names[this.mode.name];
						if (mappedId) {
							const exists = await OpfsStorage.fileExists(
								this.opfsRoot,
								`${mappedId}.lix`
							);
							if (exists) {
								this.path = `${mappedId}.lix`;
							} else {
								// Stale mapping - remove and create new below
								delete index.names[this.mode.name];
								await OpfsStorage.writeIndexFile(this.opfsRoot, index);
							}
						}
					}
				}

				if (args.blob) {
					// Use provided blob
					importDatabase({
						db: this.database,
						content: new Uint8Array(await args.blob.arrayBuffer()),
					});
					// Save the imported state to OPFS
					await this.ensurePathResolvedForCreation(args);
					await this.enforceModeInvariantsAndIndexUpdateAfterImport();
					await this.save();
				} else {
					if (this.path) {
						try {
							// Try to load existing data from OPFS
							const fileHandle = await this.opfsRoot.getFileHandle(this.path);
							const file = await fileHandle.getFile();
							const content = new Uint8Array(await file.arrayBuffer());

							importDatabase({
								db: this.database,
								content,
							});
							await this.enforceModeInvariantsAndIndexUpdateAfterImport();
						} catch {
							// File doesn't exist, create new one
							await this.createNewFromCallbackAndIndex(args);
						}
					} else {
						// No path yet (e.g., byName without mapping) -> create new and resolve id
						await this.createNewFromCallbackAndIndex(args);
					}
				}

				// Load active accounts if they exist
				await this.loadActiveAccounts();
			}

			return this.database;
		})();
		try {
			return await this.openPromise;
		} finally {
			this.openPromise = undefined;
		}
	}

	/**
	 * Closes the database connection.
	 *
	 * Performs a final save to OPFS before closing.
	 */
	async close(): Promise<void> {
		if (this.database) {
			await this.save();
			this.database = undefined;
		}
		// Clean up active account subscription
		if (this.activeAccountSubscription) {
			this.activeAccountSubscription.unsubscribe();
			this.activeAccountSubscription = undefined;
		}
		// Clean up hooks listener if registered
		if (this.unsubscribeFromStateCommit) {
			this.unsubscribeFromStateCommit();
			this.unsubscribeFromStateCommit = undefined;
		}
	}

	/**
	 * Exports the current database state as a blob.
	 *
	 * @throws Error if the database has not been opened yet
	 */
	async export(): Promise<Blob> {
		if (!this.database) {
			throw new Error("Database has not been opened yet");
		}
		const content = contentFromDatabase(this.database);
		return new Blob([content]);
	}

	/**
	 * Saves the current database state to OPFS.
	 *
	 * This method is called automatically during import/close,
	 * and can be called manually or triggered by the hooks system.
	 */
	private async save(): Promise<void> {
		if (!this.database || !this.opfsRoot) {
			return;
		}
		if (!this.path) {
			throw new Error("Cannot save without a resolved file path");
		}
		const content = contentFromDatabase(this.database);
		const fileHandle = await this.opfsRoot.getFileHandle(this.path, {
			create: true,
		});
		const writable = await fileHandle.createWritable();

		await writable.write(content);
		await writable.close();
	}

	/**
	 * Called after the Lix instance is fully initialized.
	 * Sets up observers for persisting state changes.
	 */
	connect(args: { lix: Lix }): void {
		// Enforce invariants and adjust index synchronously after DB is initialized
		try {
			const idRow = executeSync({
				lix: { sqlite: args.lix.sqlite },
				query: args.lix.db
					.selectFrom("key_value_all")
					.where("key", "=", "lix_id")
					.where("lixcol_version_id", "=", "global")
					.select("value"),
			});
			const dbId = idRow?.[0]?.value as string | undefined;

			if (this.mode?.type === "byId") {
				if (dbId && dbId !== this.mode.id) {
					throw new Error(
						`OPFS file lix_id mismatch: expected '${this.mode.id}' but found '${dbId}'`
					);
				}
			}

			if (this.mode?.type === "byName" && dbId && this.opfsRoot) {
				// Update index to point name -> dbId (do not mutate DB name)
				void (async () => {
					const index = await OpfsStorage.readIndexFile(this.opfsRoot!);
					index.names[this.mode!.name] = dbId;
					await OpfsStorage.writeIndexFile(this.opfsRoot!, index);
				})();
			}
		} catch (e) {
			if (e instanceof Error) throw e;
			throw new Error(String(e));
		}
		// Set up hook for database persistence
		this.unsubscribeFromStateCommit = args.lix.hooks.onStateCommit(() => {
			this.batchedSave();
		});

		// Observe changes to the active_account table with account details
		this.activeAccountSubscription = args.lix
			.observe(
				args.lix.db
					.selectFrom("active_account as aa")
					.innerJoin("account_all as a", "a.id", "aa.account_id")
					.where("a.lixcol_version_id", "=", "global")
					.select(["a.id", "a.name"])
			)
			.subscribe({
				next: (accounts) => {
					// Save accounts when they change
					this.saveActiveAccounts(accounts).catch((error) => {
						console.error("Failed to save active accounts:", error);
					});
				},
			});
	}

	/**
	 * Saves the current active accounts to a JSON file in OPFS.
	 */
	private async saveActiveAccounts(
		accounts: Pick<LixAccount, "id" | "name">[]
	): Promise<void> {
		if (!this.opfsRoot) {
			return;
		}

		try {
			// Save to JSON file
			const jsonContent = JSON.stringify(accounts);
			const fileHandle = await this.opfsRoot.getFileHandle(
				"lix_active_accounts.json",
				{ create: true }
			);
			const writable = await fileHandle.createWritable();
			await writable.write(jsonContent);
			await writable.close();

			// Update cached accounts
			this.activeAccounts = accounts;
		} catch (error) {
			console.error("Error saving active accounts:", error);
		}
	}

	/**
	 * Loads active accounts from the JSON file in OPFS.
	 */
	private async loadActiveAccounts(): Promise<
		Pick<LixAccount, "id" | "name">[] | undefined
	> {
		if (!this.opfsRoot) {
			return undefined;
		}

		try {
			const fileHandle = await this.opfsRoot.getFileHandle(
				"lix_active_accounts.json"
			);
			const file = await fileHandle.getFile();
			const content = await file.text();
			const accounts = JSON.parse(content) as Pick<LixAccount, "id" | "name">[];
			this.activeAccounts = accounts;
			return accounts;
		} catch {
			// File doesn't exist or error reading, return undefined
			return undefined;
		}
	}

	/**
	 * Returns any persisted state that should be restored.
	 */
	async getPersistedState(): Promise<
		{ activeAccounts?: Pick<LixAccount, "id" | "name">[] } | undefined
	> {
		// Load active accounts if not already loaded
		if (!this.activeAccounts && this.opfsRoot) {
			await this.loadActiveAccounts();
		}

		if (!this.activeAccounts || this.activeAccounts.length === 0) {
			return undefined;
		}

		return {
			activeAccounts: this.activeAccounts,
		};
	}

	/**
	 * Batches save operations to avoid multiple concurrent saves.
	 * Only one save operation will run at a time, with the latest state.
	 */
	private batchedSave(): void {
		if (this.savePromise) {
			// Save is already in progress, mark that another save is needed
			this.pendingSave = true;
			return;
		}

		this.savePromise = this.save()
			.then(() => {
				// Check if another save was requested while this one was running
				if (this.pendingSave) {
					this.pendingSave = false;
					this.savePromise = undefined;
					// Recursively call to handle the pending save
					this.batchedSave();
				} else {
					this.savePromise = undefined;
				}
			})
			.catch((error) => {
				console.error("Error saving to OPFS:", error);
				this.savePromise = undefined;
				this.pendingSave = false;
			});
	}

	// Helper: ensure path is resolved for creation scenarios when args.blob provided
	private async ensurePathResolvedForCreation(args: {
		blob?: Blob;
		createBlob: () => Promise<Blob>;
	}): Promise<void> {
		if (this.path) return;
		if (!this.opfsRoot) return;
		if (this.mode?.type === "byId") {
			this.path = `${this.mode.id}.lix`;
			return;
		}
		if (this.mode?.type === "byName") {
			// Try to derive id from provided blob if it has _lix metadata
			let idFromBlob: string | undefined;
			if (args.blob && (args.blob as any)?._lix?.id) {
				idFromBlob = (args.blob as any)._lix.id as string;
			}
			if (idFromBlob) {
				this.path = `${idFromBlob}.lix`;
				// update index
				const index = await OpfsStorage.readIndexFile(this.opfsRoot);
				index.names[this.mode.name] = idFromBlob;
				await OpfsStorage.writeIndexFile(this.opfsRoot, index);
			}
		}
	}

	private static async fileExists(
		root: FileSystemDirectoryHandle,
		name: string
	): Promise<boolean> {
		try {
			await root.getFileHandle(name);
			return true;
		} catch {
			return false;
		}
	}

	private static async readIndexFile(
		root: FileSystemDirectoryHandle
	): Promise<OpfsIndex> {
		try {
			const fileHandle = await root.getFileHandle(OpfsStorage.INDEX_FILE);
			const file = await fileHandle.getFile();
			const text = await file.text();
			const parsed = JSON.parse(text) as OpfsIndex;
			if (!parsed || parsed.version !== 1 || !parsed.names) {
				return { version: 1, names: {} };
			}
			return parsed;
		} catch {
			return { version: 1, names: {} };
		}
	}

	private static async writeIndexFile(
		root: FileSystemDirectoryHandle,
		index: OpfsIndex
	): Promise<void> {
		const fh = await root.getFileHandle(OpfsStorage.INDEX_FILE, {
			create: true,
		});
		const w = await fh.createWritable();
		await w.write(JSON.stringify(index));
		await w.close();
	}

	private async createNewFromCallbackAndIndex(args: {
		blob?: Blob;
		createBlob: () => Promise<Blob>;
	}): Promise<void> {
		if (!this.database || !this.opfsRoot) return;
		// Create new blob - customize for byId/byName to satisfy mapping immediately
		let blob: Blob;
		if (this.mode?.type === "byId" || this.mode?.type === "byName") {
			const keyValues: NewStateAll<LixKeyValue>[] = [];
			if (this.mode.type === "byId") {
				keyValues.push({
					key: "lix_id",
					value: this.mode.id,
					lixcol_version_id: "global",
				});
			}
			if (this.mode.type === "byName") {
				keyValues.push({
					key: "lix_name",
					value: this.mode.name,
					lixcol_version_id: "global",
				});
			}
			blob = await newLixFile({ keyValues });
		} else {
			blob = await args.createBlob();
		}
		importDatabase({
			db: this.database,
			content: new Uint8Array(await blob.arrayBuffer()),
		});

		// Determine id
		let id: string | undefined = (blob as any)?._lix?.id as string | undefined;
		if (!id) {
			// Fallback: try to read from imported database using internal tables
			id = await this.readLixIdFromCurrentDb();
		}
		if (!id) {
			throw new Error("Failed to determine lix_id for new OPFS file");
		}

		// If we are in byId mode, force the id to match the requested id
		if (this.mode?.type === "byId") {
			try {
				(this.database as any).exec({
					sql: `UPDATE key_value SET value = ? WHERE key = 'lix_id'`,
					bind: [this.mode.id],
				});
				id = this.mode.id;
			} catch {
				// ignore
			}
		}

		this.path = `${id}.lix`;

		// If opened by name, ensure the created DB has the requested name
		if (this.mode?.type === "byName") {
			try {
				// Update or insert lix_name to desired
				(this.database as any).exec({
					sql: `UPDATE key_value SET value = ? WHERE key = 'lix_name'`,
					bind: [this.mode.name],
				});
				const rows = (this.database as any).exec({
					sql: `SELECT 1 FROM key_value WHERE key = 'lix_name' LIMIT 1`,
					returnValue: "resultRows",
				});
				if (!rows || rows.length === 0) {
					(this.database as any).exec({
						sql: `INSERT INTO key_value (key, value) VALUES ('lix_name', ?)`,
						bind: [this.mode.name],
					});
				}
			} catch {
				// ignore
			}
		}
		await this.save();

		// Update index if opened by name
		if (this.mode?.type === "byName") {
			const index = await OpfsStorage.readIndexFile(this.opfsRoot);
			index.names[this.mode.name] = id;
			await OpfsStorage.writeIndexFile(this.opfsRoot, index);
		}
	}

	// After importing any DB content, enforce mode invariants and adjust index mapping accordingly.
	private async enforceModeInvariantsAndIndexUpdateAfterImport(): Promise<void> {
		if (!this.database || !this.opfsRoot) return;
		const id = await this.readLixIdFromCurrentDb();
		if (!id) return;
		if (this.mode?.type === "byId") {
			if (id !== this.mode.id) {
				throw new Error(
					`OPFS file lix_id mismatch: expected '${this.mode.id}' but found '${id}'`
				);
			}
		}
		if (this.mode?.type === "byName") {
			const index = await OpfsStorage.readIndexFile(this.opfsRoot);
			index.names[this.mode.name] = id;
			await OpfsStorage.writeIndexFile(this.opfsRoot, index);
		}
	}

	private async readLixIdFromCurrentDb(): Promise<string | undefined> {
		try {
			const columnNames: string[] = [];
			const rows = (this.database as any).exec({
				sql: `
					SELECT content
					FROM internal_snapshot
					WHERE id IN (
						SELECT snapshot_id FROM internal_change WHERE schema_key = 'lix_key_value'
					)
				`,
				returnValue: "resultRows",
				columnNames,
			});
			if (Array.isArray(rows) && rows.length > 0) {
				for (const row of rows) {
					let c = (row &&
						(Array.isArray(row) ? row[0] : (row as any)["content"])) as any;
					if (c instanceof Uint8Array) {
						c = new TextDecoder().decode(c);
					}
					const obj = typeof c === "string" ? JSON.parse(c) : c;
					if (obj?.key === "lix_id") {
						return String(obj.value);
					}
				}
			}
			return undefined;
		} catch {
			return undefined;
		}
	}
}
