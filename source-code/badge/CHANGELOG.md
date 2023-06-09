# @inlang/badge

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
  - @inlang-git/fs@0.0.4
  - @inlang/core@0.8.6

## null

### Patch Changes

- Updated dependencies [98b140f1]
  - @inlang-git/fs@0.0.3
  - @inlang/core@0.8.5
