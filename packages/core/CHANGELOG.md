# @inlang/core

## 0.8.2

### Patch Changes

- 0504401e: fixed testConfigFile which threw an error even though it's a result that should never throw

## 0.8.1

### Patch Changes

- 0d19f309: further improvements to the better error messages introduced in v0.8

## 0.8.0

### Minor Changes

- 1c1881d5: Improved error messages when loading the inlang.config.js module.

## 0.7.15

### Patch Changes

- f6cf2bbf: Add missing `environment` export for JSDoc

## 0.7.14

### Patch Changes

- 636e6045: test plugins in `testConfigFile`

## 0.7.13

### Patch Changes

- f3d7dc5b: fix publishing zod

## 0.7.12

### Patch Changes

- 7ed49fce: change zod pattern type union

## 0.7.11

### Patch Changes

- 61f21074: Update zod schema

## 0.7.10

### Patch Changes

- f1cff4f5: pass accumulated `config` to plugin config function

## 0.7.9

### Patch Changes

- f0cc15bb: add missing `PluginSetupFunction` export

## 0.7.1

### Patch Changes

- ab2d90cf: fix `pluginBuildConfig`

## 0.7.0

### Minor Changes

- a5572e12: Introduction of the plugin API in @inlang/core.

## 0.6.0

### Minor Changes

- 270088f7: initial release of @inlang-git/fs

### Patch Changes

- Updated dependencies [270088f7]
  - @inlang-git/fs@0.0.2

## 0.5.4

### Patch Changes

- b998e042: change the return type of query.upsert to not be a result. the function is not expected to fail

## 0.5.3

### Patch Changes

- 6bf22450: add the option to copy multiple directories for a `mockEnvironment`
- 61190e25: The `pluginBuildConfig` is now async to dynamically import plugins as required.

  Closes https://github.com/inlang/inlang/issues/486

## 0.5.1

## 0.5.0

### Minor Changes

- a0b85eb: refactor: combined multiple lint query functions in one

  https://github.com/inlang/inlang/pull/453

- e9e9ce5: refactor: simplify lint

  The linting system was simplified. Mostly by exposing less features. We intend to wait for user feedback on edge cases before we expose features that might not align with user needs but need to be maintained by us. As a side effect, the DX is expected to increase due to simpler docs

## 0.4.3

### Patch Changes

- fc30d4b: use polyfill instead of node native package

## 0.4.2

### Patch Changes

- f28da6b: allow to call lint query functions with multiple nodes
- f28da6b: create utility functions to test lint rules
- f28da6b: add possibility to specify required settings

## 0.4.1

### Patch Changes

- e5a88c8: add `/lint` to the package exports map

## 0.4.0

### Minor Changes

- 1d756dd: add lint functionality

### Patch Changes

- a4b9fce: Abstract and describe minimal required file system
