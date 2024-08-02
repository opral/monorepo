import sqlite3InitModule from "@eliaspourquoi/sqlite-node-wasm";
import { setSqliteModule, sqliteModule } from "../kysely/sqliteModule.js";

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
  let wasm;

  // detect if we are in node
  // TODO remove this monkey pathing
  // @ts-expect-error - process is a global variable from node
  if (typeof process !== "undefined") {
    // @ts-expect-error - node specific
    const fs = await import("node:fs");
    wasm = fs.readFileSync(
      "./node_modules/@eliaspourquoi/sqlite-node-wasm/sqlite-wasm/jswasm/sqlite3.wasm",
    );
  }

  setSqliteModule(
    await sqlite3InitModule({
      // @ts-expect-error
      wasmBinary: wasm,
    }),
  );
}
