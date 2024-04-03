# Building an Inlang App: A Comprehensive Guide

Inlang is a versatile globalization ecosystem that empowers developers to seamlessly integrate language translation capabilities into their applications. This comprehensive guide will walk you through the process of building a general Inlang app with the `@inlang/sdk`. 

We'll cover initializing a project from a repo, creating and updating messages, and working with lint rules.

## 1. Open Repository

All Inlang projects live in a repo, so first we use the lix client to open the repo.

We can use node:fs for repos which are already in the filesytem. E.g. This example uses the lix client to find the repo root starting from the current working directory, and then opens the repo there.

```typescript
import fs from "node:fs/promises"
import { openRepository, findRepoRoot } from "@lix-js/client"

const repoRoot = await findRepoRoot({ nodeishFs: fs, process.cwd() })

const repo = await openRepository(repoRoot, {
    nodeishFs: fs,
})
```

Or, use createNodeishMemoryFs to open a GitHub repo from a browser:

```typescript
import { createNodeishMemoryFs } from "@lix-js/fs"
import { openRepository } from "@lix-js/client"

const repoURL = "https://github.com/inlang/ci-test-repo"

const repo = await openRepository(repoURL, {
    nodeishFs: createNodeishMemoryFs(),
})
```

## 2. Load Project
The next step is to initialize a project from the repo, using the Inlang SDK. This sets the foundation for your Inlang powered application.

Since there may be multiple projects in a repo, a projectPath needs to be specified. The default projectPath is `/project.inlang`.

```typescript
import { loadProject } from "@inlang/sdk";

const projectPath = "/project.inlang";

const inlang = loadProject({
    projectPath,
    repo,
});
```

## 2. Create and update Messages

With the project initialized, creating and updating messages is straightforward. Use the `inlang.query.messages.create` function to create a message and `inlang.query.messages.update` to update it. 

There are also a few other query/mutation functions you can use.

### Creating Messages

```typescript
const messageData = /* your message data */;
inlang.query.messages.create({ data: messageData });
```

### Updating Messages

```typescript
const updatedMessageData = /* your updated message data */;
inlang.query.messages.update({ args: updatedMessageData });
```

These functions internally handle the loading and saving of messages according to your defined plugin (e.g., [JSON](/m/ig84ng0o/plugin-inlang-json), [i18next](/m/3i8bor92/plugin-inlang-i18next), [Inlang message format](/m/reootnfj/plugin-inlang-messageFormat)).

## 3. Working with Lint Rules

[Lint rules](/c/lint-rules) are crucial for maintaining code quality and consistency. In your Inlang app, you can leverage lint rules to ensure that your localization messages adhere to specific standards. For example, let's explore working with the [`snakeCaseId`](https://inlang.com/m/messageLintRule.inlang.snakeCaseId) lint rule.

This lint rule checks whether your message id's are in a snake case format or not.

To fetch lint reports for a message, use the async lintReports.get() function.

```typescript
const reports = await inlang.query.lintReports.get({ where: { messageId: message.id } })
/* do something with reports */
```

## Publishing your app

If you are ready and want to release what you have built, please [publish your app](https://inlang.com/documentation/publish-to-marketplace) on our [Marketplace](https://inlang.com) – where you can also sell apps in the future.

## Conclusion

Now it's your turn! We can't wait what you wil build with the inlang SDK. The possibilities are near endless – like a Chrome extension, a Sketch plugin, a Translation Analytics tool? Happy coding! 