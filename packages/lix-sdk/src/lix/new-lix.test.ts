import { test, expect } from "vitest";
import { openLixInMemory } from "./open-lix-in-memory.js";
import { newLixFile } from "./new-lix.js";

test("inserting a change should auto fill the created_at column", async () => {
	const lix = await openLixInMemory({ blob: await newLixFile() });

	await lix.db
		.insertInto("change")
		.values({
			id: "test",
			entity_id: "test",
			schema_key: "file",
			file_id: "mock",
			plugin_key: "mock-plugin",
			snapshot_id: "no-content",
		})
		.execute();

	const changes = await lix.db.selectFrom("change").selectAll().execute();
	expect(changes).lengthOf(1);
	expect(changes[0]?.created_at).toBeDefined();
});
