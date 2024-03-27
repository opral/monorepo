# @inlang/paraglide-js-adapter-sveltekit

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
