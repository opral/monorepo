import { describe, it, expect } from "vitest"
import { generateLinkHeader } from "./linkHeader"
import { PrefixStrategy } from "../routing/prefixStrategy"
import { NextRequest } from "next/server"

describe("generateLinkHeader", () => {
	it("generates the Link header for a Routing Strategy with only pathnames", () => {
		const strategy = PrefixStrategy({
			defaultLanguage: "en",
			availableLanguageTags: ["en", "de", "fr"],
			pathnames: {},
			exclude: () => false,
			prefix: "except-default",
		})

		const request = new NextRequest("https://example.com/base/some-page")
		request.nextUrl.basePath = "/base"

		const linkHeader = generateLinkHeader(strategy, {
			canonicalPath: "/",
			availableLanguageTags: ["en", "de", "fr"],
			request,
		})

		expect(linkHeader).includes('<https://example.com/base/de>; rel="alternate"; hreflang="de"')
		expect(linkHeader).includes('<https://example.com/base/fr>; rel="alternate"; hreflang="fr"')
		expect(linkHeader).includes('<https://example.com/base/>; rel="alternate"; hreflang="en"')
	})
})
