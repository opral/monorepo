/**
 * Storage adapter interface for Lix.
 */
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { Account } from "../../account/schema.js";
import type { Lix } from "../open-lix.js";

export interface LixStorageAdapter {
	/**
	 * Opens and returns the database instance.
	 */
	open(): Promise<SqliteWasmDatabase>;
	
	/**
	 * Closes the database and cleans up resources.
	 */
	close(): Promise<void>;
	
	/**
	 * Imports data from a blob into the storage.
	 */
	import(blob: Blob): Promise<void>;
	
	/**
	 * Exports the current storage state as a blob.
	 */
	export(): Promise<Blob>;
	
	/**
	 * Called after the Lix instance is fully initialized.
	 * Allows storage adapters to set up observers, hooks, etc.
	 * 
	 * @param args - Object containing the Lix instance and future options
	 */
	connect?(args: { lix: Lix }): void;
	
	/**
	 * Returns any persisted state that should be restored.
	 * Called during Lix initialization to restore saved state.
	 * 
	 * @returns Promise resolving to persisted state, or undefined if none
	 */
	getPersistedState?(): Promise<{
		activeAccounts?: Pick<Account, "id" | "name">[];
		// Future: Add more persisted state here
	} | undefined>;
}
