import { test, expect } from "vitest";
import { createParaglide } from "../create-paraglide.js";
import { newProject } from "@inlang/sdk";

test("pathname based localization", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["url"],
		urlPatterns: [
			// literal match
			{
				pattern: "/blog/about",
				localized: [
					["en", "/blog/about"],
					["de", "/de/artikel/ueber-uns"],
				],
			},
			// parameter
			{
				pattern: "/blog/:id",
				localized: [
					["en", "/blog/:id"],
					["de", "/de/artikel/:id"],
				],
			},
			// wildcard
			{
				pattern: "/:path(.*)",
				localized: [
					["de", "/de/:path(.*)"],
					["en", "/:path(.*)"],
				],
			},
		],
	});

	// wildcard - en to de
	expect(
		runtime.localizeUrl("https://example.com/home", { locale: "de" }).href
	).toBe("https://example.com/de/home");

	// wildcard - de to en
	expect(
		runtime.localizeUrl("https://example.com/de/home", { locale: "en" }).href
	).toBe("https://example.com/home");

	// wildcard - en to en
	expect(
		runtime.localizeUrl("https://example.com/about", { locale: "en" }).href
	).toBe("https://example.com/about");

	// wildcard - delocalizing de
	expect(runtime.deLocalizeUrl("https://example.com/de/about").href).toBe(
		"https://example.com/about"
	);

	// literal match
	expect(
		runtime.localizeUrl("https://example.com/blog/about", { locale: "de" }).href
	).toBe("https://example.com/de/artikel/ueber-uns");

	expect(
		runtime.deLocalizeUrl("https://example.com/de/artikel/ueber-uns").href
	).toBe("https://example.com/blog/about");

	// parameter matching
	expect(
		runtime.localizeUrl("https://example.com/blog/56", { locale: "de" }).href
	).toBe("https://example.com/de/artikel/56");

	expect(runtime.deLocalizeUrl("https://example.com/de/artikel/56").href).toBe(
		"https://example.com/blog/56"
	);
});

test("cross domain urls", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["url"],
		urlPatterns: [
			// Development/deployment mapping
			{
				pattern: "https://localhost::port/:path*",
				localized: [
					["de", "https://localhost::port/de/:path*"],
					["en", "https://localhost::port/:path*"],
				],
			},
			// Domain based localization
			{
				pattern: "https://example.com/:path*",
				localized: [
					["en", "https://example.com/:path*"],
					["de", "https://de.example.com/:path*"],
				],
			},
		],
	});

	// in development use localhost with different mapping
	expect(
		runtime.localizeUrl("https://localhost:5173/about", { locale: "de" }).href
	).toBe("https://localhost:5173/de/about");

	expect(
		runtime.localizeUrl("https://localhost:5173/about", { locale: "en" }).href
	).toBe("https://localhost:5173/about");

	expect(runtime.deLocalizeUrl("https://localhost:5173/de/about").href).toBe(
		"https://localhost:5173/about"
	);

	// DE routing
	expect(
		runtime.localizeUrl("https://de.example.com/about", { locale: "de" }).href
	).toBe("https://de.example.com/about");

	expect(
		runtime.localizeUrl("https://de.example.com/about", { locale: "en" }).href
	).toBe("https://example.com/about");

	// delocalizing
	expect(runtime.deLocalizeUrl("https://de.example.com/about").href).toBe(
		"https://example.com/about"
	);

	// EN routing
	expect(
		runtime.localizeUrl("https://example.com/about", { locale: "de" }).href
	).toBe("https://de.example.com/about");

	expect(
		runtime.localizeUrl("https://example.com/about", { locale: "en" }).href
	).toBe("https://example.com/about");

	// delocalizing
	expect(runtime.deLocalizeUrl("https://example.com/about").href).toBe(
		"https://example.com/about"
	);
});

test("multi tenancy", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de", "fr"],
			},
		}),
		strategy: ["url"],
		urlPatterns: [
			// 1) customer1.fr => root path locale is fr, other locales via sub-path e.g. /en/
			{
				pattern: "https://customer1.fr/:path*",
				localized: [
					["en", "https://customer1.fr/en/:path*"],
					["fr", "https://customer1.fr/:path*"],
				],
			},
			// 2) customer2.com => root path locale is en, other locales via sub-path e.g. /fr/
			{
				pattern: "https://customer2.com/:path*",
				localized: [
					["fr", "https://customer2.com/fr/:path*"],
					["en", "https://customer2.com/:path*"],
				],
			},
			// 3) Any other domain => path-based for en/fr
			{
				pattern: "https://:domain(.*)/:path*",
				localized: [
					["en", "https://:domain(.*)/en/:path*"],
					["fr", "https://:domain(.*)/fr/:path*"],
				],
			},
		],
	});
	// customer 1 - localizing french to french
	expect(
		runtime.localizeUrl("https://customer1.fr/about", { locale: "fr" }).href
	).toBe("https://customer1.fr/about");

	// customer 1 - localizing from french to english
	expect(
		runtime.localizeUrl("https://customer1.fr/about", { locale: "en" }).href
	).toBe("https://customer1.fr/en/about");

	// customer 1 - de-localizing french
	expect(runtime.deLocalizeUrl("https://customer1.fr/en/about").href).toBe(
		"https://customer1.fr/about"
	);

	// customer 2 - english to english
	expect(
		runtime.localizeUrl("https://customer2.com/about", { locale: "en" }).href
	).toBe("https://customer2.com/about");

	// customer 2 - english to french
	expect(
		runtime.localizeUrl("https://customer2.com/about", { locale: "fr" }).href
	).toBe("https://customer2.com/fr/about");

	// customer 2 - de-localize french
	expect(runtime.deLocalizeUrl("https://customer2.com/fr/about").href).toBe(
		"https://customer2.com/about"
	);
});

test("providing a URL object as input", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["url"],
		urlPatterns: [
			{
				pattern: "https://:domain(.*)/:path*",
				localized: [
					["en", "https://:domain(.*)/:path*"],
					["de", "https://de.:domain(.*)/:path*"],
				],
			},
		],
	});

	const url = new URL("https://example.com/about");

	expect(runtime.localizeUrl(url, { locale: "de" }).href).toBe(
		"https://de.example.com/about"
	);

	expect(runtime.deLocalizeUrl(url).href).toBe("https://example.com/about");
});

test("localhost with portname", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["url"],
		urlPatterns: [
			{
				pattern: ":protocol://:domain(.*)::port?/:path(.*)?",
				localized: [
					["de", ":protocol://:domain(.*)::port?/de/:path(.*)?"],
					["en", ":protocol://:domain(.*)::port?/:path(.*)?"],
				],
			},
		],
	});

	// http
	expect(
		runtime.deLocalizeUrl(new URL("http://localhost:5173/de/about")).href
	).toBe("http://localhost:5173/about");

	// https
	expect(
		runtime.deLocalizeUrl(new URL("https://localhost:5173/de/about")).href
	).toBe("https://localhost:5173/about");

	// no port
	expect(
		runtime.deLocalizeUrl(new URL("https://localhost/de/about")).href
	).toBe("https://localhost/about");

	// pathnames
	expect(
		runtime.deLocalizeUrl(new URL("http://localhost:5173/about")).href
	).toBe("http://localhost:5173/about");

	expect(runtime.deLocalizeUrl(new URL("http://localhost:5173/")).href).toBe(
		"http://localhost:5173/"
	);

	expect(runtime.deLocalizeUrl(new URL("https://localhost:5173/de")).href).toBe(
		"https://localhost:5173/"
	);
});

test("it keeps the query parameters", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["url"],
		urlPatterns: [
			{
				pattern: "https://:domain(.*)/:path(.*)?",
				localized: [
					["de", "https://:domain(.*)/de/:path(.*)?"],
					["en", "https://:domain(.*)/:path(.*)?"],
				],
			},
		],
	});

	expect(
		runtime.localizeUrl("https://example.com/about?foo=bar&baz=qux", {
			locale: "de",
		}).href
	).toBe("https://example.com/de/about?foo=bar&baz=qux");

	expect(
		runtime.deLocalizeUrl("https://example.com/de/about?foo=bar&baz=qux").href
	).toBe("https://example.com/about?foo=bar&baz=qux");
});

test("it keeps the url hash", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["url"],
		urlPatterns: [
			{
				pattern: "https://:domain(.*)/:path(.*)?",
				localized: [
					["de", "https://:domain(.*)/de/:path(.*)?"],
					["en", "https://:domain(.*)/:path(.*)?"],
				],
			},
		],
	});

	expect(
		runtime.localizeUrl("https://example.com/about#test", { locale: "de" }).href
	).toBe("https://example.com/de/about#test");

	expect(runtime.deLocalizeUrl("https://example.com/de/about#test").href).toBe(
		"https://example.com/about#test"
	);
});

// URL Pattern implicitly matches all paths
//
// The pattern https://example.com is interpreted as https://example.com.*
// It effectively matches every path under https://example.com/
// This means any request, including https://example.com/about, will match.
test("it keeps the url path", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["url"],
		urlPatterns: [
			{
				pattern: "https://example.com",
				localized: [
					["de", "https://example.de"],
					["en", "https://example.com"],
				],
			},
		],
	});

	expect(
		runtime.localizeUrl("https://example.com/about", { locale: "de" }).href
	).toBe("https://example.de/about");

	expect(runtime.deLocalizeUrl("https://example.de/about").href).toBe(
		"https://example.com/about"
	);
});

test("uses getLocale when no locale is provided", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["url"],
		urlPatterns: [
			{
				pattern: "https://:domain(.*)/:path(.*)?",
				localized: [
					["de", "https://:domain(.*)/de/:path(.*)?"],
					["en", "https://:domain(.*)/en/:path(.*)?"],
				],
			},
		],
	});

	// Override getLocale to return German
	runtime.overwriteGetLocale(() => "de");

	expect(runtime.getLocale()).toBe("de");

	// Should use "de" from getLocale since no locale provided
	expect(runtime.localizeUrl("https://example.com/about").href).toBe(
		"https://example.com/de/about"
	);

	// Should still use explicit locale when provided
	expect(
		runtime.localizeUrl("https://example.com/about", { locale: "en" }).href
	).toBe("https://example.com/en/about");
});

// https://github.com/opral/inlang-paraglide-js/issues/381
test.each([
	// empty url pattern will set TREE_SHAKE_DEFAULT_ULR_PATTERN_USED to true
	{},
	// real default url pattern to align behaviour
	{
		urlPatterns: [
			{
				pattern: ":protocol://:domain(.*)::port?/:path(.*)?",
				localized: [
					["de", ":protocol://:domain(.*)::port?/de/:path(.*)?"],
					["en", ":protocol://:domain(.*)::port?/:path(.*)?"],
				] as [string, string][],
			},
		],
	},
])("default url pattern", async (compilerOptions) => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		...compilerOptions,
	});

	runtime.overwriteGetLocale(() => "en");

	expect(runtime.localizeUrl("https://example.com/about").href).toBe(
		"https://example.com/about"
	);

	runtime.overwriteGetLocale(() => "de");

	expect(runtime.localizeUrl("https://example.com/").href).toBe(
		"https://example.com/de/"
	);

	expect(runtime.localizeUrl("https://example.com/about").href).toBe(
		"https://example.com/de/about"
	);

	// Should still use explicit locale when provided
	expect(
		runtime.localizeUrl("https://example.com/about", { locale: "de" }).href
	).toBe("https://example.com/de/about");

	expect(
		runtime.localizeUrl("https://example.com/about", { locale: "en" }).href
	).toBe("https://example.com/about");

	expect(runtime.deLocalizeUrl("https://example.com/de/about").href).toBe(
		"https://example.com/about"
	);

	expect(runtime.deLocalizeUrl("https://example.com/about").href).toBe(
		"https://example.com/about"
	);
});

test("auto fills the url base path", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["url"],
		urlPatterns: [
			{
				pattern: "/:path(.*)?",
				localized: [
					["de", "/de/:path(.*)?"],
					["en", "/:path(.*)?"],
				],
			},
		],
	});

	expect(
		runtime.localizeUrl("https://example.com/about", { locale: "en" }).href
	).toBe("https://example.com/about");

	expect(
		runtime.localizeUrl("https://example.com/about", { locale: "de" }).href
	).toBe("https://example.com/de/about");

	expect(runtime.deLocalizeUrl("https://example.com/de/about").href).toBe(
		"https://example.com/about"
	);
});

// https://github.com/opral/inlang-paraglide-js/issues/454
test("works with no trailing slash at the end", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["url"],
		urlPatterns: [
			{
				pattern: "/:path(.*)?",
				localized: [
					["en", "/en/:path(.*)?"],
					["de", "/de/:path(.*)?"],
				],
			},
		],
	});

	expect(runtime.deLocalizeUrl("https://example.com/en/").href).toBe(
		"https://example.com/"
	);

	expect(runtime.deLocalizeUrl("https://example.com/en").href).toBe(
		"https://example.com/"
	);
});

// https://github.com/opral/inlang-paraglide-js/issues/452#issuecomment-2715761308
test("falls through if no match is found", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["url"],
		urlPatterns: [
			{
				pattern: "/about",
				localized: [
					["de", "/ueber"],
					["en", "/about"],
				],
			},
		],
	});

	expect(
		runtime.localizeUrl("https://example.com/", { locale: "en" }).href
	).toBe("https://example.com/");

	expect(runtime.deLocalizeUrl("https://example.com/").href).toBe(
		"https://example.com/"
	);
});

test("defining no localized pattern leads to a fallthrough", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["url"],
		urlPatterns: [
			{
				pattern: "/specific-path",
				localized: [["en", "/specific-path"]],
			},
		],
	});

	// doesn't localize because no localized pattern is defined
	expect(
		runtime.localizeUrl("https://example.com/specific-path", { locale: "de" })
			.href
	).toBe("https://example.com/specific-path");

	// doesn't delocalize because no localized pattern is defined
	expect(
		runtime.deLocalizeUrl("https://example.com/de/specific-path").href
	).toBe("https://example.com/de/specific-path");
});

// https://github.com/opral/inlang-paraglide-js/issues/456
test("routing to a 404 page", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["url"],
		urlPatterns: [
			{
				pattern: "/404",
				localized: [
					["en", "/404"],
					["de", "/de/404"],
				],
			},
			{
				pattern: "specific-path",
				localized: [
					["en", "/specific-path"],
					["de", "/de/404"],
				],
			},
			{
				pattern: "/:path(.*)?",
				localized: [
					["en", "/:path(.*)?"],
					["de", "/de/:path(.*)?"],
				],
			},
		],
	});

	expect(
		runtime.localizeUrl("https://example.com/specific-path", { locale: "en" })
			.href
	).toBe("https://example.com/specific-path");

	// localizing to a 404 page
	expect(
		runtime.localizeUrl("https://example.com/specific-path", { locale: "de" })
			.href
	).toBe("https://example.com/de/404");

	// other paths work because of the catch all
	expect(
		runtime.localizeUrl("https://example.com/other-path", { locale: "de" }).href
	).toBe("https://example.com/de/other-path");
});

// Test showing the importance of pattern order in the localized array
test("pattern order in localized array - correct order (specific first)", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["url"],
		urlPatterns: [
			{
				pattern: "/:path(.*)?",
				localized: [
					// CORRECT ORDER: more specific pattern first
					["de", "/de/:path(.*)?"], // More specific pattern with prefix
					["en", "/:path(.*)?"], // Less specific pattern without prefix
				],
			},
		],
	});

	// These should work correctly with the specific (de) pattern first
	expect(
		runtime.localizeUrl("https://example.com/about", { locale: "en" }).href
	).toBe("https://example.com/about");

	expect(
		runtime.localizeUrl("https://example.com/about", { locale: "de" }).href
	).toBe("https://example.com/de/about");

	// Delocalization should work correctly too
	expect(runtime.deLocalizeUrl("https://example.com/de/about").href).toBe(
		"https://example.com/about"
	);
});

// Test showing the importance of pattern order in the localized array
test("pattern order in localized array - incorrect order (generic first)", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["url"],
		urlPatterns: [
			{
				pattern: "/:path(.*)?",
				localized: [
					// INCORRECT ORDER: less specific pattern first
					["en", "/:path(.*)?"], // Less specific pattern without prefix
					["de", "/de/:path(.*)?"], // More specific pattern with prefix that may never match
				],
			},
		],
	});

	// English localization works as expected
	expect(
		runtime.localizeUrl("https://example.com/about", { locale: "en" }).href
	).toBe("https://example.com/about");

	// German localization still works when explicitly requested
	expect(
		runtime.localizeUrl("https://example.com/about", { locale: "de" }).href
	).toBe("https://example.com/de/about");

	// The problem happens with delocalization:
	// With incorrect pattern order, the generic /:path(.*)?
	// pattern matches first and swallows the /de/ prefix
	expect(runtime.deLocalizeUrl("https://example.com/de/about").href).toBe(
		"https://example.com/de/about"
	); // Should be "https://example.com/about"
});

// Test for port number issue with specific port numbers in the URL pattern
test("handles explicit port numbers in URL patterns correctly", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["url"],
		urlPatterns: [
			{
				// Using explicit port number - this causes issues with deLocalizeUrl
				pattern: "http://localhost:5173/:path(.*)?",
				localized: [
					["de", "http://localhost:5173/de/:path(.*)?"],
					["en", "http://localhost:5173/:path(.*)?"],
				],
			},
		],
	});

	// Localization should work correctly
	expect(
		runtime.localizeUrl("http://localhost:5173/about", { locale: "de" }).href
	).toBe("http://localhost:5173/de/about");

	expect(
		runtime.localizeUrl("http://localhost:5173/about", { locale: "en" }).href
	).toBe("http://localhost:5173/about");

	// This is where the bug occurs - delocalizing a URL with a port number
	// The port number (5173) is incorrectly treated as a path parameter
	expect(runtime.deLocalizeUrl("http://localhost:5173/de/about").href).toBe(
		"http://localhost:5173/about"
	);
});

// Test for the correct approach using port as a pattern parameter
test("correctly handles port numbers as pattern parameters", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["url"],
		urlPatterns: [
			{
				// Using port as a proper pattern parameter with :: syntax
				pattern: "http://localhost::port/:path(.*)?",
				localized: [
					["de", "http://localhost::port/de/:path(.*)?"],
					["en", "http://localhost::port/:path(.*)?"],
				],
			},
		],
	});

	// Localization should work correctly
	expect(
		runtime.localizeUrl("http://localhost:5173/about", { locale: "de" }).href
	).toBe("http://localhost:5173/de/about");

	expect(
		runtime.localizeUrl("http://localhost:5173/about", { locale: "en" }).href
	).toBe("http://localhost:5173/about");

	// Delocalization should also work correctly with the proper pattern
	expect(runtime.deLocalizeUrl("http://localhost:5173/de/about").href).toBe(
		"http://localhost:5173/about"
	);
});
