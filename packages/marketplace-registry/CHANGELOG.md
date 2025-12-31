# @inlang/marketplace-registry

## 2.0.1

### Patch Changes

- Updated dependencies [16cf0e1]
  - @inlang/tsconfig@1.1.0
  - @inlang/marketplace-manifest@1.4.2

## 2.0.0

### Major Changes

- d837c51: breaking: only allow https links and resolve relative links from the marketplace manifest

  ```diff
  -  "readme": "./<repo>/x.md",
  // paths are now resolved from the marketplace manifest
  +  "readme": "./x.md",
  ```

## 1.5.10

### Patch Changes

- 1ef9a0e: add item to registry

## 1.5.9

### Patch Changes

- @inlang/marketplace-manifest@1.4.2

## 1.5.8

### Patch Changes

- @inlang/marketplace-manifest@1.4.1

## 1.5.7

### Patch Changes

- Updated dependencies [52c1646]
  - @inlang/marketplace-manifest@1.4.0

## 1.5.6

### Patch Changes

- @inlang/marketplace-manifest@1.3.5

## 1.5.5

### Patch Changes

- @inlang/marketplace-manifest@1.3.4

## 1.5.4

### Patch Changes

- @inlang/marketplace-manifest@1.3.3

## 1.5.3

### Patch Changes

- @inlang/marketplace-manifest@1.3.2

## 1.5.2

### Patch Changes

- @inlang/marketplace-manifest@1.3.1

## 1.5.1

### Patch Changes

- Updated dependencies [e20364a46]
  - @inlang/env-variables@0.2.0

## 1.5.0

### Minor Changes

- 9a208b466: enhanced capabilities of product pages

## 1.4.0

### Minor Changes

- 81633f1cb: implement advanced structure and uniqueID checking

## 1.3.0

### Minor Changes

- 6fe144640: fix #1478 – loadProject with absolute windows paths

## 1.2.0

### Minor Changes

- 973858c6: chore(fix): remove unpublished dependency which lead to installation failing

### Patch Changes

- Updated dependencies [973858c6]
  - @inlang/marketplace-manifest@1.2.0

## 1.1.0

### Minor Changes

- 24632069: fix: registry paths to monorepo

### Patch Changes

- Updated dependencies [713385d3]
  - @inlang/marketplace-manifest@1.1.0
