import { test, expect } from "vitest";
import { changeIsLeafOfChangeSet } from "./change-is-leaf-of-change-set.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import type { ChangeSet } from "../change-set/database-schema.js";

test("it should find changes from change set with depth=0", async () => {
  const lix = await openLixInMemory({});

  // Create change sets
  const changeSets = [
    { id: "change-set-1" },
    { id: "change-set-2" },
    { id: "change-set-3" }
  ] satisfies Partial<ChangeSet>[];

  await lix.db.insertInto("change_set")
    .values(changeSets)
    .execute();

  // Create change set relationships (parent -> child)
  await lix.db.insertInto("change_set_edge")
    .values([
      { parent_id: "change-set-1", child_id: "change-set-2" },
      { parent_id: "change-set-2", child_id: "change-set-3" }
    ])
    .execute();

  // Create snapshots - allowing SQLite to auto-generate the IDs
  const snapshot1 = await lix.db.insertInto("snapshot")
    .values({ content: { value: "content1" } })
    .returning("id")
    .executeTakeFirstOrThrow();
    
  const snapshot2 = await lix.db.insertInto("snapshot")
    .values({ content: { value: "content2" } })
    .returning("id")
    .executeTakeFirstOrThrow();
    
  const snapshot3 = await lix.db.insertInto("snapshot")
    .values({ content: { value: "content3" } })
    .returning("id")
    .executeTakeFirstOrThrow();
    
  const snapshot4 = await lix.db.insertInto("snapshot")
    .values({ content: { value: "content4" } })
    .returning("id")
    .executeTakeFirstOrThrow();
    
  const snapshot5 = await lix.db.insertInto("snapshot")
    .values({ content: { value: "content5" } })
    .returning("id")
    .executeTakeFirstOrThrow();

  // Create changes - let the database generate the IDs
  const change1_1 = await lix.db.insertInto("change")
    .values({
      entity_id: "entity-1", 
      file_id: "file-1",
      plugin_key: "test", 
      schema_key: "test", 
      snapshot_id: snapshot1.id,
      created_at: "2023-01-01T01:00:00Z"
    })
    .returning("id")
    .executeTakeFirstOrThrow();
    
  const change1_2 = await lix.db.insertInto("change")
    .values({
      entity_id: "entity-1", 
      file_id: "file-1",
      plugin_key: "test", 
      schema_key: "test", 
      snapshot_id: snapshot2.id,
      created_at: "2023-01-02T01:00:00Z"
    })
    .returning("id")
    .executeTakeFirstOrThrow();
    
  const change1_3 = await lix.db.insertInto("change")
    .values({
      entity_id: "entity-1", 
      file_id: "file-1",
      plugin_key: "test", 
      schema_key: "test", 
      snapshot_id: snapshot3.id,
      created_at: "2023-01-03T01:00:00Z"
    })
    .returning("id")
    .executeTakeFirstOrThrow();
    
  const change2_1 = await lix.db.insertInto("change")
    .values({
      entity_id: "entity-2", 
      file_id: "file-1",
      plugin_key: "test", 
      schema_key: "test", 
      snapshot_id: snapshot4.id,
      created_at: "2023-01-01T02:00:00Z"
    })
    .returning("id")
    .executeTakeFirstOrThrow();
    
  const change2_2 = await lix.db.insertInto("change")
    .values({
      entity_id: "entity-2", 
      file_id: "file-1",
      plugin_key: "test", 
      schema_key: "test", 
      snapshot_id: snapshot5.id,
      created_at: "2023-01-02T02:00:00Z"
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  // Associate changes with change sets
  await lix.db.insertInto("change_set_element")
    .values([
      { change_id: change1_1.id, change_set_id: "change-set-1", entity_id: "entity-1", schema_key: "test", file_id: "file-1" },
      { change_id: change1_2.id, change_set_id: "change-set-2", entity_id: "entity-1", schema_key: "test", file_id: "file-1" },
      { change_id: change1_3.id, change_set_id: "change-set-3", entity_id: "entity-1", schema_key: "test", file_id: "file-1" },
      { change_id: change2_1.id, change_set_id: "change-set-1", entity_id: "entity-2", schema_key: "test", file_id: "file-1" },
      { change_id: change2_2.id, change_set_id: "change-set-2", entity_id: "entity-2", schema_key: "test", file_id: "file-1" }
    ])
    .execute();

  // Test with depth=0 - should only return changes directly in the specified change set
  const changesWithDepth0 = await lix.db
    .selectFrom("change")
    .where(changeIsLeafOfChangeSet({ id: "change-set-2" }, { depth: 0 }))
    .selectAll()
    .execute();

  // With depth=0, we should only get changes from change-set-2
  expect(changesWithDepth0).toHaveLength(2);
  expect(changesWithDepth0.map(c => c.id).sort()).toEqual([change1_2.id, change2_2.id].sort());
});

test("it should find changes from change set with unlimited depth", async () => {
  const lix = await openLixInMemory({});

  // Create change sets
  const changeSets = [
    { id: "change-set-1" },
    { id: "change-set-2" },
    { id: "change-set-3" }
  ] satisfies Partial<ChangeSet>[];

  await lix.db.insertInto("change_set")
    .values(changeSets)
    .execute();

  // Create change set relationships (parent -> child)
  await lix.db.insertInto("change_set_edge")
    .values([
      { parent_id: "change-set-1", child_id: "change-set-2" },
      { parent_id: "change-set-2", child_id: "change-set-3" }
    ])
    .execute();

  // Create snapshots - allowing SQLite to auto-generate the IDs
  const snapshot1 = await lix.db.insertInto("snapshot")
    .values({ content: { value: "content1" } })
    .returning("id")
    .executeTakeFirstOrThrow();
    
  const snapshot2 = await lix.db.insertInto("snapshot")
    .values({ content: { value: "content2" } })
    .returning("id")
    .executeTakeFirstOrThrow();
    
  const snapshot3 = await lix.db.insertInto("snapshot")
    .values({ content: { value: "content3" } })
    .returning("id")
    .executeTakeFirstOrThrow();
    
  const snapshot4 = await lix.db.insertInto("snapshot")
    .values({ content: { value: "content4" } })
    .returning("id")
    .executeTakeFirstOrThrow();
    
  const snapshot5 = await lix.db.insertInto("snapshot")
    .values({ content: { value: "content5" } })
    .returning("id")
    .executeTakeFirstOrThrow();

  // Create changes - let the database generate the IDs
  const change1_1 = await lix.db.insertInto("change")
    .values({
      entity_id: "entity-1", 
      file_id: "file-1",
      plugin_key: "test", 
      schema_key: "test", 
      snapshot_id: snapshot1.id,
      created_at: "2023-01-01T01:00:00Z"
    })
    .returning("id")
    .executeTakeFirstOrThrow();
    
  const change1_2 = await lix.db.insertInto("change")
    .values({
      entity_id: "entity-1", 
      file_id: "file-1",
      plugin_key: "test", 
      schema_key: "test", 
      snapshot_id: snapshot2.id,
      created_at: "2023-01-02T01:00:00Z"
    })
    .returning("id")
    .executeTakeFirstOrThrow();
    
  const change1_3 = await lix.db.insertInto("change")
    .values({
      entity_id: "entity-1", 
      file_id: "file-1",
      plugin_key: "test", 
      schema_key: "test", 
      snapshot_id: snapshot3.id,
      created_at: "2023-01-03T01:00:00Z"
    })
    .returning("id")
    .executeTakeFirstOrThrow();
    
  const change2_1 = await lix.db.insertInto("change")
    .values({
      entity_id: "entity-2", 
      file_id: "file-1",
      plugin_key: "test", 
      schema_key: "test", 
      snapshot_id: snapshot4.id,
      created_at: "2023-01-01T02:00:00Z"
    })
    .returning("id")
    .executeTakeFirstOrThrow();
    
  const change2_2 = await lix.db.insertInto("change")
    .values({
      entity_id: "entity-2", 
      file_id: "file-1",
      plugin_key: "test", 
      schema_key: "test", 
      snapshot_id: snapshot5.id,
      created_at: "2023-01-02T02:00:00Z"
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  // Associate changes with change sets
  await lix.db.insertInto("change_set_element")
    .values([
      { change_id: change1_1.id, change_set_id: "change-set-1", entity_id: "entity-1", schema_key: "test", file_id: "file-1" },
      { change_id: change1_2.id, change_set_id: "change-set-2", entity_id: "entity-1", schema_key: "test", file_id: "file-1" },
      { change_id: change1_3.id, change_set_id: "change-set-3", entity_id: "entity-1", schema_key: "test", file_id: "file-1" },
      { change_id: change2_1.id, change_set_id: "change-set-1", entity_id: "entity-2", schema_key: "test", file_id: "file-1" },
      { change_id: change2_2.id, change_set_id: "change-set-2", entity_id: "entity-2", schema_key: "test", file_id: "file-1" }
    ])
    .execute();

  // Test with unlimited depth - should return the latest change for each entity across all ancestral change sets
  const changesWithFullDepth = await lix.db
    .selectFrom("change")
    .where(changeIsLeafOfChangeSet({ id: "change-set-3" }))
    .selectAll()
    .execute();

  // With unlimited depth for change-set-3, we should get:
  // - The latest change for entity-1, which is change-1-3 from change-set-3
  // - The latest change for entity-2, which is change-2-2 from change-set-2 (since there's no entity-2 change in change-set-3)
  expect(changesWithFullDepth).toHaveLength(2);
  expect(changesWithFullDepth.map(c => c.id).sort()).toEqual([change1_3.id, change2_2.id].sort());

  // Test with unlimited depth from middle of ancestry chain
  const changesFromMiddle = await lix.db
    .selectFrom("change")
    .where(changeIsLeafOfChangeSet({ id: "change-set-2" }))
    .selectAll()
    .execute();

  // With unlimited depth for change-set-2, we should get:
  // - The latest change for entity-1, which is change-1-2 from change-set-2
  // - The latest change for entity-2, which is change-2-2 from change-set-2
  expect(changesFromMiddle).toHaveLength(2);
  expect(changesFromMiddle.map(c => c.id).sort()).toEqual([change1_2.id, change2_2.id].sort());
});
