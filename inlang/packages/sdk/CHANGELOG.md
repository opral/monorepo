# @inlang/sdk

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
