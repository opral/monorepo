import { openLix, createVersion, selectVersionDiff } from "@lix-js/sdk";

export default async function runExample(console: any) {
  const lix = await openLix({});

  // Store a test schema for our examples
  await lix.db
    .insertInto("stored_schema")
    .values({
      value: {
        "x-lix-key": "product",
        "x-lix-version": "1.0",
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          price: { type: "number" },
        },
      },
    })
    .execute();

  // Get active version to branch from
  const activeVersion = await lix.db
    .selectFrom("active_version")
    .innerJoin("version", "version.id", "active_version.version_id")
    .selectAll("version")
    .executeTakeFirstOrThrow();

  // Add initial product data
  await lix.db
    .insertInto("state_by_version")
    .values({
      entity_id: "product-1",
      schema_key: "product",
      file_id: "products.json",
      version_id: activeVersion.id,
      plugin_key: "lix_plugin_json",
      snapshot_content: { id: "product-1", name: "Widget", price: 10 },
      schema_version: "1.0",
    })
    .execute();

  console.log("SECTION START 'version-diff'");

  // Create two versions from the same base
  const versionA = await createVersion({
    lix,
    name: "version-a",
    from: activeVersion,
  });
  const versionB = await createVersion({
    lix,
    name: "version-b",
    from: activeVersion,
  });

  // Modify the product in version A (change price)
  await lix.db
    .updateTable("state_by_version")
    .set({ snapshot_content: { id: "product-1", name: "Widget", price: 12 } })
    .where("version_id", "=", versionA.id)
    .where("entity_id", "=", "product-1")
    .execute();

  // Compare versions: what changed from B to A?
  const diff = await selectVersionDiff({
    lix,
    source: versionA,
    target: versionB,
  })
    .where("status", "!=", "unchanged")
    .execute();

  console.log("Changes between versions:");
  for (const row of diff) {
    console.log(`  ${row.entity_id}: ${row.status}`);
  }

  console.log("SECTION END 'version-diff'");

  console.log("SECTION START 'custom-diff'");

  // The power of SQL: compose custom diff queries with filters and joins
  const productDiffs = await selectVersionDiff({
    lix,
    source: versionA,
    target: versionB,
  })
    // Filter to specific schema
    .where("diff.schema_key", "=", "product")
    // Only show actual changes
    .where("diff.status", "!=", "unchanged")
    // Join to get before/after snapshot content
    .leftJoin("change as before", "before.id", "diff.before_change_id")
    .leftJoin("change as after", "after.id", "diff.after_change_id")
    .select([
      "diff.entity_id",
      "diff.status",
      "before.snapshot_content as before_content",
      "after.snapshot_content as after_content",
    ])
    .execute();

  console.log("Product changes with content:");
  for (const row of productDiffs) {
    const before = row.before_content as any;
    const after = row.after_content as any;

    if (before?.price !== after?.price) {
      console.log(
        `  ${row.entity_id}: price ${before?.price} → ${after?.price}`,
      );
    }
  }

  console.log("SECTION END 'custom-diff'");

  console.log("SECTION START 'plugin-diffs'");
  const plugin = (await lix.plugin.getAll()).find(
    (p: any) => p.key === "lix_plugin_csv",
  );

  if (plugin?.renderDiff) {
    console.log("Plugin renderDiff available:", true);
  } else {
    console.log("No renderDiff function found for CSV plugin");
  }

  console.log("SECTION END 'plugin-diffs'");
}

// Uncomment for running in node
// runExample(console);
