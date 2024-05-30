# @inlang/paraglide-next

## 0.3.1

### Patch Changes

- e621901: Add a better error message when trying to use messages/languageTag inside top-level variables.
- 60d3d5e: fix langauge switches when escaped characters are used in the URL

## 0.3.0

### Minor Changes

- 68023fc: Add NextJS 15 to supported Next versions

### Patch Changes

- 4e45ab2: Improved HTTP Header SEO

  `Link` headers are now only generated if the hrefs are unique for each language.
  `Vary` headers are now generated if the hrefs aren't sufficient to determine the language.

  - @inlang/paraglide-js@1.9.1

## 0.2.4

### Patch Changes

- 170fa74: Prompt about adding Sherlock and Ninja during `paraglide-next init`
- Updated dependencies [b8573fa]
  - @inlang/paraglide-js@1.9.1

## 0.2.3

### Patch Changes

- Updated dependencies [eb941fe]
- Updated dependencies [9566348]
  - @inlang/paraglide-js@1.9.0

## 0.2.2

### Patch Changes

- 95a34bd: Fix href types on `useRouter`

## 0.2.1

### Patch Changes

- 1ddcd3a: Use a better globbing library to avoid opening too many files at once
- 17c3e8a: Make the generated `middleware.ts` file more legible
  - @inlang/paraglide-js@1.8.0

## 0.2.0

### Minor Changes

- e1ce7fa: A major overhaul to the way routing is done. This update introduces the concept of a `RoutingStrategy`, which allows you to implement any arbitrary routing strategy ontop of `paraglide-next`'s primitives.

  Alongside this we add the `Navigation` and `Middleware` APIs, which take advantage of the new RoutingStrategy interface.

  While this is a major change to how the library is used, the old `createI18n` API is still available & works the same. Thus this is not marked as a major change.

  The legacy `createI18n` API will be removed in the next major release.

## 0.1.8

### Patch Changes

- Updated dependencies [21ab0a0]
- Updated dependencies [21ab0a0]
  - @inlang/paraglide-js@1.8.0

## 0.1.7

### Patch Changes

- 419d8b6: Fix issue where the localised routing didn't always use the most specific pathname as outlined in https://kit.svelte.dev/docs/advanced-routing#sorting
- 41e27b7: The `Link` component now uses `React.forwardRef`. This was a community contribution by [Nurbek](https://github.com/NurbekGithub).
- 432d158: Fixes a warning about `useRouter` not being available on the server. This would never have caused a crash but the log was annoying.
- Updated dependencies [32cbe48]
  - @inlang/paraglide-js@1.7.3

## 0.1.6

### Patch Changes

- 3d87380: The `init` command now always produces posix paths for the outdir and project path, even on windows
- 1baa229: Fix server actions not returning during dev

## 0.1.5

### Patch Changes

- 8902fb5: Calling the paraglide compiler on Windows should no longer error
- Updated dependencies [6105a50]
  - @inlang/paraglide-js@1.7.2

## 0.1.4

### Patch Changes

- ec7c58e: The `paraglide-next init` command now supports JS setups
- ec7c58e: The `paraglide-next init` command now supports Pages Router Setups
  - @inlang/paraglide-js@1.7.1

## 0.1.3

### Patch Changes

- Updated dependencies [4d24188]
  - @inlang/paraglide-js@1.7.1

## 0.1.2

### Patch Changes

- 86c9ad9: Add `initializeLanguage` function for setting the language in Server Actions

## 0.1.1

### Patch Changes

- 13dbef3: The `init` cli now offers to migrate navigation imports
  - @inlang/paraglide-js@1.7.0

## 3.3.0

### Minor Changes

- 6c08db1: Add a `silent` option to the paragldie config field in `next.config.js` to silence the paraglide compiler logs.

### Patch Changes

- e5ce0bd: fix: `<Link>` components that specify a `locale` now work in server-components

## 3.2.0

### Minor Changes

- 0774c1a: Added `paraglide-next init` command for quick project setup

### Patch Changes

- Updated dependencies [0774c1a]
  - @inlang/paraglide-js@1.7.0

## 3.1.1

### Patch Changes

- cee4692: Use index accesses instead of `.at` function for better compatability with legacy browsers
- Updated dependencies [cee4692]
- Updated dependencies [4b631aa]
- Updated dependencies [3c7a87c]
- Updated dependencies [ab1fe48]
  - @inlang/paraglide-js@1.6.2

## 3.1.0

### Minor Changes

- a7e1266: Optional and Rest parameters are now supported on `pathnames`. Use `[...rest]` to create a wildcard segment that matches zero or more segments. Use `[[optionalParam]]` to create an optional segment that matches zero or one segments.

### Patch Changes

- 55b78f8: The compiler no longer double-logs when starting the dev-server
- Updated dependencies [fa6aa31]
- Updated dependencies [dee5aa6]
  - @inlang/paraglide-js@1.6.1

## 3.0.1

### Patch Changes

- Updated dependencies [462325b]
  - @inlang/paraglide-js@1.6.0

## 3.0.0

### Patch Changes

- Updated dependencies [2428451]
  - @inlang/paraglide-js@1.5.0

## 2.0.0

### Patch Changes

- Updated dependencies [d47b2aa]
- Updated dependencies [192fdec]
- Updated dependencies [0b7c82e]
  - @inlang/paraglide-js@1.4.0

## 1.1.0

### Minor Changes

- 124435c: Use cookie to store language & add language negotiation

### Patch Changes

- 7115a13: preserve search params when switching languages
- 0dc1be3: correctly set the `Link` header

## 1.0.0

### Patch Changes

- Updated dependencies [4970afc]
- Updated dependencies [4837297]
  - @inlang/paraglide-js@1.3.0

## 0.3.0

### Minor Changes

- 60b54a577: feat: expose `localizePath` function from `createI18n`

### Patch Changes

- edb1a9dd1: fix: Use fully qualified hrefs in `Link` headers
- Updated dependencies [b0f1e908b]
  - @inlang/paraglide-js@1.2.8

## 0.2.1

### Patch Changes

- 1f54e6dbb: fix `pathnames` type
- f711e65b6: Make sure path translations can hande non-latin characters

## 0.2.0

### Minor Changes

- 92e371833: feat: Support translated Pathnames

### Patch Changes

- dd7ec830e: fix: `middleware` no longer sets `Link` header on excluded pages
- 63afca4fc: Simplify API of the `<ParaglideJS>` component used in the pages router.
  You no longer need to pass the `runtime` and `router.locale` as props to the `<ParaglideJS>` component. Instead, you can just use the component without any props. It will automatically use the runtime and language tag from the context.

  This change was enabled by the last-minute plugin changes that made it valuale to use in the pages router.
