import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { commitIsAncestorOf } from "./commit-is-ancestor-of.js";
import { uuidV7Sync } from "../runtime/deterministic/uuid-v7.js";

// commits are authoritative: insert directly into commit_all (no pre-created change sets).

test("selects all ancestors of the current commit", async () => {
	const lix = await openLix({});

	// Create a linear chain of commits: c0 <- c1 <- c2 (global)
	const c0Id = uuidV7Sync({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c0Id,
			change_set_id: "cs-" + c0Id,
			lixcol_version_id: "global",
		})
		.execute();

	const c1Id = uuidV7Sync({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c1Id,
			change_set_id: "cs-" + c1Id,
			parent_commit_ids: [c0Id],
			lixcol_version_id: "global",
		})
		.execute();

	const c2Id = uuidV7Sync({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c2Id,
			change_set_id: "cs-" + c2Id,
			parent_commit_ids: [c1Id],
			lixcol_version_id: "global",
		})
		.execute();

	// Should select c0, c1 as ancestors of c2
	const results = await lix.db
		.selectFrom("commit")
		.where(commitIsAncestorOf({ id: c2Id }))
		.select("id")
		.execute();

	expect(results.map((r) => r.id).sort()).toEqual([c0Id, c1Id].sort());
});

test("respects the optional depth limit", async () => {
	const lix = await openLix({});

	// c0 <- c1 <- c2
	const c0Id = uuidV7Sync({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c0Id,
			change_set_id: "cs-" + c0Id,
			lixcol_version_id: "global",
		})
		.execute();

	const c1Id = uuidV7Sync({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c1Id,
			change_set_id: "cs-" + c1Id,
			parent_commit_ids: [c0Id],
			lixcol_version_id: "global",
		})
		.execute();

	const c2Id = uuidV7Sync({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c2Id,
			change_set_id: "cs-" + c2Id,
			parent_commit_ids: [c1Id],
			lixcol_version_id: "global",
		})
		.execute();

	// With depth: 1, we expect c1 only
	const results = await lix.db
		.selectFrom("commit")
		.where(commitIsAncestorOf({ id: c2Id }, { depth: 1 }))
		.select("id")
		.execute();

	expect(results.map((r) => r.id).sort()).toEqual([c1Id].sort());
});

test("includeSelf true selects the current commit as well", async () => {
	const lix = await openLix({});

	// c0 <- c1 <- c2
	const c0Id = uuidV7Sync({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c0Id,
			change_set_id: "cs-" + c0Id,
			lixcol_version_id: "global",
		})
		.execute();

	const c1Id = uuidV7Sync({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c1Id,
			change_set_id: "cs-" + c1Id,
			parent_commit_ids: [c0Id],
			lixcol_version_id: "global",
		})
		.execute();

	const c2Id = uuidV7Sync({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c2Id,
			change_set_id: "cs-" + c2Id,
			parent_commit_ids: [c1Id],
			lixcol_version_id: "global",
		})
		.execute();

	// Should select c0, c1, c2
	const results = await lix.db
		.selectFrom("commit")
		.where(commitIsAncestorOf({ id: c2Id }, { includeSelf: true }))
		.select("id")
		.execute();

	expect(results.map((r) => r.id).sort()).toEqual([c0Id, c1Id, c2Id].sort());
});

test("can be combined with where(id = X) to check specific ancestry", async () => {
	const lix = await openLix({});

	// Create chain: c1 <- c2 <- c3
	const c1Id = uuidV7Sync({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c1Id,
			change_set_id: "cs-" + c1Id,
			lixcol_version_id: "global",
		})
		.execute();

	const c2Id = uuidV7Sync({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c2Id,
			change_set_id: "cs-" + c2Id,
			parent_commit_ids: [c1Id],
			lixcol_version_id: "global",
		})
		.execute();

	const c3Id = uuidV7Sync({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c3Id,
			change_set_id: "cs-" + c3Id,
			parent_commit_ids: [c2Id],
			lixcol_version_id: "global",
		})
		.execute();

	// Test: Check if c2 is an ancestor of c3 (should return c2)
	const c2IsAncestorOfC3 = await lix.db
		.selectFrom("commit")
		.where("id", "=", c2Id)
		.where(commitIsAncestorOf({ id: c3Id }))
		.select("id")
		.execute();

	expect(c2IsAncestorOfC3).toHaveLength(1);
	expect(c2IsAncestorOfC3[0]!.id).toBe(c2Id);

	// Test: Check if c1 is an ancestor of c3 (should return c1)
	const c1IsAncestorOfC3 = await lix.db
		.selectFrom("commit")
		.where("id", "=", c1Id)
		.where(commitIsAncestorOf({ id: c3Id }))
		.select("id")
		.execute();

	expect(c1IsAncestorOfC3).toHaveLength(1);
	expect(c1IsAncestorOfC3[0]!.id).toBe(c1Id);

	// Test: Check if c3 is an ancestor of c3 (should return empty - not inclusive by default)
	const c3IsAncestorOfC3 = await lix.db
		.selectFrom("commit")
		.where("id", "=", c3Id)
		.where(commitIsAncestorOf({ id: c3Id }))
		.select("id")
		.execute();

	expect(c3IsAncestorOfC3).toHaveLength(0);

	// Test: Check if c3 is an ancestor of c1 (should return empty - wrong direction)
	const c3IsAncestorOfC1 = await lix.db
		.selectFrom("commit")
		.where("id", "=", c3Id)
		.where(commitIsAncestorOf({ id: c1Id }))
		.select("id")
		.execute();

	expect(c3IsAncestorOfC1).toHaveLength(0);

	// Test: Check with includeSelf option
	const c3IsAncestorOfC3Inclusive = await lix.db
		.selectFrom("commit")
		.where("id", "=", c3Id)
		.where(commitIsAncestorOf({ id: c3Id }, { includeSelf: true }))
		.select("id")
		.execute();

	expect(c3IsAncestorOfC3Inclusive).toHaveLength(1);
	expect(c3IsAncestorOfC3Inclusive[0]!.id).toBe(c3Id);
});
