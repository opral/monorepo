/* eslint-disable @typescript-eslint/no-unused-vars */
import type { InlangPlugin } from "./schema.js";
import fs from "node:fs/promises";

const plugin: InlangPlugin = {} as any;

plugin.toBeImportedFiles?.({
	// expect no type error when passing node fs
	nodeFs: fs,
	settings: {} as any,
});
