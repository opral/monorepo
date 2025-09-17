import { describe, expect, test } from "vitest";
import { renderDiff } from "./renderDiff.js";
import { CellSchemaV1 } from "./schemas/cell.js";
import { HeaderSchemaV1 } from "./schemas/header.js";
import { RowSchemaV1 } from "./schemas/row.js";
import type { RenderDiffArgs } from "@lix-js/sdk";

describe("renderDiff", () => {
	test("returns html markup with grouped row changes", async () => {
		const diffs: RenderDiffArgs["diffs"] = [
			{
				plugin_key: "lix_plugin_csv",
				schema_key: HeaderSchemaV1["x-lix-key"] as string,
				entity_id: "header",
				before_snapshot_content: { columnNames: ["Name"] },
				after_snapshot_content: { columnNames: ["Name", "Age"] },
			},
			{
				plugin_key: "lix_plugin_csv",
				schema_key: RowSchemaV1["x-lix-key"] as string,
				entity_id: "Name|Anna",
				before_snapshot_content: { lineNumber: 1 },
				after_snapshot_content: { lineNumber: 0 },
			},
			{
				plugin_key: "lix_plugin_csv",
				schema_key: CellSchemaV1["x-lix-key"] as string,
				entity_id: "Name|Anna|Age",
				before_snapshot_content: { text: "20", rowId: "Name|Anna" },
				after_snapshot_content: { text: "21", rowId: "Name|Anna" },
			},
		];

		const html = await renderDiff({ diffs });

		expect(html).toContain("<style>");
		expect(html).toContain("Unique Value");
		expect(html).toContain("Anna");
		expect(html).toContain("21");
		expect(html).toContain("20");
	});
});
