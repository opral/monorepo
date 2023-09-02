import { MarketplaceManifest } from "./interface.js"
import { test, expect } from "vitest"
import { Value } from "@sinclair/typebox/value"

test("a valid app manifest should pass validation", () => {
	const app: MarketplaceManifest = {
		id: "app.inlang.paraglideJs",
		name: { en: "My App" },
		publisherName: "inlang",
		description: { en: "My App is the best app." },
		keywords: ["app", "best"],
		license: "Apache-2.0",
		website: "https://my-app.com",
		readme: { en: "https://my-app.com/readme" },
	}
	const errors = [...Value.Errors(MarketplaceManifest, app)]
	if (errors.length > 0) {
		console.log(errors)
	}
	expect(Value.Check(MarketplaceManifest, app)).toBe(true)
})
