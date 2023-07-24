# @inlang/sdk-js

## 0.10.0

### Minor Changes

- 3b811085: support `@inlang/sdk-js` imports in `+*.js` files

## 0.9.2

### Patch Changes

- c9d41796: correctly set `html` `lang` attribute when changing language

## 0.9.1

### Patch Changes

- d01492bd: [fix] exclude SvelteKit internal '/[fallback]' route

## 0.9.0

### Minor Changes

- d0e93f48: [feature] allow to exclude certain routes from the i18n setup

### Patch Changes

- 77165c09: [fix] correctly set fallback value of placeholder

## 0.8.1

### Patch Changes

- 50fa75e2: [fix] correctly switch language in SPA mode

## 0.8.0

### Minor Changes

- e36e6767: [BREAKING] complete rewrite of the vite plugin to make it more robust

## 0.7.1

### Patch Changes

- 11acba7b: [feature] add support for svelte@4

## 0.7.0

## 0.6.6

### Patch Changes

- 584e436b: [chore] update plugin-json link

## 0.6.5

## 0.6.4

### Patch Changes

- 785c3f4e: [feature] change language if browser back button gets pressed
- 8112e300: [feature] add support for `path.base`

## 0.6.3

### Patch Changes

- b2fc11d5: [fix] don't remove other attributes when removing the `lang` attribute from the `html` tag

## 0.6.2

### Patch Changes

- Updated dependencies [04f5ac93]
  - @inlang/core@0.9.0

## 0.6.1

### Patch Changes

- 758797dd: [fix] fix import of svelte config on windows

## 0.6.0

### Minor Changes

- d56185f5: [feature] don't initialize runtime multiple times if `sequence` helper function get's used

### Patch Changes

- dcfea692: [fix] better detect and wrap `handle` and `load` functions
- d56185f5: [fix] improve detection of `SvelteKit` version
- d56185f5: [feature] support style preprocessors

## 0.5.1

### Patch Changes

- e5f71e02: [fix] add `@inlang/core` as a regular dependency

## 0.5.0

### Minor Changes

- 481f4d1d: [feature] automatically remove HTML `lang` attribute from app template
- 481f4d1d: [feature] read folder structure of project from `svelte.config.js`

### Patch Changes

- 67b0b381: [fix] don't throw if no arguments get passed to the inlang function

## 0.4.5

### Patch Changes

- f80dc9c8: [feature] show link to docs if sdkPlugin is missing

## 0.4.4

### Patch Changes

- 561bd4d3: [fix] make vite plugin work on windows

## 0.4.3

### Patch Changes

- 652de069: [chore] update for ide extension release

## 0.4.2

### Patch Changes

- 39bbda2b: [fix] use SvelteKit's prerender for Resource-Endpoint only if necessary

## 0.4.1

### Patch Changes

- 86b42dae: [feature] bundle Resources into application on build

## 0.4.0

### Minor Changes

- 438b828f: [BREAKING] prerender all resource API calls

### Patch Changes

- 60fe900a: [feature] detect wrong vite plugin order and throw error
- 60fe900a: [fix] fix type of `languages` export

## 0.3.3

### Patch Changes

- c8883359: [feature] automatically sync `@inlang/sdk-js-plugin` version with installed `@inlang/sdk-js` version

## 0.3.2

### Patch Changes

- 8b916fc9: [feature] add support for older Svelte versions
- e815949f: [fix] don't fail to start applications in non-node environment

## 0.3.1

### Patch Changes

- 8a628151: [feature] update plugin version for generated `inlang.config.js`

## 0.3.0

### Minor Changes

- 636e6045: [BREAKING]: move `@inlang/sdk-js/plugin` into it's own package `@inlang/sdk-js-plugin`

### Patch Changes

- 95ffd205: [fix] don't wrap <svelte:\*> elements that need to be at the root

## 0.2.1

### Patch Changes

- 345c33bb: [fix] deployments of various SvelteKit adapters
- 345c33bb: [fix] don't use top level awaits

## 0.2.0

### Minor Changes

- 8de953cf: [feature] include `jsonPlugin` when generating the config file

## 0.1.2

### Patch Changes

- 3c6c50b7: [feature] don't move files automatically into `[lang]` folder; throw an Error instead

## 0.1.1

### Patch Changes

- c168b51f: [fix] bundle `inlang-plugin-json`

## 0.1.0

### Minor Changes

- 9683c327: [fix] make static output more reliable

## 0.0.12

### Patch Changes

- 469e3d58: [fix] fix generated `inlang.config.js`

## 0.0.11

### Patch Changes

- 87a98918: [fix] generate valid code for `url` detection option

## 0.0.10

### Patch Changes

- 9a5f9d21: [feature] reload resources without restarting the server

## 0.0.9

### Patch Changes

- 7be35534: [feature] execute `markup` after `script` when transforming svelte files

## 0.0.8

### Patch Changes

- 735210ce: [fix] add `@inlang/core` to peer dependencies

## 0.0.7

### Patch Changes

- 12a9dae5: [feature] implement some more AST transformations
- 8b409e18: [BREAKING] rename `accept-language-header` to `acceptLanguageHeader`

## 0.0.6

### Patch Changes

- c1a9c39f: [feature] use ide-extension-plugin

## 0.0.5

### Patch Changes

- f1cff4f5: [feature] automatically setup json plugin if no resource plugin is present

## 0.0.4

### Patch Changes

- dda53294: [fix] bundle `sdkPlugin` file

## 0.0.3

### Patch Changes

- f0cc15bb: [feature] expose `sdkPlugin` for easier setup

## 0.0.2

### Patch Changes

- b9989e02: [fix] correctly resolve `$app` module

## 0.0.1

### Patch Changes

- 1cfe1758: [chore] test releasing `@inlang/sdk-js` to npm
