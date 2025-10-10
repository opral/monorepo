import { describe, expect, test } from "vitest";
import type { RenderDiffArgs } from "@lix-js/sdk";
import type { AstSchemas } from "@opral/markdown-wc";
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
	// Additional cases (add/remove-only, ordering) can be covered once the API stabilises.
});
