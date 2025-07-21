import {
	type SqliteWasmDatabase,
	createInMemoryDatabase,
	importDatabase,
	contentFromDatabase,
} from "sqlite-wasm-kysely";
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
	 * Creates a new database and optionally initializes it with the provided blob.
	 * Returns the same database instance on subsequent calls.
	 */
	async open(args: {
		blob?: Blob;
		createBlob: () => Promise<Blob>;
	}): Promise<SqliteWasmDatabase> {
		if (!this.database) {
			this.database = await createInMemoryDatabase({ readOnly: false });

			// Initialize with provided blob or create new one
			const blob = args.blob ?? (await args.createBlob());
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
}
