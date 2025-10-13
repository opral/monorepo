import { createVersion } from "./create-version.js";
import { selectVersionDiff } from "./select-version-diff.js";
import { simulationTest } from "../test-utilities/simulation-test/simulation-test.js";
import { test } from "vitest";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";

const diffEntitySchema = {
	"x-lix-key": "test_diff_entity",
	"x-lix-version": "1.0",
	type: "object",
	additionalProperties: false,
	properties: {
		value: {
			anyOf: [{ type: "string" }, { type: "number" }],
		},
	},
} as const satisfies LixSchemaDefinition;

const diffSchemaA = {
	"x-lix-key": "test_schemaA",
	"x-lix-version": "1.0",
	type: "object",
	additionalProperties: false,
	properties: {
		v: {
			anyOf: [{ type: "string" }, { type: "number" }],
		},
	},
} as const satisfies LixSchemaDefinition;

const diffSchemaB = {
	"x-lix-key": "test_schemaB",
	"x-lix-version": "1.0",
	type: "object",
	additionalProperties: false,
	properties: {
		v: {
			anyOf: [{ type: "string" }, { type: "number" }],
		},
	},
} as const satisfies LixSchemaDefinition;

async function storeDiffTestSchemas(lix: { db: any }): Promise<void> {
	await lix.db
		.insertInto("stored_schema")
		.values({ value: diffEntitySchema })
		.onConflict((oc: any) => oc.doNothing())
		.execute();
	await lix.db
		.insertInto("stored_schema")
		.values({ value: diffSchemaA })
		.onConflict((oc: any) => oc.doNothing())
		.execute();
	await lix.db
		.insertInto("stored_schema")
		.values({ value: diffSchemaB })
		.onConflict((oc: any) => oc.doNothing())
		.execute();
}

test("simulation test discover", () => {});

simulationTest(
	"added: key only in source -> before=null, after=source (query)",
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

		await storeDiffTestSchemas(lix);

		// Create source and target versions first
		const sourceVersion = await createVersion({ lix, name: "source" });
		const targetVersion = await createVersion({ lix, name: "target" });

		// Add an entity only in the source version
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "e1",
				schema_key: "test_diff_entity",
				file_id: "file1",
				version_id: sourceVersion.id,
				plugin_key: "test_plugin",
				snapshot_content: { value: "A" },
				schema_version: "1.0",
			})
			.execute();

		const diff = await selectVersionDiff({
			lix,
			source: sourceVersion,
			target: targetVersion,
		})
			.where("status", "!=", "unchanged")
			.where("entity_id", "=", "e1")
			.execute();

		expectDeterministic(diff).toHaveLength(1);
		const d = diff[0]!;
		expectDeterministic(d.entity_id).toBe("e1");
		expectDeterministic(d.schema_key).toBe("test_diff_entity");
		expectDeterministic(d.file_id).toBe("file1");
		expectDeterministic(d.before_version_id).toBeNull();
		expectDeterministic(d.before_change_id).toBeNull();
		expectDeterministic(d.after_version_id).toBe(sourceVersion.id);
		expectDeterministic(d.after_change_id).not.toBeNull();
		expectDeterministic(d.status).toBe("added");

		// Verify the 'after' change id refers to a stored change row
		const stored = await lix.db
			.selectFrom("change")
			.where("id", "=", d.after_change_id!)
			.selectAll()
			.executeTakeFirstOrThrow();

		expectDeterministic(stored).toMatchObject({
			id: d.after_change_id!,
			entity_id: "e1",
			schema_key: "test_diff_entity",
			file_id: "file1",
			plugin_key: "test_plugin",
			snapshot_content: { value: "A" },
		});

		// After commit id should be the commit_id from state_all for the source side
		const srcState = await lix.db
			.selectFrom("state_all")
			.where("version_id", "=", sourceVersion.id)
			.where("file_id", "=", "file1")
			.where("schema_key", "=", "test_diff_entity")
			.where("entity_id", "=", "e1")
			.selectAll()
			.executeTakeFirstOrThrow();

		expectDeterministic(d.after_commit_id).toBe(srcState.commit_id);
	}
);

simulationTest(
	"modified: both changed without common ancestor -> source wins (query)",
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

		await storeDiffTestSchemas(lix);

		// Start both versions from the same tip
		const sourceVersion = await createVersion({ lix, name: "source" });
		const targetVersion = await createVersion({ lix, name: "target" });

		// Both sides change the same key independently (common ancestor had no e1)
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "e1",
				schema_key: "test_diff_entity",
				file_id: "file1",
				version_id: targetVersion.id,
				plugin_key: "test_plugin",
				snapshot_content: { value: "target" },
				schema_version: "1.0",
			})
			.execute();

		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "e1",
				schema_key: "test_diff_entity",
				file_id: "file1",
				version_id: sourceVersion.id,
				plugin_key: "test_plugin",
				snapshot_content: { value: "source" },
				schema_version: "1.0",
			})
			.execute();

		// Fetch diff rows for that key
		const diffs = await selectVersionDiff({
			lix,
			source: sourceVersion,
			target: targetVersion,
		})
			.where("diff.file_id", "=", "file1")
			.where("diff.schema_key", "=", "test_diff_entity")
			.where("diff.entity_id", "=", "e1")
			.execute();

		expectDeterministic(diffs).toHaveLength(1);
		const r = diffs[0]!;
		expectDeterministic(r.status).toBe("modified");
		expectDeterministic(r.before_version_id).toBe(targetVersion.id);
		expectDeterministic(r.after_version_id).toBe(sourceVersion.id);

		// Verify winner is source side by checking after_change_id equals source state change_id
		const srcState = await lix.db
			.selectFrom("state_all")
			.where("version_id", "=", sourceVersion.id)
			.where("file_id", "=", "file1")
			.where("schema_key", "=", "test_diff_entity")
			.where("entity_id", "=", "e1")
			.selectAll()
			.executeTakeFirstOrThrow();

		const tgtState = await lix.db
			.selectFrom("state_all")
			.where("version_id", "=", targetVersion.id)
			.where("file_id", "=", "file1")
			.where("schema_key", "=", "test_diff_entity")
			.where("entity_id", "=", "e1")
			.selectAll()
			.executeTakeFirstOrThrow();

		expectDeterministic(r.after_change_id).toBe(srcState.change_id);
		expectDeterministic(r.before_change_id).toBe(tgtState.change_id);
	}
);

simulationTest(
	"modified: both changed after common ancestor -> source wins (query)",
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

		await storeDiffTestSchemas(lix);

		// Get active version and seed a common ancestor state for e1
		const active = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "version.id", "active_version.version_id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "e1",
				schema_key: "test_diff_entity",
				file_id: "file1",
				version_id: active.id,
				plugin_key: "test_plugin",
				snapshot_content: { value: "ancestor" },
				schema_version: "1.0",
			})
			.execute();

		// Branch source and target from the active version
		const sourceVersion = await createVersion({
			lix,
			name: "source",
			from: active,
		});

		const targetVersion = await createVersion({
			lix,
			name: "target",
			from: active,
		});

		// Both sides update e1 independently
		await lix.db
			.updateTable("state_all")
			.set({ snapshot_content: { value: "target" } })
			.where("version_id", "=", targetVersion.id)
			.where("file_id", "=", "file1")
			.where("schema_key", "=", "test_diff_entity")
			.where("entity_id", "=", "e1")
			.execute();

		await lix.db
			.updateTable("state_all")
			.set({ snapshot_content: { value: "source" } })
			.where("version_id", "=", sourceVersion.id)
			.where("file_id", "=", "file1")
			.where("schema_key", "=", "test_diff_entity")
			.where("entity_id", "=", "e1")
			.execute();

		// Diff should pick source as winner
		const diffs = await selectVersionDiff({
			lix,
			source: sourceVersion,
			target: targetVersion,
		})
			.where("diff.file_id", "=", "file1")
			.where("diff.schema_key", "=", "test_diff_entity")
			.where("diff.entity_id", "=", "e1")
			.execute();

		expectDeterministic(diffs).toHaveLength(1);
		const r = diffs[0]!;
		expectDeterministic(r.status).toBe("modified");
		expectDeterministic(r.before_version_id).toBe(targetVersion.id);
		expectDeterministic(r.after_version_id).toBe(sourceVersion.id);

		const srcState = await lix.db
			.selectFrom("state_all")
			.where("version_id", "=", sourceVersion.id)
			.where("file_id", "=", "file1")
			.where("schema_key", "=", "test_diff_entity")
			.where("entity_id", "=", "e1")
			.selectAll()
			.executeTakeFirstOrThrow();

		const tgtState = await lix.db
			.selectFrom("state_all")
			.where("version_id", "=", targetVersion.id)
			.where("file_id", "=", "file1")
			.where("schema_key", "=", "test_diff_entity")
			.where("entity_id", "=", "e1")
			.selectAll()
			.executeTakeFirstOrThrow();

		expectDeterministic(r.after_change_id).toBe(srcState.change_id);
		expectDeterministic(r.before_change_id).toBe(tgtState.change_id);
	}
);

simulationTest(
	"removed: source explicit deletion beats target content -> after=source (tombstone), before=target (query)",
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

		await storeDiffTestSchemas(lix);

		// Seed common ancestor with entity e1
		const active = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "version.id", "active_version.version_id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "e1",
				schema_key: "test_diff_entity",
				file_id: "file1",
				version_id: active.id,
				plugin_key: "test_plugin",
				snapshot_content: { value: "ancestor" },
				schema_version: "1.0",
			})
			.execute();

		// Branch source and target from the ancestor
		const sourceVersion = await createVersion({
			lix,
			name: "source",
			from: active,
		});
		const targetVersion = await createVersion({
			lix,
			name: "target",
			from: active,
		});

		// Perform deletion in source version (remove e1); target keeps content
		await lix.db
			.deleteFrom("state_all")
			.where("version_id", "=", sourceVersion.id)
			.where("file_id", "=", "file1")
			.where("schema_key", "=", "test_diff_entity")
			.where("entity_id", "=", "e1")
			.execute();

		// Confirm target still has the entity
		const tgtState = await lix.db
			.selectFrom("state_all")
			.where("version_id", "=", targetVersion.id)
			.where("file_id", "=", "file1")
			.where("schema_key", "=", "test_diff_entity")
			.where("entity_id", "=", "e1")
			.selectAll()
			.executeTakeFirstOrThrow();

		// Diff should classify as deleted: after=null, before=target
		const diffs = await selectVersionDiff({
			lix,
			source: sourceVersion,
			target: targetVersion,
		})
			.where("diff.file_id", "=", "file1")
			.where("diff.schema_key", "=", "test_diff_entity")
			.where("diff.entity_id", "=", "e1")
			.execute();

		expectDeterministic(diffs).toHaveLength(1);
		const r = diffs[0]!;
		expectDeterministic(r.status).toBe("removed");
		expectDeterministic(r.before_version_id).toBe(targetVersion.id);
		// With explicit deletes, source contributes a tombstone row
		expectDeterministic(r.after_version_id).toBe(sourceVersion.id);
		expectDeterministic(r.after_change_id).toBeTruthy();
		expectDeterministic(r.before_change_id).toBe(tgtState.change_id);

		// Verify the 'after' change is a deletion (tombstone)
		const afterChange = await lix.db
			.selectFrom("change")
			.where("id", "=", r.after_change_id!)
			.selectAll()
			.executeTakeFirstOrThrow();
		expectDeterministic(afterChange.snapshot_content).toBe(null);
	}
);

simulationTest(
	"unchanged: identical leaves are returned when not filtered (query)",
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

		await storeDiffTestSchemas(lix);

		// Seed common ancestor state
		const active = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "version.id", "active_version.version_id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "e1",
				schema_key: "test_diff_entity",
				file_id: "file1",
				version_id: active.id,
				plugin_key: "test_plugin",
				snapshot_content: { value: "same" },
				schema_version: "1.0",
			})
			.execute();

		// Branch without changes
		const sourceVersion = await createVersion({
			lix,
			name: "source",
			from: active,
		});
		const targetVersion = await createVersion({
			lix,
			name: "target",
			from: active,
		});

		const diffs = await selectVersionDiff({
			lix,
			source: sourceVersion,
			target: targetVersion,
		})
			.where("diff.file_id", "=", "file1")
			.where("diff.schema_key", "=", "test_diff_entity")
			.where("diff.entity_id", "=", "e1")
			.execute();

		expectDeterministic(diffs).toHaveLength(1);
		const r = diffs[0]!;
		expectDeterministic(r.status).toBe("unchanged");
		expectDeterministic(r.before_version_id).toBe(targetVersion.id);
		expectDeterministic(r.after_version_id).toBe(sourceVersion.id);
		expectDeterministic(r.before_change_id).toBe(r.after_change_id);
	}
);

simulationTest(
	"unchanged: entity exists only in target, never in source (no explicit delete)",
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

		await storeDiffTestSchemas(lix);

		// Create source and target versions from the same tip
		const sourceVersion = await createVersion({ lix, name: "source" });
		const targetVersion = await createVersion({ lix, name: "target" });

		// Insert entity only in target; source never had it and did not delete it
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "only-in-target",
				schema_key: "test_diff_entity",
				file_id: "file-only-target",
				version_id: targetVersion.id,
				plugin_key: "test_plugin",
				snapshot_content: { value: "target" },
				schema_version: "1.0",
			})
			.execute();

		const diffs = await selectVersionDiff({
			lix,
			source: sourceVersion,
			target: targetVersion,
		})
			.where("diff.file_id", "=", "file-only-target")
			.where("diff.schema_key", "=", "test_diff_entity")
			.where("diff.entity_id", "=", "only-in-target")
			.execute();

		expectDeterministic(diffs).toHaveLength(1);
		const r = diffs[0]!;
		expectDeterministic(r.status).toBe("unchanged");
		expectDeterministic(r.before_version_id).toBe(targetVersion.id);
		// Since we treat target-only as unchanged, mirror target on after_*
		expectDeterministic(r.after_version_id).toBe(targetVersion.id);
		expectDeterministic(r.after_change_id).toBe(r.before_change_id);
	}
);

simulationTest(
	"handles multiple files and schema keys across versions",
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

		await storeDiffTestSchemas(lix);

		// Seed common ancestor with an unchanged entity on file2/test_schemaA
		const active = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "version.id", "active_version.version_id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "e_same",
				schema_key: "test_schemaA",
				file_id: "file2",
				version_id: active.id,
				plugin_key: "test_plugin",
				snapshot_content: { v: "same" },
				schema_version: "1.0",
			})
			.execute();

		// Branch source from the active version
		const sourceVersion = await createVersion({
			lix,
			name: "source",
			from: active,
		});

		// file1/test_schemaA: deleted (source explicitly deletes, target has content later)
		// Seed then delete in source before target exists (no common ancestor for this key)
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "e_del",
				schema_key: "test_schemaA",
				file_id: "file1",
				version_id: sourceVersion.id,
				plugin_key: "test_plugin",
				snapshot_content: { v: "to-be-deleted" },
				schema_version: "1.0",
			})
			.execute();

		await lix.db
			.deleteFrom("state_all")
			.where("entity_id", "=", "e_del")
			.where("schema_key", "=", "test_schemaA")
			.where("file_id", "=", "file1")
			.where("version_id", "=", sourceVersion.id)
			.execute();

		// Create target after the source tombstone was created
		const targetVersion = await createVersion({
			lix,
			name: "target",
			from: active,
		});

		// file1/test_schemaA: created (only in source)
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "e_add",
				schema_key: "test_schemaA",
				file_id: "file1",
				version_id: sourceVersion.id,
				plugin_key: "test_plugin",
				snapshot_content: { v: "source" },
				schema_version: "1.0",
			})
			.execute();

		// Ensure target has content for the deleted key
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "e_del",
				schema_key: "test_schemaA",
				file_id: "file1",
				version_id: targetVersion.id,
				plugin_key: "test_plugin",
				snapshot_content: { v: "target" },
				schema_version: "1.0",
			})
			.execute();

		// file1/test_schemaB: updated (both present but different)
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "e_upd",
				schema_key: "test_schemaB",
				file_id: "file1",
				version_id: targetVersion.id,
				plugin_key: "test_plugin",
				snapshot_content: { v: "target" },
				schema_version: "1.0",
			})
			.execute();

		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "e_upd",
				schema_key: "test_schemaB",
				file_id: "file1",
				version_id: sourceVersion.id,
				plugin_key: "test_plugin",
				snapshot_content: { v: "source" },
				schema_version: "1.0",
			})
			.execute();

		// Query all diffs and assert statuses across files/schemas
		const diffs = await selectVersionDiff({
			lix,
			source: sourceVersion,
			target: targetVersion,
		}).execute();

		// Build lookup by key
		const key = (r: any) => `${r.file_id}|${r.schema_key}|${r.entity_id}`;
		const map = new Map(diffs.map((r: any) => [key(r), r]));

		// added (file1/test_schemaA/e_add)
		const created = map.get("file1|test_schemaA|e_add");
		expectDeterministic(created).toBeDefined();
		expectDeterministic(created!.status).toBe("added");
		expectDeterministic(created!.before_version_id).toBeNull();
		expectDeterministic(created!.after_version_id).toBe(sourceVersion.id);
		expectDeterministic(created!.before_change_id).toBeNull();
		expectDeterministic(created!.after_change_id).toBeTruthy();

		// removed (file1/test_schemaA/e_del): source tombstone vs target content
		const deleted = map.get("file1|test_schemaA|e_del");
		expectDeterministic(deleted).toBeDefined();
		expectDeterministic(deleted!.status).toBe("removed");
		expectDeterministic(deleted!.before_version_id).toBe(targetVersion.id);
		expectDeterministic(deleted!.after_version_id).toBe(sourceVersion.id);
		expectDeterministic(deleted!.after_change_id).toBeTruthy();
		expectDeterministic(deleted!.before_change_id).toBeTruthy();

		// modified (file1/test_schemaB/e_upd)
		const updated = map.get("file1|test_schemaB|e_upd");
		expectDeterministic(updated).toBeDefined();
		expectDeterministic(updated!.status).toBe("modified");
		expectDeterministic(updated!.before_version_id).toBe(targetVersion.id);
		expectDeterministic(updated!.after_version_id).toBe(sourceVersion.id);
		expectDeterministic(updated!.after_change_id).toBeTruthy();
		expectDeterministic(updated!.before_change_id).toBeTruthy();
		expectDeterministic(updated!.after_change_id).not.toBe(
			updated!.before_change_id
		);

		// unchanged (file2/test_schemaA/e_same)
		const unchanged = map.get("file2|test_schemaA|e_same");
		expectDeterministic(unchanged).toBeDefined();
		expectDeterministic(unchanged!.status).toBe("unchanged");
		expectDeterministic(unchanged!.before_version_id).toBe(targetVersion.id);
		expectDeterministic(unchanged!.after_version_id).toBe(sourceVersion.id);
		expectDeterministic(unchanged!.after_change_id).toBe(
			unchanged!.before_change_id
		);
	}
);
