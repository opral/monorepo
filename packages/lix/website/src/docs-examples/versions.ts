export default async function runExample(console: any) {
  console.log("SECTION START 'setup'");

  const { openLix, createVersion, switchVersion } = await import("@lix-js/sdk");
  const { plugin: jsonPlugin } = await import("@lix-js/plugin-json");

  const lix = await openLix({
    providePlugins: [jsonPlugin],
  });

  // Get main version info for later use
  const mainVersion = await lix.db
    .selectFrom("version")
    .where("name", "=", "main")
    .select(["id"])
    .executeTakeFirstOrThrow();

  // Helper function to log file differences
  const logFileDifferences = (allFiles: any[]) => {
    allFiles.forEach((file) => {
      const data = JSON.parse(new TextDecoder().decode(file.data));
      const versionName =
        file.lixcol_version_id === mainVersion.id ? "main" : "price-update";
      const tshirtPrice = data.items.find(
        (item: any) => item.name === "T-Shirt",
      ).price;
      console.log(`T-Shirt price in '${versionName}': $${tshirtPrice}`);
    });
  };

  console.log("SECTION END 'setup'");

  console.log("SECTION START 'getting-started-versions'");

  // Create a product catalog file in the main version
  await lix.db
    .insertInto("file")
    .values({
      path: "/products.json",
      data: new TextEncoder().encode(
        JSON.stringify({
          items: [{ id: 1, name: "T-Shirt", price: 29.99, stock: 100 }],
        }),
      ),
    })
    .execute();

  // 1. Create a new version (branches from active version by default)
  const priceUpdateVersion = await createVersion({
    lix,
    name: "price-update",
  });

  // 2. Switch to the new version
  await switchVersion({ lix, to: priceUpdateVersion });

  // 3. Modify the file - update prices
  await lix.db
    .updateTable("file")
    .set({
      data: new TextEncoder().encode(
        JSON.stringify({
          items: [{ id: 1, name: "T-Shirt", price: 34.99, stock: 100 }],
        }),
      ),
    })
    .where("path", "=", "/products.json")
    .execute();

  // 4. Query files across all versions to see the differences
  const allFiles = await lix.db
    .selectFrom("file_by_version")
    .where("path", "=", "/products.json")
    .select(["lixcol_version_id", "data"])
    .execute();

  logFileDifferences(allFiles);

  console.log("SECTION END 'getting-started-versions'");
}

// Uncomment for running in node
// runExample(console);

