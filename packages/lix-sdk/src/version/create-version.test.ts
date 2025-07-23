import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createVersion } from "./create-version.js";

test("should create a version with the provided commit_id", async () => {
	const lix = await openLix({});
	// Create a source version to get a commit_id
	const sourceVersion = await createVersion({ lix, name: "source-version" });

	const newVersion = await createVersion({
		lix,
		commit_id: sourceVersion.commit_id,
	});

	// The new version should have the same commit as the source version
	expect(newVersion.commit_id).toBe(sourceVersion.commit_id);
	expect(newVersion.id).toBeDefined();
	expect(newVersion.id).not.toBe(sourceVersion.id);
	// Check if default name is assigned
	expect(newVersion.name).toBeDefined();
});

test("should create a version with the specified name", async () => {
	const lix = await openLix({});
	const sourceVersion = await createVersion({ lix, name: "source-version" });
	const versionName = "My Test Version";

	const newVersion = await createVersion({
		lix,
		commit_id: sourceVersion.commit_id,
		name: versionName,
	});

	expect(newVersion.commit_id).toBe(sourceVersion.commit_id);
	expect(newVersion.name).toBe(versionName);
	expect(newVersion.id).toBeDefined();
});

test("should create a version with the specified id", async () => {
	const lix = await openLix({});
	const sourceVersion = await createVersion({ lix, name: "source-version" });

	const newVersion = await createVersion({
		lix,
		commit_id: sourceVersion.commit_id,
		id: "hello world",
	});

	expect(newVersion.commit_id).toBe(sourceVersion.commit_id);
	expect(newVersion.id).toBe("hello world");
	// Check default name assignment
	expect(newVersion.name).toBeDefined();
});

test("should work within an existing transaction", async () => {
	const lix = await openLix({});
	const sourceVersion = await createVersion({ lix, name: "source-version" });
	const versionName = "Transaction Test Version";

	const newVersion = await lix.db.transaction().execute(async (trx) => {
		return createVersion({
			lix: { ...lix, db: trx }, // Pass the transaction object
			commit_id: sourceVersion.commit_id,
			name: versionName,
		});
	});

	expect(newVersion.commit_id).toBe(sourceVersion.commit_id);
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

test("should fail if the provided commit_id does not exist", async () => {
	const lix = await openLix({});
	const nonExistentCommitId = "non-existent-commit-id";

	await expect(
		createVersion({ lix, commit_id: nonExistentCommitId })
		// Should fail when trying to use non-existent commit
	).rejects.toThrow();
});

test("should automatically create inheritance from global version", async () => {
	const lix = await openLix({});

	// Create a new version without commit_id (should create new commit and inherit from global)
	const newVersion = await createVersion({
		lix,
		name: "test-version",
	});

	// Check that inheritance column was set correctly
	expect(newVersion.inherits_from_version_id).toBe("global");
	// Should have a commit_id
	expect(newVersion.commit_id).toBeDefined();
});

test("should create a new commit when no commit_id is provided", async () => {
	const lix = await openLix({});

	// Create two versions without commit_id
	const version1 = await createVersion({
		lix,
		name: "version-1",
	});

	const version2 = await createVersion({
		lix,
		name: "version-2",
	});

	// They should have different commits since each creates a new one
	expect(version1.commit_id).toBeDefined();
	expect(version2.commit_id).toBeDefined();
	expect(version1.commit_id).not.toBe(version2.commit_id);
});
