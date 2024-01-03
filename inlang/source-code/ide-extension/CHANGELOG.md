# inlang-vs-code-extension

## 1.25.0

### Minor Changes

- bc5803235: hotfix reactivity bug in ide extension

### Patch Changes

- Updated dependencies [bc5803235]
  - @inlang/sdk@0.20.0
  - @inlang/create-project@1.1.2
  - @inlang/telemetry@0.3.1

## 1.24.0

### Minor Changes

- 013a0923b: fix windows close project selection bug

## 1.23.0

### Minor Changes

- 1d0f167b4: Bug fix of internal #195

### Patch Changes

- Updated dependencies [1d0f167b4]
  - @inlang/telemetry@0.3.0

## 1.22.0

### Minor Changes

- e237b4942: chore: update SDK dependency and support for project directories

## 1.21.1

### Patch Changes

- @inlang/telemetry@0.2.1

## 1.21.0

### Minor Changes

- 82ccb9e80: add quote stripping to extract messages in vs code extension
- cc3c17d8a: add resolve string escape for inline preview

## 1.20.0

### Minor Changes

- Adjust publish script to publish to marketplace

## 1.19.0

### Minor Changes

- change logo of vs code extension

## 1.18.0

### Minor Changes

- 6e1fddf71: update watch & README + MARKETPLACE

## 1.17.0

### Minor Changes

- ae3cad41c: latest bugfixes

## 1.16.0

### Minor Changes

- 9d754d722: add watch to fs

### Patch Changes

- Updated dependencies [9d754d722]
  - @lix-js/fs@0.4.0

## 1.15.0

### Minor Changes

- 452553bed: remove reload prompt instead silent reload
- 39beea7dd: change return type of extractMessageOptions

## 1.14.0

### Minor Changes

- 77ed7a85c: update deps

## 1.13.0

### Minor Changes

- 3bfc38121: Use configured proxy for requests from ide-extension, if available

## 1.12.0

### Minor Changes

- a3bd1b72f: fix: show inlang logo as extension icon

### Patch Changes

- Updated dependencies [6f42758bb]
  - @lix-js/fs@0.3.0

## 1.11.0

### Minor Changes

- a1f3f064b: improve: tryAutoGenProjectSettings

  - Only prompts the user if the settings can actually be generated.

  refactor: remove unused code

## 1.10.0

### Minor Changes

- 241a37328: Refactor event emitters

## 1.9.0

### Minor Changes

- e336aa227: clean up command configuration

## 1.8.0

### Minor Changes

- b7dfc781e: change message format match from object to array

## 1.7.0

### Minor Changes

- 9df069d11: quickfix: vs code extension config create

## 1.6.0

### Minor Changes

- 564a2df5: improved the wording of the automatic settings file prompt

## 1.5.0

### Minor Changes

- 8bf4c07a: fix lint reactivity bug & migrate

## 1.4.0

### Minor Changes

- 1df3ba43: improve auto settings & ide extension structure

## 1.3.0

- updated dependencies

## 1.2.0

### Minor Changes

- 0f925704: fix env

## 1.1.0

### Minor Changes

- 973858c6: chore(fix): remove unpublished dependency which lead to installation failing

### Patch Changes

- Updated dependencies [973858c6]
  - @inlang/telemetry@0.2.0
  - @inlang/result@1.1.0
  - @lix-js/fs@0.2.0

## 0.9.3

### Patch Changes

- 1bd24020: Fixes an error so placeholders are displayed in message previews.

## 0.9.2

### Patch Changes

- 68504fbc: update README

## 0.9.1

### Patch Changes

- ce0c2566: add jsonc parser for extensions.json parsing

## 0.9.0

### Minor Changes

- 9ff20754: Add context tooltip, which lets you view all localizations of a message, edit and open them in the editor.
- 823cec8a: add lints to ide extension

## 0.8.1

### Patch Changes

- 06b12597: Adjust loading inlangs config so it is compatible with Windows
- 543231e4: Fixes telemtry in ide-extension, so it won't crash if there is no git.

## 0.8.0

### Minor Changes

- 283f5764: Several performance improvements.

### Patch Changes

- 943e29c1: added a missing group identifier event

## 0.7.6

### Patch Changes

- 584e436b: Updated to new plugin-json link from monorepo

## 0.7.5

### Patch Changes

- 66519584: Fixes https://github.com/inlang/monorepo/issues/927

## 0.7.4

### Patch Changes

- 3657b5ea: fix config not loading because of wrong path detection
- 11452575: remove telemetry events "decoration set" and "code action provided"

## 0.7.3

### Patch Changes

- 97092de0: fix config not loading because of wrong path detection
- 97092de0: remove telemetry events "decoration set" and "code action provided"

## 0.7.2

### Patch Changes

- 719c1e8b: internal refacotring

## 0.7.1

### Patch Changes

- 66e85ac1: Fix: Importing local JavaScript files via $import() has been fixed.
- c9208cc6: capture the used configs for roadmap priorization
- 7f4e79bb: add telemetry for recommended in workspace

## 0.7.0

### Minor Changes

- 16f4307f: add recommendation prompt
- d9ff0e23: change recommendation key to "disableRecommendation"

## 0.6.4

### Patch Changes

- 1cad35e9: persist user with id

## 0.6.3

### Patch Changes

- 04f5ac93: The ide extension config has been moved back into @inlang/core. For more information, read https://github.com/inlang/monorepo/issues/856.
- Updated dependencies [04f5ac93]
  - @inlang/core@0.9.0

## 0.6.2

### Patch Changes

- b3e868f1: remove monorepo config parsing and add warning to config if no ide extension properties are set

## 0.6.1

### Patch Changes

- 04f81ae8: Minor refactorings

## 0.6.0

### Minor Changes

- 9cd701a3: The VSCode extension should now work for the majority of projects.

  We fixed a problem that blocked the VSCode extension for months. The extension transpiles ESM under the hood to CJS now because Electron, and thus VSCode, do not support ESM.

## 0.5.9

### Patch Changes

- @inlang/core@0.8.6

## 0.5.8

### Patch Changes

- @inlang/core@0.8.5

## 0.5.7

### Patch Changes

- a9b71575: fix: dynamic import

## 0.5.6

### Patch Changes

- 4147156d: refactor esm imports

## 0.5.5

### Patch Changes

- 5c6d472e: update settings for plugins
- Updated dependencies [5c6d472e]
  - @inlang/core@0.8.4

## 0.5.4

### Patch Changes

- 652de069: update for ide extension release
- 89f0c7a2: update vs-code-extension

## 0.5.3

### Patch Changes

- Updated dependencies [6bf22450]
- Updated dependencies [61190e25]
  - @inlang/core@0.5.3

## 0.5.1

### Patch Changes

- @inlang/core@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [a0b85eb]
- Updated dependencies [e9e9ce5]
  - @inlang/core@0.5.0

## 0.4.3

### Patch Changes

- Updated dependencies [fc30d4b]
  - @inlang/core@0.4.3

## 0.4.2

### Patch Changes

- Updated dependencies [f28da6b]
- Updated dependencies [f28da6b]
- Updated dependencies [f28da6b]
  - @inlang/core@0.4.2

## 0.4.1

### Patch Changes

- Updated dependencies [e5a88c8]
  - @inlang/core@0.4.1

## 0.4.0

### Patch Changes

- Updated dependencies [1d756dd]
- Updated dependencies [a4b9fce]
  - @inlang/core@0.4.0
