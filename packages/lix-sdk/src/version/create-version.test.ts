import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createVersion } from "./create-version.js";

test("should create a version from a provided version (from)", async () => {
	const lix = await openLix({});
	// Create a source version to get a commit_id
	const sourceVersion = await createVersion({ lix, name: "source-version" });

    const newVersion = await createVersion({
        lix,
        from: { id: sourceVersion.id },
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
        from: { id: sourceVersion.id },
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
        from: { id: sourceVersion.id },
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
            from: { id: sourceVersion.id },
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

test("should fail if the provided 'from' version does not exist", async () => {
	const lix = await openLix({});
    const nonExistentVersionId = "non-existent-version-id";

    await expect(
        createVersion({ lix, from: { id: nonExistentVersionId } })
    ).rejects.toThrow();
});

test("should automatically create inheritance from global version", async () => {
	const lix = await openLix({});

    // Create a new version (should inherit from active version)
	const newVersion = await createVersion({
		lix,
		name: "test-version",
	});

	// Check that inheritance column was set correctly
	expect(newVersion.inherits_from_version_id).toBe("global");
	// Should have a commit_id from the active version
	expect(newVersion.commit_id).toBeDefined();
});

test("should default to active version's commit_id when 'from' is omitted or 'active'", async () => {
	const lix = await openLix({});

	// Get the active version
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

    // Create a new version without from
    const newVersion = await createVersion({
        lix,
        name: "branched-version",
    });

	// The new version should have the same commit_id as the active version
	expect(newVersion.commit_id).toBe(activeVersion.commit_id);
	expect(newVersion.id).not.toBe(activeVersion.id);
	expect(newVersion.name).toBe("branched-version");
});

test("multiple versions created without commit_id should all point to active version's commit", async () => {
	const lix = await openLix({});

	// Get the active version's commit_id
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

    // Create two versions without from
	const version1 = await createVersion({
		lix,
		name: "version-1",
	});

	const version2 = await createVersion({
		lix,
		name: "version-2",
	});

	// Both should have the same commit_id as the active version
	expect(version1.commit_id).toBe(activeVersion.commit_id);
	expect(version2.commit_id).toBe(activeVersion.commit_id);
	// But different version IDs
	expect(version1.id).not.toBe(version2.id);
});

test("should allow explicit null for inheritsFrom", async () => {
	const lix = await openLix({});

	// Create a version with explicit null inheritance
    const version = await createVersion({
			lix,
			name: "standalone-version",
			inheritsFrom: null,
		});

	// Should be null, not "global"
	expect(version.inherits_from_version_id).toBeNull();
});
