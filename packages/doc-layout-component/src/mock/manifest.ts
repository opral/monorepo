import type { MarketplaceManifest } from "@inlang/marketplace-manifest"

export const manifest: MarketplaceManifest & { uniqueID: string } = {
	$schema: "https://inlang.com/schema/marketplace-manifest",
	id: "library.inlang.paraglideJs",
	uniqueID: "gerre34r",
	icon: "https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/paraglideNoBg.png",
	gallery: [
		"https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/og.png",
		"https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/assets/marketplace/paraglide-gallery/paraglide-gallery-image-1.jpg",
		"https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/assets/marketplace/paraglide-gallery/paraglide-gallery-image-2.jpg",
		"https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/assets/marketplace/paraglide-gallery/paraglide-gallery-image-3.jpg",
		"https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/assets/marketplace/paraglide-gallery/paraglide-gallery-image-4.jpg",
	],
	displayName: {
		en: "Paraglide JS",
	},
	description: {
		en: "Simple, adaptable and tiny i18n library that integrates with any framework",
	},
	pages: {
		"/": "./inlang/source-code/paraglide/paraglide-js/README.md",
		"/changelog": "./inlang/source-code/paraglide/paraglide-js/CHANGELOG.md",
		"/examples": "./inlang/source-code/paraglide/paraglide-js/README.md",
		"/license": "./inlang/source-code/paraglide/paraglide-js/LICENSE.md",
		"/api": "./inlang/source-code/paraglide/paraglide-js/README.md",
		"/advanced": "./inlang/source-code/paraglide/paraglide-js/README.md",
		"/getting-started": "./inlang/source-code/paraglide/paraglide-js/README.md",
	},
	keywords: [
		"paraglide js",
		"libraries",
		"apps",
		"website",
		"developer",
		"paraglide",
		"i18n",
		"library",
		"localization",
		"sdk",
		"sdk-js",
		"svelte",
		"react",
		"nextjs",
		"remix",
		"vue",
		"astro",
		"javascript",
		"solid",
		"typescript",
	],
	recommends: ["m/reootnfj", "m/632iow21", "m/r7kp499g", "m/teldgniy"],
	pricing: "free",
	publisherName: "inlang",
	publisherIcon: "https://inlang.com/favicon/safari-pinned-tab.svg",
	license: "Apache-2.0",
}

export const html = `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark-dimmed.min.css">
<h1 id="why-paraglide" class="doc-font-semibold doc-leading-relaxed doc-relative doc-my-6 doc-cursor-pointer doc-group/heading doc-no-underline doc-text-3xl doc-pb-3 doc-mb-2 doc-mt-12"><span class="doc-font-medium doc-hidden md:doc-block doc-mr-2 text-primary doc-opacity-0 group-hover/heading:doc-opacity-100 transition-opacity doc-absolute -doc-left-6">#</span><a onclick="event.preventDefault(); window.scrollTo({top: document.getElementById(event.target.hash.substring(1)).offsetTop - 96, behavior: &#x22;smooth&#x22;}); window.history.pushState(null, null, event.target.hash);" href="#why-paraglide">Why Paraglide?</a></h1>
<p class="doc-text-base text-surface-600 doc-my-4 doc-leading-relaxed">With Paraglide's treeshakeable messages, each page only loads the messages it actually uses. Incremental loading like this would usually take forever to get right, with Paraglide you get it for free.</p>
<h1 id="use-it-with-your-favorite-framework" class="doc-font-semibold doc-leading-relaxed doc-relative doc-my-6 doc-cursor-pointer doc-group/heading doc-no-underline doc-text-3xl doc-pb-3 doc-mb-2 doc-mt-12"><span class="doc-font-medium doc-hidden md:doc-block doc-mr-2 text-primary doc-opacity-0 group-hover/heading:doc-opacity-100 transition-opacity doc-absolute -doc-left-6">#</span><a onclick="event.preventDefault(); window.scrollTo({top: document.getElementById(event.target.hash.substring(1)).offsetTop - 96, behavior: &#x22;smooth&#x22;}); window.history.pushState(null, null, event.target.hash);" href="#use-it-with-your-favorite-framework">Use it with your Favorite Framework</a></h1>
<p class="doc-text-base text-surface-600 doc-my-4 doc-leading-relaxed">Paraglide is framework agnostic, but there are framework-specific libraries available. If there is one for your framework you will want to follow its documentation instead. If there isn't, read on.</p>
<doc-links>
<doc-link title="Paraglide-Next" icon="tabler:brand-nextjs" href="/m/osslbuzt/paraglide-next-i18n" description="Go to Library"></doc-link>
<doc-link title="Paraglide-SvelteKit" icon="simple-icons:svelte" href="/m/dxnzrydw/paraglide-sveltekit-i18n" description="Go to Library"></doc-link>
<doc-link title="Paraglide-Astro" icon="devicon-plain:astro" href="/m/iljlwzfs/paraglide-astro-i18n" description="Go to Library"></doc-link>
<doc-link title="Paraglide-SolidStart" icon="tabler:brand-solidjs" href="/m/n860p17j/paraglide-solidstart-i18n" description="Go to Library"></doc-link>
<doc-link title="Paraglide-Remix" icon="simple-icons:remix" href="/m/fnhuwzrx/paraglide-remix-i18n" description="Go to Library"></doc-link>
<doc-link title="Or write your own" icon="ph:sparkle-fill" href="#writing-a-framework-library" description="Learn How"></doc-link>
</doc-links>
<h1 id="people-love-it" class="doc-font-semibold doc-leading-relaxed doc-relative doc-my-6 doc-cursor-pointer doc-group/heading doc-no-underline doc-text-3xl doc-pb-3 doc-mb-2 doc-mt-12"><span class="doc-font-medium doc-hidden md:doc-block doc-mr-2 text-primary doc-opacity-0 group-hover/heading:doc-opacity-100 transition-opacity doc-absolute -doc-left-6">#</span><a onclick="event.preventDefault(); window.scrollTo({top: document.getElementById(event.target.hash.substring(1)).offsetTop - 96, behavior: &#x22;smooth&#x22;}); window.history.pushState(null, null, event.target.hash);" href="#people-love-it">People Love It</a></h1>
<p class="doc-text-base text-surface-600 doc-my-4 doc-leading-relaxed">A few recent comments.</p>
<doc-comments>
<doc-comment text="Just tried Paraglide JS from @inlangHQ. This is how i18n should be done! Totally new level of DX for both implementation and managing translations! Superb support for SvelteKit as well ⭐" author="Patrik Engborg" icon="mdi:twitter"></doc-comment>
<doc-comment text="I was messing with various i18n frameworks and tools in combination with Astro, and must say that Paraglide was the smoothest experience. I have migrated my website from i18next and it was a breeze. SSG and SSR worked out of the box (which was the first one for me), and overall DX is great. Thanks for your work!" author="Dalibor Hon" icon="mdi:discord"></doc-comment>
<doc-comment text="Awesome library 🙂 Thanks so much! 1) The docs were simple and straight forward 2) Everything just worked.. no headaches" author="Dimitry" icon="mdi:discord"></doc-comment>
<doc-comment text="Thank you for that huge work you have done and still doing!" author="ZerdoX-x" icon="mdi:github"></doc-comment>
</doc-comments>
<h1 id="getting-started" class="doc-font-semibold doc-leading-relaxed doc-relative doc-my-6 doc-cursor-pointer doc-group/heading doc-no-underline doc-text-3xl doc-pb-3 doc-mb-2 doc-mt-12"><span class="doc-font-medium doc-hidden md:doc-block doc-mr-2 text-primary doc-opacity-0 group-hover/heading:doc-opacity-100 transition-opacity doc-absolute -doc-left-6">#</span><a onclick="event.preventDefault(); window.scrollTo({top: document.getElementById(event.target.hash.substring(1)).offsetTop - 96, behavior: &#x22;smooth&#x22;}); window.history.pushState(null, null, event.target.hash);" href="#getting-started">Getting started</a></h1>
<p class="doc-text-base text-surface-600 doc-my-4 doc-leading-relaxed">To use Paraglide standalone without a framework, run the following command:</p>`
