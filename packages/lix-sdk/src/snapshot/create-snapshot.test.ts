import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createSnapshot } from "./create-snapshot.js";

test("should insert a new snapshot", async () => {
	const lix = await openLixInMemory({});
	const content = { a: "some data" };
	const snapshot = await createSnapshot({ lix, content });

	expect(snapshot.content).toEqual(content);
});

test("should insert a new snapshot with no content", async () => {
	const lix = await openLixInMemory({});
	const snapshot = await createSnapshot({ lix, content: undefined });

	const snapshots = await lix.db.selectFrom("snapshot").selectAll().execute();

	expect(snapshots).toHaveLength(1);
	expect(snapshots[0]).toEqual(snapshot);
	expect(snapshot.content).toBe(null);
});

test("should retrieve existing snapshot if content is the same", async () => {
	const lix = await openLixInMemory({});
	const content = { a: "some data" };
	const snapshot1 = await createSnapshot({ lix, content });
	const snapshot2 = await createSnapshot({ lix, content });

	expect(snapshot1.id).toBe(snapshot2.id);
	expect(snapshot1.content).toEqual(snapshot2.content);
});

test("should handle transaction correctly", async () => {
	const lix = await openLixInMemory({});
	const content = { a: "some data" };

	await lix.db.transaction().execute(async (trx) => {
		const snapshot = await createSnapshot({ lix: { db: trx }, content });

		expect(snapshot.content).toEqual(content);
	});
});

test("should retrieve existing snapshot within a transaction", async () => {
	const lix = await openLixInMemory({});
	const content = { a: "some data" };

	await lix.db.transaction().execute(async (trx) => {
		const snapshotsBefore = await trx
			.selectFrom("snapshot")
			.selectAll()
			.execute();

		const snapshot1 = await createSnapshot({ lix: { db: trx }, content });
		const snapshot2 = await createSnapshot({ lix: { db: trx }, content });

		const snapshotsAfter = await trx
			.selectFrom("snapshot")
			.selectAll()
			.execute();

		// one snapshot should be added
		expect(snapshotsAfter).toHaveLength(snapshotsBefore.length + 1);
		expect(snapshot1.id).toBe(snapshot2.id);
		expect(snapshot1.content).toEqual(snapshot2.content);
	});
});
