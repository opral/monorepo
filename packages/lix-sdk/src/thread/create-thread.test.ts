import { expect, test } from "vitest";
import { createThread } from "./create-thread.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";

test("creates a thread with sequential comments where only the first has null parent_id", async () => {
	const lix = await openLixInMemory({});

	const comments = [
		{ content: "First comment" },
		{ content: "Second comment" },
		{ content: "Third comment" },
	];

	const threadWithComments = await createThread({ lix, comments });
	const { comments: insertedComments } = threadWithComments;

	expect(insertedComments).toHaveLength(3);
	expect(insertedComments[0]!.content).toBe("First comment");
	expect(insertedComments[0]!.parent_id).toBeNull();
	expect(insertedComments[1]!.content).toBe("Second comment");
	expect(insertedComments[1]!.parent_id).toBe(insertedComments[0]!.id);
	expect(insertedComments[2]!.content).toBe("Third comment");
	expect(insertedComments[2]!.parent_id).toBe(insertedComments[1]!.id);
});
