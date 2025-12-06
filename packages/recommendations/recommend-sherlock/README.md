# Sherlock 🕵️‍♂️ recommendation package

## Features

- **Check for Existing Recommendations**: Quickly verify if an extension is already recommended in the workspace's `.vscode/extensions.json` file.
- **Add New Recommendations**: Automatically add new recommendations to the `.vscode/extensions.json` file if they are not already present.

## Installation

Put this one into your `dependencies` in `package.json` & install it with `pnpm install`:

```bash
"@inlang/recommend-sherlock": "workspace:*"
```

## Usage

The module exports two main asynchronous functions:

### `shouldRecommend(fs: NodeishFilesystem, workingDirectory?: string): Promise<boolean>`

Checks whether the `inlang.vs-code-extension` is recommended in the workspace.

#### Parameters

- `fs`: A `NodeishFilesystem` object to interact with the file system.
- `workingDirectory`: (Optional) The working directory path.

#### Returns

- `Promise<boolean>`: `true` if the extension is recommended, `false` otherwise.

### `add(fs: NodeishFilesystem, workingDirectory?: string): Promise<void>`

Adds the `inlang.vs-code-extension` recommendation to the workspace if it's not already present.

#### Parameters

- `fs`: A `NodeishFilesystem` object to interact with the file system.
- `workingDirectory`: (Optional) The working directory path.

## Example

```typescript
import { shouldRecommend, add } from '@inlang/recommend-sherlock';
import { NodeishFilesystem } from '@lix-js/fs';

async function addSherlock(fs: NodeishFilesystem) {
  const isExtensionAdopted = await shouldRecommend(fs);

  if (!isExtensionAdopted) {
    // prompt for user confirmation
    const userConfirmed = await promptUser();

    if (userConfirmed) {
      await add(fs);
      console.log('Extension recommendation added.');
    } else {
      console.log('User declined to add extension recommendation.');
    }
  }
}
```

## Contributing

Contributions are welcome! If you have a feature request, bug report, or proposal, please open an issue or submit a pull request. Our Discord can be found [here](https://discord.gg/gdMPPWy57R).
