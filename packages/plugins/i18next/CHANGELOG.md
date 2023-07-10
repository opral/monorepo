# @inlang/plugin-i18next

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

- 6326e01e: fix: placeholder matching https://github.com/inlang/inlang/issues/955

## 2.2.1

### Patch Changes

- 138df7cc: fix: don't match functions that ends with a t but are not a t function like somet("key").

## 2.2.0

### Minor Changes

- 0093c4b8: Substantial internal refactorings to increase the quality of the plugin.

## 2.1.0

### Minor Changes

- bfa65665: The message reference matchers have been completely overhauled.
