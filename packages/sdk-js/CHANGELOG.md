# @inlang/sdk-js

## 0.4.5

### Patch Changes

- f80dc9c8: show link to docs if sdkPlugin is missing

## 0.4.4

### Patch Changes

- 561bd4d3: make vite plugin work on windows

## 0.4.3

### Patch Changes

- 652de069: update for ide extension release

## 0.4.2

### Patch Changes

- 39bbda2b: use SvelteKit's prerender for Resource-Endpoint only if necessary

## 0.4.1

### Patch Changes

- 86b42dae: bundle Resources into application on build

## 0.4.0

### Minor Changes

- 438b828f: BREAKING: prerender all resource API calls

### Patch Changes

- 60fe900a: detect wrong vite plugin order and throw error
- 60fe900a: fix type of `languages` export

## 0.3.3

### Patch Changes

- c8883359: automatically sync `@inlang/sdk-js-plugin` version with installed `@inlang/sdk-js` version

## 0.3.2

### Patch Changes

- 8b916fc9: add support for older Svelte versions
- e815949f: fix: don't fail to start applications in non-node environment

## 0.3.1

### Patch Changes

- 8a628151: update plugin version for generated `inlang.config.js`

## 0.3.0

### Minor Changes

- 636e6045: [BREAKING]: move `@inlang/sdk-js/plugin` into it's own package `@inlang/sdk-js-plugin`

### Patch Changes

- 95ffd205: fix: don't wrap <svelte:\*> elements that need to be at the root

## 0.2.1

### Patch Changes

- 345c33bb: fix: deployments of various SvelteKit adapters
- 345c33bb: fix: don't use top level awaits

## 0.2.0

### Minor Changes

- 8de953cf: include `jsonPlugin` when generating the config file

## 0.1.2

### Patch Changes

- 3c6c50b7: don't move files automatically into `[lang]` folder; throw an Error instead

## 0.1.1

### Patch Changes

- c168b51f: bundle `inlang-plugin-json`

## 0.1.0

### Minor Changes

- 9683c327: fix some bugs related to static output

## 0.0.12

### Patch Changes

- 469e3d58: fix generated inlang.config.js

## 0.0.11

### Patch Changes

- 87a98918: generate valid code for `url` detection option

## 0.0.10

### Patch Changes

- 9a5f9d21: reload resources without restarting the server

## 0.0.9

### Patch Changes

- 7be35534: execute `markup` after `script` when transforming svelte files

## 0.0.8

### Patch Changes

- 735210ce: add `@inlang/core` to peer dependencies

## 0.0.7

### Patch Changes

- 12a9dae5: implement some more AST transformations
- 8b409e18: rename `accept-language-header` to `acceptLanguageHeader`

## 0.0.6

### Patch Changes

- c1a9c39f: use ide-extension-plugin

## 0.0.5

### Patch Changes

- f1cff4f5: automatically setup json plugin if no resource plugin is present

## 0.0.4

### Patch Changes

- dda53294: bundle `sdkPlugin` file

## 0.0.3

### Patch Changes

- f0cc15bb: expose `sdkPlugin` for easier setup

## 0.0.2

### Patch Changes

- b9989e02: correctly resolve `$app` module

## 0.0.1

### Patch Changes

- 1cfe1758: test releasing `@inlang/sdk-js` to npm
