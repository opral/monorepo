import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";

test("thread.id should default to nano_id", async () => {
	const lix = await openLixInMemory({});

	const result = await lix.db
		.insertInto("thread")
		.defaultValues()
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(result.id).toBeDefined();
});
