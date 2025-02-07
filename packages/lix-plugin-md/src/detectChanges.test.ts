import { expect, test } from "vitest";
import { detectChanges } from "./detectChanges.js";
import { MarkdownBlockSchemaV1 } from "./schemas/blocks.js";

const encode = (text: string) => new TextEncoder().encode(text);

test("it should not detect changes if the markdown file did not update", async () => {
	const before = encode("# Heading\n\nSome text.");
	const after = before;

	const detectedChanges = await detectChanges({
		before: { id: "random", path: "x.md", data: before },
		after: { id: "random", path: "x.md", data: after },
	});

	expect(detectedChanges).toEqual([]);
});

test("it should detect a new block", async () => {
	const before = encode("# Heading\n\nSome text.");
	const after = encode("# Heading\n\nSome text.\n\nNew paragraph.");

	const detectedChanges = await detectChanges({
		before: { id: "random", path: "x.md", data: before },
		after: { id: "random", path: "x.md", data: after },
	});

	expect(detectedChanges).toStrictEqual([
		{
			schema: MarkdownBlockSchemaV1,
			entity_id: expect.any(String),
			snapshot: { text: "New paragraph.", type: "paragraph" },
		},
	]);
});

test("it should detect an updated block", async () => {
	const before = encode("# Heading\n\nSome text.");
	const after = encode("# Heading\n\nUpdated text.");

	const detectedChanges = await detectChanges({
		before: { id: "random", path: "x.md", data: before },
		after: { id: "random", path: "x.md", data: after },
	});

	expect(detectedChanges).toStrictEqual([
		{
			schema: MarkdownBlockSchemaV1,
			entity_id: expect.any(String),
			snapshot: { text: "Updated text.", type: "paragraph" },
		},
	]);
});

test("it should detect a deleted block", async () => {
	const before = encode("# Heading\n\nSome text.\n\nAnother paragraph.");
	const after = encode("# Heading\n\nSome text.");

	const detectedChanges = await detectChanges({
		before: { id: "random", path: "x.md", data: before },
		after: { id: "random", path: "x.md", data: after },
	});

	expect(detectedChanges).toStrictEqual([
		{
			schema: MarkdownBlockSchemaV1,
			entity_id: expect.any(String),
			snapshot: undefined,
		},
	]);
});
