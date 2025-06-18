/**
 * This file contains example usage of the query API for Lix SDK.
 * These examples demonstrate how to use the new abstraction layer for common operations.
 */

import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import type { LixPlugin } from "../plugin/lix-plugin.js";

// Example plugin to demonstrate usage
const examplePlugin: LixPlugin = {
  key: "example_plugin",
  detectChangesGlob: "*.md",
  detectChanges: ({ before, after }) => {
    // Simple implementation for the example
    return [];
  },
  applyChanges: ({ file, changes }) => {
    // Simple implementation for the example
    return { fileData: file.data };
  },
};

async function fileRepositoryExample() {
  // Initialize Lix with the example plugin
  const lix = await openLixInMemory({
    providePlugins: [examplePlugin],
  });

  // Using the file repository
  const { files } = lix.query;

  // Create a new file
  const readme = await files.create({
    path: "/README.md",
    data: new TextEncoder().encode("# Hello World"),
    metadata: { createdAt: new Date().toISOString() },
  });

  console.log(`Created file: ${readme.path} with ID: ${readme.id}`);

  // Get a file by path
  const file = await files.getByPath("/README.md");
  if (file) {
    console.log(`Found file: ${file.path}`);
    console.log(`Content: ${new TextDecoder().decode(file.data)}`);
  }

  // Update a file
  const updatedFile = await files.update(readme.id, {
    data: new TextEncoder().encode("# Updated Content"),
    metadata: { ...readme.metadata, updatedAt: new Date().toISOString() },
  });

  console.log(`Updated file content: ${new TextDecoder().decode(updatedFile.data)}`);

  // Find all markdown files
  const markdownFiles = await files.findByExtension("md");
  console.log(`Found ${markdownFiles.length} markdown files`);

  // Create or update a file (convenience method)
  const document = await files.createOrUpdate(
    "/docs/document.md",
    new TextEncoder().encode("# New Document"),
    { category: "documentation" }
  );

  console.log(`Created or updated file: ${document.path}`);

  // Query with more complex conditions
  const recentFiles = await files.query()
    .where("path", "startsWith", "/docs/")
    .orderBy("lixcol_created_at", "desc")
    .limit(5)
    .execute();

  console.log(`Found ${recentFiles.length} recent files in docs directory`);

  // Delete a file
  await files.deleteByPath("/README.md");
  console.log("Deleted README.md");
}

async function keyValueRepositoryExample() {
  // Initialize Lix
  const lix = await openLixInMemory({});

  // Using the key-value repository
  const { keyValues } = lix.query;

  // Store some values
  await keyValues.set("user:preferences:theme", "dark");
  await keyValues.set("user:preferences:fontSize", 14);
  await keyValues.set("app:version", "1.0.0");

  // Get a single value
  const theme = await keyValues.get("user:preferences:theme");
  console.log(`User theme: ${theme}`);

  // Find all user preferences
  const userPrefs = await keyValues.findByKeyPrefix("user:preferences:");
  console.log("User preferences:", userPrefs);

  // Update a value
  await keyValues.set("user:preferences:theme", "light");
  console.log(`Updated theme to: ${await keyValues.get("user:preferences:theme")}`);

  // Delete a value
  await keyValues.deleteKey("app:version");
  console.log(`app:version exists: ${await keyValues.get("app:version") !== null}`);
}

// These examples can be run to demonstrate the query API
// fileRepositoryExample();
// keyValueRepositoryExample();