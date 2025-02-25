# @inlang/sdk

## 2.3.0

### Minor Changes

- c0b857a: stable lix ids when opening a project with `loadProjectFromDirectory()` https://github.com/opral/inlang-sdk/issues/228

### Patch Changes

- 91ba4eb: fix: Cannot mkdir project.inlang/cache/puligns in window OSS using git bash terminal

  https://github.com/opral/inlang-paraglide-js/issues/377

- Updated dependencies [c0b857a]
  - @lix-js/sdk@0.4.1

## 2.2.2

### Patch Changes

- c53b1a9: fix: type of LocalVariable

## 2.2.1

### Patch Changes

- f51736f: fix: plugin imports on Bun
- adf7d6c: fix `saveProjectToDirectory` to have proper backwards compatibility and respect `pathPattern` file location`

## 2.2.0

### Minor Changes

- fc41e71: remove sentry

  the overhead of sentry is too high for the inlang sdk. errors that occur are eventually reported by apps.

## 2.1.3

### Patch Changes

- Updated dependencies [1c84afb]
- Updated dependencies [175f7f9]
  - @lix-js/sdk@0.4.0

## 2.1.2

### Patch Changes

- 61b9782: update the description of depreacted settings props `sourceLanguageTag` and `languageTags` to clarify that the properties should be kept in place as long as inlang apps are used that have the inlang SDK v1 as a dependency
- Updated dependencies [b87f8a8]
  - sqlite-wasm-kysely@0.3.0
  - @lix-js/sdk@0.3.5

## 2.1.1

### Patch Changes

- Updated dependencies [31e8fb8]
  - sqlite-wasm-kysely@0.2.0
  - @lix-js/sdk@0.3.4

## 2.1.0

### Minor Changes

- 57f9e7f: adds a gitignore when calling `saveProjectToDirectory`

### Patch Changes

- 8af8ba9: improve performance: only write db changes to lix on close
- 4444034: fix: replaced wrong variable

  closes https://github.com/opral/inlang-paraglide-js/issues/310

  This bug prevented the SDK from working on Windows due to a POSIX path conversion being performed but not used later.

  ```diff
  // inlang/packages/sdk/src/project/loadProjectFromDirectory.ts:550
  await args.lix.db
      .insertInto("file") // change queue
      .values({
  -       path: path,
  +       path: posixPath,
          data: new Uint8Array(data),
      })
  ```

- fa94c1f: improve: beautified json when creating a new project
- Updated dependencies [7fd8092]
  - @lix-js/sdk@0.3.3

## 2.0.0

### Patch Changes

- Updated dependencies [d71b3c7]
  - @lix-js/sdk@0.3.2
