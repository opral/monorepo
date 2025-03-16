import { expect, test } from "vitest";
import { detectChanges } from "./detectChanges.js";
import { openLixInMemory } from "@lix-js/sdk";

test("it should not detect changes if the document did not update", async () => {
	const lix = await openLixInMemory({});

	const before = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "paragraph",
					_id: "39u49u212",
					content: [
						{
							type: "text",
							text: "Hello, world!",
						},
					],
				},
			],
		}),
	);
	// same file
	const after = before;

	const detectedChanges = await detectChanges?.({
		lix,
		before: { id: "random", path: "prosemirror.json", data: before, metadata: null },
		after: { id: "random", path: "prosemirror.json", data: after, metadata: null },
	});
	expect(detectedChanges).toEqual([]);
});

test("it should detect insertion of a new node", async () => {
	const lix = await openLixInMemory({});

	const before = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "paragraph",
					_id: "paragraph-1",
					content: [
						{
							type: "text",
							text: "Hello, world!",
						},
					],
				},
			],
		}),
	);
	
	const after = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "paragraph",
					_id: "paragraph-1",
					content: [
						{
							type: "text",
							text: "Hello, world!",
						},
					],
				},
				{
					type: "paragraph",
					_id: "paragraph-2",
					content: [
						{
							type: "text",
							text: "This is a new paragraph.",
						},
					],
				},
			],
		}),
	);

	const detectedChanges = await detectChanges?.({
		lix,
		before: { id: "random", path: "prosemirror.json", data: before, metadata: null },
		after: { id: "random", path: "prosemirror.json", data: after, metadata: null },
	});
	
	expect(detectedChanges).toHaveLength(1);
	// Use non-null assertion to handle the possibly undefined case
	const change = detectedChanges[0]!;
	expect(change.entity_id).toEqual("paragraph-2");
	expect(change.snapshot).toBeDefined();
});

test("it should detect modification of an existing node", async () => {
	const lix = await openLixInMemory({});

	const before = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "paragraph",
					_id: "paragraph-1",
					content: [
						{
							type: "text",
							text: "Hello, world!",
						},
					],
				},
			],
		}),
	);
	
	const after = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "paragraph",
					_id: "paragraph-1",
					content: [
						{
							type: "text",
							text: "Hello, updated world!",
						},
					],
				},
			],
		}),
	);

	const detectedChanges = await detectChanges?.({
		lix,
		before: { id: "random", path: "prosemirror.json", data: before, metadata: null },
		after: { id: "random", path: "prosemirror.json", data: after, metadata: null },
	});
	
	expect(detectedChanges).toHaveLength(1);
	// Use non-null assertion to handle the possibly undefined case
	const change = detectedChanges[0]!;
	expect(change.entity_id).toEqual("paragraph-1");
	expect(change.snapshot).toBeDefined();
	if (change.snapshot) {
		expect((change.snapshot as any).content[0].text).toEqual("Hello, updated world!");
	}
});

test("it should detect deletion of a node", async () => {
	const lix = await openLixInMemory({});

	const before = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "paragraph",
					_id: "paragraph-1",
					content: [
						{
							type: "text",
							text: "Hello, world!",
						},
					],
				},
				{
					type: "paragraph",
					_id: "paragraph-2",
					content: [
						{
							type: "text",
							text: "This paragraph will be deleted.",
						},
					],
				},
			],
		}),
	);
	
	const after = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "paragraph",
					_id: "paragraph-1",
					content: [
						{
							type: "text",
							text: "Hello, world!",
						},
					],
				},
			],
		}),
	);

	const detectedChanges = await detectChanges?.({
		lix,
		before: { id: "random", path: "prosemirror.json", data: before, metadata: null },
		after: { id: "random", path: "prosemirror.json", data: after, metadata: null },
	});
	
	expect(detectedChanges).toHaveLength(1);
	// Use non-null assertion to handle the possibly undefined case
	const change = detectedChanges[0]!;
	expect(change.entity_id).toEqual("paragraph-2");
	expect(change.snapshot).toBeUndefined();
});