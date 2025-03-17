import { it, expect } from "vitest";
import { openLixInMemory } from "@lix-js/sdk";
import { plugin } from "./index.js";

it("detects changes when inserting a prosemirror document", async () => {
  // Initialize Lix with the ProseMirror plugin
  const lix = await openLixInMemory({
    providePlugins: [plugin],
  });

  // Create initial document
  const initialDoc = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        attrs: { _id: "p1" },
        content: [{ type: "text", text: "Initial paragraph" }],
      },
    ],
  };

  // Convert to binary data
  const initialData = new TextEncoder().encode(JSON.stringify(initialDoc));

  // Store in Lix using direct database insert (matches App.tsx implementation)
  await lix.db
    .insertInto("file")
    .values({
      path: "/prosemirror.json",
      data: initialData,
    })
    .onConflict((oc) =>
      oc.doUpdateSet({
        data: initialData,
      }),
    )
    .execute();

  // Verify the file was stored
  const storedFile = await lix.db
    .selectFrom("file")
    .where("path", "=", "/prosemirror.json")
    .select("data")
    .executeTakeFirst();

  expect(storedFile).toBeDefined();
  expect(storedFile?.data).toEqual(initialData);

  // Check if changes were detected
  const changes = await lix.db
    .selectFrom("change")
    .innerJoin("file", "change.file_id", "file.id")
    .where("file.path", "=", "/prosemirror.json")
    .selectAll("change")
    .execute();

  // We should have at least one change for the paragraph
  expect(changes.length).toBeGreaterThanOrEqual(1);
  
  // Verify that one of the changes is for our paragraph
  const paragraphChange = changes.find(c => c.entity_id === "p1");
  expect(paragraphChange).toBeDefined();

  // Create modified document with a new paragraph
  const modifiedDoc = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        attrs: { _id: "p1" },
        content: [{ type: "text", text: "Modified paragraph" }],
      },
      {
        type: "paragraph",
        attrs: { _id: "p2" },
        content: [{ type: "text", text: "New paragraph" }],
      },
    ],
  };

  // Convert to binary data
  const modifiedData = new TextEncoder().encode(JSON.stringify(modifiedDoc));

  // Store updated document in Lix using direct database insert
  await lix.db
    .insertInto("file")
    .values({
      path: "/prosemirror.json",
      data: modifiedData,
    })
    .onConflict((oc) =>
      oc.doUpdateSet({
        data: modifiedData,
      }),
    )
    .execute();

  // Check if more changes were detected
  const updatedChanges = await lix.db
    .selectFrom("change")
    .innerJoin("file", "change.file_id", "file.id")
    .where("file.path", "=", "/prosemirror.json")
    .selectAll("change")
    .execute();

  // We should have more changes now
  expect(updatedChanges.length).toBeGreaterThan(changes.length);
  
  // Verify that we have changes for both paragraphs
  const p1Change = updatedChanges.find(c => c.entity_id === "p1");
  const p2Change = updatedChanges.find(c => c.entity_id === "p2");
  
  expect(p1Change).toBeDefined();
  expect(p2Change).toBeDefined();

  // Get snapshots to verify content
  const snapshots = await lix.db
    .selectFrom("change")
    .innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
    .innerJoin("file", "change.file_id", "file.id")
    .where("file.path", "=", "/prosemirror.json")
    .select(["change.entity_id", "snapshot.content"])
    .execute();
  
  // Find the snapshot for p2
  const p2Snapshot = snapshots.find(s => s.entity_id === "p2");
  expect(p2Snapshot).toBeDefined();
  
  // Verify the content of the new paragraph
  if (p2Snapshot?.content) {
    const content = p2Snapshot.content as any;
    expect(content.type).toBe("paragraph");
    expect(content.attrs._id).toBe("p2");
    
    // Check text content if it exists
    if (content.content && content.content.length > 0) {
      const textNode = content.content[0];
      expect(textNode.text).toBe("New paragraph");
    }
  }
});