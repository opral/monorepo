import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createSnapshot } from "./create-snapshot.js";

test("should insert a new snapshot", async () => {
	const lix = await openLixInMemory({});
	const content = { a: "some data" };
	const snapshot = await createSnapshot({ lix, content });

	expect(snapshot.content).toEqual(content);
});

/**
 * Crucial to identify delete changes without joining the snapshot able.
 *
 * A change with snapshot_id = 'no-content' is a delete change.
 */
test("snapshots with no content lead to a no-content snapshot", async () => {
	const lix = await openLixInMemory({});
	const snapshot = await createSnapshot({ lix, content: null });

	expect(snapshot.id).toBe("no-content");
	expect(snapshot.content).toBe(null);
});

test("should insert a new snapshot with no content", async () => {
	const lix = await openLixInMemory({});
	const snapshot = await createSnapshot({ lix, content: null });

	const snapshots = await lix.db.selectFrom("snapshot").selectAll().execute();

	expect(snapshots.some((s) => s.id === snapshot.id)).toBe(true);
	expect(snapshot.content).toBe(null);
});

/**
 * Note on snapshot IDs and content addressability:
 *
 * Although content-addressable IDs (e.g., using a hash of the snapshot content) are attractive for deduplication,
 * this approach is ineffective in our case. Our snapshot payloads typically include volatile fields such as 'id'
 * or timestamps, which change with every record—even if the underlying data is otherwise identical. As a result,
 * the computed hash almost always differs, leading to little or no deduplication benefit.
 *
 * Additionally, hardcoding the use of a JSON SHA-256 hash as the primary key could hinder future enhancements,
 * such as splitting snapshots into sub-chunks or evolving the snapshot structure, since these changes might
 * inadvertently break the content-addressable property or make deduplication unreliable.
 *
 * Instead, we use a monotonic, non-content-addressable ID (e.g., uuidv7) for each snapshot. If deduplication
 * becomes important in the future, we can add a separate 'hash' field for comparison or querying, without
 * locking ourselves into a brittle key scheme.
 *
 * The following test verifies that snapshot IDs are NOT content-addressable: two snapshots with identical content
 * receive different IDs, but their content remains equal.
 */
test("the id is NOT content addressable", async () => {
	const lix = await openLixInMemory({});
	const content = { a: "some data" };
	const snapshot1 = await createSnapshot({ lix, content });
	const snapshot2 = await createSnapshot({ lix, content });

	expect(snapshot1.id).not.toBe(snapshot2.id);
	expect(snapshot1.content).toEqual(snapshot2.content);
});

test("should handle transaction correctly", async () => {
	const lix = await openLixInMemory({});
	const content = { a: "some data" };

	await lix.db.transaction().execute(async (trx) => {
		const snapshot = await createSnapshot({
			lix: { ...lix, db: trx },
			content,
		});

		expect(snapshot.content).toEqual(content);
	});
});

test("should create separate snapshots within a transaction", async () => {
	const lix = await openLixInMemory({});
	const content = { a: "some data" };

	await lix.db.transaction().execute(async (trx) => {
		const snapshot1 = await createSnapshot({
			lix: { ...lix, db: trx },
			content,
		});
		const snapshot2 = await createSnapshot({
			lix: { ...lix, db: trx },
			content,
		});

		// snapshots are NOT deduplicated - each gets a unique ID
		expect(snapshot1.id).not.toBe(snapshot2.id);
		expect(snapshot1.content).toEqual(snapshot2.content);
	});
});
