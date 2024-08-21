import { test, expect } from "vitest";
import { openLixInMemory } from "./open/openLixInMemory.js";
import { newLixFile } from "./newLix.js";

test("inserting a change should insert a current timestamp", async () => {
	const lix = await openLixInMemory({ blob: await newLixFile() });

	await lix.db
		.insertInto("change")
		.values({
			id: "test",
			commit_id: "test",
			type: "file",
			file_id: "mock",
			plugin_key: "mock-plugin",
			operation: "create",
		})
		.execute();

	const changes = await lix.db.selectFrom("change").selectAll().execute();
	expect(changes).lengthOf(1);
	expect(changes[0]?.created_at).toBeDefined();
});
