# @inlang/core

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
