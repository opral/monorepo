import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChange } from "./create-change-v2.js";

test("creating changes", async () => {
	const lix = await openLixInMemory({});

	const c0 = await createChange({
		lix,
		data: {
			id: "c0",
			entity_id: "entity1",
			schema_key: "schema1",
			file_id: "file1",
			plugin_key: "plugin1",
			snapshot: {
				content: "snapshot-content",
			},
		},
	});

	const changes = await lix.db.selectFrom("change").selectAll().execute();

	expect(changes).toEqual([c0]);
});

test("uses the 'no-content' id if the snapshot content is null for de-duplication", async () => {
	const lix = await openLixInMemory({});

	const change = await createChange({
		lix,
		data: {
			id: "c0",
			entity_id: "entity1",
			schema_key: "schema1",
			file_id: "file1",
			plugin_key: "plugin1",
			snapshot: {
				content: null,
			},
		},
	});

	expect(change.snapshot_id).toBe("no-content");
});