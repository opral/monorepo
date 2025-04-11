import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { withSkipOwnChangeControl } from "../own-change-control/with-skip-own-change-control.js";
import type { ChangeSet } from "../change-set/index.js";

test("should enforce primary key constraint (parent_id, child_id)", async () => {
	const lix = await openLixInMemory({});
	// Pre-populate change_set table for FK tests
	await lix.db
		.insertInto("change_set")
		.values([
			{ id: "cs1", immutable_elements: true },
			{ id: "cs2", immutable_elements: true },
			{ id: "cs3", immutable_elements: true },
		])
		.execute();

	// Insert initial edge
	await lix.db
		.insertInto("change_set_edge")
		.values({ parent_id: "cs1", child_id: "cs2" })
		.execute();

	// Attempt to insert the same edge again
	await expect(
		lix.db
			.insertInto("change_set_edge")
			.values({ parent_id: "cs1", child_id: "cs2" })
			.execute()
	).rejects.toThrow(
		/UNIQUE constraint failed: change_set_edge.parent_id, change_set_edge.child_id/i
	);
});

test("should allow different edges with same parent or child", async () => {
	const lix = await openLixInMemory({});
	// Pre-populate change_set table for FK tests
	await withSkipOwnChangeControl(lix.db, async (trx) => {
		await trx
			.insertInto("change_set")
			.values([
				{ id: "cs1", immutable_elements: true },
				{ id: "cs2", immutable_elements: true },
				{ id: "cs3", immutable_elements: true },
			])
			.execute();

		// Insert initial edges
		await trx
			.insertInto("change_set_edge")
			.values([
				{ parent_id: "cs1", child_id: "cs2" },
				{ parent_id: "cs1", child_id: "cs3" }, // Same parent, different child
				{ parent_id: "cs2", child_id: "cs3" }, // Different parent, same child
			])
			.execute();
	});

	const edges = await lix.db
		.selectFrom("change_set_edge")
		.selectAll()
		.execute();
	expect(edges.length).toBe(3);
});

test("should enforce foreign key constraint on parent_id", async () => {
	const lix = await openLixInMemory({});
	// Pre-populate change_set table for FK tests
	await lix.db
		.insertInto("change_set")
		.values([
			{ id: "cs1", immutable_elements: true },
			{ id: "cs2", immutable_elements: true },
			{ id: "cs3", immutable_elements: true },
		])
		.execute();

	await expect(
		lix.db
			.insertInto("change_set_edge")
			.values({ parent_id: "cs_nonexistent", child_id: "cs1" })
			.execute()
	).rejects.toThrow(/FOREIGN KEY constraint failed/i);
});

test("should enforce foreign key constraint on child_id", async () => {
	const lix = await openLixInMemory({});
	// Pre-populate change_set table for FK tests
	await lix.db
		.insertInto("change_set")
		.values([
			{ id: "cs1", immutable_elements: true },
			{ id: "cs2", immutable_elements: true },
			{ id: "cs3", immutable_elements: true },
		])
		.execute();

	await expect(
		lix.db
			.insertInto("change_set_edge")
			.values({ parent_id: "cs1", child_id: "cs_nonexistent" })
			.execute()
	).rejects.toThrow(/FOREIGN KEY constraint failed/i);
});

test("should enforce CHECK constraint (parent_id != child_id)", async () => {
	const lix = await openLixInMemory({});
	// Pre-populate change_set table for FK tests
	await lix.db
		.insertInto("change_set")
		.values([
			{ id: "cs1", immutable_elements: true },
			{ id: "cs2", immutable_elements: true },
			{ id: "cs3", immutable_elements: true },
		])
		.execute();

	await expect(
		lix.db
			.insertInto("change_set_edge")
			.values({ parent_id: "cs1", child_id: "cs1" }) // Self-reference
			.execute()
	).rejects.toThrow(/CHECK constraint failed: parent_id != child_id/i);
});

test("should enforce NOT NULL constraints", async () => {
	const lix = await openLixInMemory({});
	// Pre-populate change_set table for FK tests
	await lix.db
		.insertInto("change_set")
		.values([
			{ id: "cs1", immutable_elements: true },
			{ id: "cs2", immutable_elements: true },
			{ id: "cs3", immutable_elements: true },
		])
		.execute();

	// Kysely's types should prevent this, but testing the constraint directly
	await expect(
		lix.db
			.insertInto("change_set_edge")
			// @ts-expect-error Testing invalid input
			.values({ parent_id: null, child_id: "cs1" })
			.execute()
	).rejects.toThrow(/NOT NULL constraint failed: change_set_edge.parent_id/i);

	await expect(
		lix.db
			.insertInto("change_set_edge")
			// @ts-expect-error Testing invalid input
			.values({ parent_id: "cs1", child_id: null })
			.execute()
	).rejects.toThrow(/NOT NULL constraint failed: change_set_edge.child_id/i);
});

test("should prevent creating edges involving mutable change sets", async () => {
	const lix = await openLixInMemory({});

	// Create change sets
	const csImmutable1: ChangeSet = { id: "csI1", immutable_elements: true };
	const csImmutable2: ChangeSet = { id: "csI2", immutable_elements: true };
	const csMutable1: ChangeSet = { id: "csM1", immutable_elements: false };
	const csMutable2: ChangeSet = { id: "csM2", immutable_elements: false };

	await lix.db
		.insertInto("change_set")
		.values([csImmutable1, csImmutable2, csMutable1, csMutable2])
		.execute();

	const expectedError =
		/Change set edges can only be created between change sets with immutable elements/i;

	// Test case 1: Parent is mutable
	await expect(
		lix.db
			.insertInto("change_set_edge")
			.values({ parent_id: csMutable1.id, child_id: csImmutable1.id })
			.execute()
	).rejects.toThrow(expectedError);

	// Test case 2: Child is mutable
	await expect(
		lix.db
			.insertInto("change_set_edge")
			.values({ parent_id: csImmutable1.id, child_id: csMutable2.id })
			.execute()
	).rejects.toThrow(expectedError);

	// Test case 3: Both are mutable
	await expect(
		lix.db
			.insertInto("change_set_edge")
			.values({ parent_id: csMutable1.id, child_id: csMutable2.id })
			.execute()
	).rejects.toThrow(expectedError);

	// Test case 4: Both are immutable (should succeed)
	await expect(
		lix.db
			.insertInto("change_set_edge")
			.values({ parent_id: csImmutable1.id, child_id: csImmutable2.id })
			.execute()
	).resolves.toBeDefined();

	// Verify the successful edge exists
	const edge = await lix.db
		.selectFrom("change_set_edge")
		.where("parent_id", "=", csImmutable1.id)
		.where("child_id", "=", csImmutable2.id)
		.selectAll()
		.executeTakeFirst();

	expect(edge).toBeDefined();
});