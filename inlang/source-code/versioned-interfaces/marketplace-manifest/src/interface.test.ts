import { MarketplaceManifest } from "./interface.js"
import { test, expect } from "vitest"
import { Value } from "@sinclair/typebox/value"

test("a valid app manifest should pass validation", () => {
	const app: MarketplaceManifest = {
		id: "library.inlang.paraglideJsSveltekit",
		gallery: ["https://inlang.com/images/paraglidejs.png"],
		displayName: { en: "My App" },
		publisherName: "inlang",
		description: { en: "My App is the best app." },
		keywords: ["app", "best"],
		license: "Apache-2.0",
		website: "https://my-app.com",
		readme: { en: "https://my-app.com/readme.md" },
	}
	const errors = [...Value.Errors(MarketplaceManifest, app)]
	if (errors.length > 0) {
		// @ts-ignore
		console.error(errors)
	}
	expect(Value.Check(MarketplaceManifest, app)).toBe(true)
})

test("should pass a valid plugin manifest", () => {
	const plugin: MarketplaceManifest = {
		id: "plugin.inlang.example",
		gallery: ["https://inlang.com/images/paraglidejs.png"],
		displayName: { en: "My App" },
		description: { en: "Hello" },
		keywords: [],
		license: "Apache-2.0",
		readme: { en: "https://my-app.com/readme.md" },
		publisherName: "inlang",
		module: "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next/dist/index.js",
	}
	const errors = [...Value.Errors(MarketplaceManifest, plugin)]
	if (errors.length > 0) {
		// @ts-ignore
		console.error(errors)
	}
	expect(Value.Check(MarketplaceManifest, plugin)).toBe(true)
})

test("should be possible to define the schema", () => {
	const plugin: MarketplaceManifest = {
		$schema: "https://inlang.com/schema/marketplace-manifest",
		id: "plugin.inlang.example",
		gallery: ["https://inlang.com/images/paraglidejs.png"],
		displayName: { en: "My App" },
		description: { en: "Hello" },
		keywords: [],
		license: "Apache-2.0",
		readme: { en: "https://my-app.com/readme.md" },
		publisherName: "inlang",
		module: "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next/dist/index.js",
	}
	expect(Value.Check(MarketplaceManifest, plugin)).toBe(true)
})

test("should only allow the inlang schema schema", () => {
	const plugin: MarketplaceManifest = {
		// @ts-expect-error - should not be possible to define a custom schema
		$schema: "https://inlang.com/schema/balbal-manifest",
		id: "plugin.inlang.example",
		gallery: ["https://inlang.com/images/paraglidejs.png"],
		displayName: { en: "My App" },
		description: { en: "Hello" },
		keywords: [],
		license: "Apache-2.0",
		readme: { en: "https://my-app.com/readme.md" },
		publisherName: "inlang",
		module: "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next/dist/index.js",
	}
	expect(Value.Check(MarketplaceManifest, plugin)).toBe(false)
})

test("should pass a valid guide", () => {
	const guide: MarketplaceManifest = {
		$schema: "https://inlang.com/schema/marketplace-manifest",
		id: "guide.inlang.example",
		gallery: ["https://inlang.com/images/paraglidejs.png"],
		displayName: { en: "My App" },
		description: { en: "Hello" },
		keywords: [],
		license: "Apache-2.0",
		readme: { en: "https://my-app.com/readme.md" },
		publisherName: "inlang",
	}
	expect(Value.Check(MarketplaceManifest, guide)).toBe(true)
})

test("should allow apps from third party", () => {
	const parrot: MarketplaceManifest = {
		id: "app.parrot.figmaPlugin",
		icon: "https://cdn.jsdelivr.net/gh/parrot-global/parrot@main/parrot-logo.svg",
		gallery: [
			"https://cdn.jsdelivr.net/gh/parrot-global/parrot@main/cover.png",
			"https://cdn.jsdelivr.net/gh/parrot-global/parrot@main/layers.png",
			"https://cdn.jsdelivr.net/gh/parrot-global/parrot@main/messages.png",
		],
		displayName: {
			en: "Parrot – i18n Figma plugin",
		},
		description: {
			en: "Parrot simplifies the translation management process right within Figma. If you deal with multilingual design projects and want to streamline your translation workflow, this plugin is for you!",
		},
		readme: {
			en: "https://cdn.jsdelivr.net/gh/parrot-global/parrot@main/README.md",
		},
		keywords: ["editor", "web", "figma", "plugin", "application", "website", "translator", "lix"],
		publisherName: "inlang",
		publisherIcon: "https://cdn.jsdelivr.net/gh/parrot-global/parrot@main/parrot-logo.svg",
		website: "https://www.figma.com/community/plugin/1205803482754362456",
		license: "PolyForm Strict License 1.0.0",
	}
	expect(Value.Check(MarketplaceManifest, parrot)).toBe(true)
})

test("should allow setting a slug", () => {
	const guide: MarketplaceManifest = {
		id: "guide.inlang.example",
		slug: "examle-guide",
		displayName: { en: "My App" },
		description: { en: "Hello" },
		keywords: [],
		license: "Apache-2.0",
		readme: { en: "https://my-app.com/readme.md" },
		publisherName: "inlang",
	}
	expect(Value.Check(MarketplaceManifest, guide)).toBe(true)
})

test("should fail when slug is not valid", () => {
	const guide: MarketplaceManifest = {
		id: "guide.inlang.example",
		slug: "examle/gu ide",
		displayName: { en: "My App" },
		description: { en: "Hello" },
		keywords: [],
		license: "Apache-2.0",
		readme: { en: "https://my-app.com/readme.md" },
		publisherName: "inlang",
	}
	expect(Value.Check(MarketplaceManifest, guide)).toBe(false)
})
