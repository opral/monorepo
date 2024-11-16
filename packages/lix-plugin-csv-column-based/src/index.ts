import { type LixPlugin } from "@lix-js/sdk";
import { applyChanges } from "./applyChanges.js";
import { detectChanges } from "./detectChanges.js";

export const plugin: LixPlugin = {
	key: "lix-plugin-csv-v2",
	detectChangesGlob: "*.csv",
	detectChanges,
	applyChanges,
};

export { CellSchema } from "./schemas/cellSchema.js";
