import { type LixPlugin } from "@lix-js/sdk";
import { applyChanges } from "./applyChanges.js";
import { detectChanges } from "./detectChanges.js";
import { Diff } from "./diff.js";

export const plugin: LixPlugin = {
	key: "lix-plugin-csv-v2",
	detectChangesGlob: "*.csv",
	detectChanges,
	diffUiComponents: [
		{
			schema_key: "lix-plugin-csv-cell-v1",
			component: Diff,
		},
	],
	applyChanges,
};

export { CellSchemaV1 } from "./schemas/cell.js";
export { HeaderSchemaV1 } from "./schemas/header.js";
export { RowSchemaV1 } from "./schemas/row.js";