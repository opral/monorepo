import { expect, test } from "vitest";
import { detectChanges } from "./detectChanges.js";
import { TextSchemaV1 } from "./schemas/text.js";
import { openLixInMemory } from "@lix-js/sdk";

const encode = (text: string) => new TextEncoder().encode(text);

test("it should not detect changes if the markdown file did not update", async () => {
	const lix = await openLixInMemory({});
	const before = encode(`<!-- id: abc123 -->
# Heading

<!-- id: def456 -->
Some text.`);
	const after = before;

	const detectedChanges = await detectChanges({
		lix,
		before: { id: "random", path: "x.md", data: before, metadata: {} },
		after: { id: "random", path: "x.md", data: after, metadata: {} },
	});

	expect(detectedChanges).toEqual([]);
});

test("it should detect a new block", async () => {
	const lix = await openLixInMemory({});
	const before = encode(`<!-- id: abc123 -->
# Heading

<!-- id: def456 -->
Some text.`);
	const after = encode(`<!-- id: abc123 -->
# Heading

<!-- id: def456 -->
Some text.

<!-- id: xyz789 -->
New paragraph.`);

	const detectedChanges = await detectChanges({
		lix,
		before: { id: "random", path: "x.md", data: before, metadata: {} },
		after: { id: "random", path: "x.md", data: after, metadata: {} },
	});

	expect(detectedChanges).toStrictEqual([
		{
			schema: {
				key: "lix_plugin_txt",
				type: "json",
				schema: {
					type: "object",
					properties: {
						id: {
							type: "string",
						},
						content: {
							type: "string",
						},
					},
					required: ["id", "content"],
					additionalProperties: false,
				},
			},
			entity_id: "x.mdcontent",
			snapshot:
				"<!-- id: abc123 -->\n# Heading\n\n<!-- id: def456 -->\nSome text.\n\n<!-- id: xyz789 -->\nNew paragraph.",
		},
	]);
});

test("it should detect an updated block", async () => {
	const lix = await openLixInMemory({});
	const before = encode(`<!-- id: abc123 -->
# Heading

<!-- id: def456 -->
Some text.`);
	const after = encode(`<!-- id: abc123 -->
# Heading

<!-- id: def456 -->
Updated text.`);

	const detectedChanges = await detectChanges({
		lix,
		before: { id: "random", path: "x.md", data: before, metadata: {} },
		after: { id: "random", path: "x.md", data: after, metadata: {} },
	});

	expect(detectedChanges).toStrictEqual([
		{
			schema: {
				key: "lix_plugin_txt",
				type: "json",
				schema: {
					type: "object",
					properties: {
						id: {
							type: "string",
						},
						content: {
							type: "string",
						},
					},
					required: ["id", "content"],
					additionalProperties: false,
				},
			},
			entity_id: "x.mdcontent",
			snapshot:
				"<!-- id: abc123 -->\n# Heading\n\n<!-- id: def456 -->\nUpdated text.",
		},
	]);
});

test("it should detect a deleted block", async () => {
	const lix = await openLixInMemory({});
	const before = encode(`<!-- id: abc123 -->
# Heading

<!-- id: def456 -->
Some text.

<!-- id: xyz789 -->
Another paragraph.`);
	const after = encode(`<!-- id: abc123 -->
# Heading

<!-- id: def456 -->
Some text.`);

	const detectedChanges = await detectChanges({
		lix,
		before: { id: "random", path: "x.md", data: before, metadata: {} },
		after: { id: "random", path: "x.md", data: after, metadata: {} },
	});

	expect(detectedChanges).toStrictEqual([
		{
			schema: {
				key: "lix_plugin_txt",
				type: "json",
				schema: {
					type: "object",
					properties: {
						id: {
							type: "string",
						},
						content: {
							type: "string",
						},
					},
					required: ["id", "content"],
					additionalProperties: false,
				},
			},
			entity_id: "x.mdcontent",
			snapshot:
				"<!-- id: abc123 -->\n# Heading\n\n<!-- id: def456 -->\nSome text.",
		},
	]);
});
