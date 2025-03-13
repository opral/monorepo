---
imports:
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-feature.js
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-features.js
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-link.js
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-links.js
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-comment.js
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-comments.js
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-callout.js
---

[<img src="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/paraglide/paraglide-js/assets/header.png" alt="Dead Simple i18n. Typesafe, Small Footprint, Treeshsakeable Messages, IDE Integration, Framework Agnostic" width="10000000px" />](https://www.youtube.com/watch?v=-YES3CCAG90)

# Why Paraglide?

Paraglide is designed as a compiler which emits tree-shakable message functions. This means that only the messages you actually use are loaded without asynchronous waterfalls.

<doc-features>
  <doc-feature title="Tiny Runtime" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/paraglide/paraglide-js/assets/bundlesize-feature.png"></doc-feature>
  <doc-feature title="Fully Typesafe" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/paraglide/paraglide-js/assets/typesafety-feature.png"></doc-feature>
  <doc-feature title="Only Ship Used Messages" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/paraglide/paraglide-js/assets/unused-translations.png"></doc-feature>
   <doc-feature title="Sherlock VS Code Extension" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/paraglide/paraglide-js/assets/sherlock-preview.png"></doc-feature>
</doc-features>

## People Love It

<doc-comments>
<doc-comment text="Paraglide js is by far the best option when it comes to internatinalization. Nothing better on the market." author="Ancient-Background17" icon="mdi:reddit" data-source="https://www.reddit.com/r/sveltejs/comments/1h7z5gv/comment/m0suyvf"></doc-comment>
<doc-comment text="Just tried Paraglide JS from @inlangHQ. This is how i18n should be done! Totally new level of DX for both implementation and managing translations! Superb support for SvelteKit as well ⭐" author="Patrik Engborg" icon="mdi:twitter" data-source="https://twitter.com/patrikengborg/status/1747260930873053674"></doc-comment>
<doc-comment text="I was messing with various i18n frameworks and tools in combination with Astro, and must say that Paraglide was the smoothest experience. I have migrated my website from i18next and it was a breeze. SSG and SSR worked out of the box (which was the first one for me), and overall DX is great. Thanks for your work!" author="Dalibor Hon" icon="mdi:discord" data-source="https://discord.com/channels/897438559458430986/1096039983116202034/1220796380772307004"></doc-comment>
<doc-comment text="Awesome library 🙂 Thanks so much! 1) The docs were simple and straight forward 2) Everything just worked.. no headaches" author="Dimitry" icon="mdi:discord" data-source="https://discord.com/channels/897438559458430986/1083724234142011392/1225658097016766574"></doc-comment>
</doc-comments>

## Works in any framework

<doc-links>
  <doc-link title="Vanilla JS/TS" icon="devicon:javascript" href="/m/gerre34r/library-inlang-paraglideJs/vanilla-js-ts" description="Open example"></doc-link>
  <doc-link title="React" icon="devicon:react" href="/m/gerre34r/library-inlang-paraglideJs/vite" description="Open example"></doc-link>
  <doc-link title="Vue" icon="devicon:vuejs" href="/m/gerre34r/library-inlang-paraglideJs/vite" description="Open example"></doc-link>
  <doc-link title="SvelteKit" icon="devicon:svelte" href="/m/gerre34r/library-inlang-paraglideJs/sveltekit" description="Open example"></doc-link>
  <doc-link title="NextJS" icon="devicon:nextjs" href="/m/gerre34r/library-inlang-paraglideJs/next-js" description="Open example"></doc-link>
  <doc-link title="Astro" icon="devicon:astro" href="/m/gerre34r/library-inlang-paraglideJs/astro" description="Open example"></doc-link>
  <doc-link title="Other frameworks" icon="basil:other-1-outline" href="/m/gerre34r/library-inlang-paraglideJs/other-frameworks"></doc-link>
</doc-links>

## Comparison

<doc-callout type="info">Please open a pull request if the comparison is outdated, incorrect, or can be improved.</doc-callout>

| Feature                                                      | Paraglide JS                                                                                              | i18next                                                                                                          | React-Intl/FormatJS                                                                                               |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Architecture**                                             | 🏗️ Compiler                                                                                               | 🏃 Runtime                                                                                                       | 🏃 Runtime                                                                                                        |
| **Requires build step**                                      | ❌ Yes                                                                                                    | ✅ No                                                                                                            | ✅ No                                                                                                             |
| **Runtime Size**                                             | ✅ Tiny (as small as 300B)                                                                                | ⚠️ Larger (10kB+)                                                                                                | ⚠️ Medium (8kB+)                                                                                                  |
| **Tree-shaking**                                             | ✅ Built-in                                                                                               | ❌ No support                                                                                                    | ❌ No support                                                                                                     |
| **Type Safety**                                              | ✅ Built-in                                                                                               | [🟠 Via workarounds](https://www.i18next.com/overview/typescript)                                                | ❌ No support                                                                                                     |
| **Framework agnostic**                                       | ✅ No wrappers needed                                                                                     | [🟠 Wrappers needed](https://github.com/i18next/react-i18next)                                                   | [🟠 Wrappers needed](https://formatjs.github.io/docs/react-intl/#the-react-intl-package)                          |
| **Message syntax agnostic**                                  | [✅ Via inlang plugins](https://inlang.com/c/plugins)                                                     | [✅ Via different backends](https://www.i18next.com/how-to/add-or-load-translations#load-using-a-backend-plugin) | [❌ Only ICU1](https://formatjs.github.io/docs/core-concepts/icu-syntax/)                                         |
| **Pluralization**                                            | [✅ Built-in](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/variants#pluralization)            | [✅ Built-in](https://www.i18next.com/translation-function/plurals)                                              | [✅ Built-in](https://formatjs.github.io/docs/core-concepts/icu-syntax#plural-format)                             |
| **Variants**                                                 | [✅ Built-in](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/variants)                          | ❌ No support                                                                                                    | ❌ No support                                                                                                     |
| **Component interpolation**                                  | [❌ Open issue #240](https://github.com/opral/inlang-sdk/issues/240)                                      | [🟠 Only for React](https://react.i18next.com/legacy-v9/trans-component)                                         | [🟠 Only for React](https://formatjs.github.io/docs/react-intl/components/#rich-text-formatting)                  |
| **Multi-tenancy**                                            | [✅ Built-in](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/multi-tenancy)                     | ❌ Custom solution needed                                                                                        | ❌ Custom solution needed                                                                                         |
| **Strategy agnostic**                                        | [✅ Built-in](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/strategy)                          | [🟠 Via plugins](https://github.com/i18next/i18next-browser-languageDetector)                                    | ❌ Custom solution needed                                                                                         |
| **Scales well over 15 locales**                              | [🟠 Experimental split locale option](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/benchmark) | [✅ Via HTTP backend](https://github.com/i18next/i18next-http-backend)                                           | ❌ Custom solution needed                                                                                         |
| **Metaframework (NextJS, SvelteKit, Astro, ...) compatible** | ✅ Out of the box                                                                                         | [🟠 Wrappers needed](https://github.com/i18next/next-i18next)                                                    | ❌ Only supports plain JS or React ([source](https://formatjs.github.io/docs/react-intl/#the-react-intl-package)) |
| **Ecosystem**                                                | [🌱 Growing based on open inlang file format](https://github.com/opral/inlang-sdk)                        | [🟠 Cloud TMS service](https://www.i18next.com/#localization-as-a-service)                                       | ❌ Only an i18n library                                                                                           |
| **Maturity**                                                 | 🆕 Newer                                                                                                  | 🧓 Very mature                                                                                                   | 👨 Mature                                                                                                         |

## Ecosystem

Paraglide JS is build on top of the [open inlang file format](https://github.com/opral/inlang-sdk). Any other inlang app like the Sherlock VSCode extension, the CLI to machine translate, or Fink to let translators manage translations works out of the box.

<doc-links>
  <doc-link title="Sherlock" description="VSCode extension" icon="twemoji:detective" href="https://inlang.com/m/r7kp499g/app-inlang-ideExtension"></doc-link>
  <doc-link title="CLI" description="Machine translate" icon="garden:terminal-cli-fill-16" href="https://inlang.com/m/2qj2w8pu/app-inlang-cli"></doc-link>
  <doc-link title="Fink" description="CAT editor for translators" icon="fxemoji:bird" href="https://inlang.com/m/2qj2w8pu/app-inlang-cli"></doc-link>
  <doc-link title="Parrot" description="Manage translations in Figma" icon="twemoji:parrot" href="https://inlang.com/m/gkrpgoir/app-parrot-figmaPlugin"></doc-link>
  <doc-link icon="material-symbols-light:travel-explore-rounded" title="Explore more" href="https://inlang.com/c/apps"></doc-link>
</doc-links>

## Talks

- [Paraglide JS 1.0 announcement](https://www.youtube.com/watch?v=-YES3CCAG90)
- [Svelte London January 2024 Meetup](https://www.youtube.com/watch?v=eswNQiq4T2w&t=646s)
