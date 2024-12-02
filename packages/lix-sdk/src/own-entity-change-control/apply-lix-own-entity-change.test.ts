import { test, expect } from "vitest";
import { applyLixOwnEntityChange } from "./apply-lix-own-entity-change.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { mockJsonSnapshot } from "../snapshot/mock-json-snapshot.js";

test("should apply key_value change", async () => {
	const lix = await openLixInMemory({});

	const mockSnapshot = mockJsonSnapshot({
		key: "mock-key",
		value: "mock-value",
	});

	await lix.db
		.insertInto("snapshot")
		.values({ content: mockSnapshot.content })
		.execute();

	const change = await lix.db
		.insertInto("change")
		.values({
			schema_key: "lix-key-value-v1",
			entity_id: "mock-key",
			file_id: "null",
			plugin_key: "lix-own-entity",
			snapshot_id: mockSnapshot.id,
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	await applyLixOwnEntityChange({ lix, change });

	const keyValue = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "mock-key")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(keyValue.value).toBe("mock-value");
});
