import { expect, test } from "vitest";
import { createThread } from "./create-thread.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createZettelSpan, createZettelTextBlock } from "@opral/zettel-ast";

test("creates a thread with sequential comments where only the first has null parent_id", async () => {
	const lix = await openLixInMemory({});

	const comments = [
		{
			content: [
				createZettelTextBlock({
					children: [
						createZettelSpan({
							text: "First comment",
						}),
					],
				}),
			],
		},
		{
			content: [
				createZettelTextBlock({
					children: [
						createZettelSpan({
							text: "Second comment",
						}),
					],
				}),
			],
		},
		{
			content: [
				createZettelTextBlock({
					children: [
						createZettelSpan({
							text: "Third comment",
						}),
					],
				}),
			],
		},
	];

	const threadWithComments = await createThread({ lix, comments });
	const { comments: insertedComments } = threadWithComments;

	expect(insertedComments).toHaveLength(3);
	expect(insertedComments[0]!.parent_id).toBeNull();
	expect(insertedComments[1]!.parent_id).toBe(insertedComments[0]!.id);
	expect(insertedComments[2]!.parent_id).toBe(insertedComments[1]!.id);
});
