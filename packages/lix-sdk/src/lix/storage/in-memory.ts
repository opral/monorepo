import { type SqliteWasmDatabase, createInMemoryDatabase, importDatabase, contentFromDatabase } from "sqlite-wasm-kysely";
import { newLixFile } from "../new-lix.js";
import type { LixStorageAdapter } from "./lix-storage-adapter.js";

/**
 * In-memory storage adapter for Lix.
 * 
 * Data is stored only for the lifetime of the JavaScript context.
 * When the page is refreshed or the application is closed, all data is lost.
 */
export class InMemoryStorage implements LixStorageAdapter {
	private database?: SqliteWasmDatabase;

	/**
	 * Opens an in-memory SQLite database.
	 * 
	 * Creates a new empty lix if this is the first time opening.
	 * Returns the same database instance on subsequent calls.
	 */
	async open(): Promise<SqliteWasmDatabase> {
		if (!this.database) {
			this.database = await createInMemoryDatabase({ readOnly: false });
			
			// Initialize with new empty lix
			const blob = await newLixFile();
			importDatabase({
				db: this.database,
				content: new Uint8Array(await blob.arrayBuffer()),
			});
		}
		
		return this.database;
	}

	/**
	 * Closes the database connection.
	 * 
	 * Note: For in-memory databases, this just clears the reference.
	 * The data is lost when the database is no longer referenced.
	 */
	async close(): Promise<void> {
		this.database = undefined;
	}

	/**
	 * Imports data from a blob, replacing the current database content.
	 */
	async import(blob: Blob): Promise<void> {
		const database = await this.open();
		importDatabase({
			db: database,
			content: new Uint8Array(await blob.arrayBuffer()),
		});
	}

	/**
	 * Exports the current database state as a blob.
	 */
	async export(): Promise<Blob> {
		const database = await this.open();
		const content = contentFromDatabase(database);
		return new Blob([content]);
	}
}