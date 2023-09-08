# inlang-vs-code-extension

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

- 66519584: Fixes https://github.com/inlang/inlang/issues/927

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

- 04f5ac93: The ide extension config has been moved back into @inlang/core. For more information, read https://github.com/inlang/inlang/issues/856.
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
