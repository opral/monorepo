import { Sqlite3Static } from "@eliaspourquoi/sqlite-node-wasm";

export let sqliteModule: Sqlite3Static;

export function setSqliteModule(module: Sqlite3Static) {
  sqliteModule = module;
}
