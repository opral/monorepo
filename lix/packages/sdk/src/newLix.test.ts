import { test, expect } from "vitest";
import { openLixInMemory } from "./open/openLixInMemory.js";
import { newLixFile } from "./newLix.js";

test("inserting a change should auto fill the created_at column", async () => {
	const lix = await openLixInMemory({ blob: await newLixFile() });

	await lix.db
		.insertInto("change")
		.values({
			id: "test",
			entity_id: "test",
			commit_id: "test",
			type: "file",
			file_id: "mock",
			plugin_key: "mock-plugin",
			snapshot_id: "sn1",
		})
		.execute();

	const changes = await lix.db.selectFrom("change").selectAll().execute();
	expect(changes).lengthOf(1);
	expect(changes[0]?.created_at).toBeDefined();
});

test("inserting a commit should auto fill the created_at column", async () => {
	const lix = await openLixInMemory({ blob: await newLixFile() });

	await lix.db
		.insertInto("commit")
		.values({
			id: "test",
			parent_id: "test",
			description: "test",
		})
		.execute();

	const commits = await lix.db.selectFrom("commit").selectAll().execute();

	expect(commits).lengthOf(1);
	expect(commits[0]?.created_at).toBeDefined();
});
