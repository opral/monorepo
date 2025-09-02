import type { Lix } from "@lix-js/sdk";

export async function upsertMarkdownFile(args: {
  lix: Lix;
  fileId: string;
  markdown: string;
  path?: string;
  metadata?: any;
  hidden?: boolean;
}): Promise<void> {
  const { lix, fileId, markdown, path, metadata, hidden } = args;
  const data = new TextEncoder().encode(markdown);

  const existing = await lix.db
    .selectFrom("file")
    .select(["id"]) // small row
    .where("id", "=", fileId)
    .executeTakeFirst();

  if (existing) {
    await lix.db.updateTable("file").set({ data }).where("id", "=", fileId).execute();
  } else {
    // Insert requires a path; use provided or fallback to /<fileId>.md
    await lix.db
      .insertInto("file")
      .values({
        id: fileId,
        path: path ?? `/${fileId}.md`,
        data,
        metadata: metadata ?? null,
        hidden: hidden ? 1 : 0,
      })
      .execute();
  }
}
