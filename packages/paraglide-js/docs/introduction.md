---
imports: 
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-feature.js
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-features.js
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-link.js
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-links.js
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-comment.js
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-comments.js
---

<script type="module" src="https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-feature.js"></script>
<script type="module" src="https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-features.js"></script>
<script type="module" src="https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-link.js"></script>
<script type="module" src="https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-links.js"></script>
<script type="module" src="https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-comment.js"></script>
<script type="module" src="https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-comments.js"></script>

[<img src="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/paraglide-js/assets/header.png" alt="Dead Simple i18n. Typesafe, Small Footprint, Treeshsakeable Messages, IDE Integration, Framework Agnostic" width="10000000px" />](https://www.youtube.com/watch?v=-YES3CCAG90)

# Why Paraglide?

Paraglide is designed as a compiler which emits tree-shakable message functions. This means that only the messages you actually use are loaded without asynchronous waterfalls. 

<doc-features>
  <doc-feature title="Tiny Runtime" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/paraglide-js/assets/bundlesize-feature.png"></doc-feature>
  <doc-feature title="Fully Typesafe" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/paraglide-js/assets/typesafety-feature.png"></doc-feature>
  <doc-feature title="Only Ship Used Messages" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/paraglide-js/assets/unused-translations.png"></doc-feature>
   <doc-feature title="Sherlock VS Code Extension" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/paraglide-js/assets/sherlock-preview.png"></doc-feature>
</doc-features>

## Framework agnostic 

Paraglide's architecture is framework agnostic as the result of years of R&D in the i18n space. 

You can write your own framework specific adapter in a few lines of code, and keep full control, or start with an opinionated adapter in a few minutes. 

<doc-links>
  <doc-link title="Paraglide-SvelteKit" icon="simple-icons:svelte" href="https://inlang.com/m/dxnzrydw/paraglide-sveltekit-i18n" description="Go to Library"></doc-link>
	<doc-link title="Paraglide-Next" icon="tabler:brand-nextjs" href="/m/osslbuzt/paraglide-next-i18n" description="Go to Library"></doc-link>
  <doc-link title="Paraglide-Astro" icon="devicon-plain:astro" href="/m/iljlwzfs/paraglide-astro-i18n" description="Go to Library"></doc-link>
	<doc-link title="Paraglide-Remix" icon="simple-icons:remix" href="/m/fnhuwzrx/paraglide-remix-i18n" description="Go to Library"></doc-link>
</doc-links>

## Ecosystem 

Paraglide JS is build on top of the inlang ecosystem. Use the Sherlock VSCode extension, CLI to machine translate, or Fink to let translators manage translations out of the box. 

<doc-links>
  <doc-link title="Sherlock" description="VSCode extension" icon="devicon:vscode" href="https://inlang.com/m/r7kp499g/app-inlang-ideExtension"></doc-link>
  <doc-link title="CLI" description="Machine translate" icon="garden:terminal-cli-fill-16" href="https://inlang.com/m/2qj2w8pu/app-inlang-cli"></doc-link>
  <doc-link title="Fink" description="CAT editor for translators" icon="fxemoji:bird" href="https://inlang.com/m/2qj2w8pu/app-inlang-cli"></doc-link>
  <doc-link title="Parrot" description="Manage translations in Figma" icon="devicon:figma" href="https://inlang.com/m/2qj2w8pu/app-inlang-cli"></doc-link>
  <doc-link title="Explore more" href="https://inlang.com/c/apps"></doc-link>
</doc-links>

## People Love It

A few recent comments.

<doc-comments>
<doc-comment text="Paraglide js is by far the best option when it comes to internatinalization. Nothing better on the market." author="Ancient-Background17" icon="mdi:reddit" data-source="https://www.reddit.com/r/sveltejs/comments/1h7z5gv/comment/m0suyvf"></doc-comment>
<doc-comment text="Just tried Paraglide JS from @inlangHQ. This is how i18n should be done! Totally new level of DX for both implementation and managing translations! Superb support for SvelteKit as well ⭐" author="Patrik Engborg" icon="mdi:twitter" data-source="https://twitter.com/patrikengborg/status/1747260930873053674"></doc-comment>
<doc-comment text="I was messing with various i18n frameworks and tools in combination with Astro, and must say that Paraglide was the smoothest experience. I have migrated my website from i18next and it was a breeze. SSG and SSR worked out of the box (which was the first one for me), and overall DX is great. Thanks for your work!" author="Dalibor Hon" icon="mdi:discord" data-source="https://discord.com/channels/897438559458430986/1096039983116202034/1220796380772307004"></doc-comment>
<doc-comment text="Awesome library 🙂 Thanks so much! 1) The docs were simple and straight forward 2) Everything just worked.. no headaches" author="Dimitry" icon="mdi:discord" data-source="https://discord.com/channels/897438559458430986/1083724234142011392/1225658097016766574"></doc-comment>
</doc-comments>

## Talks

- [Paraglide JS 1.0 announcement](https://www.youtube.com/watch?v=-YES3CCAG90)
- [Svelte London January 2024 Meetup](https://www.youtube.com/watch?v=eswNQiq4T2w&t=646s)

