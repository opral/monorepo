# @inlang/paraglide-sveltekit

## 0.9.3

### Patch Changes

- def2d4e: fix: Also update the `paraglide:lang` cookie on the client to allow for better language negotiation
  - @inlang/paraglide-js@1.9.1
  - @inlang/paraglide-vite@1.2.65

## 0.9.2

### Patch Changes

- @inlang/paraglide-js@1.9.1
- @inlang/paraglide-vite@1.2.64

## 0.9.1

### Patch Changes

- f0192d2: Invalid `href`s in your app no longer cause errors to be thrown in `<ParaglideJS>`. During development a warning is logged.
- 255fd41: The link preprocessor no longer crashes when encountering a file with a syntax error. Insetad it will log a warning & noop. Reporting the error is delegated to the main svelte parser.

## 0.9.0

### Minor Changes

- 76e7f20: Add the `ParaglideLocals` interface for properly typing paraglide's locals. It should be added in `app.d.ts` under `Locals.paraglide`. The `init` CLI will do this automatically
- 8db2224: Previously, if the default language was available on the root `/`, then it would still be available under `/[lang]`. This was never intended & no longer the case.

  If you still want this behavior set the `prefixDefaultLanguage` to `"always"` in your `i18n` config.

### Patch Changes

- 6319391: Fix: Excluded routes now use the default language instead of incorrecly attempting to detect the language form the URL

## 0.8.7

### Patch Changes

- @inlang/paraglide-js@1.9.1
- @inlang/paraglide-vite@1.2.63

## 0.8.6

### Patch Changes

- Updated dependencies [3b2e0a6]
  - @lix-js/client@2.2.0
  - @inlang/paraglide-js@1.9.1
  - @inlang/paraglide-vite@1.2.62

## 0.8.5

### Patch Changes

- Updated dependencies [548bc9e]
  - @lix-js/client@2.1.0
  - @inlang/paraglide-js@1.9.1
  - @inlang/paraglide-vite@1.2.61

## 0.8.4

### Patch Changes

- @inlang/paraglide-js@1.9.1
- @lix-js/client@2.0.1
- @inlang/paraglide-vite@1.2.60

## 0.8.3

### Patch Changes

- Updated dependencies [00ad046]
  - @lix-js/client@2.0.0
  - @inlang/paraglide-js@1.9.1
  - @inlang/paraglide-vite@1.2.59

## 0.8.2

### Patch Changes

- @inlang/paraglide-vite@1.2.58
- @inlang/paraglide-js@1.9.1

## 0.8.1

### Patch Changes

- fbac297: Fix `bin` field in `package.json`

## 0.8.0

### Minor Changes

- 0bf4d74: Added an `@inlang/paraglide-sveltekit init` command to automatically add `paraglide-sveltekit` to your project

### Patch Changes

- 75cf8fd: Prompt about adding the VsCode extension and Github Action during `paraglide-sveltekit init`
- a27b7a4: This reintroduces reactivity to lint reports - see https://github.com/opral/monorepo/pull/2792 for more details
- Updated dependencies [b8573fa]
  - @inlang/paraglide-js@1.9.1
  - @inlang/paraglide-vite@1.2.57

## 0.7.0

### Minor Changes

- 3e9b863: Use Svelte 5 compiler in the preprocessor for rewriting links

### Patch Changes

- Updated dependencies [eb941fe]
- Updated dependencies [9566348]
  - @inlang/paraglide-js@1.9.0
  - @inlang/paraglide-vite@1.2.56

## 0.6.23

### Patch Changes

- @inlang/paraglide-js@1.8.0
- @inlang/paraglide-vite@1.2.55

## 0.6.22

### Patch Changes

- @inlang/paraglide-js@1.8.0
- @inlang/paraglide-vite@1.2.54

## 0.6.21

### Patch Changes

- @inlang/paraglide-js@1.8.0
- @inlang/paraglide-vite@1.2.53

## 0.6.20

### Patch Changes

- @inlang/paraglide-js@1.8.0
- @inlang/paraglide-vite@1.2.52

## 0.6.19

### Patch Changes

- 1e5320e: Protect against the preprocessor being applied twice

## 0.6.18

### Patch Changes

- @inlang/paraglide-js@1.8.0
- @inlang/paraglide-vite@1.2.51

## 0.6.17

### Patch Changes

- @inlang/paraglide-vite@1.2.50

## 0.6.16

### Patch Changes

- @inlang/paraglide-js@1.8.0
- @inlang/paraglide-vite@1.2.49

## 0.6.15

### Patch Changes

- Updated dependencies [21ab0a0]
- Updated dependencies [21ab0a0]
  - @inlang/paraglide-js@1.8.0
  - @inlang/paraglide-vite@1.2.48

## 0.6.14

### Patch Changes

- 419d8b6: Fix issue where the localised routing didn't always use the most specific pathname as outlined in https://kit.svelte.dev/docs/advanced-routing#sorting
- Updated dependencies [32cbe48]
  - @inlang/paraglide-js@1.7.3
  - @inlang/paraglide-vite@1.2.47

## 0.6.13

### Patch Changes

- @inlang/paraglide-js@1.7.2
- @inlang/paraglide-vite@1.2.46

## 0.6.12

### Patch Changes

- @inlang/paraglide-js@1.7.2
- @inlang/paraglide-vite@1.2.45

## 0.6.11

### Patch Changes

- Updated dependencies [6105a50]
  - @inlang/paraglide-js@1.7.2
  - @inlang/paraglide-vite@1.2.44

## 0.6.10

### Patch Changes

- @inlang/paraglide-js@1.7.1
- @inlang/paraglide-vite@1.2.43

## 0.6.9

### Patch Changes

- Updated dependencies [4d24188]
  - @inlang/paraglide-js@1.7.1
  - @inlang/paraglide-vite@1.2.42

## 0.6.8

### Patch Changes

- @inlang/paraglide-js@1.7.0
- @inlang/paraglide-vite@1.2.41

## 0.6.7

### Patch Changes

- Updated dependencies [0774c1a]
  - @inlang/paraglide-js@1.7.0
  - @inlang/paraglide-js-adapter-vite@1.2.40

## 0.6.6

### Patch Changes

- cee4692: Use index accesses instead of `.at` function for better compatability with legacy browsers
- 4b631aa: Update invalid type-declarations
- Updated dependencies [cee4692]
- Updated dependencies [4b631aa]
- Updated dependencies [3c7a87c]
- Updated dependencies [ab1fe48]
  - @inlang/paraglide-js@1.6.2
  - @inlang/paraglide-js-adapter-vite@1.2.39

## 0.6.5

### Patch Changes

- Updated dependencies [fa6aa31]
- Updated dependencies [dee5aa6]
  - @inlang/paraglide-js@1.6.1
  - @inlang/paraglide-js-adapter-vite@1.2.38

## 0.6.4

### Patch Changes

- Updated dependencies [462325b]
  - @inlang/paraglide-js@1.6.0
  - @inlang/paraglide-js-adapter-vite@1.2.37

## 0.6.3

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.36

## 0.6.2

### Patch Changes

- cdbb415: Fix crash when switching languages on a route tthat ends with a `[...rest]` parameter when there is a trailing slash

## 0.6.1

### Patch Changes

- a4d4e10: Fix crashe when navigating to `/{lang}/` with `trailingSlash="always"`

## 0.6.0

### Minor Changes

- 1642873: Param Matchers are now supported. They can be passed to `createI18n` alongside `pathnames` with the `matchers` option.
- ce0b961: Wildcard and optional parameters are now supported for translated pathnames

### Patch Changes

- 690656e: Trailing Slashes are now preserverd more reliably if present
  - @inlang/paraglide-js-adapter-vite@1.2.35

## 0.5.22

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.34

## 0.5.21

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.33

## 0.5.20

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.32

## 0.5.19

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.31

## 0.5.18

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.30

## 0.5.17

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.29

## 0.5.16

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.28

## 0.5.15

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.27

## 0.5.14

### Patch Changes

- d052495: fix: Log filename when warning about using `<a>` tags in the same file as `<ParaglideJS>`
  - @inlang/paraglide-js-adapter-vite@1.2.26

## 0.5.13

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.25

## 0.5.12

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.24

## 0.5.11

### Patch Changes

- ef4e0ab: fix: preserve trailing slash when translating hrefs
  - @inlang/paraglide-js-adapter-vite@1.2.23

## 0.5.10

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.22

## 0.5.9

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.21

## 0.5.8

### Patch Changes

- 62e4a5c: Add warning message if an `<a>` tag is used in the same component as `<ParaglideJS>` since they can't be translated
  - @inlang/paraglide-js-adapter-vite@1.2.20

## 0.5.7

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.19

## 0.5.6

### Patch Changes

- bce060367: fix: make `svelte` a peer dependency
  - @inlang/paraglide-js-adapter-vite@1.2.18

## 0.5.5

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.17

## 0.5.4

### Patch Changes

- 5d25b889a: log warning if the `lang` attribute isn't updated in `src/app.html`

## 0.5.3

### Patch Changes

- 726690acb: fix: Disable some lint errors when internally rewriting links with the spread syntax to avoid annoying logs (https://discord.com/channels/897438559458430986/1070750156644962434/1212320293578874880)

## 0.5.2

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.16

## 0.5.1

### Patch Changes

- a7b593e9a: fix: double-execution of `load` on initial load

## 0.5.0

### Minor Changes

- e4e879c77: feat: Automatically call `invalidate("paraglide:lang")` when the language changes. You can now call `depends("paraglide:lang")` in your server-load functions to have them re-run on language changes.

### Patch Changes

- 7f566ae73: fix reactivity issue in Svelte 5 [#2270](https://github.com/opral/monorepo/issues/2270)
- 21a3890cc: fix: Corrected comments saying the default placeholder for the text-direction is `%paraglide.dir%` when it's `%paraglide.textDirection%`
- 37a247c0e: fix: `i18n.resolveRoute` now ignores paths that don't start with the base
- 37a247c0e: fix: Alternate links will not include the origin during prerendering, unless one is explicitly specified in `kit.prerender.origin`

## 0.4.1

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.15

## 0.4.0

### Minor Changes

- 45f5d8256: Message function can now be used as pathname translations

## 0.3.7

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.14

## 0.3.6

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.13

## 0.3.5

### Patch Changes

- eaef718ee: Treeshake away `i18n.handle` on the client to reduce bundle size

## 0.3.4

### Patch Changes

- 3aa1b6ca3: fix [#2717](https://github.com/opral/monorepo/issues/2171) - Link rewrite reactivity issue when navigating between pages
  - @inlang/paraglide-js-adapter-vite@1.2.12

## 0.3.3

### Patch Changes

- 0efbc35c5: The `href` attribute on `<link rel="alternate"` is now always a fully qualified URL, including the protocol, as the spec demands.

  If you are prerendering, you should set `kit.prerendering.origin` in `svelte.config.js` to make sure the correct URL gets prerendered.

## 0.3.2

### Patch Changes

- 6e7435185: fix: Don't stringify value-only attributes
- de595ebf1: fix: Properly encode & decode non-latin pathnames
- 01e918153: Fix: `noAlternateLinks` default value is now `false`, as it should be
  - @inlang/paraglide-js-adapter-vite@1.2.11

## 0.3.1

### Patch Changes

- b10958b71: fix `seo` type not being optional on `createI18n`

## 0.3.0

### Minor Changes

- 577c66b45: breaking: move `noAlternateLinks` option from `<ParaglideJS>` component to `seo` option on `createI18n`
- 021ae3e80: feat: Add `textDirection` option to `createI18n` for text-direction. If omitted, an automatically detected text-direction will be used.

### Patch Changes

- da9b91ff4: fix: Rewrite {...spreadAttributes}
- cfa1b0175: fix: Crawl `{:else}`, `{:then}` and `{:catch}` blocks for links to rewrite
- cfa1b0175: fix: Rewrite attributes on `<svelte:element>`

## 0.2.5

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.10

## 0.2.4

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.9

## 0.2.3

### Patch Changes

- 0305ce54e: fix broken globbing for `exclude` option causing the wrong routes to be excluded

## 0.2.2

### Patch Changes

- 6ac6e3be9: fix: make `exclude` option optional

## 0.2.1

### Patch Changes

- 117c684d0: fix base resolution issue in `route`

## 0.2.0

### Minor Changes

- 87135ae38: Rename `route` to `resolveRoute` and `getCanonicalPath` to `route` - As to be more inline with SvelteKit's naming convention

### Patch Changes

- 87135ae38: fix base-path normalisation issue

## 0.1.2

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.8

## 0.1.1

hotfix: Build unbuilt TypeScript so that the package can be used in non-TypeScript projects.

## 0.1.0

First public prerelease of the SvelteKit adapter for Paraglide.
