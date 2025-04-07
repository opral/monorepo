import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { withSkipOwnChangeControl } from "../own-change-control/with-skip-own-change-control.js";

test("should enforce primary key constraint (parent_id, child_id)", async () => {
	const lix = await openLixInMemory({});
	// Pre-populate change_set table for FK tests
	await lix.db
		.insertInto("change_set")
		.values([{ id: "cs1" }, { id: "cs2" }, { id: "cs3" }])
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
			.values([{ id: "cs1" }, { id: "cs2" }, { id: "cs3" }])
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
		.values([{ id: "cs1" }, { id: "cs2" }, { id: "cs3" }])
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
		.values([{ id: "cs1" }, { id: "cs2" }, { id: "cs3" }])
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
		.values([{ id: "cs1" }, { id: "cs2" }, { id: "cs3" }])
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
		.values([{ id: "cs1" }, { id: "cs2" }, { id: "cs3" }])
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
