import { test, expect } from "vitest";
import { createLsaInMemoryEnvironment } from "./create-in-memory-environment.js";
import { openLixInMemory } from "../../lix/open-lix-in-memory.js";

test("opening a lix works", async () => {
	const environment = createLsaInMemoryEnvironment();

	const mockLix = await openLixInMemory({});

	const { value: lixId } = await mockLix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow();

	// initialize the env with the lix file
	environment.setLix({ id: lixId, blob: await mockLix.toBlob() });

	const [lix, connectionId] = await environment.openLix({ id: lixId });

	const mockInsert = await lix.db
		.insertInto("key_value")
		.values({ key: "foo", value: "bar" })
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(mockInsert).toEqual({
		key: "foo",
		value: "bar",
	});

	await environment.closeLix({ id: lixId, connectionId });

	const [reopenedLix, connectionId2] = await environment.openLix({
		id: lixId,
	});

	const mockSelect = await reopenedLix.db
		.selectFrom("key_value")
		.where("key", "=", "foo")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(mockSelect).toEqual({ key: "foo", value: "bar" });

	await environment.closeLix({ id: lixId, connectionId: connectionId2 });
});
