# @inlang/plugin-i18next

## 4.13.16

### Patch Changes

- f3b0489: fix typo

## 4.13.15

### Patch Changes

- 4837297: File locking for concurrent message updates through the load/store plugin api
  Auto-generated human-IDs and aliases - only with experimental: { aliases: true }
- Updated dependencies [4837297]
  - @inlang/sdk@0.27.0

## 4.13.14

### Patch Changes

- @inlang/sdk@0.26.5

## 4.13.13

### Patch Changes

- 960f8fb70: rename the vscode extension to "Sherlock"
  - @inlang/sdk@0.26.4

## 4.13.12

### Patch Changes

- d9cf66170: update docs for apps and plugins
- b7344152a: updated the docs

## 4.13.11

### Patch Changes

- @inlang/sdk@0.26.3

## 4.13.10

### Patch Changes

- @inlang/sdk@0.26.2

## 4.13.9

### Patch Changes

- @inlang/sdk@0.26.1

## 4.13.8

### Patch Changes

- Updated dependencies [676c0f905]
  - @inlang/sdk@0.26.0

## 4.13.7

### Patch Changes

- Updated dependencies [87bed968b]
- Updated dependencies [23ca73060]
  - @inlang/sdk@0.25.0

## 4.13.6

### Patch Changes

- @inlang/sdk@0.24.1

## 4.13.5

### Patch Changes

- Updated dependencies [c38faebce]
  - @inlang/sdk@0.24.0

## 4.13.4

### Patch Changes

- Updated dependencies [b920761e6]
  - @inlang/sdk@0.23.0

## 4.13.3

### Patch Changes

- Updated dependencies [cd29edb11]
  - @inlang/sdk@0.22.0

## 4.13.2

### Patch Changes

- Updated dependencies [e20364a46]
  - @inlang/sdk@0.21.0

## 4.13.1

### Patch Changes

- Updated dependencies [bc5803235]
  - @inlang/sdk@0.20.0

## 4.13.0

### Minor Changes

- b66068127: Matcher Improvments. 'useTranslation' hook can contain a namespace and keyPrefix for the whole page. The improved matcher can recognize it and adds it to the messageId if needed.

## 4.12.1

### Patch Changes

- Updated dependencies [8b05794d5]
  - @inlang/sdk@0.19.0

## 4.12.0

### Minor Changes

- cafff8748: adjust tests and fix erros message
- 39beea7dd: change return type of extractMessageOptions

### Patch Changes

- Updated dependencies [cafff8748]
  - @inlang/sdk@0.17.0

## 4.11.0

### Minor Changes

- a39638334: add support for new document selector typescriptreact

## 4.10.0

### Minor Changes

- 2150b4873: fix: path patterns can start as as an absolute path like `/resources/{languageTag}.json`

## 4.9.0

### Minor Changes

- 2f924df32: added Modulesettings validation via the Typebox JSON Schema Validation. This ensure that users can exclusively use module settings when there are given by the moduel

### Patch Changes

- Updated dependencies [2f924df32]
  - @inlang/sdk@0.16.0

## 4.8.0

### Minor Changes

- 0055f20b1: update README

## 4.7.0

### Minor Changes

- 7bcb365ed: update `config init` deprecation

### Patch Changes

- 4668f637a: Added test for empty object in nested translation file.
- Updated dependencies [2976a4b15]
  - @inlang/sdk@0.10.0

## 4.6.0

### Minor Changes

- 6e4ea967d: refactor: now uses the plugin api v2.0

### Patch Changes

- Updated dependencies [0f9dc72b3]
  - @inlang/sdk@0.9.0

## 4.5.0

### Minor Changes

- b7dfc781e: change message format match from object to array

### Patch Changes

- Updated dependencies [b7dfc781e]
  - @inlang/sdk@0.8.0

## 4.4.0

### Minor Changes

- 7e112af9: isolated detect formating function for plugins

### Patch Changes

- Updated dependencies [7e112af9]
  - @inlang/detect-formatting@0.2.0

## 4.3.0

### Minor Changes

- 0d0502f4: deprecate detectedLanguageTags

### Patch Changes

- Updated dependencies [0d0502f4]
  - @inlang/plugin@1.3.0

## 4.2.0

### Minor Changes

- 25fe8502: refactor: remove plugin.meta and messageLintRule.meta nesting

### Patch Changes

- Updated dependencies [25fe8502]
  - @inlang/plugin@1.2.0

## 4.1.0

### Minor Changes

- 973858c6: chore(fix): remove unpublished dependency which lead to installation failing

### Patch Changes

- Updated dependencies [973858c6]
  - @inlang/plugin@1.1.0

## 3.0.2

### Patch Changes

- 1672ec38: Throw error when using wildcard in version 3

## 3.0.1

### Patch Changes

- 6c7e2077: Single namespace path defined without object syntax

## 3.0.0

### Major Changes

- 66fd1a55: The pathPattern has a different type now. Old: `pathPattern: string` new: `pathPattern: string | {[key: string]: string}`

## 2.2.4

### Patch Changes

- 12fe1943: support language folders and addLanguage button

## 2.2.3

### Patch Changes

- ceae4a83: fix: prevent split(regex) from generating empty text elements

## 2.2.2

### Patch Changes

- 6326e01e: fix: placeholder matching https://github.com/opral/monorepo/issues/955

## 2.2.1

### Patch Changes

- 138df7cc: fix: don't match functions that ends with a t but are not a t function like somet("key").

## 2.2.0

### Minor Changes

- 0093c4b8: Substantial internal refactorings to increase the quality of the plugin.

## 2.1.0

### Minor Changes

- bfa65665: The message reference matchers have been completely overhauled.
