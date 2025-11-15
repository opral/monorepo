import { describe, expect, test } from "vitest";
import type { RenderDiffArgs } from "@lix-js/sdk";
import { AstSchemas } from "@opral/markdown-wc";
import { renderDiff } from "./render-diff.js";

describe("renderPluginDiff", () => {
	test("produces inline diff markup for simple paragraph changes", async () => {
		const beforeNode: AstSchemas.ParagraphNode = {
			type: "paragraph",
			data: { id: "p1" },
			children: [{ type: "text", value: "Hello world." }],
		};

		const afterNode: AstSchemas.ParagraphNode = {
			type: "paragraph",
			data: { id: "p1" },
			children: [{ type: "text", value: "Hello brave new world." }],
		};

		const args: RenderDiffArgs = {
			diffs: [
				{
					plugin_key: "plugin_md",
					schema_key: "markdown_wc_paragraph",
					entity_id: "p1",
					before_snapshot_content: beforeNode,
					after_snapshot_content: afterNode,
				},
			],
		};

		const html = await renderDiff(args);
		expect(html).toContain('class="diff-added"');
		expect(html).toContain("Hello");
		expect(html).toContain("brave new");
		expect(html).toContain("world.");
	});

	test("ignores diffs with non-markdown schema keys", async () => {
		const args: RenderDiffArgs = {
			diffs: [
				{
					entity_id: "meta",
					plugin_key: "plugin_md",
					schema_key: "lix_file_descriptor",
					before_snapshot_content: null,
					after_snapshot_content: {
						id: "meta",
						directory_id: null,
						name: "welcome",
						extension: "md",
						metadata: null,
						hidden: false,
					} as any,
				},
				{
					plugin_key: "plugin_md",
					schema_key: "markdown_wc_paragraph",
					entity_id: "p1",
					before_snapshot_content: {
						type: "paragraph",
						data: { id: "p1" },
						children: [{ type: "text", value: "Hello world." }],
					} as AstSchemas.ParagraphNode,
					after_snapshot_content: {
						type: "paragraph",
						data: { id: "p1" },
						children: [
							{ type: "text", value: "Hello world." },
							{ type: "text", value: " Again!" },
						],
					} as AstSchemas.ParagraphNode,
				},
			],
		};

		const html = await renderDiff(args);
		expect(html).toContain("Again!");
		expect(html).not.toContain("welcome");
	});

	test("renders removed markdown blocks when they carry stable ids", async () => {
		const removedHeading: AstSchemas.HeadingNode = {
			type: "heading",
			depth: 2,
			data: { id: "removed-section" },
			children: [{ type: "text", value: "Removed Section" }],
		};
		const remainingParagraph: AstSchemas.ParagraphNode = {
			type: "paragraph",
			data: { id: "keep" },
			children: [{ type: "text", value: "Stays in the document." }],
		};

		const diffs: RenderDiffArgs["diffs"] = [
			{
				plugin_key: "plugin_md",
				entity_id: "root",
				schema_key: AstSchemas.DocumentSchema["x-lix-key"],
				before_snapshot_content: { order: ["removed-section", "keep"] },
				after_snapshot_content: { order: ["keep"] },
			},
			{
				plugin_key: "plugin_md",
				entity_id: "removed-section",
				schema_key: AstSchemas.schemasByType.heading?.["x-lix-key"],
				before_snapshot_content: removedHeading,
				after_snapshot_content: null,
			},
			{
				plugin_key: "plugin_md",
				entity_id: "keep",
				schema_key: AstSchemas.schemasByType.paragraph?.["x-lix-key"],
				before_snapshot_content: remainingParagraph,
				after_snapshot_content: remainingParagraph,
			},
		];

		const html = await renderDiff({ diffs });
		expect(html).toContain("Removed Section");
		expect(html).toContain("diff-removed");
		expect(html).not.toContain("North America");
	});

	test("marks table cells as modified when their content changes", async () => {
		const documentDiff = {
			plugin_key: "plugin_md",
			entity_id: "root",
			schema_key: AstSchemas.DocumentSchema["x-lix-key"],
			before_snapshot_content: { order: ["table"] },
			after_snapshot_content: { order: ["table"] },
		};

		const makeCell = (id: string, value: string): AstSchemas.TableCellNode => ({
			type: "tableCell",
			data: { id },
			children: [{ type: "text", value }],
		});

		const makeRow = (id: string, values: Array<{ id: string; text: string }>): AstSchemas.TableRowNode => ({
			type: "tableRow",
			data: { id },
			children: values.map(({ id: cellId, text }) => makeCell(cellId, text)),
		});

		const tableBefore: AstSchemas.TableNode = {
			type: "table",
			data: { id: "table" },
			align: [null, null, null],
			children: [
				makeRow("header", [
					{ id: "head-0", text: "Header 1" },
					{ id: "head-1", text: "Header 2" },
					{ id: "head-2", text: "Header 3" },
				]),
				makeRow("row-1", [
					{ id: "row1-0", text: "Row 1 Col 1" },
					{ id: "row1-1", text: "Row 1 Col 2" },
					{ id: "row1-2", text: "Row 1 Col 3" },
				]),
				makeRow("row-2", [
					{ id: "cell-r2c1", text: "Row 2 Col 1" },
					{ id: "cell-r2c2", text: "Row 2 Col 2" },
					{ id: "cell-r2c3", text: "Row 2 Col 3" },
				]),
			],
		};

		const tableAfter: AstSchemas.TableNode = {
			...tableBefore,
			children: (tableBefore.children ?? []).map((row) =>
				row.data?.id === "row-2"
					? {
							...row,
							children: (row.children ?? []).map((cell) =>
								cell.data?.id === "cell-r2c2"
									? {
											...cell,
											children: [{ type: "text", value: "Row 2 Col 25" }],
									  }
									: cell,
							),
					  }
					: row,
			),
		};

		const diffs: RenderDiffArgs["diffs"] = [
			documentDiff,
			{
				plugin_key: "plugin_md",
				entity_id: "table",
				schema_key: AstSchemas.schemasByType.table?.["x-lix-key"],
				before_snapshot_content: tableBefore,
				after_snapshot_content: tableAfter,
			},
		];

		const html = await renderDiff({ diffs });

		expect(html).toContain("Row 2 Col 25");
		expect(html).toMatch(
			/data-id="cell-r2c2"[^>]*class="diff-modified"/,
		);
	});
	// Additional cases (add/remove-only, ordering) can be covered once the API stabilises.
});
