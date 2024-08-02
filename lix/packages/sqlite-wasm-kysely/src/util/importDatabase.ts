import { sqliteModule } from "../kysely/sqliteModule.js";
import { Database } from "@eliaspourquoi/sqlite-node-wasm";

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
    : sqliteModule.capi.SQLITE_DESERIALIZE_FREEONCLOSE |
      sqliteModule.capi.SQLITE_DESERIALIZE_RESIZEABLE;

  const contentPointer = sqliteModule.wasm.allocFromTypedArray(content);
  const deserializeReturnCode = sqliteModule.capi.sqlite3_deserialize(
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
