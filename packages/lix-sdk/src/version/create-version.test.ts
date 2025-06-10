import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createVersion } from "./create-version.js";
import type { ChangeSet } from "../change-set/schema.js";
import { createChangeSet } from "../change-set/create-change-set.js";

test("should create a version linked to the provided change_set_id", async () => {
	const lix = await openLixInMemory({});
	// Setup: Create a change_set to link to (must be in global version for version graph)
	const changeSet = await createChangeSet({ lix, version_id: "global" });

	const newVersion = await createVersion({ lix, changeSet });

	expect(newVersion.change_set_id).toBe(changeSet.id);
	expect(newVersion.id).toBeDefined();
	// Check if default name is assigned (assuming schema has a default or generated name)
	expect(newVersion.name).toBeDefined();
});

test("should create a version with the specified name", async () => {
	const lix = await openLixInMemory({});
	const changeSet = await createChangeSet({ lix, version_id: "global" });
	const versionName = "My Test Version";

	const newVersion = await createVersion({
		lix,
		changeSet,
		name: versionName,
	});

	expect(newVersion.change_set_id).toBe(changeSet.id);
	expect(newVersion.name).toBe(versionName);
	expect(newVersion.id).toBeDefined();
});

test("should create a version with the specified id", async () => {
	const lix = await openLixInMemory({});
	const changeSet = await createChangeSet({ lix, version_id: "global" });

	const newVersion = await createVersion({
		lix,
		changeSet,
		id: "hello world",
	});

	expect(newVersion.change_set_id).toBe(changeSet.id);
	expect(newVersion.id).toBe("hello world");
	// Check default name assignment
	expect(newVersion.name).toBeDefined();
});

test("should work within an existing transaction", async () => {
	const lix = await openLixInMemory({});
	const changeSet = await createChangeSet({ lix, version_id: "global" });
	const versionName = "Transaction Test Version";

	const newVersion = await lix.db.transaction().execute(async (trx) => {
		return createVersion({
			lix: { ...lix, db: trx }, // Pass the transaction object
			changeSet,
			name: versionName,
		});
	});

	expect(newVersion.change_set_id).toBe(changeSet.id);
	expect(newVersion.name).toBe(versionName);
	expect(newVersion.id).toBeDefined();

	// Verify it's actually in the database outside the transaction
	const dbVersion = await lix.db
		.selectFrom("version")
		.selectAll()
		.where("id", "=", newVersion.id)
		.executeTakeFirstOrThrow();
	expect(dbVersion.name).toBe(versionName);
});

test("should fail if the 'from' change_set_id does not exist", async () => {
	const lix = await openLixInMemory({});
	const nonExistentChangeSet: Pick<ChangeSet, "id"> = {
		id: "hello world" as ChangeSet["id"], // ID that won't exist
	};

	await expect(
		createVersion({ lix, changeSet: nonExistentChangeSet })
		// Check for foreign key constraint error
		// The specific error message might vary based on the db driver
	).rejects.toThrow(/Foreign key constraint violation/i);
});
