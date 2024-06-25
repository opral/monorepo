# Ninja 🥷 recommendation package

## Features

- **Workflow Verification**: Ensures that the GitHub Actions workflow incorporating the Ninja i18n lint action is present in a project's `.github/workflows` directory.
- **Automated Workflow Addition**: If not present, the package can automatically add a workflow to incorporate Ninja i18n linting into the project.

## Installation

Add this package to your `dependencies` in `package.json` & install it using `pnpm install`:

```bash
"@inlang/recommend-ninja": "workspace:*"
```

## Usage

This module exports two main asynchronous functions:

### `shouldRecommend(fs: NodeishFilesystem): Promise<boolean>`

Verifies if the Ninja i18n GitHub Action is adopted within the GitHub workflow files of your project.

#### Parameters

- `fs`: A `NodeishFilesystem` object for file system interactions.

#### Returns

- `Promise<boolean>`: `true` if the Ninja i18n GitHub Action workflow is found, `false` otherwise.

### `add(fs: NodeishFilesystem): Promise<void>`

Adds the Ninja i18n GitHub Action workflow to the repository's `.github/workflows` directory if it's not already present.

#### Parameters

- `fs`: A `NodeishFilesystem` object for file system interactions.

## Example

```typescript
import { shouldRecommend, add } from '@inlang/recommend-ninja';
import { NodeishFilesystem } from '@lix-js/fs';

async function ensureNinjaAdoption(fs: NodeishFilesystem) {
  const isWorkflowAdopted = await shouldRecommend(fs);

  if (!isWorkflowAdopted) {
    // Optionally prompt for user confirmation
    const userConfirmed = await promptUser("Do you want to add the Ninja i18n workflow?");

    if (userConfirmed) {
      await add(fs);
      console.log('Ninja i18n workflow added.');
    } else {
      console.log('User declined to add Ninja i18n workflow.');
    }
  } else {
    console.log('Ninja i18n workflow is already adopted.');
  }
}
```

## Contributing

Contributions are highly appreciated! Whether it's feature requests, bug reports, or pull requests, please feel free to contribute. Check out our [Discord](https://discord.gg/CNPfhWpcAa) for community discussions and updates.
