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


test("it handles concurrent connections", async () => {
	const environment = createLsaInMemoryEnvironment();

	const mockLix = await openLixInMemory({});

	const { value: lixId } = await mockLix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow();

	// initialize the env with the lix file
	environment.setLix({ id: lixId, blob: await mockLix.toBlob() });

	const [lix1, connectionId1] = await environment.openLix({ id: lixId });
	const [lix2, connectionId2] = await environment.openLix({ id: lixId });

	const mockInsert = await lix1.db
		.insertInto("key_value")
		.values({ key: "foo", value: "bar" })
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(mockInsert).toEqual({
		key: "foo",
		value: "bar",
	});

	const mockSelect = await lix2.db
		.selectFrom("key_value")
		.where("key", "=", "foo")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(mockSelect).toEqual({ key: "foo", value: "bar" });

	// test both writing at the same time

	await Promise.all([
		lix1.db.transaction().execute(async (trx) => {
			await trx
				.updateTable("key_value")
				.where("key", "=", "foo")
				.set("value", "bar2")
				.execute();
			// Introduce a delay to simulate processing time
			// and keep the transaction open
			return await new Promise((resolve) => setTimeout(resolve, 100));
		}),
		lix2.db.transaction().execute((trx) => {
			// expecting bar3 to be the final value
			// even though it's processing faster than
			// the other transaction but it's the last one to commit
			return trx
				.updateTable("key_value")
				.where("key", "=", "foo")
				.set("value", "bar3")
				.execute();
		}),
	]);

	await environment.closeLix({ id: lixId, connectionId: connectionId1 });

	await environment.closeLix({ id: lixId, connectionId: connectionId2 });

	const [reopenedLix, connectionId3] = await environment.openLix({
		id: lixId,
	});

	const mockSelect2 = await reopenedLix.db
		.selectFrom("key_value")
		.where("key", "=", "foo")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(mockSelect2).toEqual({ key: "foo", value: "bar3" });

	await environment.closeLix({ id: lixId, connectionId: connectionId3 });
});