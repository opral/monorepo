import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import { commitIsDescendantOf } from "./commit-is-descendant-of.js";
import { commitIsAncestorOf } from "./commit-is-ancestor-of.js";
import { uuidV7 } from "../deterministic/uuid-v7.js";
import type { Lix } from "../lix/open-lix.js";

// Utility function to create a commit with optional parent
async function createCommitWithParent(args: {
	lix: Lix;
	changeSetId: string;
	parentCommitId?: string;
	versionId?: string;
}): Promise<string> {
	const commitId = uuidV7({ lix: args.lix });
	const versionId = args.versionId || "global";

	// Create the commit
	await args.lix.db
		.insertInto("commit_all")
		.values({
			id: commitId,
			change_set_id: args.changeSetId,
			lixcol_version_id: versionId,
		})
		.execute();

	// Create edge if parent is provided
	if (args.parentCommitId) {
		await args.lix.db
			.insertInto("commit_edge_all")
			.values({
				parent_id: args.parentCommitId,
				child_id: commitId,
				lixcol_version_id: versionId,
			})
			.execute();
	}

	return commitId;
}

test("selects all descendants excluding the current commit", async () => {
	const lix = await openLix({});

	// Create a linear chain of commits: c0 <- c1 <- c2
	const cs0 = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [],
	});
	const c0Id = await createCommitWithParent({ lix, changeSetId: cs0.id });

	const cs1 = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [],
	});
	const c1Id = await createCommitWithParent({
		lix,
		changeSetId: cs1.id,
		parentCommitId: c0Id,
	});

	const cs2 = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [],
	});
	const c2Id = await createCommitWithParent({
		lix,
		changeSetId: cs2.id,
		parentCommitId: c1Id,
	});

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
	const cs0 = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [],
	});
	const c0Id = uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c0Id,
			change_set_id: cs0.id,
			lixcol_version_id: "global",
		})
		.execute();

	const cs1 = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [],
	});
	const c1Id = uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c1Id,
			change_set_id: cs1.id,
			lixcol_version_id: "global",
		})
		.execute();
	await lix.db
		.insertInto("commit_edge_all")
		.values({
			parent_id: c0Id,
			child_id: c1Id,
			lixcol_version_id: "global",
		})
		.execute();

	const cs2 = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [],
	});
	const c2Id = uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c2Id,
			change_set_id: cs2.id,
			lixcol_version_id: "global",
		})
		.execute();
	await lix.db
		.insertInto("commit_edge_all")
		.values({
			parent_id: c1Id,
			child_id: c2Id,
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
	const cs0 = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [],
	});
	const c0Id = await createCommitWithParent({ lix, changeSetId: cs0.id });

	const cs1 = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [],
	});
	const c1Id = await createCommitWithParent({
		lix,
		changeSetId: cs1.id,
		parentCommitId: c0Id,
	});

	const cs2 = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [],
	});
	const c2Id = await createCommitWithParent({
		lix,
		changeSetId: cs2.id,
		parentCommitId: c1Id,
	});

	const cs3 = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [],
	});
	const c3Id = await createCommitWithParent({
		lix,
		changeSetId: cs3.id,
		parentCommitId: c2Id,
	});

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
	const cs0 = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [],
	});
	const c0Id = uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c0Id,
			change_set_id: cs0.id,
			lixcol_version_id: "global",
		})
		.execute();

	const cs1 = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [],
	});
	const c1Id = uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c1Id,
			change_set_id: cs1.id,
			lixcol_version_id: "global",
		})
		.execute();
	await lix.db
		.insertInto("commit_edge_all")
		.values({
			parent_id: c0Id,
			child_id: c1Id,
			lixcol_version_id: "global",
		})
		.execute();

	const cs2 = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [],
	});
	const c2Id = uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c2Id,
			change_set_id: cs2.id,
			lixcol_version_id: "global",
		})
		.execute();
	await lix.db
		.insertInto("commit_edge_all")
		.values({
			parent_id: c1Id,
			child_id: c2Id,
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
	const cs0 = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [],
	});
	const c0Id = uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c0Id,
			change_set_id: cs0.id,
			lixcol_version_id: "global",
		})
		.execute();

	const cs1 = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [],
	});
	const c1Id = uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c1Id,
			change_set_id: cs1.id,
			lixcol_version_id: "global",
		})
		.execute();
	await lix.db
		.insertInto("commit_edge_all")
		.values({
			parent_id: c0Id,
			child_id: c1Id,
			lixcol_version_id: "global",
		})
		.execute();

	const cs2 = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [],
	});
	const c2Id = uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: c2Id,
			change_set_id: cs2.id,
			lixcol_version_id: "global",
		})
		.execute();
	await lix.db
		.insertInto("commit_edge_all")
		.values({
			parent_id: c1Id,
			child_id: c2Id,
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
