export { newLixFile } from "./newLix.js";

export * from "./plugin/index.js";
export * from "./open/index.js";
export * from "./database/index.js";
export * from "./query-utilities/index.js";
export * from "./branch/index.js";

export { jsonObjectFrom, jsonArrayFrom } from "kysely/helpers/sqlite";
export { v4 as uuidv4 } from "uuid";
export * from "./resolve-conflict/errors.js";
export { merge } from "./merge/merge.js";
export { resolveConflictBySelecting } from "./resolve-conflict/resolve-conflict-by-selecting.js";
export { resolveConflictWithNewChange } from "./resolve-conflict/resolve-conflict-with-new-change.js";
