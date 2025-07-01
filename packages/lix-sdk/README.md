# Lix SDK

[![NPM Downloads](https://img.shields.io/npm/dw/%40lix-js%2Fsdk?logo=npm&logoColor=red&label=npm%20downloads)](https://www.npmjs.com/package/@lix-js/sdk) [![Discord](https://img.shields.io/discord/897438559458430986?style=flat&logo=discord&labelColor=white)](https://discord.gg/xjQA897RyK)


![Lix SDK](https://cdn.jsdelivr.net/gh/opral/monorepo/packages/lix-sdk/assets/banner.png)

## Introduction

Lix is a change control system that runs in the browser and an SDK to build web apps.

A change control system allows storing, tracking, querying, and reviewing changes in different file formats, e.g., `.xlsx`, `.sqlite`, or `.inlang`. Compared to a version control system, a change control system understands “what” changed in a file, e.g., cell C43 in the financials spreadsheet changed.

Lix is not a git replacement, nor is it designed for software engineering. The goal is to bring change control workflows to industries other than software engineering like health, finance, policy making, design, etc.

Try a [demo lix app](https://lix.opral.com/app/fm). 

## Features

- **📌 Versioning**: The possibility to create divergent states (branches in Git).  
- **⚡ CI/CD**: Automations as we know them from software engineering.  
- **🔀 Change Proposals**: (WIP [#242](https://github.com/opral/lix-sdk/issues/242)) Similar workflow to pull requests in Git.  
- **🤝 Collaboration**: Lix comes with built-in sync, enabling asynchronous (Git-like) and real-time collaboration (Google Docs-like) capabilities.  
- **✅ Validation Rules**: (WIP [#239](https://github.com/opral/lix-sdk/issues/239)) Define and enforce validation rules for your data.  
 

### Good to know

- 🔍 **Everything is SQL**: Querying lix happens via SQL. No new query language to learn. The lix SDK conveniently exposes [Kysely](https://kysely.dev/), a type-safe SQL query builder.
- 🌐 **Browser-based**: Lix targets the browser as target platform. Node/unix dependencies are ruled out.
- 📂 **Repository Structure**: Issues and documentation are tracked in the [opral/lix-sdk](https://github.com/opral/lix-sdk) repository, while the source code lives in the [opral/monorepo](https://github.com/opral/monorepo/tree/main/packages/lix-sdk). This separation helps maintain a clean issue tracking experience and reduces repository complexity.  

## Getting Started

> [!TIP]
> The documentation is a work in progress. If you have any questions, please open issues in the [GitHub repository](https://github.com/opral/lix-sdk).

> [!NOTE]
> The getting started uses a JSON file but you can store any file in lix, even a SQLite database, as long as a plugin for the file format is provided.

### Installation

Install the Lix SDK package:

```bash
npm install @lix-js/sdk
```

### Open a lix

> [!NOTE]
> We plan to have locally installed plugins in the future with no need to provide them upfront, see [#241](https://github.com/opral/lix-sdk/issues/241).

Create and open a new Lix file:

```javascript 
import { newLixFile, openLixInMemory } from "@lix-js/sdk";
import { plugin as jsonPlugin } from "@lix-js/plugin-json";

// Create a new empty Lix file
const lixFile = await newLixFile();

// Open the Lix file in memory
const lix = await openLixInMemory({
	blob: lixFile,
	providePlugins: [jsonPlugin],
});
```

### Insert files

Inserting an examplary JSON file into lix:

```javascript
const json = {
	name: "Hello World",
	version: "1.0.0",
	settings: {
		enableFeatureX: true,
		maxUsers: 10,
	},
};

// Insert the file 
const file = await lix.db
	.insertInto("file")
	.values({
		path: "/example.json",
		data: new TextEncoder().encode(JSON.stringify(json)),
	})
	.returningAll()
	.executeTakeFirstOrThrow();

console.log("JSON file inserted with ID:", file.id);
```

### Update Files

Let's update our JSON file with some changes:

```diff
{
	name: "Hello World",
-	version: "1.0.0",
+	version: "1.1.0",
	settings: {
		enableFeatureX: true,
-		maxUsers: 10,
+		maxUsers: 20,
	},
};
```

```javascript
// updating the json from the previous example
json["version"] = "1.1.0";
json["settings"]["maxUsers"] = 20;

// Update the file
await lix.db
	.updateTable("file")
	.set({
		data: new TextEncoder().encode(JSON.stringify(updatedJson)),
	})
	.where("path", "=", "/example.json")
	.execute();

```

Lix detect changes in file updates via the [file-queue](https://github.com/opral/monorepo/tree/main/packages/lix-sdk/src/file-queue) and the provided plugin which detects changes. 

### Query Changes

Now we can query the changes that were made to the JSON file:

```javascript
// Get all changes for this file
const changes = await lix.db
	.selectFrom("change")
	.where("file_id", "=", file.id)
	.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
	.execute();

console.log("Changes for the JSON file:", changes);
```

### Create and switch a version

```javascript
const versionB = await createVersion({ lix, name: "B" });

// Create a new version based on the parent version
await switchVersion({ lix, to: versionB });

console.log("New version created:", versionB.id);
```

### Querying changes in a specific version

We'll update the JSON again by bumping the version to 1.2.0 with a new maxUsers count of 30:

```diff
{
	name: "Hello World",
-	version: "1.1.0",
+	version: "1.2.0",
	settings: {
		enableFeatureX: true,
-		maxUsers: 20,
+		maxUsers: 30,
	},
};
```

Querying changes in a specific version is simple by using the `changeInVersion()` filter:

```javascript
import { createChange } from "@lix-js/sdk";

const changes = await lix.db
	.selectFrom("change")
	.where("file_id", "=", file.id)
  .where(changeInVersion(versionB))
	.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
	.execute();

console.log(
  `Changes for the JSON file in version ${versionB.name}:`, changes
);
```

### Querying a file 

The file table is derived from the changes in the current version. Hence, querying the file after updating the json in the previous step will return the updated file:

```ts
const file = await lix.db
  .selectFrom("file")
  .where("path", "=", "/example.json")
  .selectAll()
  .executeTakeFirstOrThrow();

console.log(file)
```

```json
{
	"name": "Hello World",
	"version": "1.2.0",
	"settings": {
		"enableFeatureX": true,
		"maxUsers": 30,
	},
}
```

### Switch Back

Switch back to version A and you will see that the changes of version B are not present:

```javascript
await switchVersion({ lix, to: versionA })

console.log("Switched to version: main");

// Get the file data in this version
const originalFile = lix.db
	.selectFrom("file")
	.where("path", "=", "/example.json")
	.selectAll()
	.executeTakeFirstOrThrow();

const originalContent = JSON.parse(originalFile.content);
console.log("Original content in main version:", originalContent);
```

```json
{
	"name": "Hello World",
	"version": "1.1.0",
	"settings": {
		"enableFeatureX": true,
		"maxUsers": 20,
	},
}
```

### Merge Changes

Merge changes from version B into version A:

```javascript
await mergeVersion({lix, sourceVersion: versionB, targetVersion: versionA});

// Check the merged state
const file_after_merge = lix.db
	.selectFrom("file")
	.where("id", "=", file.id)
	.select("data")
	.executeTakeFirstOrThrow();

console.log("File state after merge:", JSON.parse(file_after_merge.data));
```

```json
{
	"name": "Hello World",
	"version": "1.2.0",
	"settings": {
		"enableFeatureX": true,
		"maxUsers": 30,
	},
}
```

## Plugins

Lix uses plugins to understand and track changes in different file formats. Documentation is work in progress. Find example plugins here: 

- [JSON Plugin](https://github.com/opral/monorepo/tree/main/packages/lix-plugin-json)
- [CSV plugin](https://github.com/opral/monorepo/tree/main/packages/lix-plugin-csv)

## Building apps

### Example use cases

Apps that revolve around changes are prime use cases to be built on lix. Having an “edit -> review -> automate” workflow is a good indicator for an app that revolves around changes:

- document editors (markdown, PDF, etc.)
- accounting solutions (auditing)
- content creation tools (Figma, Adobe Premiere)
- spreadsheets (Excel, Google Sheets)
- CAD software (Fusion 360, Autodesk)
- data science (Jupyter Notebooks)
- dashboards (Analytics, Infrastructure)

### Advantages

Developing a web app with lix is reduced to providing a user interface that opens and saves a file.

![Open a file, provide a UI, done](https://cdn.jsdelivr.net/gh/opral/monorepo/packages/lix-sdk/assets/open_file.png)

Backend features like auth, permissions, change control, and automations are solved on a file rather than an application-specific level. Lix knows who the actors are (auth), allows actors to conduct changes (permissions), is aware of how data changes over time (change history), can merge changes (collaboration), and uses the knowledge of changes to trigger automations (automation pipelines).

![Backend features for files](https://cdn.jsdelivr.net/gh/opral/monorepo/packages/lix-sdk/assets/backend_features_to_files.png)

In contrast, cloud-based apps are substantially more difficult to build because they require:

- Auth (could be solved with a backend as a service)
- Integrations (no interop between apps)
- Ensure data privacy and security
- Scaling complexity of storing all customer data
- Replicating change control features like history, branching, etc.
