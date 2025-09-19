import type { SqliteWasmDatabase } from "./createInMemoryDatabase.js";

/**
 * Loads serialized SQLite bytes into an in-memory database.
 *
 * The content is copied into the provided database and made available under
 * the configured schema. By default the database becomes writable, but you can
 * force read-only mode through the `readOnly` option.
 *
 * @example
 *   importDatabase({ db, content: new Uint8Array(bytes) });
 */
export const importDatabase = ({
	db,
	content,
	schema = "main",
	readOnly = false,
}: {
	db: SqliteWasmDatabase;
	content: Uint8Array;
	schema?: string;
	readOnly?: boolean;
}) => {
	const deserializeFlag = readOnly
		? db.sqlite3.capi.SQLITE_DESERIALIZE_READONLY
		: db.sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE |
			db.sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE;

	const contentPointer = db.sqlite3.wasm.allocFromTypedArray(content);
	const deserializeReturnCode = db.sqlite3.capi.sqlite3_deserialize(
		db.pointer!,
		schema,
		contentPointer,
		content.byteLength, // db size
		content.byteLength, // content size
		deserializeFlag
	);

	// check if the deserialization was successfull
	db.checkRc(deserializeReturnCode);

	return db;
};
