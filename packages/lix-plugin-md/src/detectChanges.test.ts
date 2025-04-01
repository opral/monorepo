import { expect, test } from "vitest";
import { detectChanges } from "./detectChanges.js";
import { MarkdownBlockSchemaV1 } from "./schemas/blocks.js";
import { openLixInMemory } from "@lix-js/sdk";
import { MarkdownBlockPositionSchemaV1 } from "./schemas/blockPositions.js";

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
			schema: MarkdownBlockSchemaV1,
			entity_id: "xyz789",
			snapshot: {
				text: "New paragraph.",
				type: "paragraph",
			},
		},
		{
			schema: MarkdownBlockPositionSchemaV1,
			entity_id: "block_positions",
			snapshot: {
				idPositions: {
					abc123: 0,
					def456: 1,
					xyz789: 2,
				},
			},
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
			schema: MarkdownBlockSchemaV1,
			entity_id: "def456",
			snapshot: { text: "Updated text.", type: "paragraph" },
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
			schema: MarkdownBlockSchemaV1,
			entity_id: "xyz789",
			snapshot: undefined,
		},
		{
			schema: MarkdownBlockPositionSchemaV1,
			entity_id: "block_positions",
			snapshot: {
				idPositions: {
					abc123: 0,
					def456: 1,
				},
			},
		},
	]);
});

test("it should detect an empty block", async () => {
	const lix = await openLixInMemory({});
	const before = encode(`<!-- id: abc123 -->
# Heading

<!-- id: def456 -->
Some text.`);
	const after = encode(`<!-- id: abc123 -->
# Heading

<!-- id: def456 -->
Some text.
<!-- id: bcd --><br>
<!-- id: cde -->
test
`);

	const detectedChanges = await detectChanges({
		lix,
		before: { id: "random", path: "x.md", data: before, metadata: {} },
		after: { id: "random", path: "x.md", data: after, metadata: {} },
	});

	expect(detectedChanges).toStrictEqual([
		{
			schema: MarkdownBlockSchemaV1,
			entity_id: "bcd",
			snapshot: {
				text: "<br>",
				type: "paragraph",
			},
		},
		{
			schema: MarkdownBlockSchemaV1,
			entity_id: "cde",
			snapshot: {
				text: "test",
				type: "paragraph",
			},
		},
		{
			schema: MarkdownBlockPositionSchemaV1,
			entity_id: "block_positions",
			snapshot: {
				idPositions: {
					abc123: 0,
					def456: 1,
					bcd: 2,
					cde: 3,
				},
			},
		},
	]);
});
