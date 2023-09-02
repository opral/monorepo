import { MarketplaceManifest, App } from "./interface.js"
import { test, expect } from "vitest"
import { Value } from "@sinclair/typebox/value"

test("a valid app manifest should pass validation", () => {
	const app: MarketplaceManifest = {
		type: "app",
		name: { en: "My App" },
		description: { en: "My App is the best app." },
		keywords: ["app", "best"],
		publisherName: "My Company",
		license: "Apache-2.0",
		website: "https://my-app.com",
		readme: { en: "https://my-app.com/readme" },
	}
	const errors = [...Value.Errors(App, app)]
	if (errors.length > 0) {
		console.log(errors)
	}
	expect(Value.Check(App, app)).toBe(true)
})
