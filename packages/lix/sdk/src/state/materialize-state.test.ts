import { describe, expect } from "vitest";
import { sql } from "kysely";
import { selectActiveVersion } from "../version/select-active-version.js";
import { createVersion } from "../version/create-version.js";
import { timestamp } from "../deterministic/timestamp.js";
import {
	simulationTest,
	normalSimulation,
	outOfOrderSequenceSimulation,
} from "../test-utilities/simulation-test/simulation-test.js";
import { LixVersionTipSchema, type LixVersionTip } from "../version/schema.js";

function stripWriterKey<T extends Record<string, any> | null | undefined>(
	row: T
): T {
	if (!row) return row;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { writer_key, ...rest } = row as any;
	return rest as T;
}

describe("internal_materialization_version_tips", () => {
	simulationTest(
		"includes all versions with state, even if other versions branch from them",
		async ({ openSimulatedLix }) => {
			// Test the rule: "if a version entity exists, the version is active.
			// even if other versions 'build' on this version by branching away from the commit"
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});

			// Create base version with state
			await createVersion({ lix, id: "base-version" });
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "base-entity",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "base-version",
					plugin_key: "mock-plugin",
					snapshot_content: { id: "base-entity", name: "Base Entity" },
				})
				.execute();

			// Get base version's current commit
			const baseVersion = await lix.db
				.selectFrom("version")
				.select("commit_id")
				.where("id", "=", "base-version")
				.executeTakeFirstOrThrow();

			// Create version A that branches from base version's commit
			await createVersion({ lix, id: "version-a" });
			await lix.db
				.updateTable("version")
				.set({ commit_id: baseVersion.commit_id })
				.where("id", "=", "version-a")
				.execute();

			// Add state to version A (this will create a new commit, making base-version no longer a "tip")
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "entity-a",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "version-a",
					plugin_key: "mock-plugin",
					snapshot_content: { id: "entity-a", name: "Version A Entity" },
				})
				.execute();

			// Create version B that also branches from base version's commit
			await createVersion({ lix, id: "version-b" });
			await lix.db
				.updateTable("version")
				.set({ commit_id: baseVersion.commit_id })
				.where("id", "=", "version-b")
				.execute();

			// Add state to version B
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "entity-b",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "version-b",
					plugin_key: "mock-plugin",
					snapshot_content: { id: "entity-b", name: "Version B Entity" },
				})
				.execute();

			// Now base-version has children (version-a and version-b branched from it),
			// so it's no longer a "tip" commit. But it still has important state that should be materialized.

			// Query version tips - should include ALL versions with state, not just leaf tips
			const tips = await lix.db
				.selectFrom("internal_materialization_version_tips" as any)
				.selectAll()
				.where("version_id", "in", ["base-version", "version-a", "version-b"])
				.orderBy("version_id")
				.execute();

			// All three versions should be included because they all have entities/state
			expect(tips).toHaveLength(3);

			const baseVersionTip = tips.find(
				(t: any) => t.version_id === "base-version"
			);
			const versionATip = tips.find((t: any) => t.version_id === "version-a");
			const versionBTip = tips.find((t: any) => t.version_id === "version-b");

			// All versions should be present in version tips
			expect(baseVersionTip).toBeDefined();
			expect(versionATip).toBeDefined();
			expect(versionBTip).toBeDefined();

			// Verify that the base version's state can be materialized (not excluded from materialization pipeline)
			const baseMaterializedState = await lix.db
				.selectFrom("internal_state_materializer" as any)
				.selectAll()
				.where("version_id", "=", "base-version")
				.where("entity_id", "=", "base-entity")
				.executeTakeFirst();

			expect(baseMaterializedState).toBeDefined();
			expect(baseMaterializedState!.snapshot_content).toEqual({
				id: "base-entity",
				name: "Base Entity",
			});
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);

	simulationTest(
		"finds tip commit for a version with single commit",
		async ({ openSimulatedLix }) => {
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});

			const activeVersion =
				await selectActiveVersion(lix).executeTakeFirstOrThrow();

			// Query the view
			const results = await lix.db
				.selectFrom("internal_materialization_version_tips" as any)
				.where("version_id", "=", activeVersion.id)
				.selectAll()
				.execute();

			// Verify results
			expect(results).toHaveLength(1);
			expect(results[0]?.version_id).toBe(activeVersion.id);
			expect(results[0]?.tip_commit_id).toBe(activeVersion.commit_id);
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);

	simulationTest(
		"updates tip when new commit is added",
		async ({ openSimulatedLix }) => {
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});

			const activeVersion =
				await selectActiveVersion(lix).executeTakeFirstOrThrow();

			// Get initial tip
			const initialResults = await lix.db
				.selectFrom("internal_materialization_version_tips" as any)
				.where("version_id", "=", activeVersion.id)
				.selectAll()
				.execute();

			const initialTip = initialResults[0]?.tip_commit_id;

			// Insert state to trigger a new commit
			await lix.db
				.insertInto("state")
				.values({
					entity_id: "entity-1",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					plugin_key: "mock-plugin",
					snapshot_content: { id: "entity-1", name: "Test Entity" },
				})
				.execute();

			// Get updated tip
			const updatedResults = await lix.db
				.selectFrom("internal_materialization_version_tips" as any)
				.where("version_id", "=", activeVersion.id)
				.selectAll()
				.execute();

			const updatedTip = updatedResults[0]?.tip_commit_id;

			// Verify tip changed
			expect(updatedTip).not.toBe(initialTip);
			expect(updatedResults).toHaveLength(1);
			expect(updatedResults[0]?.version_id).toBe(activeVersion.id);
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);

	simulationTest(
		"handles multiple versions with independent tips",
		async ({ openSimulatedLix }) => {
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});

			// Create two versions
			await createVersion({ lix, id: "version-1" });
			await createVersion({ lix, id: "version-2" });

			// Add state to version1 to create a commit
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "entity-1",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "version-1",
					plugin_key: "mock-plugin",
					snapshot_content: { id: "entity-1", name: "Version 1 Entity" },
				})
				.execute();

			// Add state to version2 to create a commit
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "entity-2",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "version-2",
					plugin_key: "mock-plugin",
					snapshot_content: { id: "entity-2", name: "Version 2 Entity" },
				})
				.execute();

			// Get tips for both versions
			const tips = await lix.db
				.selectFrom("internal_materialization_version_tips" as any)
				.selectAll()
				.where("version_id", "in", ["version-1", "version-2"])
				.orderBy("version_id")
				.execute();

			// Should have two different tips
			expect(tips).toHaveLength(2); // includes the default version
			const v1Tip = tips.find((t: any) => t.version_id === "version-1");
			const v2Tip = tips.find((t: any) => t.version_id === "version-2");

			expect(v1Tip).toBeDefined();
			expect(v2Tip).toBeDefined();
			expect(v1Tip?.tip_commit_id).not.toBe(v2Tip?.tip_commit_id);

			// Add more state to version1 to move its tip
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "entity-3",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "version-1",
					plugin_key: "mock-plugin",
					snapshot_content: {
						id: "entity-3",
						name: "Another Version 1 Entity",
					},
				})
				.execute();

			// Get updated tips
			const updatedTips = await lix.db
				.selectFrom("internal_materialization_version_tips" as any)
				.selectAll()
				.orderBy("version_id")
				.execute();

			const v1UpdatedTip = updatedTips.find(
				(t: any) => t.version_id === "version-1"
			);
			const v2UpdatedTip = updatedTips.find(
				(t: any) => t.version_id === "version-2"
			);

			// Version 1 tip should have changed, version 2 should remain the same
			expect(v1UpdatedTip?.tip_commit_id).not.toBe(v1Tip?.tip_commit_id);
			expect(v2UpdatedTip?.tip_commit_id).toBe(v2Tip?.tip_commit_id);
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);
});

simulationTest(
	"materializes change_author from commit.author_account_ids",
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

		// Insert a tracked key_value on active version to trigger a commit
		const kvKey = "kv_for_author_mat";
		await lix.db
			.insertInto("key_value")
			.values({ key: kvKey, value: "v1" })
			.execute();

		// Domain change id for that key_value
		const kvChange = await lix.db
			.selectFrom("change")
			.where("schema_key", "=", "lix_key_value")
			.where("entity_id", "=", kvKey)
			.orderBy("created_at", "desc")
			.select(["id"]) // domain change id
			.executeTakeFirstOrThrow();

		// Authors should appear in internal_materialization_latest_visible_state
		const authorRows = await lix.db
			.selectFrom("internal_materialization_latest_visible_state" as any)
			.selectAll()
			.where("schema_key", "=", "lix_change_author")
			.where(
				sql`json_extract(snapshot_content, '$.change_id')`,
				"=",
				kvChange.id
			)
			.execute();

		expectDeterministic(authorRows.length).toBe(1);

		// Verify account and lineage
		const active = await lix.db
			.selectFrom("active_account")
			.selectAll()
			.execute();
		const activeAccountId = active[0]!.account_id;
		expectDeterministic(
			(authorRows[0] as any)?.snapshot_content?.account_id
		).toBe(activeAccountId);

		// The materializer uses the commit change row id as 'change_id' column for provenance
		const commitChangeId = (authorRows[0] as any)?.change_id;
		const commitRow = await lix.db
			.selectFrom("change")
			.where("schema_key", "=", "lix_commit")
			.where("id", "=", commitChangeId)
			.selectAll()
			.executeTakeFirst();

		expectDeterministic(!!commitRow).toBe(true);
	}
);

// Ensures version tip equals the lix_version_tip snapshot commit_id in the materializer
simulationTest(
	"version tip matches lix_version_tip snapshot commit_id",
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

		// Create a new version from the current global tip
		const { id: versionId } = await createVersion({
			lix,
			name: "tip-vs-snapshot",
		});

		const tips =
			(lix.sqlite.exec({
				sql: `SELECT version_id, tip_commit_id FROM internal_materialization_version_tips WHERE version_id = ?`,
				bind: [versionId],
				rowMode: "object",
				returnValue: "resultRows",
			}) as Array<{ version_id: string; tip_commit_id: string }>) ?? [];

		expectDeterministic(tips.length).toBe(1);

		const matRows =
			(lix.sqlite.exec({
				sql: `SELECT json_extract(snapshot_content,'$.commit_id') AS commit_id
                      FROM internal_state_materializer
                      WHERE schema_key = 'lix_version_tip' AND version_id = 'global' AND entity_id = ?`,
				bind: [versionId],
				rowMode: "object",
				returnValue: "resultRows",
			}) as Array<{ commit_id: string | null }>) ?? [];

		expectDeterministic(matRows.length).toBe(1);
		expectDeterministic(matRows[0]!.commit_id).toBe(tips[0]!.tip_commit_id);
	}
);

// Regression: materializer tip for a version must match tips view after a commit on that version
simulationTest(
	"materializer tip equals tips view after committing on a version",
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

		// Create version A
		const versionA = await createVersion({ lix, id: "mat-tip-version-a" });

		// Insert tracked state into version A to trigger a real commit
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "mat-entity-1",
				schema_key: "mock_schema",
				schema_version: "1.0",
				file_id: "mat-file",
				version_id: versionA.id,
				plugin_key: "mock-plugin",
				snapshot_content: { id: "mat-entity-1", name: "Mat Entity" },
			})
			.execute();

		// Read tip from materializer tips view
		const tips =
			(lix.sqlite.exec({
				sql: `SELECT version_id, tip_commit_id FROM internal_materialization_version_tips WHERE version_id = ?`,
				bind: [versionA.id],
				rowMode: "object",
				returnValue: "resultRows",
			}) as Array<{ version_id: string; tip_commit_id: string }>) ?? [];

		expectDeterministic(tips.length).toBe(1);
		expectDeterministic(tips[0]!.tip_commit_id).not.toEqual(versionA.commit_id);

		// Read tip from internal_state_materializer for lix_version_tip (global scope)
		const matRows =
			(lix.sqlite.exec({
				sql: `SELECT json_extract(snapshot_content,'$.commit_id') AS commit_id
                  FROM internal_state_materializer
                  WHERE schema_key = 'lix_version_tip' AND version_id = 'global' AND entity_id = ?`,
				bind: [versionA.id],
				rowMode: "object",
				returnValue: "resultRows",
			}) as Array<{ commit_id: string | null }>) ?? [];

		expectDeterministic(matRows.length).toBe(1);
		expectDeterministic(matRows[0]!.commit_id).toBe(tips[0]!.tip_commit_id);
	}
);

describe("internal_materialization_commit_graph", () => {
	simulationTest(
		"builds linear commit history with correct depths",
		async ({ openSimulatedLix }) => {
			// Linear history: initial -> commit1 -> commit2 -> commit3 (tip)
			// Expected depths:    3          2          1          0
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});

			// Create a version
			const initialVersion = await createVersion({
				lix,
				id: "linear-test-version",
			});

			// Create commit 1 (will be at depth 2)
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "entity-1",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "linear-test-version",
					plugin_key: "mock-plugin",
					snapshot_content: { id: "entity-1", name: "First commit" },
				})
				.execute();

			// Get first commit id
			const commits1 = await lix.db
				.selectFrom("commit")
				.innerJoin("version", "version.commit_id", "commit.id")
				.select("commit.id")
				.where("version.id", "=", "linear-test-version")
				.orderBy("commit.lixcol_created_at", "desc")
				.limit(1)
				.execute();
			const commit1Id = commits1[0]!.id;

			// Create commit 2 (will be at depth 1)
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "entity-2",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "linear-test-version",
					plugin_key: "mock-plugin",
					snapshot_content: { id: "entity-2", name: "Second commit" },
				})
				.execute();

			// Get second commit id
			const commits2 = await lix.db
				.selectFrom("commit")
				.innerJoin("version", "version.commit_id", "commit.id")
				.select("commit.id")
				.where("version.id", "=", "linear-test-version")
				.orderBy("commit.lixcol_created_at", "desc")
				.limit(1)
				.execute();
			const commit2Id = commits2[0]!.id;

			// Create commit 3 (will be at depth 0 - tip)
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "entity-3",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "linear-test-version",
					plugin_key: "mock-plugin",
					snapshot_content: { id: "entity-3", name: "Third commit" },
				})
				.execute();

			// Get third commit id
			const commits3 = await lix.db
				.selectFrom("commit")
				.innerJoin("version", "version.commit_id", "commit.id")
				.select("commit.id")
				.where("version.id", "=", "linear-test-version")
				.orderBy("commit.lixcol_created_at", "desc")
				.limit(1)
				.execute();

			const commit3Id = commits3[0]!.id;

			// Query the commit graph view
			const graph = await lix.db
				.selectFrom("internal_materialization_commit_graph" as any)
				.selectAll()
				.where("version_id", "=", "linear-test-version")
				.orderBy("depth")
				.execute();

			// Verify we have 4 commits with correct depths (including initial)
			expect(graph).toHaveLength(4);

			// Commit 3 (tip) should be at depth 0
			expect(graph[0]).toMatchObject({
				commit_id: commit3Id,
				version_id: "linear-test-version",
				depth: 0,
			});

			// Commit 2 should be at depth 1
			expect(graph[1]).toMatchObject({
				commit_id: commit2Id,
				version_id: "linear-test-version",
				depth: 1,
			});

			// Commit 1 should be at depth 2
			expect(graph[2]).toMatchObject({
				commit_id: commit1Id,
				version_id: "linear-test-version",
				depth: 2,
			});

			// Initial commit should be at depth 3
			expect(graph[3]).toMatchObject({
				version_id: "linear-test-version",
				commit_id: initialVersion.commit_id,
				depth: 3,
			});
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);

	simulationTest(
		"handles branching commit history",
		async ({ openSimulatedLix }) => {
			// Branching history:
			//       initial
			//          |
			//       commit1 (depth 2)
			//        /    \
			//   commit2a  commit2b (both depth 1)
			//      |        |
			//  commit3a  commit3b (both depth 0 - tips)

			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});

			// Create two versions that branch from a common commit
			await createVersion({ lix, id: "branch-version-1" });
			await createVersion({ lix, id: "branch-version-2" });

			// Create a common commit in version1
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "common-entity",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "branch-version-1",
					plugin_key: "mock-plugin",
					snapshot_content: { id: "common-entity", name: "Common commit" },
				})
				.execute();

			// Get the common commit id
			const commonCommit = await lix.db
				.selectFrom("commit")
				.innerJoin("version", "version.commit_id", "commit.id")
				.select("commit.id")
				.where("version.id", "=", "branch-version-1")
				.orderBy("commit.lixcol_created_at", "desc")
				.limit(1)
				.execute();
			const commonCommitId = commonCommit[0]!.id;

			// Update version2 to point to the common commit (simulating a branch)
			await lix.db
				.updateTable("version")
				.set({ commit_id: commonCommitId })
				.where("id", "=", "branch-version-2")
				.execute();

			// Create diverging commits in version1
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "branch1-entity",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "branch-version-1",
					plugin_key: "mock-plugin",
					snapshot_content: { id: "branch1-entity", name: "Branch 1 commit" },
				})
				.execute();

			// Create diverging commits in version2
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "branch2-entity",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "branch-version-2",
					plugin_key: "mock-plugin",
					snapshot_content: { id: "branch2-entity", name: "Branch 2 commit" },
				})
				.execute();

			// Query the commit graph for version1
			const graph1 = await lix.db
				.selectFrom("internal_materialization_commit_graph" as any)
				.selectAll()
				.where("version_id", "=", "branch-version-1")
				.orderBy("depth")
				.execute();

			// Query the commit graph for version2
			const graph2 = await lix.db
				.selectFrom("internal_materialization_commit_graph" as any)
				.selectAll()
				.where("version_id", "=", "branch-version-2")
				.orderBy("depth")
				.execute();

			// Version 1 should have its own tip at depth 0 and common commit at depth 1
			expect(graph1).toHaveLength(3); // initial, common, branch1
			expect(graph1[0]).toMatchObject({
				version_id: "branch-version-1",
				depth: 0,
			});
			expect(graph1[1]).toMatchObject({
				commit_id: commonCommitId,
				version_id: "branch-version-1",
				depth: 1,
			});

			// Version 2 should have its own tip at depth 0 and common commit at depth 1
			expect(graph2).toHaveLength(3); // initial, common, branch2
			expect(graph2[0]).toMatchObject({
				version_id: "branch-version-2",
				depth: 0,
			});
			expect(graph2[1]).toMatchObject({
				commit_id: commonCommitId,
				version_id: "branch-version-2",
				depth: 1,
			});

			// Both versions should see the common commit at the same relative depth
			const v1CommonDepth = graph1.find(
				(g: any) => g.commit_id === commonCommitId
			)?.depth;
			const v2CommonDepth = graph2.find(
				(g: any) => g.commit_id === commonCommitId
			)?.depth;
			expect(v1CommonDepth).toBe(1);
			expect(v2CommonDepth).toBe(1);
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);

	simulationTest(
		"handles merge commits without duplicates",
		async ({ openSimulatedLix }) => {
			// Diamond pattern:
			//     initial
			//        |
			//     commit1
			//      /    \
			//  commit2a  commit2b
			//      \    /
			//     commit3 (merge commit with two parents)

			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});

			// Create version A
			await createVersion({ lix, id: "merge-version-a" });

			// Create version B that will diverge
			await createVersion({ lix, id: "merge-version-b" });

			// Add unique changes to version A
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "entity-a",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "merge-version-a",
					plugin_key: "mock-plugin",
					snapshot_content: { id: "entity-a", name: "Version A change" },
				})
				.execute();

			// Add unique changes to version B
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "entity-b",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "merge-version-b",
					plugin_key: "mock-plugin",
					snapshot_content: { id: "entity-b", name: "Version B change" },
				})
				.execute();

			// Get both version tips
			const versionATip = await lix.db
				.selectFrom("version")
				.select("commit_id")
				.where("id", "=", "merge-version-a")
				.executeTakeFirstOrThrow();

			const versionBTip = await lix.db
				.selectFrom("version")
				.select("commit_id")
				.where("id", "=", "merge-version-b")
				.executeTakeFirstOrThrow();

			// Create a merge commit manually with two parent edges
			const ts = timestamp({ lix });
			const mergeCommitId = `merge-${ts}`;
			const mergeChangeSetId = `cs-${mergeCommitId}`;

			// Create the change set first
			await lix.db
				.insertInto("change_set_all")
				.values({
					id: mergeChangeSetId,
					lixcol_version_id: "global",
				})
				.execute();

			// Insert a commit change with parent_commit_ids (changes-only materializer)
			const mergeCommitChangeId = `chg-${mergeCommitId}`;
			await lix.db
				.insertInto("change")
				.values({
					id: mergeCommitChangeId,
					entity_id: mergeCommitId,
					schema_key: "lix_commit",
					schema_version: "1.0",
					file_id: "lix",
					plugin_key: "lix_own_entity",
					snapshot_content: {
						id: mergeCommitId,
						change_set_id: mergeChangeSetId,
						parent_commit_ids: [versionATip.commit_id, versionBTip.commit_id],
					},
					created_at: ts,
				})
				.execute();

			// Update version A tip via version_tip (commit-anchored pointer)
			await lix.db
				.insertInto("change")
				.values({
					id: `vt-${mergeCommitId}`,
					entity_id: "merge-version-a",
					schema_key: LixVersionTipSchema["x-lix-key"],
					schema_version: LixVersionTipSchema["x-lix-version"],
					file_id: "lix",
					plugin_key: "lix_own_entity",
					snapshot_content: {
						id: "merge-version-a",
						commit_id: mergeCommitId,
					} satisfies LixVersionTip,
					created_at: ts,
				})
				.execute();

			// Query the commit graph for the merged version
			const graph = await lix.db
				.selectFrom("internal_materialization_commit_graph" as any)
				.selectAll()
				.where("version_id", "=", "merge-version-a")
				.orderBy("depth")
				.execute();

			// Count how many times each commit appears
			const commitCounts = new Map<string, number>();
			for (const entry of graph) {
				const count = commitCounts.get(entry.commit_id) || 0;
				commitCounts.set(entry.commit_id, count + 1);
			}

			// Verify no commit appears more than once (no duplicates)
			for (const [, count] of commitCounts) {
				expect(count).toBe(1);
			}

			// Verify the merge commit is at depth 0 (tip)
			expect(graph[0]).toMatchObject({
				commit_id: mergeCommitId,
				version_id: "merge-version-a",
				depth: 0,
			});

			// Verify both parent commits appear in the graph
			const hasVersionATip = graph.some(
				(g: any) => g.commit_id === versionATip.commit_id
			);
			const hasVersionBTip = graph.some(
				(g: any) => g.commit_id === versionBTip.commit_id
			);
			expect(hasVersionATip).toBe(true);
			expect(hasVersionBTip).toBe(true);

			// Verify we have expected commits
			// We should have at least 4 commits:
			// - 1 merge commit (depth 0)
			// - 2 parent commits from divergent versions (depth 1)
			// - At least 1 shared initial commit (depth 2)
			expect(graph.length).toBeGreaterThanOrEqual(4);

			// The merge commit should have two commits at depth 1 (its parents)
			const depth1Commits = graph.filter((g: any) => g.depth === 1);
			expect(depth1Commits).toHaveLength(2);
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);

	simulationTest(
		"detects and handles cycles gracefully",
		async ({ openSimulatedLix }) => {
			// Test that cycle detection prevents infinite loops in recursive CTEs
			// This tests the path-based cycle detection in version ancestry
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});

			// Create three versions
			const versionA = await createVersion({ lix, id: "version-cycle-a" });
			const versionB = await createVersion({
				lix,
				id: "version-cycle-b",
				inheritsFrom: versionA,
			});
			await createVersion({
				lix,
				id: "version-cycle-c",
				inheritsFrom: versionB,
			});

			// Manually create a cycle by updating version A to inherit from C
			// This simulates data corruption: A -> B -> C -> A
			await lix.db
				.updateTable("version")
				.set({
					inherits_from_version_id: "version-cycle-c",
				})
				.where("id", "=", "version-cycle-a")
				.execute();

			// Query version ancestry - should not hang due to cycle detection
			const ancestry = await lix.db
				.selectFrom("internal_materialization_version_ancestry" as any)
				.selectAll()
				.where("version_id", "=", "version-cycle-a")
				.execute();

			// Version A should see itself and its ancestors, but stop when cycle detected
			const ancestorIds = ancestry.map((a: any) => a.ancestor_version_id);
			const uniqueAncestors = new Set(ancestorIds);

			// Should contain A (itself), B, and C - cycle detection should have stopped
			expect(uniqueAncestors.has("version-cycle-a")).toBe(true);
			expect(uniqueAncestors.has("version-cycle-b")).toBe(true);
			expect(uniqueAncestors.has("version-cycle-c")).toBe(true);

			// The important part is that cycle detection prevented infinite recursion
			// We should have a finite number of results even with a cycle
			expect(ancestry.length).toBeLessThan(20); // Would be infinite without cycle detection

			// Check that we stopped at reasonable inheritance depths
			const maxDepth = Math.max(
				...ancestry.map((a: any) => a.inheritance_depth)
			);
			expect(maxDepth).toBeLessThanOrEqual(3); // Should stop after traversing the cycle once
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);

	simulationTest(
		"associates commits with correct version",
		async ({ openSimulatedLix }) => {
			// Create multiple versions and verify version_id association
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});

			// Create three versions
			await createVersion({ lix, id: "version-x" });
			await createVersion({ lix, id: "version-y" });
			await createVersion({ lix, id: "version-z" });

			// Add commits to each version
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "entity-x",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "version-x",
					plugin_key: "mock-plugin",
					snapshot_content: { id: "entity-x", name: "Version X Entity" },
				})
				.execute();

			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "entity-y",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "version-y",
					plugin_key: "mock-plugin",
					snapshot_content: { id: "entity-y", name: "Version Y Entity" },
				})
				.execute();

			// Query graphs for each version
			const graphX = await lix.db
				.selectFrom("internal_materialization_commit_graph" as any)
				.selectAll()
				.where("version_id", "=", "version-x")
				.execute();

			const graphY = await lix.db
				.selectFrom("internal_materialization_commit_graph" as any)
				.selectAll()
				.where("version_id", "=", "version-y")
				.execute();

			const graphZ = await lix.db
				.selectFrom("internal_materialization_commit_graph" as any)
				.selectAll()
				.where("version_id", "=", "version-z")
				.execute();

			// Each version should only see commits associated with it
			expect(graphX.every((g: any) => g.version_id === "version-x")).toBe(true);
			expect(graphY.every((g: any) => g.version_id === "version-y")).toBe(true);

			// Version X should have 2 commits (initial + one change)
			expect(graphX).toHaveLength(2);

			// Version Y should have 2 commits (initial + one change)
			expect(graphY).toHaveLength(2);

			// Version Z has only the initial commit, so will appear with 1 commit in the graph
			expect(graphZ).toHaveLength(1);

			// Verify each version has its own unique tip commit
			const xTip = graphX.find((g: any) => g.depth === 0);
			const yTip = graphY.find((g: any) => g.depth === 0);

			expect(xTip).toBeDefined();
			expect(yTip).toBeDefined();
			expect(xTip!.commit_id).not.toBe(yTip!.commit_id);

			// The commit graph correctly associates commits with their versions
			// Each graph entry has the correct version_id
			const allGraphEntries = [...graphX, ...graphY, ...graphZ];
			expect(
				allGraphEntries.every(
					(g: any) =>
						g.version_id === "version-x" ||
						g.version_id === "version-y" ||
						g.version_id === "version-z"
				)
			).toBe(true);
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);
});

// Ensure commit edges are projected by the materializer from commit.parent_commit_ids
simulationTest(
	"materializer emits commit_edge rows from commit parent ids",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
				},
			],
		});

		// Create two versions and commit one change in each to produce parent commits
		const vA = await createVersion({ lix, id: "edge-test-a" });
		const vB = await createVersion({ lix, id: "edge-test-b" });

		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "edge-entity-a",
				schema_key: "mock_entity",
				schema_version: "1.0",
				file_id: "edge-file",
				version_id: vA.id,
				plugin_key: "mock-plugin",
				snapshot_content: { id: "edge-entity-a", name: "A" },
			})
			.execute();

		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "edge-entity-b",
				schema_key: "mock_entity",
				schema_version: "1.0",
				file_id: "edge-file",
				version_id: vB.id,
				plugin_key: "mock-plugin",
				snapshot_content: { id: "edge-entity-b", name: "B" },
			})
			.execute();

		const tipA = await lix.db
			.selectFrom("version")
			.select("commit_id")
			.where("id", "=", vA.id)
			.executeTakeFirstOrThrow();
		const tipB = await lix.db
			.selectFrom("version")
			.select("commit_id")
			.where("id", "=", vB.id)
			.executeTakeFirstOrThrow();

		// Create a new commit that has both tips as parents
		const ts = timestamp({ lix });
		const mergeCommitId = `edge-merge-${ts}`;
		const mergeChangeSetId = `cs-${mergeCommitId}`;

		// Ensure a changeset entity exists (not strictly required for edges but keeps commit snapshot coherent)
		await lix.db
			.insertInto("change_set_all")
			.values({ id: mergeChangeSetId, lixcol_version_id: "global" })
			.execute();

		await lix.db
			.insertInto("change")
			.values({
				id: `chg-${mergeCommitId}`,
				entity_id: mergeCommitId,
				schema_key: "lix_commit",
				schema_version: "1.0",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: {
					id: mergeCommitId,
					change_set_id: mergeChangeSetId,
					parent_commit_ids: [tipA.commit_id, tipB.commit_id],
				},
				created_at: ts,
			})
			.execute();

		// Point version A to the merge commit so the graph seeds include it
		await lix.db
			.insertInto("change")
			.values({
				id: `vt-${mergeCommitId}`,
				entity_id: vA.id,
				schema_key: LixVersionTipSchema["x-lix-key"],
				schema_version: LixVersionTipSchema["x-lix-version"],
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: { id: vA.id, commit_id: mergeCommitId },
				created_at: ts,
			})
			.execute();

		// Read edges from the materializer for this merge commit (global scope)
		const edges = await lix.db
			.selectFrom("internal_state_materializer" as any)
			.select([
				sql`json_extract(snapshot_content, '$.parent_id')`.as("parent_id"),
				sql`json_extract(snapshot_content, '$.child_id')`.as("child_id"),
			])
			.where("schema_key", "=", "lix_commit_edge")
			.where("version_id", "=", "global")
			.where(
				sql`json_extract(snapshot_content, '$.child_id')`,
				"=",
				mergeCommitId as any
			)
			.execute();

		// Exactly two parent edges (counts should be deterministic across simulations)
		expectDeterministic(edges.length).toBe(2);

		// Parents themselves can vary between simulations; assert membership within each run
		const parents = new Set(edges.map((e: any) => e.parent_id));
		expect(parents.has(tipA.commit_id)).toBe(true);
		expect(parents.has(tipB.commit_id)).toBe(true);
	}
);

// Ensure change set elements are materialized for domain changes
simulationTest(
	"materializer emits change_set_elements for commit.change_ids",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
		});

		// Create a version and make two domain changes in a single statement
		const v = await createVersion({ lix, id: "cse-dom-version" });

		await lix.db
			.insertInto("state_all")
			.values([
				{
					entity_id: "dom-1",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "cse-file",
					version_id: v.id,
					plugin_key: "mock-plugin",
					snapshot_content: { id: "dom-1", name: "one" },
				},
				{
					entity_id: "dom-2",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "cse-file",
					version_id: v.id,
					plugin_key: "mock-plugin",
					snapshot_content: { id: "dom-2", name: "two" },
				},
			])
			.execute();

		// Read the commit and its change_set_id
		const ver = await lix.db
			.selectFrom("version")
			.selectAll()
			.where("id", "=", v.id)
			.executeTakeFirstOrThrow();

		const commitRow = await lix.db
			.selectFrom("change")
			.select([sql`json(snapshot_content)`.as("snapshot")])
			.where("schema_key", "=", "lix_commit")
			.where(
				sql`json_extract(snapshot_content, '$.id')`,
				"=",
				ver.commit_id as any
			)
			.executeTakeFirstOrThrow();

		const changeSetId = (commitRow as any).snapshot.change_set_id as string;

		// Query materializer for CSE rows for this change set (domain-only)
		const cseRows = await lix.db
			.selectFrom("internal_state_materializer" as any)
			.select([
				sql`json_extract(snapshot_content, '$.change_set_id')`.as(
					"change_set_id"
				),
				sql`json_extract(snapshot_content, '$.change_id')`.as("change_id"),
				sql`json_extract(snapshot_content, '$.entity_id')`.as("entity_id"),
				sql`json_extract(snapshot_content, '$.schema_key')`.as("schema_key"),
			])
			.where("schema_key", "=", "lix_change_set_element")
			.where("version_id", "=", "global")
			.where(
				sql`json_extract(snapshot_content, '$.change_set_id')`,
				"=",
				changeSetId as any
			)
			.where(
				sql`json_extract(snapshot_content, '$.schema_key')`,
				"=",
				"mock_entity" as any
			)
			.execute();

		// Expect exactly two domain CSEs (for dom-1 and dom-2)
		expectDeterministic(cseRows.length).toBe(2);

		const ids = new Set(cseRows.map((r: any) => r.entity_id));
		expect(ids.has("dom-1")).toBe(true);
		expect(ids.has("dom-2")).toBe(true);
	}
);

describe("internal_materialization_latest_visible_state", () => {
	simulationTest(
		"finds latest change for each entity in a single version",
		async ({ openSimulatedLix }) => {
			// Create version with multiple changes to same entity
			// Verify only the latest (closest to tip) change is visible
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});

			// Create a version
			await createVersion({ lix, id: "latest-test-version" });

			// Create multiple changes to the same entity
			// First change - create entity
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "entity-1",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "latest-test-version",
					plugin_key: "mock-plugin",
					snapshot_content: { id: "entity-1", name: "Initial Name", value: 1 },
				})
				.execute();

			// Second change - update entity
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "entity-1",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "latest-test-version",
					plugin_key: "mock-plugin",
					snapshot_content: { id: "entity-1", name: "Updated Name", value: 2 },
				})
				.execute();

			// Third change - another update
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "entity-1",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "latest-test-version",
					plugin_key: "mock-plugin",
					snapshot_content: { id: "entity-1", name: "Final Name", value: 3 },
				})
				.execute();

			// Query the latest visible state view
			const latestState = await lix.db
				.selectFrom("internal_materialization_latest_visible_state" as any)
				.selectAll()
				.where("version_id", "=", "latest-test-version")
				.where("entity_id", "=", "entity-1")
				.execute();

			// Should only have one entry (the latest)
			expect(latestState).toHaveLength(1);

			// Should be the most recent change (closest to tip, depth 0)
			const state = latestState[0]!;
			expect(state.entity_id).toBe("entity-1");
			expect(state.snapshot_content).toEqual({
				id: "entity-1",
				name: "Final Name",
				value: 3,
			});
			expect(state.depth).toBe(0); // Latest commit is at depth 0

			// Verify it selected the change from the newest commit
			const commits = await lix.db
				.selectFrom("commit")
				.innerJoin("version", "version.commit_id", "commit.id")
				.select("commit.id")
				.where("version.id", "=", "latest-test-version")
				.orderBy("commit.lixcol_created_at", "desc")
				.execute();

			expect(state.commit_id).toBe(commits[0]!.id);
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);

	simulationTest(
		"handles multiple entities with different change histories",
		async ({ openSimulatedLix }) => {
			// Create multiple entities with different numbers of changes
			// Verify each entity shows its latest state
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});

			// Create a version
			await createVersion({ lix, id: "multi-entity-version" });

			// Entity 1: Three changes
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "entity-1",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "multi-entity-version",
					plugin_key: "mock-plugin",
					snapshot_content: { id: "entity-1", version: 1 },
				})
				.execute();

			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "entity-1",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "multi-entity-version",
					plugin_key: "mock-plugin",
					snapshot_content: { id: "entity-1", version: 2 },
				})
				.execute();

			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "entity-1",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "multi-entity-version",
					plugin_key: "mock-plugin",
					snapshot_content: { id: "entity-1", version: 3 },
				})
				.execute();

			// Entity 2: Two changes
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "entity-2",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "multi-entity-version",
					plugin_key: "mock-plugin",
					snapshot_content: { id: "entity-2", status: "created" },
				})
				.execute();

			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "entity-2",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "multi-entity-version",
					plugin_key: "mock-plugin",
					snapshot_content: { id: "entity-2", status: "updated" },
				})
				.execute();

			// Entity 3: Single change
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "entity-3",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "multi-entity-version",
					plugin_key: "mock-plugin",
					snapshot_content: { id: "entity-3", data: "single-change" },
				})
				.execute();

			// Query the latest visible state view
			const latestStates = await lix.db
				.selectFrom("internal_materialization_latest_visible_state" as any)
				.selectAll()
				.where("version_id", "=", "multi-entity-version")
				.where("schema_key", "=", "mock_entity")
				.orderBy("entity_id")
				.execute();

			// Should have exactly 3 entries (one per entity)
			expect(latestStates).toHaveLength(3);

			// Verify each entity shows its latest state
			const entity1State = latestStates.find(
				(s: any) => s.entity_id === "entity-1"
			);
			const entity2State = latestStates.find(
				(s: any) => s.entity_id === "entity-2"
			);
			const entity3State = latestStates.find(
				(s: any) => s.entity_id === "entity-3"
			);

			expect(entity1State).toBeDefined();
			expect(entity1State!.snapshot_content).toEqual({
				id: "entity-1",
				version: 3,
			});

			expect(entity2State).toBeDefined();
			expect(entity2State!.snapshot_content).toEqual({
				id: "entity-2",
				status: "updated",
			});

			expect(entity3State).toBeDefined();
			expect(entity3State!.snapshot_content).toEqual({
				id: "entity-3",
				data: "single-change",
			});

			// The depths depend on which commit each entity's latest change was in
			// Entity-1's latest change (version 3) was in the 4th commit from tip
			expect(entity1State!.depth).toBe(3);

			// Entity-2's latest change was in the 2nd commit from tip
			expect(entity2State!.depth).toBe(1);

			// Entity-3's only change was in the tip commit
			expect(entity3State!.depth).toBe(0);

			// Each entity correctly shows its latest state regardless of depth
			// This demonstrates that the view correctly selects the most recent
			// change for each entity, even when they're at different depths
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);

	simulationTest(
		"respects first-seen-wins principle for commits at same depth",
		async () => {
			// TODO: Create scenario where multiple changes exist at same depth
			// Verify consistent selection based on first-seen
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);

	simulationTest(
		"includes NULL snapshots (deletions) in results",
		async ({ openSimulatedLix }) => {
			// Create entity, then delete it (NULL snapshot)
			// Verify deletion tombstone appears in latest visible state
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});

			// Create a version
			await createVersion({ lix, id: "deletion-test-version" });

			// Create an entity
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "entity-to-delete",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "deletion-test-version",
					plugin_key: "mock-plugin",
					snapshot_content: {
						id: "entity-to-delete",
						name: "Original Entity",
						active: true,
					},
				})
				.execute();

			// Update the entity
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "entity-to-delete",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "deletion-test-version",
					plugin_key: "mock-plugin",
					snapshot_content: {
						id: "entity-to-delete",
						name: "Updated Entity",
						active: true,
					},
				})
				.execute();

			// Delete the entity by inserting NULL snapshot
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "entity-to-delete",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "deletion-test-version",
					plugin_key: "mock-plugin",
					// @ts-expect-error - snapshot_content is intentionally NULL for deletion
					snapshot_content: null, // Deletion tombstone
				})
				.execute();

			// Query the latest visible state view
			const latestState = await lix.db
				.selectFrom("internal_materialization_latest_visible_state" as any)
				.selectAll()
				.where("version_id", "=", "deletion-test-version")
				.where("entity_id", "=", "entity-to-delete")
				.execute();

			// Should have exactly one entry - the deletion tombstone
			expect(latestState).toHaveLength(1);

			const deletionState = latestState[0]!;

			// Verify it's the deletion (NULL snapshot)
			expect(deletionState.entity_id).toBe("entity-to-delete");
			expect(deletionState.snapshot_content).toBeNull();
			expect(deletionState.depth).toBe(0); // Latest commit

			// Verify it's tracking the deletion, not earlier states
			expect(deletionState.schema_key).toBe("mock_entity");
			expect(deletionState.file_id).toBe("mock-file");

			// Create another entity that is NOT deleted to verify filtering
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "entity-still-exists",
					schema_key: "mock_entity",
					schema_version: "1.0",
					file_id: "mock-file",
					version_id: "deletion-test-version",
					plugin_key: "mock-plugin",
					snapshot_content: {
						id: "entity-still-exists",
						name: "Active Entity",
					},
				})
				.execute();

			// Query all latest states for this version
			const allStates = await lix.db
				.selectFrom("internal_materialization_latest_visible_state" as any)
				.selectAll()
				.where("version_id", "=", "deletion-test-version")
				.where("schema_key", "=", "mock_entity")
				.orderBy("entity_id")
				.execute();

			// Should have both entities
			expect(allStates).toHaveLength(2);

			// One is deleted (NULL), one exists
			const deletedEntity = allStates.find(
				(s: any) => s.entity_id === "entity-to-delete"
			);
			const activeEntity = allStates.find(
				(s: any) => s.entity_id === "entity-still-exists"
			);

			expect(deletedEntity!.snapshot_content).toBeNull();
			expect(activeEntity!.snapshot_content).not.toBeNull();
			expect(activeEntity!.snapshot_content).toEqual({
				id: "entity-still-exists",
				name: "Active Entity",
			});
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);
});

describe("internal_materialization_version_ancestry", () => {
	simulationTest(
		"version is its own ancestor at depth 0",
		async ({ openSimulatedLix }) => {
			// Create a version and verify it appears as its own ancestor
			// at inheritance depth 0
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});

			// Create a standalone version
			await createVersion({ lix, id: "standalone-version" });

			// Query the version ancestry view
			const ancestry = await lix.db
				.selectFrom("internal_materialization_version_ancestry" as any)
				.selectAll()
				.where("version_id", "=", "standalone-version")
				.execute();

			// By default, versions inherit from 'global'
			// Should have two entries: itself (depth 0) and global (depth 1)
			expect(ancestry).toHaveLength(2);

			// Check self-ancestry at depth 0
			const selfAncestor = ancestry.find(
				(a: any) => a.ancestor_version_id === "standalone-version"
			);
			expect(selfAncestor).toBeDefined();
			expect(selfAncestor!.version_id).toBe("standalone-version");
			expect(selfAncestor!.ancestor_version_id).toBe("standalone-version");
			expect(selfAncestor!.inheritance_depth).toBe(0);

			// Check global ancestry at depth 1
			const globalAncestor = ancestry.find(
				(a: any) => a.ancestor_version_id === "global"
			);
			expect(globalAncestor).toBeDefined();
			expect(globalAncestor!.version_id).toBe("standalone-version");
			expect(globalAncestor!.ancestor_version_id).toBe("global");
			expect(globalAncestor!.inheritance_depth).toBe(1);
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);

	simulationTest(
		"handles single-level inheritance",
		async ({ openSimulatedLix }) => {
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});

			// Create parent version A
			await createVersion({ lix, id: "version-a" });

			// Create child version B that inherits from A
			await createVersion({
				lix,
				id: "version-b",
				inheritsFrom: { id: "version-a" },
			});

			// Query ancestry for version B
			const ancestry = await lix.db
				.selectFrom("internal_materialization_version_ancestry" as any)
				.selectAll()
				.where("version_id", "=", "version-b")
				.orderBy("inheritance_depth", "asc")
				.execute();

			// Version B should see:
			// - Itself at depth 0
			// - Version A at depth 1
			// - Global at depth 2 (inherited through A)
			expect(ancestry).toHaveLength(3);

			expect(ancestry[0]).toEqual({
				version_id: "version-b",
				ancestor_version_id: "version-b",
				inheritance_depth: 0,
			});

			expect(ancestry[1]).toEqual({
				version_id: "version-b",
				ancestor_version_id: "version-a",
				inheritance_depth: 1,
			});

			expect(ancestry[2]).toEqual({
				version_id: "version-b",
				ancestor_version_id: "global",
				inheritance_depth: 2,
			});
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);

	simulationTest(
		"handles multi-level inheritance chain",
		async ({ openSimulatedLix }) => {
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});

			// Create inheritance chain: global → A → B → C → D
			await createVersion({ lix, id: "version-a" });

			await createVersion({
				lix,
				id: "version-b",
				inheritsFrom: { id: "version-a" },
			});

			await createVersion({
				lix,
				id: "version-c",
				inheritsFrom: { id: "version-b" },
			});

			await createVersion({
				lix,
				id: "version-d",
				inheritsFrom: { id: "version-c" },
			});

			// Query ancestry for version D
			const ancestry = await lix.db
				.selectFrom("internal_materialization_version_ancestry" as any)
				.selectAll()
				.where("version_id", "=", "version-d")
				.orderBy("inheritance_depth", "asc")
				.execute();

			// Version D should see all ancestors at correct depths
			expect(ancestry).toHaveLength(5);

			expect(ancestry[0]).toEqual({
				version_id: "version-d",
				ancestor_version_id: "version-d",
				inheritance_depth: 0,
			});

			expect(ancestry[1]).toEqual({
				version_id: "version-d",
				ancestor_version_id: "version-c",
				inheritance_depth: 1,
			});

			expect(ancestry[2]).toEqual({
				version_id: "version-d",
				ancestor_version_id: "version-b",
				inheritance_depth: 2,
			});

			expect(ancestry[3]).toEqual({
				version_id: "version-d",
				ancestor_version_id: "version-a",
				inheritance_depth: 3,
			});

			expect(ancestry[4]).toEqual({
				version_id: "version-d",
				ancestor_version_id: "global",
				inheritance_depth: 4,
			});
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);

	simulationTest(
		"handles diamond inheritance pattern",
		async ({ openSimulatedLix }) => {
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});

			// Create diamond pattern:
			//     global
			//        |
			//        A
			//       / \
			//      B   C
			//       \ /
			//        D

			// Note: In this system, a version can only inherit from ONE parent
			// So D inherits from B, which inherits from A
			// C also inherits from A, but D doesn't directly inherit from C

			await createVersion({ lix, id: "version-a" });

			await createVersion({
				lix,
				id: "version-b",
				inheritsFrom: { id: "version-a" },
			});

			await createVersion({
				lix,
				id: "version-c",
				inheritsFrom: { id: "version-a" },
			});

			// D inherits from B (not from both B and C)
			await createVersion({
				lix,
				id: "version-d",
				inheritsFrom: { id: "version-b" },
			});

			// Query ancestry for version D
			const ancestryD = await lix.db
				.selectFrom("internal_materialization_version_ancestry" as any)
				.selectAll()
				.where("version_id", "=", "version-d")
				.orderBy("inheritance_depth", "asc")
				.execute();

			// D should see: itself, B, A, global
			expect(ancestryD).toHaveLength(4);

			expect(ancestryD[0]).toEqual({
				version_id: "version-d",
				ancestor_version_id: "version-d",
				inheritance_depth: 0,
			});

			expect(ancestryD[1]).toEqual({
				version_id: "version-d",
				ancestor_version_id: "version-b",
				inheritance_depth: 1,
			});

			expect(ancestryD[2]).toEqual({
				version_id: "version-d",
				ancestor_version_id: "version-a",
				inheritance_depth: 2,
			});

			expect(ancestryD[3]).toEqual({
				version_id: "version-d",
				ancestor_version_id: "global",
				inheritance_depth: 3,
			});

			// Verify C also sees A as ancestor
			const ancestryC = await lix.db
				.selectFrom("internal_materialization_version_ancestry" as any)
				.selectAll()
				.where("version_id", "=", "version-c")
				.orderBy("inheritance_depth", "asc")
				.execute();

			expect(ancestryC).toHaveLength(3);
			expect(ancestryC[1]?.ancestor_version_id).toBe("version-a");
			expect(ancestryC[1]?.inheritance_depth).toBe(1);
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);

	simulationTest(
		"handles version with no inheritance",
		async ({ openSimulatedLix }) => {
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});

			// Create a version that explicitly does NOT inherit from global
			await createVersion({
				lix,
				id: "standalone-version",
				inheritsFrom: null,
			});

			// Query ancestry
			const ancestry = await lix.db
				.selectFrom("internal_materialization_version_ancestry" as any)
				.selectAll()
				.where("version_id", "=", "standalone-version")
				.orderBy("inheritance_depth", "asc")
				.execute();

			// Should only see itself as ancestor
			expect(ancestry).toHaveLength(1);

			expect(ancestry[0]).toEqual({
				version_id: "standalone-version",
				ancestor_version_id: "standalone-version",
				inheritance_depth: 0,
			});
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);

	simulationTest(
		"cycle detection prevents infinite recursion",
		async ({ openSimulatedLix }) => {
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});

			// Create version A that will later point to B
			await createVersion({
				lix,
				id: "version-a",
				inheritsFrom: null, // Start with no inheritance
			});

			// Create version B that inherits from A
			await createVersion({
				lix,
				id: "version-b",
				inheritsFrom: { id: "version-a" },
			});

			// Now update A to inherit from B, creating a cycle
			// This would create A -> B -> A -> B -> ...
			await lix.db
				.updateTable("version")
				.set({ inherits_from_version_id: "version-b" })
				.where("id", "=", "version-a")
				.execute();

			// Query ancestry for version A with DISTINCT to remove duplicates
			const ancestryA = await lix.db
				.selectFrom("internal_materialization_version_ancestry" as any)
				.selectAll()
				.where("version_id", "=", "version-a")
				.distinct()
				.orderBy("inheritance_depth", "asc")
				.execute();

			// Should have exactly 2 entries due to cycle detection
			// A sees: itself (depth 0), B (depth 1)
			// The cycle detection prevents seeing A again at depth 2
			expect(ancestryA).toHaveLength(2);

			expect(ancestryA[0]).toEqual({
				version_id: "version-a",
				ancestor_version_id: "version-a",
				inheritance_depth: 0,
			});

			expect(ancestryA[1]).toEqual({
				version_id: "version-a",
				ancestor_version_id: "version-b",
				inheritance_depth: 1,
			});

			// Query ancestry for version B
			const ancestryB = await lix.db
				.selectFrom("internal_materialization_version_ancestry" as any)
				.selectAll()
				.where("version_id", "=", "version-b")
				.distinct()
				.orderBy("inheritance_depth", "asc")
				.execute();

			// B should also see exactly 2 entries
			// B sees: itself (depth 0), A (depth 1)
			expect(ancestryB).toHaveLength(2);

			expect(ancestryB[0]).toEqual({
				version_id: "version-b",
				ancestor_version_id: "version-b",
				inheritance_depth: 0,
			});

			expect(ancestryB[1]).toEqual({
				version_id: "version-b",
				ancestor_version_id: "version-a",
				inheritance_depth: 1,
			});
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);
});

describe("internal_state_materializer", () => {
	simulationTest(
		"shows entity from own version",
		async ({ openSimulatedLix }) => {
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});

			// Create a version
			await createVersion({ lix, id: "version-1" });

			// Insert an entity directly to version-1
			await lix.db
				.insertInto("key_value_all")
				.values({
					key: "test-key",
					value: "test-value",
					lixcol_version_id: "version-1",
				})
				.execute();

			// Query the materializer for version-1
			const materializedState = await lix.db
				.selectFrom("internal_state_materializer" as any)
				.selectAll()
				.where("version_id", "=", "version-1")
				.where("entity_id", "=", "test-key")
				.executeTakeFirst();

			const cachedState = await lix.db
				.selectFrom("state_all")
				.selectAll()
				.where("version_id", "=", "version-1")
				.where("entity_id", "=", "test-key")
				.executeTakeFirst();

			expect(materializedState).toBeDefined();
			expect(materializedState!.snapshot_content).toEqual({
				key: "test-key",
				value: "test-value",
			});
			expect(materializedState!.inherited_from_version_id).toBeNull(); // Not inherited

			expect(stripWriterKey(materializedState)).toEqual(
				stripWriterKey(cachedState)
			);
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);

	simulationTest(
		"inherits entity from parent version",
		async ({ openSimulatedLix }) => {
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});

			// Create parent and child versions
			await createVersion({ lix, id: "parent-version" });
			await createVersion({
				lix,
				id: "child-version",
				inheritsFrom: { id: "parent-version" },
			});

			// Add entity to parent version
			await lix.db
				.insertInto("key_value_all")
				.values({
					key: "inherited-key",
					value: "parent-value",
					lixcol_version_id: "parent-version",
				})
				.execute();

			// Query the materializer for child version
			const materializedState = await lix.db
				.selectFrom("internal_state_materializer" as any)
				.selectAll()
				.where("version_id", "=", "child-version")
				.where("entity_id", "=", "inherited-key")
				.executeTakeFirst();

			const cachedState = await lix.db
				.selectFrom("state_all")
				.selectAll()
				.where("version_id", "=", "child-version")
				.where("entity_id", "=", "inherited-key")
				.executeTakeFirst();

			// Child should see the entity from parent
			expect(materializedState).toBeDefined();
			expect(materializedState!.snapshot_content).toEqual({
				key: "inherited-key",
				value: "parent-value",
			});
			expect(materializedState!.inherited_from_version_id).toBe(
				"parent-version"
			);

			expect(stripWriterKey(materializedState)).toEqual(
				stripWriterKey(cachedState)
			);
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);

	simulationTest(
		"child version overrides parent entity",
		async ({ openSimulatedLix }) => {
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});

			// Create parent and child versions
			await createVersion({ lix, id: "parent-version" });
			await createVersion({
				lix,
				id: "child-version",
				inheritsFrom: { id: "parent-version" },
			});

			// Add entity to parent version
			await lix.db
				.insertInto("key_value_all")
				.values({
					key: "shared-key",
					value: "parent-value",
					lixcol_version_id: "parent-version",
				})
				.execute();

			// Update the inherited entity in child version
			await lix.db
				.updateTable("key_value_all")
				.set({
					value: "child-value",
				})
				.where("key", "=", "shared-key")
				.where("lixcol_version_id", "=", "child-version")
				.execute();

			// Query the materializer for child version
			const materializedState = await lix.db
				.selectFrom("internal_state_materializer" as any)
				.selectAll()
				.where("version_id", "=", "child-version")
				.where("entity_id", "=", "shared-key")
				.executeTakeFirst();

			const cachedState = await lix.db
				.selectFrom("state_all")
				.selectAll()
				.where("version_id", "=", "child-version")
				.where("entity_id", "=", "shared-key")
				.executeTakeFirst();

			// Child should see its own value, not parent's
			expect(materializedState).toBeDefined();
			expect(materializedState!.snapshot_content).toEqual({
				key: "shared-key",
				value: "child-value",
			});
			expect(materializedState!.inherited_from_version_id).toBeNull(); // Not inherited

			expect(stripWriterKey(materializedState)).toEqual(
				stripWriterKey(cachedState)
			);
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);

	simulationTest(
		"handles multi-level inheritance",
		async ({ openSimulatedLix }) => {
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});

			// Create inheritance chain: A -> B -> C
			await createVersion({ lix, id: "version-a" });
			await createVersion({
				lix,
				id: "version-b",
				inheritsFrom: { id: "version-a" },
			});
			await createVersion({
				lix,
				id: "version-c",
				inheritsFrom: { id: "version-b" },
			});

			// Add entity to version A
			await lix.db
				.insertInto("key_value_all")
				.values({
					key: "key-from-a",
					value: "value-from-a",
					lixcol_version_id: "version-a",
				})
				.execute();

			// Add different entity to version B
			await lix.db
				.insertInto("key_value_all")
				.values({
					key: "b-only-key",
					value: "value-from-b",
					lixcol_version_id: "version-b",
				})
				.execute();

			// Query materializer for version C
			const materializedStates = await lix.db
				.selectFrom("internal_state_materializer" as any)
				.selectAll()
				.where("version_id", "=", "version-c")
				.where("schema_key", "=", "lix_key_value")
				.where("entity_id", "in", ["key-from-a", "b-only-key"])
				.orderBy("entity_id")
				.execute();

			// C should see both entities
			expect(materializedStates).toHaveLength(2);

			// Check inherited from A (through B)
			const keyFromA = materializedStates.find(
				(s: any) => s.entity_id === "key-from-a"
			);
			expect(keyFromA).toBeDefined();
			expect(keyFromA!.snapshot_content).toEqual({
				key: "key-from-a",
				value: "value-from-a",
			});
			expect(keyFromA!.inherited_from_version_id).toBe("version-a");
			// CRITICAL: version_id should be version-c (the viewing version), not version-a
			expect(keyFromA!.version_id).toBe("version-c");

			// Check inherited from B
			const bKey = materializedStates.find(
				(s: any) => s.entity_id === "b-only-key"
			);
			expect(bKey).toBeDefined();
			expect(bKey!.snapshot_content).toEqual({
				key: "b-only-key",
				value: "value-from-b",
			});
			expect(bKey!.inherited_from_version_id).toBe("version-b");
			// CRITICAL: version_id should be version-c (the viewing version), not version-b
			expect(bKey!.version_id).toBe("version-c");
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);

	simulationTest(
		"includes deleted entities as tombstones (NULL snapshots)",
		async ({ openSimulatedLix }) => {
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});

			// Create a version
			await createVersion({ lix, id: "version-1" });

			// Insert an entity
			await lix.db
				.insertInto("key_value_all")
				.values({
					key: "entity-to-delete",
					value: "initial-value",
					lixcol_version_id: "version-1",
				})
				.execute();

			// Delete the entity (update to NULL snapshot)
			await lix.db
				.deleteFrom("key_value_all")
				.where("key", "=", "entity-to-delete")
				.where("lixcol_version_id", "=", "version-1")
				.execute();

			// Query the materializer - should return deleted entities as tombstones
			const materializedState = await lix.db
				.selectFrom("internal_state_materializer" as any)
				.selectAll()
				.where("version_id", "=", "version-1")
				.where("entity_id", "=", "entity-to-delete")
				.executeTakeFirst();

			// Materializer should include the deleted entity as a tombstone
			expect(materializedState).toBeDefined();
			expect(materializedState!.snapshot_content).toBeNull();
			expect(materializedState!.entity_id).toBe("entity-to-delete");
			expect(materializedState!.version_id).toBe("version-1");

			// But the latest visible state should still have it with NULL
			const latestVisible = await lix.db
				.selectFrom("internal_materialization_latest_visible_state" as any)
				.selectAll()
				.where("version_id", "=", "version-1")
				.where("entity_id", "=", "entity-to-delete")
				.executeTakeFirst();

			expect(latestVisible).toBeDefined();
			expect(latestVisible!.snapshot_content).toBeNull();
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);

	simulationTest(
		"deletion in child overrides parent entity",
		async ({ openSimulatedLix }) => {
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});

			// Create parent and child versions
			await createVersion({ lix, id: "parent-version" });
			await createVersion({
				lix,
				id: "child-version",
				inheritsFrom: { id: "parent-version" },
			});

			// Add entity to parent version
			await lix.db
				.insertInto("key_value_all")
				.values({
					key: "entity-to-override",
					value: "parent-value",
					lixcol_version_id: "parent-version",
				})
				.execute();

			// Delete the inherited entity in child version
			await lix.db
				.deleteFrom("key_value_all")
				.where("key", "=", "entity-to-override")
				.where("lixcol_version_id", "=", "child-version")
				.execute();

			// Query materializer for parent - should see the entity
			const parentState = await lix.db
				.selectFrom("internal_state_materializer" as any)
				.selectAll()
				.where("version_id", "=", "parent-version")
				.where("entity_id", "=", "entity-to-override")
				.executeTakeFirst();

			const parentCachedState = await lix.db
				.selectFrom("state_all")
				.selectAll()
				.where("version_id", "=", "parent-version")
				.where("entity_id", "=", "entity-to-override")
				.executeTakeFirst();

			expect(stripWriterKey(parentCachedState)).toEqual(
				stripWriterKey(parentState)
			);

			expect(parentState).toBeDefined();
			expect(parentState!.snapshot_content).toEqual({
				key: "entity-to-override",
				value: "parent-value",
			});

			// Query materializer for child - should see the entity as a tombstone (deleted)
			const childState = await lix.db
				.selectFrom("internal_state_materializer" as any)
				.selectAll()
				.where("version_id", "=", "child-version")
				.where("entity_id", "=", "entity-to-override")
				.executeTakeFirst();

			expect(childState).toBeDefined();
			expect(childState!.snapshot_content).toBeNull();
			expect(childState!.entity_id).toBe("entity-to-override");
			expect(childState!.version_id).toBe("child-version");
			expect(childState!.inherited_from_version_id).toBeNull(); // Direct deletion in child

			// But the latest visible state for child should have NULL snapshot
			const childLatestVisible = await lix.db
				.selectFrom("internal_materialization_latest_visible_state" as any)
				.selectAll()
				.where("version_id", "=", "child-version")
				.where("entity_id", "=", "entity-to-override")
				.executeTakeFirst();

			expect(childLatestVisible).toBeDefined();
			expect(childLatestVisible!.snapshot_content).toBeNull();
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);

	simulationTest(
		"handles diamond inheritance - takes from closest ancestor",
		async ({ openSimulatedLix }) => {
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});

			// Create diamond inheritance pattern:
			//       A (root)
			//      / \
			//     B   C
			//      \ /
			//       D
			//
			// Note: In Lix, a version can only inherit from one parent directly
			// So D inherits from B, B inherits from A, C also inherits from A

			await createVersion({ lix, id: "version-a" });
			await createVersion({
				lix,
				id: "version-b",
				inheritsFrom: { id: "version-a" },
			});
			await createVersion({
				lix,
				id: "version-c",
				inheritsFrom: { id: "version-a" },
			});
			await createVersion({
				lix,
				id: "version-d",
				inheritsFrom: { id: "version-b" },
			});

			// Add entity to root version A
			await lix.db
				.insertInto("key_value_all")
				.values({
					key: "shared-entity",
					value: "value-from-a",
					lixcol_version_id: "version-a",
				})
				.execute();

			// Override the entity in version B
			await lix.db
				.updateTable("key_value_all")
				.set({
					value: "value-from-b",
				})
				.where("key", "=", "shared-entity")
				.where("lixcol_version_id", "=", "version-b")
				.execute();

			// Also override the entity in version C
			await lix.db
				.updateTable("key_value_all")
				.set({
					value: "value-from-c",
				})
				.where("key", "=", "shared-entity")
				.where("lixcol_version_id", "=", "version-c")
				.execute();

			// Query materializer for version D
			const dState = await lix.db
				.selectFrom("internal_state_materializer" as any)
				.selectAll()
				.where("version_id", "=", "version-d")
				.where("entity_id", "=", "shared-entity")
				.executeTakeFirst();

			// D should see the value from B (its direct parent), not from A or C
			expect(dState).toBeDefined();
			expect(dState!.snapshot_content).toEqual({
				key: "shared-entity",
				value: "value-from-b",
			});
			expect(dState!.inherited_from_version_id).toBe("version-b");

			// Verify that B sees its own value
			const bState = await lix.db
				.selectFrom("internal_state_materializer" as any)
				.selectAll()
				.where("version_id", "=", "version-b")
				.where("entity_id", "=", "shared-entity")
				.executeTakeFirst();

			expect(bState).toBeDefined();
			expect(bState!.snapshot_content).toEqual({
				key: "shared-entity",
				value: "value-from-b",
			});
			expect(bState!.inherited_from_version_id).toBeNull(); // B has its own value

			// Verify that C sees its own value
			const cState = await lix.db
				.selectFrom("internal_state_materializer" as any)
				.selectAll()
				.where("version_id", "=", "version-c")
				.where("entity_id", "=", "shared-entity")
				.executeTakeFirst();

			expect(cState).toBeDefined();
			expect(cState!.snapshot_content).toEqual({
				key: "shared-entity",
				value: "value-from-c",
			});
			expect(cState!.inherited_from_version_id).toBeNull(); // C has its own value

			// Test inheritance ranking - add a different entity only in A
			await lix.db
				.insertInto("key_value_all")
				.values({
					key: "root-only-entity",
					value: "only-in-a",
					lixcol_version_id: "version-a",
				})
				.execute();

			// D should inherit it through B (depth 2 from D's perspective)
			const dRootEntity = await lix.db
				.selectFrom("internal_state_materializer" as any)
				.selectAll()
				.where("version_id", "=", "version-d")
				.where("entity_id", "=", "root-only-entity")
				.executeTakeFirst();

			expect(dRootEntity).toBeDefined();
			expect(dRootEntity!.snapshot_content).toEqual({
				key: "root-only-entity",
				value: "only-in-a",
			});
			expect(dRootEntity!.inherited_from_version_id).toBe("version-a");
		},
		{
			simulations: [normalSimulation, outOfOrderSequenceSimulation],
		}
	);
});
