![Dead Simple i18n. Typesafe, Small Footprint, SEO-Friendly and, with an IDE Integration.](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-sveltekit/assets/og.png)

<doc-features>
<doc-feature text-color="#0F172A" color="#E1EFF7" title="Internationalized Routing" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-next/assets/i18n-routing.png"></doc-feature>
<doc-feature text-color="#0F172A" color="#E1EFF7" title="Tiny Bundle Size" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-next/assets/bundle-size.png"></doc-feature>
<doc-feature text-color="#0F172A" color="#E1EFF7" title="No route Param needed" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-sveltekit/assets/no-param.png"></doc-feature>
</doc-features>

`@inlang/paraglide-sveltekit` is the easiest way to internationalize your SvelteKit Project. It handles string translations, i18n routing and more! 	

Thanks to Paraglide's Treeshakeable messages only messages that are _used_ on the _current page_ are part of the JS bundle. This results in the smallest size with the exception that Paraglide JS loads all languages till [#88](https://github.com/opral/inlang-paraglide-js/issues/88) is solved. The inflection point of only bundling the used messages but for all languages is around 10-20 languages, dependent on the number of messages used. Read [scaling](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/scaling) for more information. 

Paraglide-SvelteKit offers Localised routing with translated pathnames, without requiring a `[locale]` parameter in your routes.	

Links are automatically translated to the current language. Write `<a href="/about"` and it renders as `<a href="/fr/a-propos"` in French.

[➡ Get started here](/m/dxnzrydw/paraglide-sveltekit-i18n/getting-started)

# People Love It

<doc-comments>
<doc-comment text="Just tried Paraglide JS from @inlangHQ. This is how i18n should be done! Totally new level of DX for both implementation and managing translations! Superb support for SvelteKit as well ⭐" author="Patrik Engborg" icon="mdi:twitter" data-source="https://twitter.com/patrikengborg/status/1747260930873053674"></doc-comment>
<doc-comment text="Awesome library 🙂 Thanks so much! 1) The docs were simple and straight forward 2) Everything just worked.. no headaches" author="Dimitry" icon="mdi:discord" data-source="https://discord.com/channels/897438559458430986/1083724234142011392/1225658097016766574"></doc-comment>
<doc-comment text="Thank you for that huge work you have done and still doing!" author="ZerdoX-x" icon="mdi:github"></doc-comment>
</doc-comments>

# When is the SvelteKit adapter for Paraglide JS not the right choice?

Warning: Progress on feature development for Paraglide SvelteKit in on hold until lix 1.0 is released. See [this post](https://opral.substack.com/p/focus-shift-from-inlang-to-lix). Pull requests for bugfixes will be reviewed and merged ASAP.  

- You don't want the route to contain the language tag (e.g. `/en/about`), see [Issue #217](https://github.com/opral/inlang-paraglide-js/issues/217). You can use [Paraglide JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) (without an adapter) instead. 
- Variant are not supported yet (pluralization, gendering) see [Issue #201](https://github.com/opral/inlang-paraglide-js/issues/201)
- You have more than 10 languages and care about minimum bundle sizes, see [Scaling](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/scaling). A runtime based i18n library might be better for you until language splitting ships [issue #88](https://github.com/opral/inlang-paraglide-js/issues/88).

## Playground

Play around with it on [StackBlitz](https://stackblitz.com/~/github.com/lorissigrist/paraglide-sveltekit-example)

[➡ Get started here](/m/dxnzrydw/paraglide-sveltekit-i18n/getting-started)