# @inlang/cli

## 3.1.0

### Minor Changes

- ff07482: Require the `INLANG_GOOGLE_TRANSLATE_API_KEY` environment variable for machine translations.

  We previously subsidized machine translation costs. As projects become larger, our bill is no longer sustainable.

  To ensure that machine translations remain available, we are switching to a Bring Your Own Key (BYOK) model.

  **Before**

  ```sh
  npx @inlang/cli machine translate --project ./project.inlang
  ```

  **After**

  ```sh
  export INLANG_GOOGLE_TRANSLATE_API_KEY="your-google-api-key"
  npx @inlang/cli machine translate --project ./project.inlang
  ```

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

### Patch Changes

- 930df2d: Fix CLI build banner to avoid duplicate `createRequire` declarations when bundling SQLite from [lix](https://lix.dev).
- Updated dependencies [7791be7]
  - @inlang/sdk@3.0.0

## 3.0.12

### Patch Changes

- Updated dependencies [22089a2]
  - @inlang/sdk@2.4.9

## 3.0.11

### Patch Changes

- Updated dependencies [56acb22]
  - @inlang/sdk@2.4.8

## 3.0.10

### Patch Changes

- Updated dependencies [bd2c366]
  - @inlang/sdk@2.4.7

## 3.0.9

### Patch Changes

- Updated dependencies [49a7880]
  - @inlang/sdk@2.4.6

## 3.0.8

### Patch Changes

- Updated dependencies [083ff1f]
  - @inlang/sdk@2.4.5

## 3.0.7

### Patch Changes

- @inlang/sdk@2.4.4

## 3.0.6

### Patch Changes

- c1adffe: Fix typo and inconsistent casing in CLI help output

## 3.0.5

### Patch Changes

- @inlang/sdk@2.4.3

## 3.0.4

### Patch Changes

- @inlang/sdk@2.4.2

## 3.0.3

### Patch Changes

- Updated dependencies [5a991cd]
  - @inlang/sdk@2.4.1

## 3.0.2

Fix @inlang/rpc is a bundled dependency that is not published on npm

## 3.0.0

### Major Changes

- 4b710df: Upgrade to the inlang SDK v2.

  BREAKING:

  - The `inlang lint` command has been removed. Please upvote https://github.com/opral/lix-sdk/issues/239 to re-introduce linting in a future release.

  ```diff
  - inlang lint
  ```

  - Machine translate now takes `locales` instead of `languageTags` as argument

  ```diff
  - inlang machine-translate --languageTags en,de
  + inlang machine-translate --locales en,de
  ```

## 2.18.1

### Patch Changes

- 9d2aa1a: v2 message bundle persistence - initial store implementation

## 2.18.0

### Minor Changes

- 2806698: force release cli, as it was missing from the changeset targets for some reason

## 2.17.0

### Minor Changes

- 3896fe6: fix: move dependencies to dev dependencies to avoid "unpublished dependency" issues

## 2.16.10

### Patch Changes

- Updated dependencies [00ad046]
- Updated dependencies [00ad046]
  - @lix-js/fs@2.0.0
  - @lix-js/client@2.0.0
  - @inlang/sdk@0.35.1

## 2.16.9

### Patch Changes

- Updated dependencies [ae47203]
  - @inlang/sdk@0.35.0

## 2.16.8

### Patch Changes

- a27b7a4: This reintroduces reactivity to lint reports - see https://github.com/opral/monorepo/pull/2792 for more details
- Updated dependencies [d27a983]
- Updated dependencies [a27b7a4]
  - @inlang/sdk@0.34.10

## 2.16.7

### Patch Changes

- Updated dependencies [a958d91]
  - @inlang/sdk@0.34.9

## 2.16.6

### Patch Changes

- Updated dependencies [10dbd02]
  - @inlang/sdk@0.34.8

## 2.16.5

### Patch Changes

- Updated dependencies [5209b81]
  - @inlang/sdk@0.34.7

## 2.16.4

### Patch Changes

- Updated dependencies [f38536e]
  - @inlang/sdk@0.34.6

## 2.16.3

### Patch Changes

- Updated dependencies [b9eccb7]
  - @inlang/sdk@0.34.5

## 2.16.2

### Patch Changes

- Updated dependencies [2a90116]
  - @inlang/sdk@0.34.4

## 2.16.1

### Patch Changes

- Updated dependencies [bc17d0c]
  - @inlang/sdk@0.34.3

## 2.16.0

### Minor Changes

- 35cd140: Fix cli for new projects without git

## 2.15.3

### Patch Changes

- af8a397: Filter inlang machine translate to call rpc only if hasMissingTranslations

## 2.15.2

### Patch Changes

- 3c959bc: experimental sdk persistence v0
- Updated dependencies [3c959bc]
  - @inlang/sdk@0.34.2

## 2.15.1

### Patch Changes

- Updated dependencies [9165e64]
  - @lix-js/client@1.4.0
  - @inlang/sdk@0.34.1

## 2.15.0

### Minor Changes

- 5b8c053: sdk helper functions stringifyMessage, normalizeMessage
  INLANG_CLI_EXPERIMENTAL inlang validate --dump --save

### Patch Changes

- Updated dependencies [5b8c053]
  - @inlang/sdk@0.34.0

## 2.14.2

### Patch Changes

- cd9a3e1: add internal links
- Updated dependencies [7bd98e4]
  - @lix-js/client@1.3.0
  - @inlang/sdk@0.33.1

## 2.14.1

### Patch Changes

- Updated dependencies [4941ca4]
- Updated dependencies [d573ab8]
  - @lix-js/client@1.2.1
  - @inlang/sdk@0.33.0

## 2.14.0

### Minor Changes

- bc9875d: sdk multi-project test, MOCK_TRANSLATE_LOCAL for no server testing, inlang machine translate --nobar (-b) hides progressbar

### Patch Changes

- Updated dependencies [bc9875d]
  - @inlang/sdk@0.32.0

## 2.13.7

### Patch Changes

- Updated dependencies [c068dd2]
  - @inlang/sdk@0.31.0

## 2.13.6

### Patch Changes

- Updated dependencies [9b26a31]
  - @inlang/sdk@0.30.0

## 2.13.5

### Patch Changes

- 62dfa26: SDK Breaking change: LintReports get() and getAll() are now async, and non-reactive.
  Reduces (does not eliminate) excessive sdk resource consumption.
- Updated dependencies [62dfa26]
  - @inlang/sdk@0.29.0

## 2.13.4

### Patch Changes

- Updated dependencies [8a8aec7]
  - @lix-js/client@1.2.0
  - @inlang/sdk@0.28.3

## 2.13.3

### Patch Changes

- Updated dependencies [d1b361e]
  - @lix-js/client@1.1.0
  - @inlang/sdk@0.28.2

## 2.13.2

### Patch Changes

- Updated dependencies [03fa6f2]
  - @lix-js/client@1.0.0
  - @lix-js/fs@1.0.0
  - @inlang/sdk@0.28.1

## 2.13.1

### Patch Changes

- Updated dependencies [1e43ae4]
  - @inlang/sdk@0.28.0

## 2.13.0

### Minor Changes

- 4837297: File locking for concurrent message updates through the load/store plugin api
  Auto-generated human-IDs and aliases - only with experimental: { aliases: true }

### Patch Changes

- Updated dependencies [4837297]
  - @inlang/sdk@0.27.0
  - @lix-js/client@0.9.0

## 2.12.6

### Patch Changes

- @inlang/sdk@0.26.5

## 2.12.5

### Patch Changes

- @inlang/sdk@0.26.4

## 2.12.4

### Patch Changes

- f75af45af: Use p-limit to constrain rpc concurrency in cli translate

## 2.12.3

### Patch Changes

- d9cf66170: update docs for apps and plugins
- b7344152a: updated the docs

## 2.12.2

### Patch Changes

- Updated dependencies [32746a9ff]
  - @inlang/language-tag@1.5.1
  - @inlang/sdk@0.26.3

## 2.12.1

### Patch Changes

- Updated dependencies [244442698]
  - @inlang/language-tag@1.5.0
  - @inlang/sdk@0.26.2

## 2.12.0

### Minor Changes

- 2f160c130: refactor: clean up env variable usage

## 2.11.0

### Minor Changes

- ac7e6fe5e: fix: move bundled dependency to devDependencies

### Patch Changes

- eb60c0408: fix broken dependency

## 2.10.0

### Minor Changes

- 773ec8516: refactor: consolidate telemetry event

## 2.9.0

### Minor Changes

- 0bf93e5e6: refactor: telemetry for how commands are used

## 2.8.0

### Minor Changes

- 871972019: remove create-project in fsvor of manage.inlang.com

## 2.7.0

### Minor Changes

- 676c0f905: remove deprecated loadProject({nodeishFs})

## 2.6.0

### Minor Changes

- 488f2e33e: chore: add project group identify

## 2.5.0

### Minor Changes

- c38faebce: release fixed project id and catchup missed releases for cli and lix

## 2.4.0

### Minor Changes

- 112e9c1c3: interim fix: bumb machine translate timeout to 8s (https://github.com/opral/monorepo/issues/1968)

## 2.3.0

### Minor Changes

- 25d9cb7f1: fix: https://github.com/opral/monorepo/issues/1884

## 2.2.0

### Minor Changes

- 1d0f167b4: Bug fix of internal #195

## 2.1.0

### Minor Changes

- f75a7a551: improve: `inlang machine translate` now shows a progress bar (closes https://github.com/opral/monorepo/issues/1845)
- 950173b4c: fix: machine translate command not exiting
- 2cca8242a: improve: machine translation are conducted in parallel now, massively speeding up machine translations. see this loom https://www.loom.com/share/6467a97082224b31a6dd665c833a6cda?sid=65ec6913-b822-45b5-a111-0c9f303cceba

## 2.0.0

### Major Changes

- 2cafaf56c: BREAKING: `inlang project validate` is now only `inlang validate` see https://github.com/opral/monorepo/issues/1777
- 34f1944a9: REFACTOR: --project paths now need to end with .inlang

  ```diff
  -inlang machine translate --project ../project.inlang.json
  +inlang machine translate --project ../project.inlang
  ```

## 1.21.0

### Minor Changes

- f8d864297: add `sourceLanguageTag` & `targetLanguageTags` options to `machine translate` command

## 1.20.0

### Minor Changes

- c90939a90: update README

## 1.19.0

### Minor Changes

- 4ccdb2da6: fix `--no-fail` flag

## 1.18.0

### Minor Changes

- 93dca7bb2: add `--languageTags` flag to `lint` cli command

## 1.17.0

### Minor Changes

- 561a03ebe: add global `--project` flag

## 1.16.0

### Minor Changes

- 2f924df32: added Modulesettings validation via the Typebox JSON Schema Validation. This ensure that users can exclusively use module settings when there are given by the moduel

## 1.15.0

### Minor Changes

- 870641305: improve: better error output with stack traces

## 1.14.0

### Minor Changes

- 5d8b3d015: fix headline

## 1.13.0

### Minor Changes

- bf448423f: fix: wording of project validate command

## 1.12.0

### Minor Changes

- c3524d113: **removed the command `project init`**

  De-facto can a project not be manually created. The project settings are app/library/plugin specific. Stating that a project can be manually created is misleading. And leadsto reports like #1448.

## 1.11.0

### Minor Changes

- 6f42758bb: force absolute path for settingsFilePath to intercept nodeishFs with absolute paths

## 1.10.0

### Minor Changes

- 1502c0deb: refactor: removed the project migrate command

  - migration command is not used anymore
  - removed the command to reduce complexity

  improve: the project init command forward to inlang.com/new

## 1.9.0

### Minor Changes

- 7bcb365ed: update `config init` deprecation

## 1.8.0

### Minor Changes

- e5ae186f: add better error handling

## 1.7.0

### Minor Changes

- aaf2c7e4: chore: update dependencies

## 1.6.0

### Minor Changes

- 25fe8502: refactor: remove plugin.meta and messageLintRule.meta nesting

## 1.5.0

### Minor Changes

- dcb20e90: improve: module init got new templates with testing and more

## 1.4.0

### Minor Changes

- 81b9d741: refactor: move 'config validate' command to 'project validate'
- d0592709: improve: simplify init template

## 1.3.0

### Minor Changes

- 6ace5de0: update README of CLI to provide new commands `module` and `project`

## 1.2.0

### Minor Changes

- 973858c6: chore(fix): remove unpublished dependency which lead to installation failing

## 1.1.0

### Minor Changes

- 713385d3: add typesafety via JSON schema

## 0.13.3

### Patch Changes

- 1b7a054e: improve error DX and update links

## 0.13.2

### Patch Changes

- e7546f74: add nodejs minimum support

## 0.13.1

### Patch Changes

- 9171a188: fix lint table and config update plugin link quotes

## 0.13.0

### Minor Changes

- 1bc427b7: add `config update` command

### Patch Changes

- 74e18d43: fix typos and add one edge case

## 0.12.0

### Minor Changes

- 7bad2441: add `--no-fail` flag to lint command and output lint messages in tables

## 0.11.7

### Patch Changes

- 1cff6e4d: fix btoa with Buffer.from

## 0.11.6

### Patch Changes

- 943e29c1: added a missing group identifier event

## 0.11.5

### Patch Changes

- 3d248d71: fix wrong conditional on package.json checking

## 0.11.4

### Patch Changes

- 56c9d56f: fix auto major version

## 0.11.3

### Patch Changes

- 7ed241ae: fix config init validate step

## 0.11.2

### Patch Changes

- f5e76f98: introduce dynamic versions and fix Windows path bug

## 0.11.1

### Patch Changes

- 49adbea4: add inlang/sdk-js plugin

## 0.11.0

### Minor Changes

- 49269a2f: rework config init command to detect supported libraries

## 0.10.1

### Patch Changes

- 6a3063f0: support windows with open editor

## 0.10.0

### Minor Changes

- c67535d5: add --config option for monorepos

## 0.9.16

### Patch Changes

- c9208cc6: capture the used configs for roadmap priorization

## 0.9.15

### Patch Changes

- 95bfe307: add config validate

## 0.9.14

### Patch Changes

- 43a00f83: Added an info that `inlang config init` is work in progres.

## 0.9.13

### Patch Changes

- 99d9a2c3: remove double warning of no config found

## 0.9.12

### Patch Changes

- 9a7e72ac: add lint command to CLI

## 0.9.11

### Patch Changes

- b60740f9: refactoring

## 0.9.10

### Patch Changes

- caa9e747: add --force flag to machine translate command to raise awareness about translation quality

## 0.9.9

### Patch Changes

- 04f81ae8: Minor refactorings

## 0.9.8

### Patch Changes

- 4fc27086: Fix autogeneration of the config. The files have been resolved from the binary instead of `cwd`

## 0.9.7

### Patch Changes

- 2ff95127: Improved error messages and internal changes.

## 0.9.6

### Patch Changes

- f8b09192: Fixes "fetch" is not defined error in Node16 environments.

## 0.9.5

### Patch Changes

- 10947cea: refactoring of telemetry logic

## 0.9.4

### Patch Changes

- a05970cd: Fix machine translate command for CJS projects.

## 0.9.3

### Patch Changes

- 31f55f21: Dependencies are now declared as dev dependencies. The CLI is bundled, there was no need to define regular dependencies.
- 32cfc814: Improve the README on NPM.

## 0.9.2

### Patch Changes

- Updated dependencies [98b140f1]
  - @lix-js/fs@0.0.3

## 0.9.0

### Patch Changes

- e0876036: add machine translate and open editor commands

## 0.8.0

### Minor Changes

- 55cf3902: added error monitoring to fix bugs faster

## 0.7.0

### Minor Changes

- 8d1bcc2c: added error monitoring to fix bugs faster

## 0.6.1

### Patch Changes

- 59696d8e: improved error message

## 0.6.0

### Minor Changes

- 270088f7: initial release of @lix-js/fs

## 0.5.5

### Patch Changes

- fe00ebf2: Showing a loading spinner for config generation.

## 0.5.4

### Patch Changes

- ed2f8332: refactored config generation
