/**
 * Storage adapter interface for Lix.
 */
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";

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
}
