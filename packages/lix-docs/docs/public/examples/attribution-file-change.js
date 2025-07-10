import { openLix } from "@lix-js/sdk";

async function demonstrateFileAttribution() {
  const lix = await openLix({});

  const fileChangeAuthor = await lix.db
    .selectFrom("file")
    .innerJoin("change_author", "file.lixcol_change_id", "change_author.id")
    .innerJoin("account", "change_author.account_id", "account.id")
    .where("file.path", "=", "/example.json")
    .selectAll()
    .executeTakeFirst();

  console.log(
    `${fileChangeAuthor?.path} was last modified by ${fileChangeAuthor?.name} at ${fileChangeAuthor?.created_at}`
  );
}

// Run the demonstration
demonstrateFileAttribution().catch(console.error);