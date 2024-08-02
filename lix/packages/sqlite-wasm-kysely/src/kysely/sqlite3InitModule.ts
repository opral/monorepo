import sqlite3InitModule from "@sqlite.org/sqlite-wasm";


let wasm;

// detect if we are in node
// TODO remove this monkey pathing
// @ts-expect-error - process is a global variable from node
if (typeof process !== "undefined") {
  // @ts-expect-error - node specific
  const fs = await import("node:fs");
  wasm = fs.readFileSync(
    "./node_modules/@sqlite.org/sqlite-wasm/sqlite-wasm/jswasm/sqlite3.wasm",
  );
}

export const sqliteModule = await sqlite3InitModule({
  // @ts-expect-error
  wasmBinary: wasm,
});
