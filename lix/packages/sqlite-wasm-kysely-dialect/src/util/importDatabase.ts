import { sqliteModule } from "../kysely/sqlite3InitModule.js";
import { Database } from "@sqlite.org/sqlite-wasm";

export const importDatabase = ({
  db,
  content,
  schema = "main",
  readOnly = false,
}: {
  db: Database;
  content: Uint8Array;
  schema?: string;
  readOnly?: boolean;
}) => {
  const deserializeFlag = readOnly
    ? sqliteModule.capi.SQLITE_DESERIALIZE_READONLY
    : sqliteModule.capi.SQLITE_DESERIALIZE_FREEONCLOSE;

  const contentPointer = sqliteModule.wasm.allocFromTypedArray(content);
  const deserializeReturnCode = sqliteModule.capi.sqlite3_deserialize(
    db.pointer!,
    schema,
    contentPointer,
    content.byteLength, // db size
    content.byteLength, // content size
    deserializeFlag,
    // Optionally:
    // | sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE
  );

  // check if the deserialization was successfull
  db.checkRc(deserializeReturnCode);

  return db;
};
