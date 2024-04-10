# @inlang/badge

## 0.7.12

### Patch Changes

- Updated dependencies [c068dd2]
  - @inlang/sdk@0.31.0

## 0.7.11

### Patch Changes

- Updated dependencies [9b26a31]
  - @inlang/sdk@0.30.0

## 0.7.10

### Patch Changes

- 62dfa26: SDK Breaking change: LintReports get() and getAll() are now async, and non-reactive.
  Reduces (does not eliminate) excessive sdk resource consumption.
- Updated dependencies [62dfa26]
  - @inlang/sdk@0.29.0

## 0.7.9

### Patch Changes

- Updated dependencies [8a8aec7]
  - @lix-js/client@1.2.0
  - @inlang/sdk@0.28.3

## 0.7.8

### Patch Changes

- Updated dependencies [d1b361e]
  - @lix-js/client@1.1.0
  - @inlang/sdk@0.28.2

## 0.7.7

### Patch Changes

- Updated dependencies [03fa6f2]
  - @lix-js/client@1.0.0
  - @inlang/sdk@0.28.1

## 0.7.6

### Patch Changes

- Updated dependencies [1e43ae4]
  - @inlang/sdk@0.28.0

## 0.7.5

### Patch Changes

- 4837297: File locking for concurrent message updates through the load/store plugin api
  Auto-generated human-IDs and aliases - only with experimental: { aliases: true }
- Updated dependencies [4837297]
  - @inlang/sdk@0.27.0
  - @lix-js/client@0.9.0

## 0.7.4

### Patch Changes

- @inlang/sdk@0.26.5

## 0.7.3

### Patch Changes

- @inlang/sdk@0.26.4

## 0.7.2

### Patch Changes

- @inlang/sdk@0.26.3

## 0.7.1

### Patch Changes

- @inlang/sdk@0.26.2

## 0.7.0

### Minor Changes

- 23a0f5ff8: add memory settings to nodejs

## 0.6.1

### Patch Changes

- Updated dependencies [3bf94ddb5]
  - @lix-js/client@0.8.0
  - @inlang/sdk@0.26.1

## 0.6.0

### Minor Changes

- edb7d145f: update svg renderer
- 345c277f1: add badge error cache

## 0.5.8

### Patch Changes

- Updated dependencies [676c0f905]
  - @inlang/sdk@0.26.0

## 0.5.7

### Patch Changes

- Updated dependencies [87bed968b]
- Updated dependencies [23ca73060]
  - @inlang/sdk@0.25.0

## 0.5.6

### Patch Changes

- Updated dependencies [23ce3f0ea]
  - @lix-js/client@0.7.0
  - @inlang/sdk@0.24.1

## 0.5.5

### Patch Changes

- Updated dependencies [c38faebce]
  - @inlang/sdk@0.24.0
  - @lix-js/client@0.6.0

## 0.5.4

### Patch Changes

- Updated dependencies [b920761e6]
  - @inlang/sdk@0.23.0

## 0.5.3

### Patch Changes

- Updated dependencies [cd29edb11]
  - @inlang/sdk@0.22.0
  - @lix-js/client@0.5.0
  - @inlang/telemetry@0.3.3

## 0.5.2

### Patch Changes

- Updated dependencies [e20364a46]
  - @inlang/env-variables@0.2.0
  - @inlang/sdk@0.21.0
  - @lix-js/client@0.4.0
  - @inlang/telemetry@0.3.2

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
