# @inlang/create-project

## 1.1.2

### Patch Changes

- Updated dependencies [bc5803235]
  - @inlang/sdk@0.20.0

## 1.1.1

### Patch Changes

- Updated dependencies [8b05794d5]
  - @inlang/sdk@0.19.0

## 1.1.0

### Minor Changes

- 029d78dc8: #1456 add windows tests & fix tests

### Patch Changes

- Updated dependencies [0e0d910b7]
- Updated dependencies [5c443c47a]
- Updated dependencies [ae752c309]
- Updated dependencies [029d78dc8]
  - @inlang/sdk@0.13.0

## 1.0.0

### Major Changes

- e3fa5701b: BREAKING: `tryAutoGenerateSettings` returns either the project settings or undefined.

  - simplifies the API
  - avoids confusion about what the function does

  improve: depend on @inlang/marketplace to get latest plugin links and correct ids

  improve: derives the correct language tags

  improve: `tryAutoGenerateSettings` does not write to the filesystem anymore

  test: check whether the project returns no errors

  refactor: remove dependency on node because this code runs in the browser

  refactor: remove unused exports

## 0.5.0

### Minor Changes

- 0d0502f4: deprecate detectedLanguageTags

### Patch Changes

- Updated dependencies [0d0502f4]
  - @inlang/plugin@1.3.0
  - @inlang/sdk@0.7.0

## 0.4.0

### Minor Changes

- 1df3ba43: improve auto settings & ide extension structure

## 0.3.0

### Minor Changes

- 25fe8502: refactor: remove plugin.meta and messageLintRule.meta nesting

### Patch Changes

- Updated dependencies [25fe8502]
- Updated dependencies [0a2114d4]
  - @inlang/project-settings@2.1.0
  - @inlang/plugin@1.2.0
  - @inlang/sdk@0.5.0

## 0.2.0

### Minor Changes

- 973858c6: chore(fix): remove unpublished dependency which lead to installation failing

### Patch Changes

- Updated dependencies [973858c6]
  - @inlang/project-settings@1.2.0
  - @inlang/plugin@1.1.0
  - @lix-js/fs@0.2.0

## 0.1.0

### Minor Changes

- 713385d3: add typesafety via JSON schema
- 983e6eb7: fix: correct plugin id

### Patch Changes

- Updated dependencies [713385d3]
  - @inlang/project-settings@1.1.0
