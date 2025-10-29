# @inlang/sdk

## 3.0.0

### Major Changes

- 7791be7: Upgraded the [inlang SDK](https://github.com/opral/inlang-sdk) to [Lix](https://lix.dev/) v0.5 🎉

  ## Highlights

  ### Writing directly to Lix state

  State is now written straight into Lix instead of the SDK’s private in-memory SQLite snapshot. Every bundle, message, and variant change becomes a first-class Lix commit, unlocking:

  - history and branching,
  - writer-key aware workflows,
  - change proposals and subscriptions, and
  - a single source of truth for downstream tools.

  ### Per-file filesystem sync

  Any inlang-based tooling that opens a project from disk (IDE extensions, CLIs, custom apps) used to patch the entire locale tree whenever a single message changed. That behaviour is at the heart of [opral/inlang-sherlock#173](https://github.com/opral/inlang-sherlock/issues/173) where editing one key in `en.json` would re-export every other locale file, destroying manual formatting or reintroducing stale content.

  Thanks to Lix v0.5’s observable state and writer-key APIs we can now react to per-commit metadata and suppress our own writes. When `happy_elephant` in `en.json` is updated, the SDK marks only `en.json` as dirty, leaving `de.json` and friends untouched. Drift is still possible if another tool rewrites `en.json`, yet the blast radius falls from “the whole project just changed” to “only the file you touched,” making reviews and merges manageable across all inlang integrations.

## 2.4.9

### Patch Changes

- 22089a2: Fix error when running the machine translate using `pathPattern` as an array

  ***

  When running command `{npx|pnpm} inlang machine translate ...` is throwing an error when the `pathPattern` value is Array like this:

  ```json
  {
  	"$schema": "https://inlang.com/schema/project-settings",
  	"baseLocale": "es",
  	"locales": ["es", "en"],
  	"modules": [
  		"https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@4/dist/index.js",
  		"https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@2/dist/index.js"
  	],
  	"plugin.inlang.messageFormat": {
  		// In this example, "pathPattern" is array
  		"pathPattern": [
  			"./messages/{locale}/home.json",
  			"./messages/{locale}/shopping-cart.json"
  		]
  	}
  }
  ```

  ### Error message

  ```bash
  deriancordoba@DerianCordoba project % pnpm machine-translate

  > project@0.0.1 machine-translate /Users/deriancordoba/Developer/project
  > inlang machine translate --project project.inlang

  ✔ Machine translate complete.

   ERROR   pathPattern.replace is not a function

    at saveProjectToDirectory (node_modules/.pnpm/@inlang+cli@3.0.11/node_modules/@inlang/cli/dist/main.js:56516:81)
    at async _Command.<anonymous> (node_modules/.pnpm/@inlang+cli@3.0.11/node_modules/@inlang/cli/dist/main.js:56647:5)

   ELIFECYCLE  Command failed with exit code 1.
  ```

## 2.4.8

### Patch Changes

- 56acb22: fix: loading plugins from cache in directory mode https://github.com/opral/inlang-paraglide-js/issues/498
- Updated dependencies [aa4d69e]
  - @lix-js/sdk@0.4.7

## 2.4.7

### Patch Changes

- bd2c366: improve: sample telemetry event to reduce number of events
- Updated dependencies [f634538]
  - @lix-js/sdk@0.4.6

## 2.4.6

### Patch Changes

- 49a7880: improve: forward telemetry settings to lix

## 2.4.5

### Patch Changes

- 083ff1f: fix: `loadProjectFromDirectory()` should return errors from `loadProject()`
- Updated dependencies [275d87e]
- Updated dependencies [dc92f56]
- Updated dependencies [c1ed545]
  - @lix-js/sdk@0.4.5

## 2.4.4

### Patch Changes

- Updated dependencies [85478f8]
  - @lix-js/sdk@0.4.4

## 2.4.3

### Patch Changes

- Updated dependencies [8ce6666]
  - @lix-js/sdk@0.4.3

## 2.4.2

### Patch Changes

- Updated dependencies [59f6c92]
  - @lix-js/sdk@0.4.2

## 2.4.1

### Patch Changes

- 5a991cd: fix sdk&sherlock on win

## 2.4.0

### Minor Changes

- f01927c: bugfixing

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
