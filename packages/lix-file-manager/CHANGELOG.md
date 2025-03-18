# lix-file-manager

## 0.2.8

### Patch Changes

- Updated dependencies [8ce6666]
  - @lix-js/sdk@0.4.3
  - @lix-js/plugin-csv@0.1.5

## 0.2.7

### Patch Changes

- Updated dependencies [59f6c92]
  - @lix-js/sdk@0.4.2
  - @lix-js/plugin-csv@0.1.4

## 0.2.6

### Patch Changes

- Updated dependencies [c0b857a]
  - @lix-js/sdk@0.4.1
  - @lix-js/plugin-csv@0.1.3

## 0.2.5

### Patch Changes

- 175f7f9: @lix-js/sdk:

  - define UiDiffComponent type
  - diff components can now consume multiple diffs

  @lix-js/plugin-csv:

  - update to use new diff component type
  - display multiple diffs in a single component
  - add rowId to snapshot content
  - group diffs by rowId

  lix-file-manager:

  - add checkpoint timeline instead of change list
  - refactor API diff component rendering
  - refactor queries to use new UiDiffComponent type

  PR URL:
  https://github.com/opral/monorepo/pull/3377

- Updated dependencies [1c84afb]
- Updated dependencies [175f7f9]
  - @lix-js/sdk@0.4.0
  - @lix-js/plugin-csv@0.1.2

## 0.2.4

### Patch Changes

- @lix-js/sdk@0.3.5
- @lix-js/plugin-csv@0.1.1

## 0.2.3

### Patch Changes

- Updated dependencies [494ab14]
  - @lix-js/plugin-csv@0.1.0
  - @lix-js/sdk@0.3.4

## 0.2.2

### Patch Changes

- Updated dependencies [7fd8092]
  - @lix-js/sdk@0.3.3
  - @lix-js/plugin-csv@0.0.7

## 0.2.1

### Patch Changes

- Updated dependencies [d71b3c7]
  - @lix-js/sdk@0.3.2
  - @lix-js/plugin-csv@0.0.6

## 0.2.0

### Minor Changes

- c3d2d8e: Refactor: change "confirmed" to "checkpoint" and "unconfirmed" to "intermediate"

### Patch Changes

- Updated dependencies [c3d2d8e]
  - @lix-js/sdk@0.3.0
  - @lix-js/plugin-csv@0.0.5

## 0.1.1

### Patch Changes

- Updated dependencies [657bdc4]
- Updated dependencies [0de2866]
- Updated dependencies [48fac78]
- Updated dependencies [03e746d]
  - @lix-js/sdk@0.2.0
  - @lix-js/plugin-csv@0.0.4

## 0.1.0

### Minor Changes

- c016fe4: improve: clears the OPFS in case the lix file can't be loaded.

  If the lix schema changed, loading existing lix'es breaks with no possibility for users to fix the situation. Auto clearing the OPFS ledas to the creation of a new lix file with the new schema.

### Patch Changes

- be92eb8: replaces newsletter example with salary example that has changes
- 31b7cda: Refactor(fix): `file.data` from `ArrayBuffer` to `Uint8Array`

  The lix SDK's file.data type changed from `ArrayBuffer` to `Uint8Array`. SQLite returned `UInt8Array`.

- Updated dependencies [85eb03e]
- Updated dependencies [2d3ab95]
- Updated dependencies [d78a1bf]
- Updated dependencies [6b14433]
- Updated dependencies [9f1765a]
- Updated dependencies [c494dca]
- Updated dependencies [4d9d980]
- Updated dependencies [cc93bd9]
- Updated dependencies [fc5a5dd]
- Updated dependencies [31b7cda]
- Updated dependencies [8c4ac57]
- Updated dependencies [8629faa]
- Updated dependencies [de6d717]
- Updated dependencies [be9effa]
- Updated dependencies [b74e982]
- Updated dependencies [5eecc61]
  - @lix-js/sdk@0.1.0
  - @lix-js/plugin-csv@0.0.3

## 0.0.1

### Patch Changes

- Updated dependencies [400db21]
  - @lix-js/sdk@0.0.1
  - @lix-js/plugin-csv@0.0.2
