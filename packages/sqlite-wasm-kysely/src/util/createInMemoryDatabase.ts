import sqlite3InitModule from "@eliaspourquoi/sqlite-node-wasm";
import { setSqliteModule, sqliteModule } from "../kysely/sqliteModule.js";
import { wasmBinary } from "./sqliteWasmBinary.js";

export const createInMemoryDatabase = async ({
  readOnly = false,
}: {
  readOnly?: boolean;
}) => {
  if (!sqliteModule) {
    await initSqlite();
  }
  const flags = [
    readOnly ? "r" : "cw", // read and write
    "", // non verbose
  ].join("");

  return new sqliteModule.oo1.DB(":memory:", flags);
};

async function initSqlite() {
  setSqliteModule(
    await sqlite3InitModule({
      // @ts-expect-error
      wasmBinary: wasmBinary,
      // https://github.com/opral/inlang-sdk/issues/170#issuecomment-2334768193
      locateFile: () => "sqlite3.wasm",
    }),
  );
}
