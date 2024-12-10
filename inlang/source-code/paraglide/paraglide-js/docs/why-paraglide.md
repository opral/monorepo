[<img src="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/header.png" alt="Dead Simple i18n. Typesafe, Small Footprint, Treeshsakeable Messages, IDE Integration, Framework Agnostic" width="10000000px" />](https://www.youtube.com/watch?v=-YES3CCAG90)

# Why Paraglide?

<doc-features>
  <doc-feature title="Tiny Runtime" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/bundlesize-feature.png"></doc-feature>
  <doc-feature title="Fully Typesafe" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/typesafety-feature.png"></doc-feature>
  <doc-feature title="Only Ship Used Messages" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/unused-translations.png"></doc-feature>
   <doc-feature title="Sherlock VS Code Extension" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/sherlock-preview.png"></doc-feature>
</doc-features>


With Paraglide's treeshakeable messages, each page only bundles the messages it actually uses with the exception that Paraglide JS loads all languages till [#88](https://github.com/opral/inlang-paraglide-js/issues/88) is solved. The inflection point of only bundling the used messages but for all languages is around 10-20 languages, dependent on the number of messages used. Read [scaling](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/scaling) for more information. 

# Use it with your Favorite Framework

Paraglide is framework agnostic, but there are framework-specific adapters available. 

<doc-links>
	<doc-link title="Paraglide-Next" icon="tabler:brand-nextjs" href="/m/osslbuzt/paraglide-next-i18n" description="Go to Library"></doc-link>
    <doc-link title="Paraglide-SvelteKit" icon="simple-icons:svelte" href="/m/dxnzrydw/paraglide-sveltekit-i18n" description="Go to Library"></doc-link>
    <doc-link title="Paraglide-Astro" icon="devicon-plain:astro" href="/m/iljlwzfs/paraglide-astro-i18n" description="Go to Library"></doc-link>
    <doc-link title="Paraglide-SolidStart" icon="tabler:brand-solidjs" href="/m/n860p17j/paraglide-solidstart-i18n" description="Go to Library"></doc-link>
	<doc-link title="Paraglide-Remix" icon="simple-icons:remix" href="/m/fnhuwzrx/paraglide-remix-i18n" description="Go to Library"></doc-link>
	<doc-link title="Or write your own" icon="ph:sparkle-fill" href="#writing-a-framework-library" description="Learn How"></doc-link>
</doc-links>

# People Love It

A few recent comments.

<doc-comments>
<doc-comment text="Just tried Paraglide JS from @inlangHQ. This is how i18n should be done! Totally new level of DX for both implementation and managing translations! Superb support for SvelteKit as well ⭐" author="Patrik Engborg" icon="mdi:twitter" data-source="https://twitter.com/patrikengborg/status/1747260930873053674"></doc-comment>
<doc-comment text="I was messing with various i18n frameworks and tools in combination with Astro, and must say that Paraglide was the smoothest experience. I have migrated my website from i18next and it was a breeze. SSG and SSR worked out of the box (which was the first one for me), and overall DX is great. Thanks for your work!" author="Dalibor Hon" icon="mdi:discord" data-source="https://discord.com/channels/897438559458430986/1096039983116202034/1220796380772307004"></doc-comment>
<doc-comment text="Awesome library 🙂 Thanks so much! 1) The docs were simple and straight forward 2) Everything just worked.. no headaches" author="Dimitry" icon="mdi:discord" data-source="https://discord.com/channels/897438559458430986/1083724234142011392/1225658097016766574"></doc-comment>
<doc-comment text="Thank you for that huge work you have done and still doing!" author="ZerdoX-x" icon="mdi:github"></doc-comment>
</doc-comments>

# When is Paraglide JS not the right choice?

- Variant are not supported yet (pluralization, gendering) see https://github.com/opral/inlang-paraglide-js/issues/201
- You have more than 10 languages and care about minimum bundle sizes. A runtime based i18n library might be better for you. See https://inlang.com/m/gerre34r/library-inlang-paraglideJs/scaling.