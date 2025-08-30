import { test } from "vitest";
import { sql } from "kysely";
import { simulationTest } from "../test-utilities/simulation-test/simulation-test.js";
import { createVersion } from "./create-version.js";
import { mergeVersion } from "./merge-version.js";

test("simulationTest discovery", () => {});

// We will implement mergeVersion step by step.
// For now, outline the test plan with todos (flat list).

// Core behavior
simulationTest(
	"merges created entities from source into target",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		// Create versions
		const source = await createVersion({ lix, name: "source" });
		const target = await createVersion({ lix, name: "target" });

		// Insert entities only in source
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "e_created_1",
				schema_key: "test_entity",
				file_id: "fileA",
				version_id: source.id,
				plugin_key: "test_plugin",
				snapshot_content: { v: "from-source-1" },
				schema_version: "1.0",
			})
			.execute();

		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "e_created_2",
				schema_key: "test_entity",
				file_id: "fileA",
				version_id: source.id,
				plugin_key: "test_plugin",
				snapshot_content: { v: "from-source-2" },
				schema_version: "1.0",
			})
			.execute();

		// Execute merge
		await mergeVersion({ lix, source, target });

		// Target should now contain the created entities with source content
		const targetRows = await lix.db
			.selectFrom("state_all")
			.where("version_id", "=", target.id)
			.where("file_id", "=", "fileA")
			.where("schema_key", "=", "test_entity")
			.select([
				"entity_id",
				"schema_key",
				"file_id",
				"version_id",
				"change_id",
				"commit_id",
				"plugin_key",
				"schema_version",
				"snapshot_content",
			])
			.execute();

		expectDeterministic(targetRows.length).toBe(2);
		const map = new Map(targetRows.map((r: any) => [r.entity_id, r]));
		expectDeterministic(map.get("e_created_1")?.snapshot_content).toEqual({
			v: "from-source-1",
		});
		expectDeterministic(map.get("e_created_2")?.snapshot_content).toEqual({
			v: "from-source-2",
		});

		// Ensure no new change rows were created for these entities
		// 1) Target change_ids equal source change_ids
		const sourceRows = await lix.db
			.selectFrom("state_all")
			.where("version_id", "=", source.id)
			.where("file_id", "=", "fileA")
			.where("schema_key", "=", "test_entity")
			.select(["entity_id", "change_id"])
			.execute();
		const srcMap = new Map(
			sourceRows.map((r: any) => [r.entity_id, r.change_id])
		);
		expectDeterministic(map.get("e_created_1")?.change_id).toBe(
			srcMap.get("e_created_1")
		);
		expectDeterministic(map.get("e_created_2")?.change_id).toBe(
			srcMap.get("e_created_2")
		);

		// 2) The change table contains only the original two user changes for these keys
		const changeRowsForKeys = await lix.db
			.selectFrom("change")
			.where("schema_key", "=", "test_entity")
			.where("entity_id", "in", ["e_created_1", "e_created_2"])
			.select(["id"])
			.execute();

		expectDeterministic(changeRowsForKeys.length).toBe(2);
	}
);

simulationTest(
	"merges updated entities: source overwrites target content",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const source = await createVersion({ lix, name: "source" });
		const target = await createVersion({ lix, name: "target" });

		// Seed different content on both
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "e_upd",
				schema_key: "test_entity",
				file_id: "fileU",
				version_id: target.id,
				plugin_key: "test_plugin",
				snapshot_content: { v: "target" },
				schema_version: "1.0",
			})
			.execute();

		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "e_upd",
				schema_key: "test_entity",
				file_id: "fileU",
				version_id: source.id,
				plugin_key: "test_plugin",
				snapshot_content: { v: "source" },
				schema_version: "1.0",
			})
			.execute();

		// Capture source change_id
		const srcRow = await lix.db
			.selectFrom("state_all")
			.where("version_id", "=", source.id)
			.where("file_id", "=", "fileU")
			.where("schema_key", "=", "test_entity")
			.where("entity_id", "=", "e_upd")
			.select(["change_id"])
			.executeTakeFirstOrThrow();

		await mergeVersion({ lix, source, target });

		const tgtRow = await lix.db
			.selectFrom("state_all")
			.where("version_id", "=", target.id)
			.where("file_id", "=", "fileU")
			.where("schema_key", "=", "test_entity")
			.where("entity_id", "=", "e_upd")
			.select(["snapshot_content", "change_id"])
			.executeTakeFirstOrThrow();

		expectDeterministic(tgtRow.snapshot_content).toEqual({ v: "source" });
		// No new live change: change_id equals source change
		expectDeterministic(tgtRow.change_id).toBe(srcRow.change_id);
	}
);
simulationTest(
	"applies explicit deletions: source tombstones delete target content",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const source = await createVersion({ lix, name: "source" });
		const target = await createVersion({ lix, name: "target" });

		// Seed live in target
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "e_del",
				schema_key: "test_entity",
				file_id: "fileD",
				version_id: target.id,
				plugin_key: "test_plugin",
				snapshot_content: { v: "target" },
				schema_version: "1.0",
			})
			.execute();

		// Create live in source then delete to create tombstone
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "e_del",
				schema_key: "test_entity",
				file_id: "fileD",
				version_id: source.id,
				plugin_key: "test_plugin",
				snapshot_content: { v: "source" },
				schema_version: "1.0",
			})
			.execute();
		await lix.db
			.deleteFrom("state_all")
			.where("entity_id", "=", "e_del")
			.where("schema_key", "=", "test_entity")
			.where("file_id", "=", "fileD")
			.where("version_id", "=", source.id)
			.execute();

		await mergeVersion({ lix, source, target });

		// Target should have no live entity now
		const tgtRows = await lix.db
			.selectFrom("state_all")
			.where("version_id", "=", target.id)
			.where("file_id", "=", "fileD")
			.where("schema_key", "=", "test_entity")
			.where("entity_id", "=", "e_del")
			.selectAll()
			.execute();
		expectDeterministic(tgtRows.length).toBe(0);

		// Verify a deletion change was created and referenced in the merge change_set
		const afterTarget = await lix.db
			.selectFrom("version")
			.where("id", "=", target.id)
			.selectAll()
			.executeTakeFirstOrThrow();
		const commitChangeRow = await lix.db
			.selectFrom("change")
			.where("schema_key", "=", "lix_commit")
			.where(
				sql`json_extract(snapshot_content, '$.id')`,
				"=",
				afterTarget.commit_id as any
			)
			.select([sql`json(snapshot_content)`.as("snapshot")])
			.executeTakeFirstOrThrow();
		const changeSetId = (commitChangeRow as any).snapshot
			.change_set_id as string;

		// Find referenced deletion change for this key
		const cseRows = await lix.db
			.selectFrom("change")
			.where("schema_key", "=", "lix_change_set_element")
			.where(
				sql`json_extract(snapshot_content, '$.change_set_id')`,
				"=",
				changeSetId as any
			)
			.select([sql`json(snapshot_content)`.as("snapshot")])
			.execute();
		const anchoredIds = cseRows.map((r: any) => r.snapshot.change_id);
		const anchoredChanges = anchoredIds.length
			? await lix.db
					.selectFrom("change")
					.where("id", "in", anchoredIds)
					.select([
						"id",
						"schema_key",
						"entity_id",
						sql`json(snapshot_content)`.as("snapshot"),
					])
					.execute()
			: [];
		const del = anchoredChanges.find(
			(c: any) =>
				c.schema_key === "test_entity" &&
				c.entity_id === "e_del" &&
				c.snapshot === null
		);
		expectDeterministic(Boolean(del)).toBe(true);
	}
);

simulationTest(
	"keeps target-only entities unchanged (no explicit delete in source)",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const source = await createVersion({ lix, name: "source" });
		const target = await createVersion({ lix, name: "target" });

		// Seed only in target
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "only-target",
				schema_key: "test_entity",
				file_id: "fileT",
				version_id: target.id,
				plugin_key: "test_plugin",
				snapshot_content: { v: "target" },
				schema_version: "1.0",
			})
			.execute();

		const before = await lix.db
			.selectFrom("version")
			.where("id", "=", target.id)
			.selectAll()
			.executeTakeFirstOrThrow();

		await mergeVersion({ lix, source, target });

		// Target row unchanged
		const tgt = await lix.db
			.selectFrom("state_all")
			.where("version_id", "=", target.id)
			.where("file_id", "=", "fileT")
			.where("schema_key", "=", "test_entity")
			.where("entity_id", "=", "only-target")
			.selectAll()
			.executeTakeFirstOrThrow();

		expectDeterministic(tgt.snapshot_content).toEqual({ v: "target" });

		// No merge commit created (no diffs) -> commit_id unchanged
		const after = await lix.db
			.selectFrom("version")
			.where("id", "=", target.id)
			.selectAll()
			.executeTakeFirstOrThrow();

		expectDeterministic(after.commit_id).toBe(before.commit_id);
	}
);

simulationTest(
	"no-op merge returns current target tip when no changes",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});
		const source = await createVersion({ lix, name: "source" });
		const target = await createVersion({ lix, name: "target" });

		const before = await lix.db
			.selectFrom("version")
			.where("id", "=", target.id)
			.selectAll()
			.executeTakeFirstOrThrow();

		await mergeVersion({ lix, source, target });

		const after = await lix.db
			.selectFrom("version")
			.where("id", "=", target.id)
			.selectAll()
			.executeTakeFirstOrThrow();

		expectDeterministic(after.commit_id).toBe(before.commit_id);
	}
);

simulationTest(
	"idempotent: running the same merge twice results in no further changes",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});
		const source = await createVersion({ lix, name: "source" });
		const target = await createVersion({ lix, name: "target" });

		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "idem-1",
				schema_key: "test_entity",
				file_id: "fileI",
				version_id: source.id,
				plugin_key: "test_plugin",
				snapshot_content: { v: "from-source" },
				schema_version: "1.0",
			})
			.execute();

		await mergeVersion({ lix, source, target });

		const afterFirst = await lix.db
			.selectFrom("version")
			.where("id", "=", target.id)
			.selectAll()
			.executeTakeFirstOrThrow();

		expectDeterministic(afterFirst.commit_id);

		// Helper to inspect a commit: list its change_set contents by schema
		const dumpCommit = async (commitId: string) => {
			const commitChange = await lix.db
				.selectFrom("change")
				.where("schema_key", "=", "lix_commit")
				.where(
					sql`json_extract(snapshot_content, '$.id')`,
					"=",
					commitId as any
				)
				.select(["id", sql`json(snapshot_content)`.as("snapshot")])
				.executeTakeFirst();
			if (!commitChange) return { commitId, change_set_id: null, schemas: {} };
			const change_set_id = (commitChange as any).snapshot
				.change_set_id as string;
			const cse = await lix.db
				.selectFrom("change")
				.where("schema_key", "=", "lix_change_set_element")
				.where(
					sql`json_extract(snapshot_content, '$.change_set_id')`,
					"=",
					change_set_id as any
				)
				.select([sql`json(snapshot_content)`.as("snapshot")])
				.execute();
			const anchoredIds = cse.map((r: any) => r.snapshot.change_id as string);
			const referenced = anchoredIds.length
				? await lix.db
						.selectFrom("change")
						.where("id", "in", anchoredIds)
						.select([
							"id",
							"schema_key",
							"entity_id",
							sql`json(snapshot_content)`.as("snapshot"),
						])
						.execute()
				: [];
			const bySchema = referenced.reduce<Record<string, number>>(
				(m, r: any) => {
					m[r.schema_key] = (m[r.schema_key] ?? 0) + 1;
					return m;
				},
				{}
			);
			return { commitId, change_set_id, schemas: bySchema, referenced };
		};

		// Verify snapshots after first merge
		const firstStateAll = await lix.db
			.selectFrom("state_all")
			.where("version_id", "=", target.id)
			.where("file_id", "=", "fileI")
			.where("schema_key", "=", "test_entity")
			.where("entity_id", "=", "idem-1")
			.select([
				"change_id",
				"commit_id",
				sql`json(snapshot_content)`.as("snapshot"),
			])
			.executeTakeFirstOrThrow();
		expectDeterministic(firstStateAll);

		await mergeVersion({ lix, source, target });

		const afterSecond = await lix.db
			.selectFrom("version")
			.where("id", "=", target.id)
			.selectAll()
			.executeTakeFirstOrThrow();
		expectDeterministic(afterSecond.commit_id);

		// Dump commit contents for both tips
		const firstDump = await dumpCommit(afterFirst.commit_id);
		const secondDump = await dumpCommit(afterSecond.commit_id);
		expectDeterministic(firstDump);
		expectDeterministic(secondDump);

		// Deterministic across simulations and within a run
		expectDeterministic(afterSecond.commit_id).toBe(afterFirst.commit_id);

		// State remains referenced once
		const tgtRows = await lix.db
			.selectFrom("state_all")
			.where("version_id", "=", target.id)
			.where("file_id", "=", "fileI")
			.where("schema_key", "=", "test_entity")
			.where("entity_id", "=", "idem-1")
			.selectAll()
			.execute();
		expectDeterministic(tgtRows.length).toBe(1);

		// Verify snapshots after second merge
		const secondStateAll = await lix.db
			.selectFrom("state_all")
			.where("version_id", "=", target.id)
			.where("file_id", "=", "fileI")
			.where("schema_key", "=", "test_entity")
			.where("entity_id", "=", "idem-1")
			.select([
				"change_id",
				"commit_id",
				sql`json(snapshot_content)`.as("snapshot"),
			])
			.executeTakeFirstOrThrow();

		// Verify business snapshots are correct across both surfaces
		expectDeterministic(firstStateAll.snapshot).toEqual({ v: "from-source" });

		expectDeterministic(secondStateAll.snapshot).toEqual({ v: "from-source" });
	}
);

simulationTest(
	"treats source === target as a no-op merge",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const version = await createVersion({ lix, name: "same" });

		// Seed some business data in the version
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "noop-1",
				schema_key: "test_entity",
				file_id: "fileS",
				version_id: version.id,
				plugin_key: "test_plugin",
				snapshot_content: { v: "seed" },
				schema_version: "1.0",
			})
			.execute();

		// Capture pointers before
		const beforeTarget = await lix.db
			.selectFrom("version")
			.where("id", "=", version.id)
			.selectAll()
			.executeTakeFirstOrThrow();
		const beforeGlobal = await lix.db
			.selectFrom("version")
			.where("id", "=", "global")
			.selectAll()
			.executeTakeFirstOrThrow();

		// Call merge with identical source and target
		await mergeVersion({ lix, source: version, target: version });

		// Pointers must be unchanged
		const afterTarget = await lix.db
			.selectFrom("version")
			.where("id", "=", version.id)
			.selectAll()
			.executeTakeFirstOrThrow();
		const afterGlobal = await lix.db
			.selectFrom("version")
			.where("id", "=", "global")
			.selectAll()
			.executeTakeFirstOrThrow();

		expectDeterministic(afterTarget.commit_id).toBe(beforeTarget.commit_id);
		expectDeterministic(afterGlobal.commit_id).toBe(beforeGlobal.commit_id);

		//  tate remains unchanged
		const row = await lix.db
			.selectFrom("state_all")
			.where("file_id", "=", "fileS")
			.where("schema_key", "=", "test_entity")
			.where("entity_id", "=", "noop-1")
			.selectAll()
			.executeTakeFirstOrThrow();

		expectDeterministic(row.snapshot_content).toEqual({ v: "seed" });
	}
);
// Edge cases
test.todo("handles empty source (no entities) gracefully");
test.todo("handles empty target (fresh branch) gracefully");
test.todo("handles mixed created/updated/deleted keys across multiple files");

/**
 * TL;DR — Global/Source/Target merge model
 *
 * - Target (the version we merge into) holds user-domain entities. It receives
 *   a new tip commit (target.tip_after) that ANCHORS the winning entity changes.
 * - Global holds the DAG (graph) for all versions. It publishes commits, edges
 *   and version pointers so the full history can be re-materialized from the
 *   global tip alone.
 * - Source remains untouched by the merge: its `commit_id` is unchanged.
 *
 * Properties guaranteed by the two-commit model:
 * 1) Target commit (target.tip_after) has TWO PARENTS:
 *      - parent_1 = target.tip_before
 *      - parent_2 = source.tip_before
 * 2) Global commit (global.tip_after) publishes graph-only rows for BOTH commits
 *    (global.tip_after and target.tip_after) and the necessary edges/version updates:
 *      - Commits (2):   ['lix_commit' for global.tip_after, 'lix_commit' for target.tip_after]
 *      - Edges (3):     [target.tip_before → target.tip_after,
 *                        source.tip_before → target.tip_after,
 *                        global.tip_before → global.tip_after]
 *      - Versions (2):  ['lix_version' for target.id   → target.tip_after,
 *                        'lix_version' for 'global'    → global.tip_after]
 * 3) No user-domain entities are referenced under global — only graph metadata and version updates.
 *
 * Visual overview (simplified):
 *
 *  ┌─────────────────┐                 ┌─────────────────────────┐
 *  │  version_target │  target data    │   COMMIT (target)       │
 *  └─────────────────┘ ───────────────▶│  references user entities  │
 *                                      └──────────┬──────────────┘
 *                                                 │ parent edges (2)
 *                                                 │ from: target.tip_before, source.tip_before
 *                                                 ▼
 *  ┌────────────┐                   ┌─────────────────────────┐
 *  │  global    │  graph rows       │  COMMIT (global)        │
 *  └────────────┘ ─────────────────▶│  change_set with:       │
 *                                   │    commits (2),         │
 *                                   │    edges   (3),         │
 *                                   │    versions (2)         │
 *                                   └──────────┬──────────────┘
 *                                              │ edge (1)
 *                                              │ from: global.tip_before to global.tip_after
 *                                              ▼
 *                                   versions: target → target.tip_after,
 *                                             global → global.tip_after
 */
simulationTest(
	"merge meta: two-commit model writes global graph rows and local data",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		// Create versions
		const source = await createVersion({ lix, name: "source" });
		const target = await createVersion({ lix, name: "target" });

		// Insert one entity only in source
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "merge-meta-1",
				schema_key: "test_entity",
				file_id: "fileM",
				version_id: source.id,
				plugin_key: "test_plugin",
				snapshot_content: { v: "content" },
				schema_version: "1.0",
			})
			.execute();

		// Capture tips before merge for edge assertions
		const beforeSource = await lix.db
			.selectFrom("version")
			.where("id", "=", source.id)
			.selectAll()
			.executeTakeFirstOrThrow();

		const beforeTarget = await lix.db
			.selectFrom("version")
			.where("id", "=", target.id)
			.selectAll()
			.executeTakeFirstOrThrow();

		const beforeGlobal = await lix.db
			.selectFrom("version")
			.where("id", "=", "global")
			.selectAll()
			.executeTakeFirstOrThrow();

		// Perform merge
		await mergeVersion({ lix, source, target });

		const afterSource = await lix.db
			.selectFrom("version")
			.where("id", "=", source.id)
			.selectAll()
			.executeTakeFirstOrThrow();

		// Source commit id should remain unchanged by merge
		expectDeterministic(afterSource.commit_id).toBe(beforeSource.commit_id);

		// Fetch updated target and global version commits
		const afterTarget = await lix.db
			.selectFrom("version")
			.where("id", "=", target.id)
			.selectAll()
			.executeTakeFirstOrThrow();

		const afterGlobal = await lix.db
			.selectFrom("version")
			.where("id", "=", "global")
			.selectAll()
			.executeTakeFirstOrThrow();

		// Identify target tip commit and verify it has exactly two parents
		const targetCommitId = afterTarget.commit_id;
		const edgesToTarget = await lix.db
			.selectFrom("commit_edge")
			.where("child_id", "=", targetCommitId)
			.select(["parent_id", "child_id"])
			.execute();

		expectDeterministic(edgesToTarget.length).toBe(2);

		const targetParents = new Set(edgesToTarget.map((r: any) => r.parent_id));

		expectDeterministic(targetParents.has(beforeTarget.commit_id)).toBe(true);
		expectDeterministic(targetParents.has(beforeSource.commit_id)).toBe(true);

		// ── Expect block 1: GLOBAL ────────────────────────────────────────────────
		// Global expectations:
		// - Global tip changed
		// - Global change_set references: commits (2), edges (3), versions (2)

		expectDeterministic(afterGlobal.commit_id).not.toBe(beforeGlobal.commit_id);

		const globalCommit = await lix.db
			.selectFrom("commit_all")
			.where("lixcol_version_id", "=", "global")
			.where("id", "=", afterGlobal.commit_id)
			.selectAll()
			.executeTakeFirstOrThrow();

		const changeSetId = globalCommit.change_set_id;
		const cseRows = await lix.db
			.selectFrom("change_set_element_all")
			.where("lixcol_version_id", "=", "global")
			.where("change_set_id", "=", changeSetId)
			.select([
				"change_set_id",
				"change_id",
				"entity_id",
				"schema_key",
				"file_id",
			])
			.execute();

    const schemaCounts = cseRows.reduce<Record<string, number>>(
        (acc, r: any) => {
            acc[r.schema_key] = (acc[r.schema_key] ?? 0) + 1;
            return acc;
        },
        {}
    );
    expectDeterministic(schemaCounts["lix_commit"]).toBe(2);
    expectDeterministic(schemaCounts["lix_version"]).toBe(2);

		// Commits: one for afterGlobal and one for afterTarget
		const commitIds = new Set(
			cseRows
				.filter((r: any) => r.schema_key === "lix_commit")
				.map((r: any) => r.entity_id)
		);
		expectDeterministic(commitIds.has(afterGlobal.commit_id)).toBe(true);
		expectDeterministic(commitIds.has(afterTarget.commit_id)).toBe(true);

    // Edges are derived/materialized: verify via commit_edge view (global scope)
    const allEdges = await lix.db
        .selectFrom("commit_edge")
        .select(["parent_id", "child_id"])
        .execute();
    const parentsSet = new Set(allEdges.map((e: any) => e.parent_id));
    const childrenSet = new Set(allEdges.map((e: any) => e.child_id));
    // target edges
    expectDeterministic(parentsSet.has(beforeTarget.commit_id)).toBe(true);
    expectDeterministic(parentsSet.has(beforeSource.commit_id)).toBe(true);
    expectDeterministic(childrenSet.has(targetCommitId)).toBe(true);
    // global lineage edge
    const lineageEdge = allEdges.find(
        (e: any) => e.parent_id === beforeGlobal.commit_id && e.child_id === afterGlobal.commit_id
    );
    expectDeterministic(Boolean(lineageEdge)).toBe(true);

		// Versions referenced in CSE: verify presence, and verify pointers via version view
		const versionEntityIds = new Set(
			cseRows
				.filter((r: any) => r.schema_key === "lix_version")
				.map((r: any) => r.entity_id)
		);
		expectDeterministic(versionEntityIds.has(target.id)).toBe(true);
		expectDeterministic(versionEntityIds.has("global")).toBe(true);
		const versionTargetNow = await lix.db
			.selectFrom("version")
			.where("id", "=", target.id)
			.selectAll()
			.executeTakeFirstOrThrow();
		const versionGlobalNow = await lix.db
			.selectFrom("version")
			.where("id", "=", "global")
			.selectAll()
			.executeTakeFirstOrThrow();
		expectDeterministic(versionTargetNow.commit_id).toBe(afterTarget.commit_id);
		expectDeterministic(versionGlobalNow.commit_id).toBe(afterGlobal.commit_id);

		// ── Expect block 2: LOCAL ────────────────────────────────────────────────
		// Local expectations:
		// - Target state reflects the local entity change

		// Business state lands in target version's state view
		const targetState = await lix.db
			.selectFrom("state_all")
			.where("version_id", "=", target.id)
			.where("file_id", "=", "fileM")
			.where("schema_key", "=", "test_entity")
			.selectAll()
			.execute();

		expectDeterministic(targetState.length).toBe(1);

		// Target commit change_set should reference exactly the merged entity once
		const targetCommit = await lix.db
			.selectFrom("commit_all")
			.where("lixcol_version_id", "=", "global")
			.where("id", "=", afterTarget.commit_id)
			.selectAll()
			.executeTakeFirstOrThrow();
		const targetChangeSetId = targetCommit.change_set_id;
		const targetCseRows = await lix.db
			.selectFrom("change_set_element_all")
			.where("lixcol_version_id", "=", "global")
			.where("change_set_id", "=", targetChangeSetId)
			.select([
				"change_set_id",
				"change_id",
				"entity_id",
				"schema_key",
				"file_id",
			])
			.execute();
		const targetSchemaCounts = targetCseRows.reduce<Record<string, number>>(
			(acc, r: any) => {
				acc[r.schema_key] = (acc[r.schema_key] ?? 0) + 1;
				return acc;
			},
			{}
		);
		expectDeterministic(targetSchemaCounts["test_entity"]).toBe(1);
		expectDeterministic(targetSchemaCounts["lix_commit"] ?? 0).toBe(0);
		expectDeterministic(targetSchemaCounts["lix_commit_edge"] ?? 0).toBe(0);
		expectDeterministic(targetSchemaCounts["lix_version"] ?? 0).toBe(0);
		const anchoredEntity = targetCseRows.find(
			(r: any) => r.schema_key === "test_entity"
		);
		expectDeterministic(Boolean(anchoredEntity)).toBe(true);
		expectDeterministic(anchoredEntity?.entity_id).toBe("merge-meta-1");
		expectDeterministic(anchoredEntity?.file_id).toBe("fileM");
	}
);
