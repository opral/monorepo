# @inlang/paraglide-js

**Paraglide JS 2.0 GA release notes are [here](https://github.com/opral/monorepo/blob/main/inlang/packages/paraglide/paraglide-js/v2-release-notes.md)**

## 2.0.0-beta.30

- improve: if no url pattern matches, `localizeUrl()` and `deLocalizeUrl()` will return the input url unchanged instead of throwing an error [#452](https://github.com/opral/inlang-paraglide-js/issues/452#issuecomment-2715761308)

- improve: make AsyncLocalStorage tree-shakable by moving `disableAsyncLocalStorage` into the compiler options [#424](https://github.com/opral/inlang-paraglide-js/issues/424#issuecomment-2711453627)

```diff
-  serverMiddleware(req, resolve, { disableAsyncLocalStorage: true })
+  serverMiddleware(req, resolve)

paraglideVitePlugin({
   // ...
+  disableAsyncLocalStorage: true
})

```

- improve: allow fall through. enables partially localized patterns and thereby eases adoption. 

## 2.0.0-beta.29

- fix [#455 setLocale and getLocale call each other in a loop](https://github.com/opral/inlang-paraglide-js/issues/455)

- fix [#454 Adapt config to the new localized param of beta.28](https://github.com/opral/inlang-paraglide-js/issues/454)

## 2.0.0-beta.28

### BREAKING update to the URLPattern API  

https://github.com/opral/monorepo/pull/3485

The `localizedNamedGroups` and `deLocalizedNamedGroups` API has been replaced with a tuple-based `localized` array to: 

- enable translated pathnames in any combination
- make the API more intuitive

#### Migration Guide:

**Refer to the updated documentation [here](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/strategy#url).**

Before

```json
{
  "pattern": "https://:domain(.*)/:locale(de|fr)?/:path*",
  "deLocalizedNamedGroups": { "locale": null },
  "localizedNamedGroups": {
    "en": { "locale": null },
    "fr": { "locale": "fr" },
    "de": { "locale": "de" }
  }
}
```

After

```json
{
  "pattern": "https://:domain(.*)/:path*",
  "localized": [
    ["fr", "https://:domain(.*)/fr/:path*"],
    ["de", "https://:domain(.*)/de/:path*"]
    ["en", "https://:domain(.*)/:path*"],
  ]
}
```

### other changes

- improve: fallback to `typeof window` in vite [#445](https://github.com/opral/inlang-paraglide-js/issues/445)

- make `setLocale()` set all strategies. Setting all strategies aligns with user expectations and ensures that server APIs can receive the cookie of the client, for example. [#439](https://github.com/opral/inlang-paraglide-js/issues/439)

- new `generateStaticLocalizedUrls()` API [#443](https://github.com/opral/inlang-paraglide-js/issues/433)

```diff
const localizedUrls = generateStaticLocalizedUrls([
  "/example",
  "/page/blog",
  "/123/hello"
])

console.log(localizedUrls.map(url => url.pathnames))
>> /de/example
>> /fr/example
>> ...
```


## 2.0.0-beta.27

- fix wrong matching in API requests [#427](https://github.com/opral/inlang-paraglide-js/issues/427)

Paraglide JS is no longer extracting the locale from API requests for the `url` strategy because that can lead to unwanted re-directs. To get the right locale in API requests, at least add the `baseLocale` strategy to your options. 

```diff
-strategy: ["url"]
+strategy: ["url", "cookie", "baseLocale"]
```

- consolidated `message-modules` output into a single file [#434](https://github.com/opral/inlang-paraglide-js/issues/434) to severaly improve scalability



- `experimentalMiddlewareLocaleSplitting` option https://github.com/opral/inlang-paraglide-js/issues/425#issuecomment-2692351073

- fix [setLocale() triggers re-loads if the same locale is set](https://github.com/opral/inlang-paraglide-js/issues/430) 

- fix [serverMiddleware() throws when cookie contains invalid locale](https://github.com/opral/inlang-paraglide-js/issues/442)

- add `localStorage` strategy [#431](https://github.com/opral/inlang-paraglide-js/issues/431)

- fix url strategy with optional locale always resoles base locale  [#436](https://github.com/opral/inlang-paraglide-js/issues/436)

## 2.0.0-beta.26

- replace `node:crypto` with the Web Crypto API https://github.com/opral/inlang-paraglide-js/issues/424

## 2.0.0-beta.25

- added optional localized groups 
- keeps hashes, etc. in the URL when localizing https://github.com/opral/monorepo/pull/3452
- fixes the multi-variant return 

## 2.0.0-beta.24

- changes the redirect status from `302` to `307` https://github.com/opral/inlang-paraglide-js/issues/416
- adds a `cleanOutdir` option which defaults to true https://github.com/opral/inlang-paraglide-js/issues/420
- adds a `machine-translate` command if desired on init

## 2.0.0-beta.23

Renames and splits the `serverMiddleware()` into a dedicated `server.js` file to avoid bundler issues. 

```diff
- import { serverMiddleware } from "./paraglide/runtime.js";
+ import { paraglideMiddleware } from "./paraglide/server.js";
```

## 2.0.0-beta.22

- fix `serverMiddleware()` only imports async_hooks on the server
- add `serverMiddleware(req, resolve, { disableAsyncLocalStorage: true })` to disable async local storage
- fix `serverMiddleware()` throws in next js when `url` strategy is not used https://github.com/opral/inlang-paraglide-js/issues/411#issuecomment-2683530533

## 2.0.0-beta.21

- compile arbitrary message keys https://github.com/opral/inlang-paraglide-js/issues/201#issuecomment-2680006131
- only polyfills `URLPattern` if needed https://github.com/opral/inlang-paraglide-js/issues/381
- don't include `url` strategy by default https://github.com/opral/inlang-paraglide-js/issues/405
- fixes webpack watch mode https://github.com/opral/inlang-paraglide-js/issues/406

## 2.0.0-beta.20

- automatic re-directs in `serverMiddleware()` https://github.com/opral/inlang-paraglide-js/issues/201#issuecomment-2675823651
- various bug fixes and improvements

## 2.0.0-beta.19

NO MORE ADAPTERS NEEDED.

If you have code from an adapter, remove it and follow the examples in the documentation. https://inlang.com/m/gerre34r/library-inlang-paraglideJs/sveltekit

```diff
-@inlang/paraglide-sveltekit
-@inlang/paraglide-next
-@inlang/paraglide-astro
```

- introduced `serverMiddleware()` https://github.com/opral/inlang-paraglide-js/issues/201#issuecomment-2673375348

- rename `defineGetLocale()` and `defineSetLocale()` to `overwriteGetLocale()` and `overwriteSetLocale()` https://github.com/opral/inlang-paraglide-js/issues/382

- enables `import { m } from "./paraglide/messages.js"` for auto imports https://github.com/opral/inlang-paraglide-js/issues/345

- adds the `strategy` compiler option to the cli https://github.com/opral/inlang-paraglide-js/issues/316

## 2.0.0-beta.18

Added URLPatterns as a replacement for the beta 17 pathnames API. 

The URLPattern API is extremly powerful. You can express base paths, translated pathnames, domain based localization, and even multi-tenancy. 

Read the docs [here](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/strategy#url) and make PRs to improve the documentation.

```diff
await compile({
-  strategy: ["pathname"],
+  strategy: ["url"],
})
```

The `localizePath()` API had to be replaced by a new `localizeHref()` API. Please give feedback on the new API in [#380](https://github.com/opral/inlang-paraglide-js/issues/380)

```diff
- <a href={localizePath("/about")}>About</a>
+ <a href={localizeHref("/about")}>About</a>
```

## 2.0.0-beta.17

Add support for `pathnames` API https://github.com/opral/inlang-paraglide-js/issues/359

You can now create whatever pathname pattern you want. The syntax is provided by https://github.com/pillarjs/path-to-regexp.

```diff
await compile({
  strategy: ["pathname", "cookie", "baseLocale"],
+ pathnames: {
+   "{*path}": {
+     "de": "/de{/*path}",
+     "en": "/en{/*path}",
}
}
})
```

Add support for `pathnameBase` https://github.com/opral/inlang-paraglide-js/issues/362

```diff
await compile({
  strategy: ["pathname", "cookie", "baseLocale"],
+ pathnameBase: "/base"
})

```

## 2.0.0-beta.16

New `strategy` API. See https://github.com/opral/inlang-paraglide-js/issues/346.

You can now define your own stragegy for getting and setting a locale.

```diff
await compile({
+  strategy: ["pathname", "cookie", "baseLocale"]
})
```

## 2.0.0-beta.14

Fixes windows path normalization https://github.com/opral/monorepo/pull/3374

## 2.0.0-beta.13

- flat compiler options

```diff
await compile({
- compilerOptions: {
-  emitPrettierIgnore: false,
- },
+ emitPrettierIgnore: false,
})
```

- removed `experimentalEmitTs`. the overhead of maintaing two syntaxes is too large https://github.com/opral/inlang-paraglide-js/issues/329

```diff
await compile({
- experimentalEmitTs: true,
})
```

## 2.0.0-beta.11

- improve: compiler awaits ongoing compilations before starting a new one
- update dependency that fixes https://github.com/opral/inlang-paraglide-js/issues/320

## 2.0.0-beta.10

- remove `available` prefix from locale APIs alltogether https://github.com/opral/inlang-paraglide-js/issues/201#issuecomment-2596202820

## 2.0.0-beta.9

- Expose compiler on the index

```diff
-import { compile } from "@inlang/paraglide-js/compiler";
+import { compile } from "@inlang/paraglide-js";
```

- expose paraglide compile args

```diff
+ import { type CompileArgs } from "@inlang/paraglide-js";
```

## 2.0.0-beta.8

- rename `runtime.locales` to `runtime.availableLocales` to align with v1 API and avoid ambiguity https://github.com/opral/inlang-paraglide-js/issues/314
- remove legacy `languageTag` APIs https://github.com/opral/inlang-paraglide-js/issues/315

## 2.0.0-beta.7

- fixed windows path problems
- increased performance of the compiler by removing a redundant setTimeout
- increased performance of the compiler by removing prettier
- `experimentalEmitTs` flag

## 2.0.0-beta.3

### Patch Changes

- remove `fast-glob` as dependency in favor of node's built-in `fs.glob` (a new API in node 22)

## 2.0.0

### Major changes

- Upgrade to @inlang/sdk v2
- Support for variants (pluralization, gendering, A/B test, etc.)

### Minor Changes

- 1d62451: remove `dedent` dependency in CLI
- 5d906bd: refactor: remove posthog-node dependency

  Posthog node has been replaced for a fetch call. Removing 3 (posthog + 2 transitive dependencies).

- 855a71c: adds `experimentalEmitTsDeclarations` compiler option https://github.com/opral/inlang-paraglide-js/issues/288

  ```diff
  await compile({
    // ...
    options: {
  +   experimentalEmitTsDeclarations: true
    }
  })
  ```

  Projects can now select if TypeScript declaration file should be emitted. The need for the `allowJs: true` option in TypeScript configs becomes redundant at the cost of slower compilation times (https://github.com/opral/inlang-paraglide-js/issues/238).

- 346c21b: maintenance: remove path prop from tsconfig

  ```diff
  -"paths": {
  -  "~/*": ["./src/*"]
  -}
  ```

  So not worth it "nice to have" "but it's better DX" thing. Breaks path resolving in JS. Vitest needed a vite config to resolve the paths because only TS knew how to resolve thep paths. Etc. Etc. Etc.

- fb06546: adds `emitGitIgnore` and `emitPrettierIgnore` compiler options

  Closes https://github.com/opral/inlang-paraglide-js/issues/189

  ```diff
  await compile({
    // ...
    options: {
  +   emitPrettierIgnore: false
  +   emitGitIgnore: false
    }
  })
  ```

- e2b9e24: feat: expose compiler as library

  closes https://github.com/opral/inlang-paraglide-js/issues/206

  The Paraglide compiler is now exposed as a library. This allows you to use and extend the compiler however you need.

  ```ts
  import { compile } from "@inlang/paraglide-js/compiler";

  await compile({
  	path: "/path/to/project.inlang",
  	outdir: "/path/to/output",
  });
  ```

- 44ac447: maintenance: remove vite in favor of tsc to build paraglide js lib

  Closes https://github.com/opral/inlang-paraglide-js/issues/208

  ```diff
  -  "build": "vite build",
  +  "build": "tsc",
  ```

  Paraglide JS used vite to build the library. This change removes vite in favor of tsc to build the library. This change is made to simplify the build process and to make it easier to maintain the library in the future.

## 1.11.2

### Patch Changes

- 59c8b11: Fix Ninja recommendation and adoption if working directory is not the repo root

## 1.11.1

### Patch Changes

- 14d80b3: Removed the "Which tech-stack are you using?" prompt from the `init` command as it was not providing any real value. All it did was link you to the appropriate documentation.

  From now on we rely on the docuemntation site to guide people to the correct documenation for their framework.

  - SvelteKit: https://inlang.com/m/dxnzrydw/paraglide-sveltekit-i18n
  - NextJs: https://inlang.com/m/osslbuzt/paraglide-next-i18n
  - Astro: https://inlang.com/m/iljlwzfs/paraglide-astro-i18n
  - SolidStart: https://inlang.com/m/n860p17j/paraglide-solidstart-i18n
  - Vite: https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-vite

## 1.11.0

### Minor Changes

- e37eabf: - renamed packages `@inlang/cross-sell-X` to `@inlang/recommend-X` be more descriptive
  - refactor recommendation view in Sherlock VS Code extension
  - introduce new `shouldRecommend` function to `@inlang/recommend-sherlock` & `@inlang/recommend-ninja`

## 1.10.1

### Patch Changes

- c5d145d: use types from SDK for error handling

## 1.10.0

### Minor Changes

- 33662e6: Gracefully handle errors in the Inlang Project. Only crash on errors that are fatal to paraglide specifically

## 1.9.1

### Patch Changes

- b8573fa: Improved error-reporting

## 1.9.0

### Minor Changes

- eb941fe: Prompt about adding the [Ninja](https://inlang.com/m/3gk8n4n4/app-inlang-ninjaI18nAction) Github Action for translation-linting during `paraglide-js init`. Also exposes it over the internal API.

### Patch Changes

- 9566348: Better handling of `tsconfig` files that `extends` another config.

## 1.8.0

### Minor Changes

- 21ab0a0: Add an output mode where each message is it's own file. This enables treeshaking in less capable bundlers. Currently this is only available via the programmatic API.

### Patch Changes

- 21ab0a0: performance improvements

## 1.7.3

### Patch Changes

- 32cbe48: Improve `bestMatch` reliability

## 1.7.2

### Patch Changes

- 6105a50: No longer log "Exiting the Watcher" when stopping the watching process, as it was causing annoying CMD popups on windows

## 1.7.1

### Patch Changes

- 4d24188: `paraglide-js init` now uses the `createNewProject` API from `@inlang/sdk` for creating new projects. This resulits in higher reliability.

## 1.7.0

### Minor Changes

- 0774c1a: Expose CLI programmatically to enable framework-specific init clis

## 1.6.2

### Patch Changes

- cee4692: Use index accesses instead of `.at` function for better compatability with legacy browsers
- 4b631aa: Update invalid type-declarations
- 3c7a87c: Fixes a race-condition when creating the messages directory during `paraglide-js init`
- ab1fe48: When initialising and a single project is available, it no longer suggests and empty string as the project path

## 1.6.1

### Patch Changes

- fa6aa31: Update internal adapter-utilities
- dee5aa6: Add `--silent` option to `paraglide-js compile` command that will only log errors

## 1.6.0

### Minor Changes

- 462325b: Paraglide now ships with internal utility functions that handle common adapter tasks such as language-negotiation. These aren't public facing, but the version bump is required to make sure adapter-packages resolve the correct version of paragldie.

## 1.5.0

### Minor Changes

- 2428451: `paraglide-js init` now finds more existing projects

## 1.4.0

### Minor Changes

- d47b2aa: Generate empty `messages/{lang}.js` files if no messages are present. This way the "shape" of the generated output is always the same regardless of messages

### Patch Changes

- 192fdec: prompt the user for the `outdir` during `paraglide-js init`
- 0b7c82e: Inline package-version at build time to be more robust

## 1.3.7

### Patch Changes

- 1cc9cbc: Run compiler after `paraglide-js init` so that initial files are present
- 5401f95: Add `--outdir` flag to the generated CLI commands

## 1.3.6

### Patch Changes

- 526b0ba: `paraglide-js init` now prompts for which languages should be supported
- 26d2ba1: No longer add `identical-pattern` lint rule by default

## 1.3.5

### Patch Changes

- 7dce581: fix `openRepository` crash in non-git environments

## 1.3.4

### Patch Changes

- 2a42b6e: bump `@lix-js/client` dependency

## 1.3.3

### Patch Changes

- 11f0e18: Update dependency
- 10e3c28: fix JSDoc annotations on message aliases

## 1.3.2

### Patch Changes

- 45975c0: Fail gracefully if adding `.vscode` folder fails

## 1.3.1

### Patch Changes

- afaaffa: Bundle `@inlang/recommend-sherlock`. This is used to promot _once_ during `paraglide-js init` to ask if you want to install the Sherlock vscode extension

## 1.3.0

### Minor Changes

- 4970afc: paraglide deprecate aliases
- 4837297: File locking for concurrent message updates through the load/store plugin api
  Auto-generated human-IDs and aliases - only with experimental: { aliases: true }

### Patch Changes

- @inlang/recommend-sherlock@0.0.2

## 1.2.9

### Patch Changes

- a99e35fee: use `@inlang/recommend-sherlock` during vscode extension initialization
- Updated dependencies [a99e35fee]
  - @inlang/recommend-sherlock@0.0.2

## 1.2.8

### Patch Changes

- b0f1e908b: Prompt user for tech-stack when running `paraglide-js init` & recommend Adapters

## 1.2.7

### Patch Changes

- f6ec6cdc9: bump `@inlang/sdk` dependency

## 1.2.6

### Patch Changes

- 960f8fb70: rename the vscode extension to "Sherlock"

## 1.2.5

### Patch Changes

- 00f181ad3: fix broken dependency

## 1.2.4

### Patch Changes

- Updated dependencies [244442698]
  - @inlang/language-tag@1.5.0

## 1.2.3

### Patch Changes

- 4c26fa70a: bump dependencies

## 1.2.2

### Patch Changes

- 613ef9877: fix: Bump `@lix-js/client` dependency

## 1.2.1

### Patch Changes

- 74dc1f8c6: Update dependencies
- 4ae6295d0: Detect when `paraglide-js init` is being run inside the VsCode terminal and skip the VsCode question if so
- Updated dependencies [74ac11c47]
  - @inlang/language-tag@1.4.0

## 1.2.0

### Minor Changes

- 0f0e8496d: Throw runtime error if `languageTag()` returns a non-language tag value

## 1.1.1

### Patch Changes

- 7ea9753fb: Improve onboarding message
- 4277232db: fix: better formatting of messageID fallbacks

## 1.1.0

### Minor Changes

- cd29edb11: bumbing fixed env var dependecy issue affected packages

## 1.0.0

Bump Version to 1.0 as no more breaking changes are expected.

## 1.0.0-prerelease.26

Hotfix: Bundle SDK

## 1.0.0-prerelease.25

Update dependencies

## 1.0.0-prerelease.24

feat: Support language Fallbacks according to BCP 47 specification

## 1.0.0-prerelease.23

Update dependencies

## 1.0.0-prerelease.22

Update dependencies

## 1.0.0-prerelease.21

feat: Handle variables that have invalid JS identifiers as names.
fix: Better text escaping in the compiler.
fix: Compiler now fails reliably when a message ID is an invalid JS identifier.

## 1.0.0-prerelease.20

Paraglide now checks if the messages have actually changed before recompiling. This should improve reliability and performance.

## 1.0.0-prerelease.19

fix: Fix inlang/internal#195

## 1.0.0-prerelease.18

`paraglide-js init` now adds `@inlang/message-lint-rule-valid-js-identifier` by default.

## 1.0.0-prerelease.17

`paraglide-js init` now adds `paraglide-js compile` to the postinstall script by default. This sidesteps numerous linting issues when using paraglide in CI environments.

## 1.0.0-prerelease.16

Fix `paraglide-js compile` hanging for a couple seconds after successful compilation

## 1.0.0-prerelease.15

Fix crash when using `npx @inlang/paraglide-js init` and selecting vscode.

## 1.0.0-prerelease.14

Added `--watch` flag to the `paraglide-js compile` command. This will keep the process alive and recompile whenever messages are changed.

```bash
paraglide-js compile --project ./project.inlang --watch
```

## 1.0.0-prerelease.13

`./paraglide/runtime.js` now exports a function called `isAvailableLanguageTag`. This is
the recommended way to check if something is a valid language tag, while maintaining
type safety.

```ts
//Pseudo code
import { isAvailableLanguageTag } from "./paraglide/runtime";

if (isAvailableLanguageTag(params.lang)) {
	return renderSite(params.lang);
} else {
	return 404;
}
```

## 1.0.0-prerelease.12

[Internal Change]
Expose the compiler so that bundler plugins can call it programmatically instead of going through the CLI.

## 1.0.0-prerelease.11

`onSetLanguageTag` no longer throws when called multiple times. Newer callbacks will overwrite old ones.
Developers still should not call `onSetLanguageTag` multiple times, this is needed for HMR to work reliably.

Big thanks to [@KraXen72](https://github.com/KraXen72) for helping us find this bug.

## 1.0.0-prerelease.10

Add an optional options argument to message functions, to allow forcing a languageTag regardless of which languageTag is currently set.

```ts
import * as m from "./paraglide/messages";
const msg = m.hello({ name: "John" }, { languageTag: "de" });
```

## 1.0.0-prerelease.9

The `paraglide-js init` command now uses the [inlang message format](https://inlang.com/m/reootnfj) 2.0 which is human readable.

## 1.0.0-prerelease.8

IMPROVE: Paraglide now splits messages into different resource files as a step towards splitting messages by language via a bundler plugin.

```ts
import * as en from "./paraglide/messages/en";
import * as de from "./paraglide/messages/de";

en.hello();
de.hello();
```

## 1.0.0-prerelease.7

FIX: type error https://github.com/opral/monorepo/pull/1610#issuecomment-1801768825

```diff
export const currentLanguageTag = (params) => {
+	/** @type {Record<string, string>} */
	const variants = {
		en: `The current language tag is "${params.languageTag}".`,
		de: `Der aktuelle Sprachtag ist "${params.languageTag}".`,
	}
	return variants[languageTag()] ?? "currentLanguageTag"
}
```

## 1.0.0-prerelease.6

BREAKING: Paraglide JS now compiles into source code, see https://github.com/opral/monorepo/issues/1607.

What you need to change:

1. Remove `--namespace` from the compile command
2. Replace imports from paraglide to point to the directory in ther source code:

```diff
-import { setLanguageTag, languageTag } from '@inlang/paraglide-js/sveltekit-example';
+import { setLanguageTag, languageTag } from '../../paraglide-js/runtime';
-import * as m from "@inlang/paraglide-js/sveltekit-example/messages"
+import * as m from "../../paraglide-js/messages"
```

## 1.0.0-prerelease.5

improve: `paraglide-js init` now adds the Visual Studio Code extension (Sherlock) if vscode is used

## 1.0.0-prerelease.4

add: `paraglide-js init` command which simplifies the setup process

## 1.0.0-prerelease.3

fix: https://github.com/opral/monorepo/issues/1478

## 1.0.0-prerelease.1

### fix: Jetbrains based editors not detecting `@inlang/paraglide-js/{namespace}/messages` imports

The bug has been fixed by moving `./*/messages` above the less specifc `./*` export.

```json
	"exports": {
		"./*/messages": "./dist/compiled-output/*/messages.js",
		"./*": "./dist/compiled-output/*/runtime.js"
	},
```
