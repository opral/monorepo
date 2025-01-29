import { SqliteWasmDatabase } from "./createInMemoryDatabase.js";

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
    deserializeFlag,
  );

  // check if the deserialization was successfull
  db.checkRc(deserializeReturnCode);

  return db;
};
