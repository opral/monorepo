import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import type { Lix } from "../lix/open-lix.js";
import type { LixChangeSet } from "../change-set/schema.js";
import type { LixCommit } from "../commit/schema.js";
import { uuidV7, uuidV7Sync } from "../engine/deterministic/uuid-v7.js";
import { createVersionFromCommit } from "./create-version-from-commit.js";
import { createVersion } from "./create-version.js";

// Local test helper: create a global commit pointing to a given change set
async function createCommit(args: {
	lix: Lix;
	changeSet: Pick<LixChangeSet, "id">;
}): Promise<Pick<LixCommit, "id" | "change_set_id">> {
	const commitId = await uuidV7({ lix: args.lix });
	await args.lix.db
		.insertInto("commit_all")
		.values({
			id: commitId,
			change_set_id: args.changeSet.id,
			lixcol_version_id: "global",
		})
		.execute();
	const row = await args.lix.db
		.selectFrom("commit_all")
		.where("id", "=", commitId)
		.where("lixcol_version_id", "=", "global")
		.selectAll()
		.executeTakeFirstOrThrow();
	return { id: row.id, change_set_id: row.change_set_id };
}

// Planning all test cases for createVersionFromCommit (empty bodies for TDD)

test("creates a version pointing to the given commit", async () => {
	const lix = await openLix({});

	// Create an empty change set and a commit
	const cs = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [],
	});

	const commit = await createCommit({ lix, changeSet: cs });

	const version = await createVersionFromCommit({ lix, commit });

	expect(version.commit_id).toBe(commit.id);
	expect(version.id).toBeDefined();
});

test("accepts commit as { id } object", async () => {
	const lix = await openLix({});

	const cs = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [],
	});
	const commit = await createCommit({ lix, changeSet: cs });

	// Pass a minimal object with only id
	const version = await createVersionFromCommit({
		lix,
		commit: { id: commit.id },
	});

	expect(version.commit_id).toBe(commit.id);
});

test("sets a fresh working_commit_id backed by an empty change set", async () => {
	const lix = await openLix({});

	// Build a base commit to branch from
	const cs = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [],
	});
	const base = await createCommit({ lix, changeSet: cs });

	const v = await createVersionFromCommit({ lix, commit: base });

	// working commit should be new and different from base commit
	expect(v.working_commit_id).toBeDefined();
	expect(v.working_commit_id).not.toBe(base.id);

	// working commit should point to an empty change set
	const workingCommit = await lix.db
		.selectFrom("commit_all")
		.where("id", "=", v.working_commit_id)
		.where("lixcol_version_id", "=", "global")
		.selectAll()
		.executeTakeFirstOrThrow();

	const elements = await lix.db
		.selectFrom("change_set_element_all")
		.where("change_set_id", "=", workingCommit.change_set_id)
		.where("lixcol_version_id", "=", "global")
		.selectAll()
		.execute();

	expect(elements.length).toBe(0);
});

test("defaults inheritsFrom to global when omitted", async () => {
	const lix = await openLix({});

	const cs = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [],
	});
	const commit = await createCommit({ lix, changeSet: cs });

	const v = await createVersionFromCommit({ lix, commit });
	expect(v.inherits_from_version_id).toBe("global");
});

test("allows explicit inheritsFrom: null (no inheritance)", async () => {
	const lix = await openLix({});

	const cs = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [],
	});

	const commit = await createCommit({ lix, changeSet: cs });

	const v = await createVersionFromCommit({
		lix,
		commit,
		inheritsFrom: null,
	});
	expect(v.inherits_from_version_id).toBeNull();
});

test("allows explicit inheritsFrom: { version }", async () => {
	const lix = await openLix({});

	// Create a parent version to inherit from
	const parent = await createVersion({ lix, name: "parent-version" });

	const cs = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [],
	});
	const commit = await createCommit({ lix, changeSet: cs });

	const v = await createVersionFromCommit({
		lix,
		commit,
		inheritsFrom: parent,
	});

	expect(v.inherits_from_version_id).toBe(parent.id);
});

test("supports custom id and name", async () => {
	const lix = await openLix({});

	const cs = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [],
	});
	const commit = await createCommit({ lix, changeSet: cs });

	const v = await createVersionFromCommit({
		lix,
		commit,
		id: "my-version-id",
		name: "My Version",
	});
	expect(v.id).toBe("my-version-id");
	expect(v.name).toBe("My Version");
});

test("throws when the commit does not exist", async () => {
	const lix = await openLix({});
	await expect(
		createVersionFromCommit({ lix, commit: { id: "non-existent-commit" } })
	).rejects.toThrow();
});

test("works within a transaction", async () => {
	const lix = await openLix({});

	const cs = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [],
	});
	const commit = await createCommit({ lix, changeSet: cs });

	const v = await lix.db.transaction().execute(async (trx) => {
		return createVersionFromCommit({ lix: { ...lix, db: trx }, commit });
	});

	// Visible outside the transaction and consistent
	const readBack = await lix.db
		.selectFrom("version")
		.selectAll()
		.where("id", "=", v.id)
		.executeTakeFirstOrThrow();
	expect(readBack.commit_id).toBe(commit.id);
});
