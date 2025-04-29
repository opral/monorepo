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

[![NPM Downloads](https://img.shields.io/npm/dw/%40inlang%2Fparaglide-js?logo=npm&logoColor=red&label=npm%20downloads)](https://www.npmjs.com/package/@inlang/paraglide-js)
[![Closed github issues](https://img.shields.io/github/issues-closed/opral/paraglide-js?logo=github&color=purple)](https://github.com/opral/inlang-paraglide-js/issues)
[![Monorepo contributors](https://img.shields.io/github/contributors/opral/monorepo?logo=github)](https://github.com/opral/monorepo/graphs/contributors)

[<img src="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/paraglide/paraglide-js/assets/header.png" alt="Dead Simple i18n. Typesafe, Small Footprint, Treeshsakeable Messages, IDE Integration, Framework Agnostic" width="10000000px" />](https://www.youtube.com/watch?v=-YES3CCAG90)

# Why Paraglide?

Paraglide is a compiler-based i18n library that emits tree-shakable message functions. Small bundle sizes, no async waterfalls, full type-safety, and more. Check out the [comparison page](/m/gerre34r/library-inlang-paraglideJs/comparison). 

If you use a bundler like [Vite](/m/gerre34r/library-inlang-paraglideJs/vite) in your project, Paraglide JS is almost certainly the best fit. 

<doc-features>
  <doc-feature title="Tiny Runtime" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/paraglide/paraglide-js/assets/bundlesize-feature.png"></doc-feature>
  <doc-feature title="Fully Typesafe" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/paraglide/paraglide-js/assets/typesafety-feature.png"></doc-feature>
  <doc-feature title="Only Ship Used Messages" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/paraglide/paraglide-js/assets/unused-translations.png"></doc-feature>
   <doc-feature title="Sherlock VS Code Extension" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/paraglide/paraglide-js/assets/sherlock-preview.png"></doc-feature>
</doc-features>

## People Love It

<doc-comments>
<doc-comment text="Paraglide js is by far the best option when it comes to internationalization. Nothing better on the market." author="Ancient-Background17" icon="mdi:reddit" data-source="https://www.reddit.com/r/sveltejs/comments/1h7z5gv/comment/m0suyvf"></doc-comment>
<doc-comment text="Just tried Paraglide JS from @inlangHQ. This is how i18n should be done! Totally new level of DX for both implementation and managing translations! Superb support for SvelteKit as well ⭐" author="Patrik Engborg" icon="mdi:twitter" data-source="https://twitter.com/patrikengborg/status/1747260930873053674"></doc-comment>
<doc-comment text="I was messing with various i18n frameworks and tools in combination with Astro, and must say that Paraglide was the smoothest experience. I have migrated my website from i18next and it was a breeze. SSG and SSR worked out of the box (which was the first one for me), and overall DX is great. Thanks for your work!" author="Dalibor Hon" icon="mdi:discord" data-source="https://discord.com/channels/897438559458430986/1096039983116202034/1220796380772307004"></doc-comment>
<doc-comment text="Awesome library 🙂 Thanks so much! 1) The docs were simple and straightforward 2) Everything just worked.. no headaches" author="Dimitry" icon="mdi:discord" data-source="https://discord.com/channels/897438559458430986/1083724234142011392/1225658097016766574"></doc-comment>
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

## Ecosystem

Paraglide JS is built on top of the [open inlang file format](https://github.com/opral/inlang-sdk). Any other inlang app like the Sherlock VSCode extension, the CLI to machine translate, or Fink to let translators manage translations works out of the box.

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
