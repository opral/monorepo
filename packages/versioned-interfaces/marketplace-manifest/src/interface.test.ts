import { MarketplaceManifest } from "./interface.js"
import { test, expect } from "vitest"
import { Value } from "@sinclair/typebox/value"

test("a valid app manifest should pass validation", () => {
	const app: MarketplaceManifest = {
		id: "library.inlang.paraglideJsSveltekit",
		coverImage: "https://inlang.com/images/paraglidejs.png",
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
		coverImage: "https://inlang.com/images/paraglidejs.png",
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
		coverImage: "https://inlang.com/images/paraglidejs.png",
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
		coverImage: "https://inlang.com/images/paraglidejs.png",
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
