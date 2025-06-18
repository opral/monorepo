import { expect, test } from "vitest";
import { createThread } from "./create-thread.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { fromPlainText } from "@opral/zettel-ast";

test("creates a thread with sequential comments where only the first has null parent_id", async () => {
	const lix = await openLixInMemory({});

	const comments = [
		{ body: fromPlainText("First comment") },
		{ body: fromPlainText("Second comment") },
		{ body: fromPlainText("Third comment") },
	];

	const threadWithComments = await createThread({ lix, comments });
	const { comments: insertedComments } = threadWithComments;

	expect(insertedComments).toHaveLength(3);
	expect(insertedComments[0]!.parent_id).toBeNull();
	expect(insertedComments[1]!.parent_id).toBe(insertedComments[0]!.id);
	expect(insertedComments[2]!.parent_id).toBe(insertedComments[1]!.id);
});

test("defaults to global version if no versionId is provided", async () => {
	const lix = await openLixInMemory({});

	const comments = [{ body: fromPlainText("Global comment") }];

	const threadWithComments = await createThread({ lix, comments });
	expect(threadWithComments.lixcol_version_id).toBe("global");
	expect(threadWithComments.comments[0]!.lixcol_version_id).toBe("global");
});