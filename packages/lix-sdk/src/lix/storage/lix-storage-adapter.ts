/**
 * Storage adapter interface for Lix.
 */
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { Account } from "../../account/schema.js";

export interface LixStorageAdapter {
	open(): Promise<SqliteWasmDatabase>;
	close(): Promise<void>;
	import(blob: Blob): Promise<void>;
	export(): Promise<Blob>;
	/**
	 * Called when state commits happen.
	 * Optional method for storage adapters that want to persist on state changes.
	 */
	onStateCommit?(): void;
	/**
	 * Gets the persisted active accounts.
	 * Optional method for storage adapters that want to persist active accounts.
	 */
	getActiveAccounts?(): Pick<Account, "id" | "name">[] | undefined;
}
