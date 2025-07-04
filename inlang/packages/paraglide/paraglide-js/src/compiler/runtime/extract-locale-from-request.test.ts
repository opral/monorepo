import { newProject } from "@inlang/sdk";
import { expect, test } from "vitest";
import { createParaglide } from "../create-paraglide.js";

test("returns the locale from the cookie", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr"],
			},
		}),
		strategy: ["cookie"],
		cookieName: "PARAGLIDE_LOCALE",
	});
	const request = new Request("http://example.com", {
		headers: {
			cookie: `PARAGLIDE_LOCALE=fr`,
		},
	});
	const locale = runtime.extractLocaleFromRequest(request);
	expect(locale).toBe("fr");
});

test("returns the locale from the pathname for document requests", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en"],
			},
		}),
		strategy: ["url", "baseLocale"],
		urlPatterns: [
			{
				pattern: "https://example.com/:path(.*)",
				localized: [["en", "https://example.com/en/:path(.*)"]],
			},
		],
	});
	const request = new Request("https://example.com/en/home", {
		headers: {
			"Sec-Fetch-Dest": "document",
		},
	});
	const locale = runtime.extractLocaleFromRequest(request);
	expect(locale).toBe("en");
});

test("returns the baseLocale if no other strategy matches", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en"],
			},
		}),
		strategy: ["baseLocale"],
	});
	const request = new Request("http://example.com");
	const locale = runtime.extractLocaleFromRequest(request);
	expect(locale).toBe("en");
});

test("throws an error if no locale is found", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en"],
			},
		}),
		strategy: ["cookie"],
	});
	const request = new Request("http://example.com");
	expect(() => runtime.extractLocaleFromRequest(request)).toThrow(
		"No locale found. There is an error in your strategy. Try adding 'baseLocale' as the very last strategy."
	);
});

test("returns the preferred locale from Accept-Language header", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr", "de"],
			},
		}),
		strategy: ["preferredLanguage", "baseLocale"],
	});

	// simple direct match
	const request = new Request("http://example.com", {
		headers: {
			"Accept-Language": "en-US;q=0.8,fr;q=0.9,de;q=0.6",
		},
	});
	const locale = runtime.extractLocaleFromRequest(request);
	expect(locale).toBe("fr");

	// language tag match
	const request2 = new Request("http://example.com", {
		headers: {
			"Accept-Language": "en-US;q=0.8,nl;q=0.9,de;q=0.7",
		},
	});
	const locale2 = runtime.extractLocaleFromRequest(request2);
	// Since "nl" isn't in our locales, and "de" has the highest q-value after "nl"
	expect(locale2).toBe("en");

	// no match
	const request3 = new Request("http://example.com", {
		headers: {
			"Accept-Language": "nl;q=0.9,es;q=0.6",
		},
	});
	const locale3 = runtime.extractLocaleFromRequest(request3);
	expect(locale3).toBe("en");
});

test("should fall back to next strategy when cookie contains invalid locale", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr"],
			},
		}),
		strategy: ["cookie", "baseLocale"],
		cookieName: "PARAGLIDE_LOCALE",
	});

	// Request with an invalid locale in cookie
	const request = new Request("http://example.com", {
		headers: {
			cookie: `PARAGLIDE_LOCALE=invalid_locale`,
		},
	});

	// Should fall back to baseLocale
	expect(runtime.extractLocaleFromRequest(request)).toBe("en");
});

test("skips over localStorage strategy as it is not supported on the server", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr"],
			},
		}),
		strategy: ["localStorage", "baseLocale"],
	});

	const request = new Request("http://example.com");

	// expecting baseLocale
	expect(runtime.extractLocaleFromRequest(request)).toBe("en");
});

test("resolves the locale from the url for all request types", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr"],
			},
		}),
		strategy: ["url", "baseLocale"],
		urlPatterns: [
			{
				pattern: "https://example.com/:path(.*)",
				localized: [
					["en", "https://example.com/en/:path(.*)"],
					["fr", "https://example.com/fr/:path(.*)"],
				],
			},
		],
	});

	// Non-document request should still use URL strategy
	const request = new Request("https://example.com/fr/home", {
		headers: {
			"Sec-Fetch-Dest": "something",
		},
	});
	const locale = runtime.extractLocaleFromRequest(request);
	expect(locale).toBe("fr");
});

test("cookie strategy precedes URL strategy for API requests with wildcards", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr", "de"],
			},
		}),
		strategy: ["cookie", "url", "baseLocale"],
		cookieName: "PARAGLIDE_LOCALE",
		urlPatterns: [
			{
				pattern: "https://example.com/:path(.*)",
				localized: [
					["fr", "https://example.com/fr/:path(.*)"],
					["de", "https://example.com/de/:path(.*)"],
					["en", "https://example.com/:path(.*)"],
				],
			},
		],
	});

	// API request with cookie should use cookie locale
	const apiRequestWithCookie = new Request("https://example.com/api/data", {
		headers: {
			"Sec-Fetch-Dest": "empty",
			cookie: "PARAGLIDE_LOCALE=de",
		},
	});
	const apiLocale = runtime.extractLocaleFromRequest(apiRequestWithCookie);
	expect(apiLocale).toBe("de");

	// API request without cookie should fall back to URL strategy
	const apiRequestNoMatch = new Request("https://example.com/api/data", {
		headers: {
			"Sec-Fetch-Dest": "empty",
		},
	});
	const fallbackLocale = runtime.extractLocaleFromRequest(apiRequestNoMatch);
	expect(fallbackLocale).toBe("en");
});

// https://github.com/opral/inlang-paraglide-js/issues/436
test("preferredLanguage precedence over url", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["url", "preferredLanguage"],
		urlPatterns: [
			{
				pattern: ":protocol://:domain(.*)::port??/:path(.*)?",
				localized: [
					["de", ":protocol://:domain(.*)::port?/de/:path(.*)?"],
					["en", ":protocol://:domain(.*)::port?/en/:path(.*)?"],
				],
			},
		],
	});

	// no locale in url, should use preferredLanguage
	const request = new Request("https://example.com/home", {
		headers: {
			"Sec-Fetch-Dest": "document",
			"Accept-Language": "de;q=0.9,en;q=0.8",
		},
	});

	const locale = runtime.extractLocaleFromRequest(request);
	expect(locale).toBe("de");
});

test("sync version no longer supports custom strategies", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr", "de"],
			},
		}),
		strategy: ["custom-header", "baseLocale"],
	});

	// Define a custom strategy that extracts locale from a custom header
	runtime.defineCustomServerStrategy("custom-header", {
		getLocale: (request) =>
			request?.headers.get("X-Custom-Locale") ?? undefined,
	});

	const request = new Request("http://example.com", {
		headers: {
			"X-Custom-Locale": "fr",
		},
	});

	// Sync version skips custom strategies and falls back to baseLocale
	const locale = runtime.extractLocaleFromRequest(request);
	expect(locale).toBe("en"); // baseLocale fallback
});

test("sync version skips custom strategy and falls back to next built-in strategy", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr"],
			},
		}),
		strategy: ["custom-fallback", "baseLocale"],
	});

	runtime.defineCustomServerStrategy("custom-fallback", {
		getLocale: () => undefined,
	});

	const request = new Request("http://example.com");
	const locale = runtime.extractLocaleFromRequest(request);
	expect(locale).toBe("en"); // Should fall back to baseLocale (skipping custom strategy)
});

test("sync version uses built-in strategies instead of custom strategies", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr", "de"],
			},
		}),
		strategy: ["custom-priority", "cookie", "baseLocale"],
		cookieName: "PARAGLIDE_LOCALE",
	});

	runtime.defineCustomServerStrategy("custom-priority", {
		getLocale: () => "de",
	});

	const request = new Request("http://example.com", {
		headers: {
			cookie: "PARAGLIDE_LOCALE=fr", // Cookie has different locale
		},
	});

	const locale = runtime.extractLocaleFromRequest(request);
	expect(locale).toBe("fr"); // Should use cookie since custom strategy is skipped in sync version
});

test("sync version skips all custom strategies and uses baseLocale", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr", "de"],
			},
		}),
		strategy: ["custom-first", "custom-second", "baseLocale"],
	});

	runtime.defineCustomServerStrategy("custom-first", {
		getLocale: () => undefined,
	});

	runtime.defineCustomServerStrategy("custom-second", {
		getLocale: () => "fr",
	});

	const request = new Request("http://example.com");
	const locale = runtime.extractLocaleFromRequest(request);
	expect(locale).toBe("en"); // Should skip all custom strategies and use baseLocale
});
