# @inlang/tsconfig

## 1.1.0

### Minor Changes

- 16cf0e1: default target ES2022 to avoid unnecessary old JS code like 'use strict' at the top of the file and easier debugging of dist files, plus top level await support

  ```diff
  {
    "compilerOptions": {
      ...
  +   "target": "ES2022"
    }
  }
  ```
