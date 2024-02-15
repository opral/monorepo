# @inlang/project-settings

## 2.2.3

### Patch Changes

- Updated dependencies [32746a9ff]
  - @inlang/language-tag@1.5.1

## 2.2.2

### Patch Changes

- Updated dependencies [244442698]
  - @inlang/language-tag@1.5.0

## 2.2.1

### Patch Changes

- Updated dependencies [74ac11c47]
  - @inlang/language-tag@1.4.0

## 2.2.0

### Minor Changes

- d57b1a2ce: add: expose external project settings to ease type definitions

## 2.1.0

### Minor Changes

- 25fe8502: refactor: remove plugin.meta and messageLintRule.meta nesting

## 2.0.0

The project settings schema is now a flat key-value pair data structure to simplify application logic and the concept of config is consolidated to settings alone.

### Breaking Changes

- `$schema` must point to `"https://inlang.com/schema/project-settings"`
- `settings.*` is now part of the root object
- `project.messageLintRuleLevels` is not part of the root object

## 1.2.0

### Minor Changes

- 973858c6: chore(fix): remove unpublished dependency which lead to installation failing

### Patch Changes

- Updated dependencies [973858c6]
  - @inlang/message-lint-rule@1.1.0
  - @inlang/language-tag@1.1.0
  - @inlang/translatable@1.1.0
  - @inlang/message@1.1.0
  - @inlang/json-types@1.1.0

## 1.1.0

### Minor Changes

- 713385d3: add typesafety via JSON schema
