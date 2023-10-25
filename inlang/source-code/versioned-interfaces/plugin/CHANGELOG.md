# @inlang/plugin

## 2.2.0

### Minor Changes

- 2f924df32: added Modulesettings validation via the Typebox JSON Schema Validation. This ensure that users can exclusively use module settings when there are given by the moduel

## 2.1.0

### Minor Changes

- 6f42758bb: force absolute path for settingsFilePath to intercept nodeishFs with absolute paths

### Patch Changes

- Updated dependencies [6f42758bb]
  - @lix-js/fs@0.3.0

## 2.0.0

### Major Changes

- 404d365b2: BREAKING: The settings are now project settings that include the plugin settings.

### Patch Changes

- Updated dependencies [d57b1a2ce]
  - @inlang/project-settings@2.2.0

## 1.3.0

### Minor Changes

- 0d0502f4: deprecate detectedLanguageTags

## 1.2.0

### Minor Changes

- 25fe8502: refactor: remove plugin.meta and messageLintRule.meta nesting

### Patch Changes

- Updated dependencies [25fe8502]
  - @inlang/project-settings@2.1.0

## 1.1.0

### Minor Changes

- 973858c6: chore(fix): remove unpublished dependency which lead to installation failing

### Patch Changes

- Updated dependencies [973858c6]
  - @inlang/language-tag@1.1.0
  - @inlang/translatable@1.1.0
  - @inlang/message@1.1.0
  - @inlang/json-types@1.1.0
  - @lix-js/fs@0.2.0
