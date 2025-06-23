---
layout: home
title: Lix SDK
titleTemplate: Browser-native change control system

hero:
  name: Lix SDK
  text: ""
  tagline: A type-safe SQL-based SDK for tracking, querying, and merging fine-grained changes in structured data
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /api/

features:
  - icon: 🔍
    title: Fine-grained change tracking
    details: Property-level change detection (path→value mappings)
  - icon: 🔄
    title: SQL-based query interface
    details: Kysely-powered type-safe SQL queries
  - icon: 📊
    title: Comprehensive versioning
    details: DAG-based version control with merge detection
  - icon: 🌐
    title: Browser-first design
    details: SQLite WASM with zero Node dependencies
  - icon: 🔌
    title: Extensible plugin system
    details: Custom file format support via detectChanges()/applyChanges()
  - icon: 🤝
    title: Built-in collaboration
    details: Async/real-time sync via executeSync() API
---

<div class="vp-doc" style="max-width: 1080px; margin: 0 auto; padding: 24px;">

## Technical overview

Lix provides a complete change control system for structured data:

```typescript
// Create and open a Lix instance
const lixFile = await newLixFile();
const lix = await openLixInMemory({
  blob: lixFile,
  providePlugins: [jsonPlugin],
});

// Create and query data with type-safe SQL
const file = await lix.db
  .insertInto("file")
  .values({
    path: "/config.json",
    data: new TextEncoder().encode(JSON.stringify(data)),
  })
  .returningAll()
  .executeTakeFirstOrThrow();

// Query detected changes with SQL
const changes = await lix.db
  .selectFrom("change")
  .where("file_id", "=", file.id)
  .innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
  .execute();
```

## Core APIs

<div class="grid">
  <div class="api-card">
    <h3>File operations</h3>
    <ul>
      <li><a href="https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/lix/new-lix.ts" target="_blank"><code>newLixFile()</code></a> - Create a new empty Lix file</li>
      <li><a href="https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/lix/open-lix-in-memory.ts" target="_blank"><code>openLixInMemory()</code></a> - Open Lix instance in memory</li>
      <li><a href="https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/lix/open-lix.ts" target="_blank"><code>openLix()</code></a> - Open from persistent storage</li>
      <li><a href="https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/lix/close-lix.ts" target="_blank"><code>closeLix()</code></a> - Close Lix instance</li>
    </ul>
  </div>

  <div class="api-card">
    <h3>Version management</h3>
    <ul>
      <li><a href="https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/version/create-version.ts" target="_blank"><code>createVersion()</code></a> - Create a new branch</li>
      <li><a href="https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/version/switch-version.ts" target="_blank"><code>switchVersion()</code></a> - Switch to a different version</li>
      <li><a href="https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/change-set/create-merge-change-set.ts" target="_blank"><code>createMergeChangeSet()</code></a> - Merge two versions</li>
      <li><a href="https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/query-filter/change-set-is-ancestor-of.ts" target="_blank"><code>changeSetIsAncestorOf()</code></a> - Check version ancestry</li>
    </ul>
  </div>

  <div class="api-card">
    <h3>Change tracking</h3>
    <ul>
      <li><a href="https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/change-set/create-change-set.ts" target="_blank"><code>createChangeSet()</code></a> - Create a change set</li>
      <li><a href="https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/snapshot/create-snapshot.ts" target="_blank"><code>createSnapshot()</code></a> - Create a snapshot of changes</li>
      <li><a href="https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/query-filter/change-set-element-in-symmetric-difference.ts" target="_blank"><code>changeSetElementInSymmetricDifference()</code></a> - Compare changes</li>
      <li><a href="https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/change-set/create-transition-change-set.ts" target="_blank"><code>createTransitionChangeSet()</code></a> - Track transitions</li>
    </ul>
  </div>

  <div class="api-card">
    <h3>Collaboration</h3>
    <ul>
      <li><a href="https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/database/execute-sync.ts" target="_blank"><code>executeSync()</code></a> - Synchronize changes</li>
      <li><a href="https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/server-protocol-handler/create-server-protocol-handler.ts" target="_blank"><code>createServerProtocolHandler()</code></a> - Create protocol handler</li>
      <li><a href="https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/thread/create-thread.ts" target="_blank"><code>createThread()</code></a> - Create discussion thread</li>
      <li><a href="https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/thread/create-thread-comment.ts" target="_blank"><code>createThreadComment()</code></a> - Add comment to thread</li>
    </ul>
  </div>
</div>

## Database schema

Lix uses a SQL database with tables for tracking all changes:

```typescript
// Query changes with complete type safety
const changes = await lix.db
  .selectFrom("change")
  .where(sql`json_extract(change.metadata, '$.entity_type')`, "=", "cell")
  .where("file_id", "=", fileId)
  .select([
    "id",
    "file_id",
    "snapshot_id",
    "created_at",
    "metadata",
    "from_value",
    "to_value"
  ])
  .execute();

// Schema tables available in lix.db:
// - file: Stores file metadata and content
// - change: Records individual changes
// - snapshot: Groups related changes
// - change_set: Manages versions and branches
// - change_set_element: Tracks change set structure
// - change_set_edge: Defines change set relationships
// - thread: Manages discussion threads
// - thread_comment: Stores thread comments
// - label: Categorizes changes and versions
```

## Plugin system

<div class="grid">
  <div class="feature-card">
    <h3>JSON Plugin</h3>
    <p>Track precise changes to properties and nested objects with JSON path support.</p>
    <pre><code>// Change detection for property modifications
{
  "type": "update",
  "path": ["settings", "maxUsers"],
  "from": 10,
  "to": 20
}</code></pre>
    <div class="button-group">
      <a href="/plugins/json" class="custom-button">Documentation</a>
      <a href="https://github.com/opral/monorepo/tree/main/packages/lix-plugin-json" target="_blank" class="custom-button">GitHub</a>
    </div>
  </div>

  <div class="feature-card">
    <h3>CSV Plugin</h3>
    <p>Track cell-level changes in tabular data with row/column identifiers.</p>
    <pre><code>// Cell-based change detection
{
  "type": "update",
  "row": 5,
  "column": "C",
  "from": "old value",
  "to": "new value"
}</code></pre>
    <div class="button-group">
      <a href="/plugins/csv" class="custom-button">Documentation</a>
      <a href="https://github.com/opral/monorepo/tree/main/packages/lix-plugin-csv" target="_blank" class="custom-button">GitHub</a>
    </div>
  </div>

  <div class="feature-card">
    <h3>Markdown Plugin</h3>
    <p>Track structural changes in markdown with block-level granularity.</p>
    <pre><code>// Block-level change tracking
{
  "type": "update",
  "blockId": "heading-1",
  "from": "# Old title",
  "to": "# New title"
}</code></pre>
    <div class="button-group">
      <a href="/plugins/markdown" class="custom-button">Documentation</a>
      <a href="https://github.com/opral/monorepo/tree/main/packages/lix-plugin-md" target="_blank" class="custom-button">GitHub</a>
    </div>
  </div>
</div>

## System requirements

<div class="specs">
  <div class="spec">
    <span class="spec-name">Browser support</span>
    <span class="spec-value">Chrome 91+, Firefox 90+, Safari 15.4+, Edge 91+</span>
  </div>
  <div class="spec">
    <span class="spec-name">Dependencies</span>
    <span class="spec-value">SQLite WASM, Kysely, AJV</span>
  </div>
  <div class="spec">
    <span class="spec-name">Package size</span>
    <span class="spec-value">~300 KB (gzipped)</span>
  </div>
  <div class="spec">
    <span class="spec-name">License</span>
    <span class="spec-value"><a href="https://github.com/opral/monorepo/blob/main/packages/lix-sdk/LICENSE" target="_blank">MIT</a></span>
  </div>
</div>

</div>

<style>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin: 32px 0;
}

/* Heading styling for all cards */
.api-card h3, .feature-card h3, .spec-name {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 1.1rem;
  color: var(--vp-c-text-1);
}

.api-card ul {
  padding-left: 20px;
  margin-bottom: 0;
  line-height: 1.6;
}

.api-card li {
  margin-bottom: 6px;
}

.api-card li:last-child {
  margin-bottom: 0;
}

.api-card li code {
  font-size: 0.9em;
  color: var(--vp-c-brand);
}

.feature-card pre {
  background-color: var(--vp-c-bg-alt);
  border-radius: 6px;
  padding: 12px;
  font-size: 0.85em;
  margin: 10px 0;
  overflow-x: auto;
}

.feature-card code {
  font-family: 'JetBrains Mono', Menlo, Monaco, Consolas, 'Courier New', monospace;
}

.custom-button {
  display: inline-block;
  margin-top: 16px;
  padding: 6px 12px;
  background-color: transparent;
  color: var(--vp-c-brand);
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  text-decoration: none;
  border: 1px solid var(--vp-c-brand);
}

.custom-button:hover {
  background-color: rgba(8, 181, 214, 0.05);
}

.custom-button:active {
  background-color: rgba(8, 181, 214, 0.1);
}

.button-group {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.button-group .custom-button {
  margin-top: 0;
}

.specs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin: 32px 0;
}

/* Use the same styling for all card types */
.api-card, .feature-card, .spec {
  padding: 16px;
  background-color: var(--vp-c-bg-soft);
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: border-color 0.2s ease;
}

.spec {
  display: flex;
  flex-direction: column;
}

.api-card:hover, .feature-card:hover, .spec:hover {
  border-color: var(--vp-c-brand-lighter);
}

.spec-name {
  font-weight: 500;
  margin-bottom: 8px;
}

.spec-value {
  font-size: 0.95rem;
  color: var(--vp-c-text-2);
}

@media (max-width: 640px) {
  .specs {
    gap: 16px;
  }
}
</style>