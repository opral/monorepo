# Develop a lint rule

This documentation provides step-by-step instructions on developing a lint rule for the inlang ecosystem. Lint rules are used to check for specific patterns or issues in translated messages to ensure high-quality translations. Follow the guide below to create your own custom lint rule.

## Pre-requisites

Before you begin developing a lint rule, make sure you have the following pre-requisites installed on your system:

- [Node.js](https://nodejs.org/en/) (version 18 or higher)

## Step-by-step

### 1. Initialize a new lint rule module

You need to initialize a new lint rule module using the inlang CLI to get started. Open your terminal and run the following command:

```bash
npx @inlang/cli@latest module init --type lintRule
```

This command will create a new lint rule project with the necessary files and directory structure.

### 2. Implement your lint rule

Now that you have a basic lint rule project, it's time to implement your custom lint rule logic. You can use the following code as a starting point and customize it to fit your lint rule requirements:

```typescript
import type { MessageLintRule } from "@inlang/message-lint-rule";
import { id, displayName, description } from "../marketplace-manifest.json";

export const yourLintRule: MessageLintRule = {
  meta: {
    id: id as MessageLintRule["id"],
    displayName,
    description,
  },
  message: ({ message: { id, variants }, languageTags, sourceLanguageTag, report }) => {
    // Your custom lint rule logic goes here
    // You can analyze message variants and report issues if necessary
  },
};
```

Replace `yourLintRule` with a meaningful name for your lint rule.

Helpful **example implementations** of lint rules can be found [here](https://github.com/opral/monorepo/tree/main/inlang/source-code/message-lint-rules).

### 3. Configure your lint rule

In your lint rule's `marketplace-manifest.json` make sure to define the following information:

| Parameter        | Description                                               |
|----------------------|---------------------------------------------------------------|
| `id`                 | Unique identifier for your lint rule.                         |
| `icon`        | Link to the icon of your lint rule (optional).              |
| `gallery`        | Optional gallery, the first image acts as coverImage for your lint rule.              |
| `displayName`        | A user-friendly display name for your lint rule.              |
| `description`        | Briefly describe what your lint rule checks for.              |
| `readme`             | Link to the README documentation for your lint rule.          |
| `keywords`           | Keywords that describe your lint rule.                        |
| `publisherName`      | Your publisher name.                                          |
| `publisherIcon`      | Link to your publisher's icon or avatar (optional).           |
| `license`            | The license under which your lint rule is distributed.        |
| `module`             | The path to your lint rule's JavaScript module (Please use [jsDelivr](https://www.jsdelivr.com/)).               |

### 4. Test your lint rule

Before publishing your lint rule to the marketplace, thoroughly test it to ensure it functions correctly and detects issues as intended.

### 5. Publish your lint rule

To make your lint rule available in the inlang.com marketplace, see [Publish on marketplace](/documentation/publish-to-marketplace).

Feel free to [join our Discord](https://discord.gg/CNPfhWpcAa) if you have any questions or need assistance developing and publishing your lint rule.
