import { describe, test, expect, vi } from "vitest";
import { applyChanges } from "./apply-changes.js";
import {
	parseMarkdown,
	AstSchemas,
	type Ast,
	type MarkdownNode,
} from "@opral/markdown-wc";
import * as MarkdownWC from "@opral/markdown-wc";
import type { Change, LixPlugin } from "@lix-js/sdk";

type ApplyChangesArgs = Parameters<NonNullable<LixPlugin["applyChanges"]>>[0];
type ApplyChangesFile = ApplyChangesArgs["file"];

const createMockFile = (data: Uint8Array): ApplyChangesFile =>
	({
		id: "mock",
		directory_id: null,
		name: "mock",
		extension: "md",
		path: "/mock.md",
		data,
		metadata: {},
		hidden: false,
		lixcol_inherited_from_version_id: null,
		lixcol_created_at: new Date().toISOString(),
		lixcol_updated_at: new Date().toISOString(),
	}) as ApplyChangesFile;

function buildChangesFromAst(astMarkdown: string): Change[] {
	const ast = parseMarkdown(astMarkdown) as Ast;
	// assign deterministic ids per top-level node
	const ids: string[] = [];
	const nodes: MarkdownNode[] = [];
	ast.children.forEach((n, i) => {
		const id = `n${i + 1}`;
		n.data = { ...n.data, id };
		ids.push(id);
		nodes.push(n);
	});
	const created_at = new Date().toISOString();
	const changes: Change[] = [
		{
			id: "root-change",
			entity_id: "root",
			schema_key: AstSchemas.DocumentSchema["x-lix-key"],
			schema_version: AstSchemas.DocumentSchema["x-lix-version"],
			snapshot_content: { order: ids },
			file_id: "mock",
			plugin_key: "mock",
			created_at,
			metadata: null,
		},
		...nodes.map((node, idx) => ({
			id: `change-${idx + 1}`,
			entity_id: (node as any).data.id,
			schema_key: AstSchemas.schemasByType[node.type]?.["x-lix-key"],
			schema_version: AstSchemas.schemasByType[node.type]?.["x-lix-version"],
			snapshot_content: node as any,
			file_id: "mock",
			plugin_key: "mock",
			metadata: null,
			created_at,
		})),
	];
	return changes;
}

describe("applyChanges", () => {
	test("applies node insertion changes", () => {
		const beforeMarkdown = "# Title\n\nHello world.";
		const afterMarkdown = "# Title\n\nHello world.\n\nNew paragraph.";

		const beforeData = new TextEncoder().encode(beforeMarkdown);
		const afterData = new TextEncoder().encode(afterMarkdown);

		const changes = buildChangesFromAst(new TextDecoder().decode(afterData));

		// Apply changes to reconstruct
		const result = applyChanges({
			file: createMockFile(beforeData),
			changes,
		} as ApplyChangesArgs);

		const resultMarkdown = new TextDecoder().decode(result.fileData);

		// Should contain the new paragraph
		expect(resultMarkdown).toContain("New paragraph");
		// Should preserve existing content
		expect(resultMarkdown).toContain("Title");
		expect(resultMarkdown).toContain("Hello world");
	});

	test("applies node modification changes", () => {
		const beforeMarkdown = "# Title\n\nHello world.";
		const afterMarkdown = "# Title\n\nHello everyone.";

		const beforeData = new TextEncoder().encode(beforeMarkdown);
		const afterData = new TextEncoder().encode(afterMarkdown);

		const changes = buildChangesFromAst(new TextDecoder().decode(afterData));

		const result = applyChanges({
			file: createMockFile(beforeData),
			changes,
		} as ApplyChangesArgs);

		const resultMarkdown = new TextDecoder().decode(result.fileData);

		// Should contain modified text
		expect(resultMarkdown).toContain("Hello everyone");
		expect(resultMarkdown).not.toContain("Hello world");
		// Should preserve title
		expect(resultMarkdown).toContain("Title");
	});

	test("applies node deletion changes", () => {
		const beforeMarkdown = "# Title\n\nHello world.\n\nGoodbye!";
		const afterMarkdown = "# Title\n\nHello world.";

		const beforeData = new TextEncoder().encode(beforeMarkdown);
		const afterData = new TextEncoder().encode(afterMarkdown);

		const changes = buildChangesFromAst(new TextDecoder().decode(afterData));

		const result = applyChanges({
			file: createMockFile(beforeData),
			changes,
		} as ApplyChangesArgs);

		const resultMarkdown = new TextDecoder().decode(result.fileData);

		// Should not contain deleted text
		expect(resultMarkdown).not.toContain("Goodbye!");
		// Should preserve remaining content
		expect(resultMarkdown).toContain("Title");
		expect(resultMarkdown).toContain("Hello world");
	});

	test("applies node reordering changes", () => {
		const beforeMarkdown = "# Title\n\nParagraph 1.\n\nParagraph 2.";
		const afterMarkdown = "# Title\n\nParagraph 2.\n\nParagraph 1.";

		const beforeData = new TextEncoder().encode(beforeMarkdown);
		const afterData = new TextEncoder().encode(afterMarkdown);

		const changes = buildChangesFromAst(new TextDecoder().decode(afterData));
		const result = applyChanges({
			file: createMockFile(beforeData),
			changes,
		} as ApplyChangesArgs);

		const resultMarkdown = new TextDecoder().decode(result.fileData);

		// Should contain both paragraphs
		expect(resultMarkdown).toContain("Paragraph 1");
		expect(resultMarkdown).toContain("Paragraph 2");
		// Should have them in new order (Paragraph 2 before Paragraph 1)
		const para1Index = resultMarkdown.indexOf("Paragraph 1");
		const para2Index = resultMarkdown.indexOf("Paragraph 2");
		expect(para2Index).toBeLessThan(para1Index);
	});

	test("handles empty changes gracefully", () => {
		const markdown = "# Title\n\nHello world.";
		const data = new TextEncoder().encode(markdown);

		const result = applyChanges({
			file: createMockFile(data),
			changes: [],
		} as ApplyChangesArgs);

		const resultMarkdown = new TextDecoder().decode(result.fileData);

		// Should return empty content when no changes provided
		expect(resultMarkdown.trim()).toBe("");
	});

	// The plugin no longer writes HTML id comments; those tests were removed.

	test("minted nested IDs do not collide with existing block IDs", () => {
		const markdown = "- First item\n\nSecond block";
		const ast = parseMarkdown(markdown) as Ast;
		const [listNode, paragraphNode] = ast.children as MarkdownNode[];

		if (!listNode || !paragraphNode) {
			throw new Error("Expected parsed markdown to produce two nodes");
		}

		listNode.data = { ...(listNode.data ?? {}), id: "list-block" };
		paragraphNode.data = { ...(paragraphNode.data ?? {}), id: "mdwc_1" };

		const removeNestedIds = (node: MarkdownNode | undefined) => {
			if (!node || typeof node !== "object") return;
			const children = Array.isArray(node.children) ? node.children : [];
			for (const child of children) {
				if (child && typeof child === "object") {
					if (child.data) {
						delete child.data.id;
					}
					removeNestedIds(child as MarkdownNode);
				}
			}
		};

		// Ensure nested list nodes do not have ids so the mint function generates them.
		removeNestedIds(listNode);

		const createdAt = new Date().toISOString();
		const nodeToChange = (node: MarkdownNode): Change => ({
			id: `${node.data?.id}-change`,
			entity_id: node.data?.id as string,
			schema_key: AstSchemas.schemasByType[node.type]!["x-lix-key"],
			schema_version: AstSchemas.schemasByType[node.type]!["x-lix-version"],
			snapshot_content: node as any,
			file_id: "mock",
			plugin_key: "mock",
			metadata: null,
			created_at: createdAt,
		});

		const changes: Change[] = [
			{
				id: "root-change",
				entity_id: "root",
				schema_key: AstSchemas.DocumentSchema["x-lix-key"],
				schema_version: AstSchemas.DocumentSchema["x-lix-version"],
				snapshot_content: { order: ["list-block", "mdwc_1"] },
				file_id: "mock",
				plugin_key: "mock",
				created_at: createdAt,
				metadata: null,
			},
			nodeToChange(listNode),
			nodeToChange(paragraphNode),
		];

		const serializeSpy = vi.spyOn(MarkdownWC, "serializeAst");

		applyChanges({
			file: createMockFile(new TextEncoder().encode("")),
			changes,
		} as ApplyChangesArgs);

		const serializedAst = serializeSpy.mock.calls.at(-1)?.[0] as Ast | undefined;
		serializeSpy.mockRestore();

		expect(serializedAst?.children?.[1]?.data?.id).toBe("mdwc_1");
	});
});
