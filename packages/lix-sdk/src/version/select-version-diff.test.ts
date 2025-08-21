import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createVersion } from "./create-version.js";
import { selectVersionDiff } from "./select-version-diff.js";

test("created: key only in source -> before=null, after=source (query)", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	// Create source and target versions first
	const sourceVersion = await createVersion({ lix, name: "source" });
	const targetVersion = await createVersion({ lix, name: "target" });

	// Add an entity only in the source version
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "e1",
			schema_key: "diff_test_entity",
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
		.execute();

	expect(diff).toHaveLength(1);
	const d = diff[0]!;
	expect(d.entity_id).toBe("e1");
	expect(d.schema_key).toBe("diff_test_entity");
	expect(d.file_id).toBe("file1");
	expect(d.before_version_id).toBeNull();
	expect(d.before_change_id).toBeNull();
	expect(d.after_version_id).toBe(sourceVersion.id);
	expect(d.after_change_id).not.toBeNull();
	expect(d.status).toBe("created");

	// Verify the 'after' change id refers to a stored change row
	const stored = await lix.db
		.selectFrom("change")
		.where("id", "=", d.after_change_id!)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(stored).toMatchObject({
		id: d.after_change_id!,
		entity_id: "e1",
		schema_key: "diff_test_entity",
		file_id: "file1",
		plugin_key: "test_plugin",
		snapshot_content: { value: "A" },
	});

	// After commit id should be the commit_id from state_all for the source side
	const srcState = await lix.db
		.selectFrom("state_all")
		.where("version_id", "=", sourceVersion.id)
		.where("file_id", "=", "file1")
		.where("schema_key", "=", "diff_test_entity")
		.where("entity_id", "=", "e1")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(d.after_commit_id).toBe(srcState.commit_id);
});

test("updated: both changed without common ancestor -> source wins (query)", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	// Start both versions from the same tip
	const sourceVersion = await createVersion({ lix, name: "source" });
	const targetVersion = await createVersion({ lix, name: "target" });

	// Both sides change the same key independently (common ancestor had no e1)
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "e1",
			schema_key: "diff_test_entity",
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
			schema_key: "diff_test_entity",
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
		.where("diff.schema_key", "=", "diff_test_entity")
		.where("diff.entity_id", "=", "e1")
		.execute();

	expect(diffs).toHaveLength(1);
	const r = diffs[0]!;
	expect(r.status).toBe("updated");
	expect(r.before_version_id).toBe(targetVersion.id);
	expect(r.after_version_id).toBe(sourceVersion.id);

	// Verify winner is source side by checking after_change_id equals source state change_id
	const srcState = await lix.db
		.selectFrom("state_all")
		.where("version_id", "=", sourceVersion.id)
		.where("file_id", "=", "file1")
		.where("schema_key", "=", "diff_test_entity")
		.where("entity_id", "=", "e1")
		.selectAll()
		.executeTakeFirstOrThrow();

	const tgtState = await lix.db
		.selectFrom("state_all")
		.where("version_id", "=", targetVersion.id)
		.where("file_id", "=", "file1")
		.where("schema_key", "=", "diff_test_entity")
		.where("entity_id", "=", "e1")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(r.after_change_id).toBe(srcState.change_id);
	expect(r.before_change_id).toBe(tgtState.change_id);
});

test("updated: both changed after common ancestor -> source wins (query)", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

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
			schema_key: "diff_test_entity",
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
		.where("schema_key", "=", "diff_test_entity")
		.where("entity_id", "=", "e1")
		.execute();

	await lix.db
		.updateTable("state_all")
		.set({ snapshot_content: { value: "source" } })
		.where("version_id", "=", sourceVersion.id)
		.where("file_id", "=", "file1")
		.where("schema_key", "=", "diff_test_entity")
		.where("entity_id", "=", "e1")
		.execute();

	// Diff should pick source as winner
	const diffs = await selectVersionDiff({
		lix,
		source: sourceVersion,
		target: targetVersion,
	})
		.where("diff.file_id", "=", "file1")
		.where("diff.schema_key", "=", "diff_test_entity")
		.where("diff.entity_id", "=", "e1")
		.execute();

	expect(diffs).toHaveLength(1);
	const r = diffs[0]!;
	expect(r.status).toBe("updated");
	expect(r.before_version_id).toBe(targetVersion.id);
	expect(r.after_version_id).toBe(sourceVersion.id);

	const srcState = await lix.db
		.selectFrom("state_all")
		.where("version_id", "=", sourceVersion.id)
		.where("file_id", "=", "file1")
		.where("schema_key", "=", "diff_test_entity")
		.where("entity_id", "=", "e1")
		.selectAll()
		.executeTakeFirstOrThrow();

	const tgtState = await lix.db
		.selectFrom("state_all")
		.where("version_id", "=", targetVersion.id)
		.where("file_id", "=", "file1")
		.where("schema_key", "=", "diff_test_entity")
		.where("entity_id", "=", "e1")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(r.after_change_id).toBe(srcState.change_id);
	expect(r.before_change_id).toBe(tgtState.change_id);
});

test("deleted: source deletion beats target content -> after=null, before=target (query)", async () => {
  const lix = await openLix({
    keyValues: [
      {
        key: "lix_deterministic_mode",
        value: { enabled: true },
        lixcol_version_id: "global",
      },
    ],
  });

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
      schema_key: "diff_test_entity",
      file_id: "file1",
      version_id: active.id,
      plugin_key: "test_plugin",
      snapshot_content: { value: "ancestor" },
      schema_version: "1.0",
    })
    .execute();

  // Branch source and target from the ancestor
  const sourceVersion = await createVersion({ lix, name: "source", from: active });
  const targetVersion = await createVersion({ lix, name: "target", from: active });

  // Perform deletion in source version (remove e1); target keeps content
  await lix.db
    .deleteFrom("state_all")
    .where("version_id", "=", sourceVersion.id)
    .where("file_id", "=", "file1")
    .where("schema_key", "=", "diff_test_entity")
    .where("entity_id", "=", "e1")
    .execute();

  // Confirm target still has the entity
  const tgtState = await lix.db
    .selectFrom("state_all")
    .where("version_id", "=", targetVersion.id)
    .where("file_id", "=", "file1")
    .where("schema_key", "=", "diff_test_entity")
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
    .where("diff.schema_key", "=", "diff_test_entity")
    .where("diff.entity_id", "=", "e1")
    .execute();

  expect(diffs).toHaveLength(1);
  const r = diffs[0]!;
  expect(r.status).toBe("deleted");
  expect(r.before_version_id).toBe(targetVersion.id);
  expect(r.after_version_id).toBeNull();
  expect(r.after_change_id).toBeNull();
  expect(r.before_change_id).toBe(tgtState.change_id);
});

test("unchanged: identical leaves are returned when not filtered (query)", async () => {
  const lix = await openLix({
    keyValues: [
      {
        key: "lix_deterministic_mode",
        value: { enabled: true },
        lixcol_version_id: "global",
      },
    ],
  });

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
      schema_key: "diff_test_entity",
      file_id: "file1",
      version_id: active.id,
      plugin_key: "test_plugin",
      snapshot_content: { value: "same" },
      schema_version: "1.0",
    })
    .execute();

  // Branch without changes
  const sourceVersion = await createVersion({ lix, name: "source", from: active });
  const targetVersion = await createVersion({ lix, name: "target", from: active });

  const diffs = await selectVersionDiff({ lix, source: sourceVersion, target: targetVersion })
    .where("diff.file_id", "=", "file1")
    .where("diff.schema_key", "=", "diff_test_entity")
    .where("diff.entity_id", "=", "e1")
    .execute();

  expect(diffs).toHaveLength(1);
  const r = diffs[0]!;
  expect(r.status).toBe("unchanged");
  expect(r.before_version_id).toBe(targetVersion.id);
  expect(r.after_version_id).toBe(sourceVersion.id);
  expect(r.before_change_id).toBe(r.after_change_id);
});


test("handles multiple files and schema keys across versions", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	// Seed common ancestor with an unchanged entity on file2/schemaA
	const active = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "e_same",
			schema_key: "schemaA",
			file_id: "file2",
			version_id: active.id,
			plugin_key: "test_plugin",
			snapshot_content: { v: "same" },
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

	// file1/schemaA: created (only in source)
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "e_add",
			schema_key: "schemaA",
			file_id: "file1",
			version_id: sourceVersion.id,
			plugin_key: "test_plugin",
			snapshot_content: { v: "source" },
			schema_version: "1.0",
		})
		.execute();

	// file1/schemaA: deleted (only in target)
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "e_del",
			schema_key: "schemaA",
			file_id: "file1",
			version_id: targetVersion.id,
			plugin_key: "test_plugin",
			snapshot_content: { v: "target" },
			schema_version: "1.0",
		})
		.execute();

	// file1/schemaB: updated (both present but different)
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "e_upd",
			schema_key: "schemaB",
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
			schema_key: "schemaB",
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

	// created (file1/schemaA/e_add)
	const created = map.get("file1|schemaA|e_add");
	expect(created).toBeDefined();
	expect(created!.status).toBe("created");
	expect(created!.before_version_id).toBeNull();
	expect(created!.after_version_id).toBe(sourceVersion.id);
	expect(created!.before_change_id).toBeNull();
	expect(created!.after_change_id).toBeTruthy();

	// deleted (file1/schemaA/e_del)
	const deleted = map.get("file1|schemaA|e_del");
	expect(deleted).toBeDefined();
	expect(deleted!.status).toBe("deleted");
	expect(deleted!.before_version_id).toBe(targetVersion.id);
	expect(deleted!.after_version_id).toBeNull();
	expect(deleted!.after_change_id).toBeNull();
	expect(deleted!.before_change_id).toBeTruthy();

	// updated (file1/schemaB/e_upd)
	const updated = map.get("file1|schemaB|e_upd");
	expect(updated).toBeDefined();
	expect(updated!.status).toBe("updated");
	expect(updated!.before_version_id).toBe(targetVersion.id);
	expect(updated!.after_version_id).toBe(sourceVersion.id);
	expect(updated!.after_change_id).toBeTruthy();
	expect(updated!.before_change_id).toBeTruthy();
	expect(updated!.after_change_id).not.toBe(updated!.before_change_id);

	// unchanged (file2/schemaA/e_same)
	const unchanged = map.get("file2|schemaA|e_same");
	expect(unchanged).toBeDefined();
	expect(unchanged!.status).toBe("unchanged");
	expect(unchanged!.before_version_id).toBe(targetVersion.id);
	expect(unchanged!.after_version_id).toBe(sourceVersion.id);
	expect(unchanged!.after_change_id).toBe(unchanged!.before_change_id);
});
