import {
	type SqliteWasmDatabase,
	createInMemoryDatabase,
	importDatabase,
	contentFromDatabase,
} from "sqlite-wasm-kysely";
import { newLixFile } from "../new-lix.js";
import type { LixStorageAdapter } from "./lix-storage-adapter.js";
import type { Account } from "../../account/schema.js";
import type { Lix } from "../open-lix.js";

/**
 * OPFS (Origin Private File System) storage adapter for Lix.
 *
 * Provides persistent storage in the browser using the Origin Private File System API.
 * Data persists across browser sessions and page refreshes.
 *
 * Features auto-saving functionality when integrated with the hooks system.
 */
export class OpfsStorage implements LixStorageAdapter {
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
	private readonly path: string;
	private opfsRoot?: FileSystemDirectoryHandle;
	private savePromise?: Promise<void>;
	private pendingSave = false;
	private activeAccounts?: Pick<Account, "id" | "name">[];
	private activeAccountSubscription?: { unsubscribe(): void };

	/**
	 * Creates a new OpfsStorage instance.
	 *
	 * @param args.path - Path/name of the file to store in OPFS
	 */
	constructor(args: { path: string }) {
		// Check if OPFS is supported
		if (
			!("navigator" in globalThis) ||
			!("storage" in navigator) ||
			!("getDirectory" in navigator.storage)
		) {
			throw new Error("OPFS is not supported in this environment");
		}

		this.path = args.path;
	}

	/**
	 * Opens a database with OPFS persistence.
	 *
	 * Loads existing data from OPFS if available, otherwise creates a new lix.
	 * Returns the same database instance on subsequent calls.
	 */
	async open(): Promise<SqliteWasmDatabase> {
		if (!this.database) {
			this.database = await createInMemoryDatabase({ readOnly: false });
			this.opfsRoot = await navigator.storage.getDirectory();

			try {
				// Try to load existing data from OPFS
				const fileHandle = await this.opfsRoot.getFileHandle(this.path);
				const file = await fileHandle.getFile();
				const content = new Uint8Array(await file.arrayBuffer());

				importDatabase({
					db: this.database,
					content,
				});
			} catch {
				// File doesn't exist, create new empty lix
				const blob = await newLixFile();
				importDatabase({
					db: this.database,
					content: new Uint8Array(await blob.arrayBuffer()),
				});

				// Save the initial state to OPFS
				await this.save();
			}

			// Load active accounts if they exist
			await this.loadActiveAccounts();
		}

		return this.database;
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
	}

	/**
	 * Imports data from a blob, replacing the current database content.
	 *
	 * Also saves the imported data to OPFS.
	 */
	async import(blob: Blob): Promise<void> {
		const database = await this.open();
		importDatabase({
			db: database,
			content: new Uint8Array(await blob.arrayBuffer()),
		});

		// Save the imported data to OPFS
		await this.save();
	}

	/**
	 * Exports the current database state as a blob.
	 */
	async export(): Promise<Blob> {
		const database = await this.open();
		const content = contentFromDatabase(database);
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
		// Set up hook for database persistence
		args.lix.hooks.onStateCommit(() => {
			this.batchedSave();
		});

		// Observe changes to the active_account table
		this.activeAccountSubscription = args.lix
			.observe(args.lix.db.selectFrom("active_account").selectAll())
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
		accounts: Pick<Account, "id" | "name">[]
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
		Pick<Account, "id" | "name">[] | undefined
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
			const accounts = JSON.parse(content) as Pick<Account, "id" | "name">[];
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
		{ activeAccounts?: Pick<Account, "id" | "name">[] } | undefined
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
}
