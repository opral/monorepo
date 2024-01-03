# @inlang/badge

## 0.5.1

### Patch Changes

- Updated dependencies [bc5803235]
  - @inlang/sdk@0.20.0
  - @inlang/telemetry@0.3.1

## 0.5.0

### Minor Changes

- 1d0f167b4: Bug fix of internal #195

### Patch Changes

- Updated dependencies [1d0f167b4]
  - @inlang/telemetry@0.3.0

## 0.4.1

### Patch Changes

- Updated dependencies [8b05794d5]
  - @inlang/sdk@0.19.0
  - @inlang/telemetry@0.2.1

## 0.4.0

### Minor Changes

- 6f42758bb: force absolute path for settingsFilePath to intercept nodeishFs with absolute paths

### Patch Changes

- Updated dependencies [6f42758bb]
  - @inlang/sdk@0.11.0

## 0.3.0

### Minor Changes

- 973858c6: chore(fix): remove unpublished dependency which lead to installation failing

### Patch Changes

- Updated dependencies [973858c6]
  - @inlang/telemetry@0.2.0
  - @inlang/sdk@0.2.0
  - @lix-js/client@0.2.0

## 0.2.4

### Patch Changes

- 1cff6e4d: fix btoa with Buffer.from

## 0.2.3

### Patch Changes

- 943e29c1: added a missing group identifier event

## 0.2.2

### Patch Changes

- 2dd0a6c0: fix percentage calculation

## 0.2.1

### Patch Changes

- 04f81ae8: Minor refactorings

## 0.2.0

### Minor Changes

- 5813663c: improve: add cache

  Fixes inlang badge doesn't work for larger repositories #817

### Patch Changes

- 28d5b023: improve: wording of missing messages
- 919569ee: fix: percentage calculation

  - the percentage doesn't account for lints anymore (because that is confusing)
  - the preferred language logic has been removed (because the user agent of the user is never passed to the server and makes caching harder)

- Updated dependencies [0b43c17c]
  - @inlang/core@0.8.7

## null

### Patch Changes

- Updated dependencies [81835b11]
  - @lix-js/fs@0.0.4
  - @inlang/core@0.8.6

## null

### Patch Changes

- Updated dependencies [98b140f1]
  - @lix-js/fs@0.0.3
  - @inlang/core@0.8.5
