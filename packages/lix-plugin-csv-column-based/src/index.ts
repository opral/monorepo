import { type LixPlugin } from "@lix-js/sdk";
import { detectConflicts } from "./detectConflicts.js";
import { applyChanges } from "./applyChanges.js";
import { detectChanges } from "./detectChanges.js";

export const plugin: LixPlugin = {
	key: "lix-plugin-csv-v2",
	detectChangesGlob: "*.csv",
	detectChanges,
	detectConflicts,
	applyChanges,
};
