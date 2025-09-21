import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { commitIsDescendantOf } from "./commit-is-descendant-of.js";
import { commitIsAncestorOf } from "./commit-is-ancestor-of.js";
import { uuidV7 } from "../engine/functions/uuid-v7.js";

// commits are authoritative: insert directly into commit_all (no pre-created change sets).

test("selects all descendants excluding the current commit", async () => {
	const lix = await openLix({});

	// Create a linear chain of commits: c0 <- c1 <- c2
	const c0Id = await uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c0Id,
			change_set_id: "cs-" + c0Id,
			lixcol_version_id: "global",
		})
		.execute();

	const c1Id = await uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c1Id,
			change_set_id: "cs-" + c1Id,
			parent_commit_ids: [c0Id],
			lixcol_version_id: "global",
		})
		.execute();

	const c2Id = await uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c2Id,
			change_set_id: "cs-" + c2Id,
			parent_commit_ids: [c1Id],
			lixcol_version_id: "global",
		})
		.execute();

	// Should select c1, c2 as descendants of c0
	const results = await lix.db
		.selectFrom("commit")
		.where(commitIsDescendantOf({ id: c0Id }))
		.select("id")
		.execute();

	expect(results.map((r) => r.id).sort()).toEqual([c1Id, c2Id].sort());
});

test("respects the optional depth limit", async () => {
	const lix = await openLix({});

	// c0 <- c1 <- c2
	const c0Id = await uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c0Id,
			change_set_id: "cs-" + c0Id,
			lixcol_version_id: "global",
		})
		.execute();

	const c1Id = await uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c1Id,
			change_set_id: "cs-" + c1Id,
			parent_commit_ids: [c0Id],
			lixcol_version_id: "global",
		})
		.execute();

	const c2Id = await uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c2Id,
			change_set_id: "cs-" + c2Id,
			parent_commit_ids: [c1Id],
			lixcol_version_id: "global",
		})
		.execute();

	// With depth: 1 starting from c0, we expect c1 only
	const results = await lix.db
		.selectFrom("commit")
		.where(commitIsDescendantOf({ id: c0Id }, { depth: 1 }))
		.select("id")
		.execute();

	expect(results.map((r) => r.id).sort()).toEqual([c1Id].sort());
});

test("can be combined with ancestor filter to select commits between two points", async () => {
	const lix = await openLix({});

	// Create a linear chain: c0 <- c1 <- c2 <- c3
	const c0Id = await uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c0Id,
			change_set_id: "cs-" + c0Id,
			lixcol_version_id: "global",
		})
		.execute();

	const c1Id = await uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c1Id,
			change_set_id: "cs-" + c1Id,
			parent_commit_ids: [c0Id],
			lixcol_version_id: "global",
		})
		.execute();

	const c2Id = await uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c2Id,
			change_set_id: "cs-" + c2Id,
			parent_commit_ids: [c1Id],
			lixcol_version_id: "global",
		})
		.execute();

	const c3Id = await uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c3Id,
			change_set_id: "cs-" + c3Id,
			parent_commit_ids: [c2Id],
			lixcol_version_id: "global",
		})
		.execute();

	// Select commits that are descendants of c1 AND ancestors of c3
	const results = await lix.db
		.selectFrom("commit")
		.where(commitIsDescendantOf({ id: c1Id }))
		.where(commitIsAncestorOf({ id: c3Id }))
		.select("id")
		.execute();

	expect(results.map((r) => r.id).sort()).toEqual([c2Id].sort());
});

test("selects descendants including the current commit when includeSelf is true", async () => {
	const lix = await openLix({});

	// Setup: c0 <- c1 <- c2
	const c0Id = await uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c0Id,
			change_set_id: "cs-" + c0Id,
			lixcol_version_id: "global",
		})
		.execute();

	const c1Id = await uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c1Id,
			change_set_id: "cs-" + c1Id,
			parent_commit_ids: [c0Id],
			lixcol_version_id: "global",
		})
		.execute();

	const c2Id = await uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c2Id,
			change_set_id: "cs-" + c2Id,
			parent_commit_ids: [c1Id],
			lixcol_version_id: "global",
		})
		.execute();

	// Should select c0, c1, c2 when includeSelf: true starting from c0
	const results = await lix.db
		.selectFrom("commit")
		.where(commitIsDescendantOf({ id: c0Id }, { includeSelf: true }))
		.select("id")
		.execute();

	expect(results.map((r) => r.id).sort()).toEqual([c0Id, c1Id, c2Id].sort());
});

test("respects depth limit when includeSelf is true", async () => {
	const lix = await openLix({});

	// Setup: c0 <- c1 <- c2
	const c0Id = await uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c0Id,
			change_set_id: "cs-" + c0Id,
			lixcol_version_id: "global",
		})
		.execute();

	const c1Id = await uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c1Id,
			change_set_id: "cs-" + c1Id,
			parent_commit_ids: [c0Id],
			lixcol_version_id: "global",
		})
		.execute();

	const c2Id = await uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c2Id,
			change_set_id: "cs-" + c2Id,
			parent_commit_ids: [c1Id],
			lixcol_version_id: "global",
		})
		.execute();

	// With depth: 1 and includeSelf: true starting from c0, we expect c0 and c1
	const results = await lix.db
		.selectFrom("commit")
		.where(commitIsDescendantOf({ id: c0Id }, { depth: 1, includeSelf: true }))
		.select("id")
		.execute();

	expect(results.map((r) => r.id).sort()).toEqual([c0Id, c1Id].sort());
});
