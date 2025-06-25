import { test, expect } from "vitest";
import { createLsaInMemoryEnvironment } from "./create-in-memory-environment.js";
import { openLixInMemory } from "../../lix/open-lix-in-memory.js";
import { toBlob } from "../../lix/to-blob.js";

test.skip("opening a lix works", async () => {
	const environment = createLsaInMemoryEnvironment();

	const mockLix = await openLixInMemory({});

	const { value: lixId } = (await mockLix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow()) as { value: string };

	// initialize the env with the lix file
	environment.setLix({ id: lixId, blob: await toBlob({ lix: mockLix }) });

	const open0 = await environment.openLix({ id: lixId });

	const mockInsert = await open0.lix.db
		.insertInto("key_value")
		.values({ key: "foo", value: "bar" })
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(mockInsert).toMatchObject({
		key: "foo",
		value: "bar",
	});

	await environment.closeLix({
		id: lixId,
		connectionId: open0.connectionId,
	});

	const open1 = await environment.openLix({
		id: lixId,
	});

	const mockSelect = await open1.lix.db
		.selectFrom("key_value")
		.where("key", "=", "foo")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(mockSelect).toMatchObject({ key: "foo", value: "bar" });

	await environment.closeLix({ id: lixId, connectionId: open1.connectionId });
});

test.todo("it handles concurrent connections", async () => {
	const environment = createLsaInMemoryEnvironment();

	const mockLix = await openLixInMemory({});

	const { value: lixId } = (await mockLix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow()) as { value: string };

	// initialize the env with the lix file
	environment.setLix({ id: lixId, blob: await toBlob({ lix: mockLix }) });

	const open0 = await environment.openLix({ id: lixId });
	const open1 = await environment.openLix({ id: lixId });

	const mockInsert = await open0.lix.db
		.insertInto("key_value")
		.values({ key: "foo", value: "bar" })
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(mockInsert).toMatchObject({
		key: "foo",
		value: "bar",
	});

	const mockSelect = await open1.lix.db
		.selectFrom("key_value")
		.where("key", "=", "foo")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(mockSelect).toMatchObject({ key: "foo", value: "bar" });

	// test both writing at the same time

	await Promise.all([
		open0.lix.db.transaction().execute(async (trx) => {
			await trx
				.updateTable("key_value")
				.where("key", "=", "foo")
				.set({ value: "bar2" })
				.execute();
			// Introduce a delay to simulate processing time
			// and keep the transaction open
			return await new Promise((resolve) => setTimeout(resolve, 100));
		}),
		open1.lix.db.transaction().execute((trx) => {
			// expecting bar3 to be the final value
			// even though it's processing faster than
			// the other transaction but it's the last one to commit
			return trx
				.updateTable("key_value")
				.where("key", "=", "foo")
				.set({ value: "bar3" })
				.execute();
		}),
	]);

	await environment.closeLix({ id: lixId, connectionId: open0.connectionId });

	await environment.closeLix({ id: lixId, connectionId: open1.connectionId });

	const open2 = await environment.openLix({
		id: lixId,
	});

	const mockSelect2 = await open2.lix.db
		.selectFrom("key_value")
		.where("key", "=", "foo")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(mockSelect2).toMatchObject({ key: "foo", value: "bar3" });

	await environment.closeLix({ id: lixId, connectionId: open2.connectionId });
});
