import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { applyCommit } from "./apply-commit.js";
import { createCommit } from "./create-commit.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import { createVersion } from "../version/create-version.js";
import {
	mockJsonPlugin,
	MockJsonPropertySchema,
} from "../plugin/mock-json-plugin.js";

test("applyCommit updates the active version's commit_id", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
	});

	// Insert the schema
	await lix.db
		.insertInto("stored_schema_all")
		.values({
			value: MockJsonPropertySchema,
			lixcol_version_id: "global",
		})
		.execute();

	// Create a file
	await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			data: new TextEncoder().encode("{}"),
			path: "/test.json",
		})
		.execute();

	// Create some changes
	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c1",
				file_id: "file1",
				plugin_key: mockJsonPlugin.key,
				entity_id: "e1",
				schema_key: "mock_json_property",
				snapshot_content: { value: "Value 1" },
				schema_version: "1.0",
			},
		])
		.returningAll()
		.execute();

	// Create a change set
	const changeSet = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: changes.map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
	});

	// Create a commit
	const commit = await createCommit({
		lix,
		changeSet,
	});

	// Get the active version before applying
	const versionBefore = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	// Apply the commit
	await applyCommit({
		lix,
		commit,
	});

	// Get the active version after applying
	const versionAfter = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	// Verify the version's commit_id was updated
	expect(versionAfter.commit_id).toBe(commit.id);
	expect(versionAfter.commit_id).not.toBe(versionBefore.commit_id);

	// Verify the changes were applied to the file
	const file = await lix.db
		.selectFrom("file")
		.where("id", "=", "file1")
		.selectAll()
		.executeTakeFirstOrThrow();

	const fileData = JSON.parse(new TextDecoder().decode(file.data));
	expect(fileData).toEqual({ e1: "Value 1" });
});

test("applyCommit applies to a specific version when provided", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
	});

	// Insert the schema
	await lix.db
		.insertInto("stored_schema_all")
		.values({
			value: MockJsonPropertySchema,
			lixcol_version_id: "global",
		})
		.execute();

	// Create two versions
	const version1 = await createVersion({
		lix,
		name: "version1",
	});

	const version2 = await createVersion({
		lix,
		name: "version2",
	});

	// Create a file
	await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			data: new TextEncoder().encode("{}"),
			path: "/test.json",
		})
		.execute();

	// Create changes
	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c1",
				file_id: "file1",
				plugin_key: mockJsonPlugin.key,
				entity_id: "e1",
				schema_key: "mock_json_property",
				snapshot_content: { value: "Version 2 Value" },
				schema_version: "1.0",
			},
		])
		.returningAll()
		.execute();

	// Create a change set and commit
	const changeSet = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: changes.map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
	});

	const commit = await createCommit({
		lix,
		changeSet,
	});

	// Apply the commit to version2 specifically
	await applyCommit({
		lix,
		commit,
		version: version2,
	});

	// Check that version2 was updated
	const updatedVersion2 = await lix.db
		.selectFrom("version")
		.where("id", "=", version2.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(updatedVersion2.commit_id).toBe(commit.id);

	// Check that version1 was NOT updated
	const unchangedVersion1 = await lix.db
		.selectFrom("version")
		.where("id", "=", version1.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(unchangedVersion1.commit_id).not.toBe(commit.id);
});

test("applyCommit works within a transaction", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
	});

	// Insert the schema
	await lix.db
		.insertInto("stored_schema_all")
		.values({
			value: MockJsonPropertySchema,
			lixcol_version_id: "global",
		})
		.execute();

	// Create a file
	await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			data: new TextEncoder().encode("{}"),
			path: "/test.json",
		})
		.execute();

	// Create changes
	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c1",
				file_id: "file1",
				plugin_key: mockJsonPlugin.key,
				entity_id: "e1",
				schema_key: "mock_json_property",
				snapshot_content: { value: "Transactional Value" },
				schema_version: "1.0",
			},
		])
		.returningAll()
		.execute();

	// Create a change set and commit
	const changeSet = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: changes.map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
	});

	const commit = await createCommit({
		lix,
		changeSet,
	});

	// Run applyCommit within a transaction
	await lix.db.transaction().execute(async (trx) => {
		await applyCommit({
			lix: { ...lix, db: trx },
			commit,
		});

		// Verify within the transaction
		const version = await trx
			.selectFrom("active_version")
			.innerJoin("version", "version.id", "active_version.version_id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		expect(version.commit_id).toBe(commit.id);
	});

	// Verify outside the transaction
	const version = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	expect(version.commit_id).toBe(commit.id);

	// Verify the changes were applied
	const file = await lix.db
		.selectFrom("file")
		.where("id", "=", "file1")
		.selectAll()
		.executeTakeFirstOrThrow();

	const fileData = JSON.parse(new TextDecoder().decode(file.data));
	expect(fileData).toEqual({ e1: "Transactional Value" });
});

test("applyCommit throws when commit doesn't exist", async () => {
	const lix = await openLix({});

	await expect(
		applyCommit({
			lix,
			commit: { id: "non-existent-commit" },
		})
	).rejects.toThrow();
});

test("applyCommit throws when version doesn't exist", async () => {
	const lix = await openLix({});

	// Create a dummy change set and commit
	const changeSet = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [],
	});

	const commit = await createCommit({
		lix,
		changeSet,
	});

	await expect(
		applyCommit({
			lix,
			commit,
			version: { id: "non-existent-version" },
		})
	).rejects.toThrow();
});

test("applyCommit applies multiple changes from the commit's change set", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
	});

	// Insert the schema
	await lix.db
		.insertInto("stored_schema_all")
		.values({
			value: MockJsonPropertySchema,
			lixcol_version_id: "global",
		})
		.execute();

	// Create a file
	await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			data: new TextEncoder().encode("{}"),
			path: "/test.json",
		})
		.execute();

	// Create multiple changes
	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c1",
				file_id: "file1",
				plugin_key: mockJsonPlugin.key,
				entity_id: "e1",
				schema_key: "mock_json_property",
				snapshot_content: { value: "Value 1" },
				schema_version: "1.0",
			},
			{
				id: "c2",
				file_id: "file1",
				plugin_key: mockJsonPlugin.key,
				entity_id: "e2",
				schema_key: "mock_json_property",
				snapshot_content: { value: "Value 2" },
				schema_version: "1.0",
			},
			{
				id: "c3",
				file_id: "file1",
				plugin_key: mockJsonPlugin.key,
				entity_id: "e3",
				schema_key: "mock_json_property",
				snapshot_content: { value: "Value 3" },
				schema_version: "1.0",
			},
		])
		.returningAll()
		.execute();

	// Create a change set with all changes
	const changeSet = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: changes.map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
	});

	const commit = await createCommit({
		lix,
		changeSet,
	});

	// Apply the commit
	await applyCommit({
		lix,
		commit,
	});

	// Verify all changes were applied
	const file = await lix.db
		.selectFrom("file")
		.where("id", "=", "file1")
		.selectAll()
		.executeTakeFirstOrThrow();

	const fileData = JSON.parse(new TextDecoder().decode(file.data));
	expect(fileData).toEqual({
		e1: "Value 1",
		e2: "Value 2",
		e3: "Value 3",
	});
});
