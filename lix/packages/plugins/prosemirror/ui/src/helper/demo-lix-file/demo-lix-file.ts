import { Lix, fileQueueSettled, newLixFile, openLixInMemory, toBlob } from "@lix-js/sdk";
import { plugin as prosemirrorPlugin } from "@lix-js/plugin-prosemirror";

/**
 * Initial ProseMirror document for demo purposes
 */
export const initialDocument = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1, id: "heading-1" },
      content: [{ type: "text", text: "Welcome to ProseMirror with Lix!" }]
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This is a demo document showing how " },
        { type: "text", marks: [{ type: "strong" }], text: "ProseMirror" },
        { type: "text", text: " can be integrated with " },
        { type: "text", marks: [{ type: "em" }], text: "Lix" },
        { type: "text", text: " for collaborative editing." }
      ]
    },
    {
      type: "heading",
      attrs: { level: 2, id: "heading-2" },
      content: [{ type: "text", text: "Features:" }]
    },
    {
      type: "bullet_list",
      content: [
        {
          type: "list_item",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Rich text editing" }]
            }
          ]
        },
        {
          type: "list_item",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Change tracking" }]
            }
          ]
        },
        {
          type: "list_item",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Versioning" }]
            }
          ]
        },
        {
          type: "list_item",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Collaboration" }]
            }
          ]
        }
      ]
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Try editing this document to see how changes are tracked!" }
      ]
    }
  ]
};

/**
 * Create a new demo Lix file with the ProseMirror demo document
 */
export async function lixProsemirrorDemoFile(): Promise<{ blob: Blob; id: string }> {
  const lix = await openLixInMemory({
    blob: await newLixFile(),
    providePlugins: [prosemirrorPlugin],
  });

  const id = await lix.db
    .selectFrom("key_value")
    .where("key", "=", "lix_id")
    .select("value")
    .executeTakeFirstOrThrow();

  await setupProsemirrorDemo(lix);
  await fileQueueSettled({ lix });

  return { blob: await toBlob({ lix }), id: id.value };
}

/**
 * Sets up a demo ProseMirror document in the Lix database
 */
export async function setupProsemirrorDemo(lix: Lix) {
  console.log("Setting up ProseMirror demo file");
  
  // Create the initial document by inserting it into the file table
  const file = await lix.db
    .insertInto("file")
    .values({
      path: "/prosemirror.json",
      data: new TextEncoder().encode(JSON.stringify(initialDocument)),
    })
    .returningAll()
    .executeTakeFirstOrThrow();
  
  console.log("ProseMirror demo file created successfully");
  return file;
}