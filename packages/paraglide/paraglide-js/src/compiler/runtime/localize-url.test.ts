import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("pathname based localization with ordering", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["url"],
			urlPatterns: [
				{
					pattern: ":protocol://:domain(.*)/:locale(de)?/:path(.*)?",
					namedGroups: {
						locale: [
							null,
							{
								en: null,
								de: "de",
							},
						],
						path: [
							// More specific paths first (ordering matters)
							"blog/about",
							{
								en: "blog/about",
								de: "artikel/ueber-uns",
							},
							"blog/:id",
							{
								en: "blog/:id",
								de: "artikel/:id",
							},
						],
					},
				},
			],
		},
	});

	// en to de - same path as no groups match
	expect(
		runtime.localizeUrl("https://example.com/home", { locale: "de" }).href
	).toBe("https://example.com/de/home");

	// de to en
	expect(
		runtime.localizeUrl("https://example.com/de/home", { locale: "en" }).href
	).toBe("https://example.com/home");

	// en === delocalized
	expect(
		runtime.localizeUrl("https://example.com/about", { locale: "en" }).href
	).toBe("https://example.com/about");

	// delocalizing de
	expect(runtime.deLocalizeUrl("https://example.com/de/about").href).toBe(
		"https://example.com/about"
	);

	// direct match
	expect(
		runtime.localizeUrl("https://example.com/blog/about", { locale: "de" }).href
	).toBe("https://example.com/de/artikel/ueber-uns");

	expect(
		runtime.deLocalizeUrl("https://example.com/de/artikel/ueber-uns").href
	).toBe("https://example.com/blog/about");

	// group matching
	expect(
		runtime.localizeUrl("https://example.com/blog/56", { locale: "de" }).href
	).toBe("https://example.com/de/artikel/56");

	expect(runtime.deLocalizeUrl("https://example.com/de/artikel/56").href).toBe(
		"https://example.com/blog/56"
	);
});

// test("cross domain urls", async () => {
// 	const runtime = await createRuntimeForTesting({
// 		baseLocale: "en",
// 		locales: ["en", "de"],
// 		compilerOptions: {
// 			strategy: ["url"],
// 			urlPatterns: [
// 				{
// 					pattern: "https://localhost::port/:locale(de|en)?/:path(.*)?",
// 					localizedNamedGroups: {
// 						en: { locale: "en" },
// 						de: { locale: "de" },
// 					},
// 					deLocalizedNamedGroups: { locale: null },
// 				},
// 				{
// 					pattern: "https://:domain(.*)/:path*",
// 					deLocalizedNamedGroups: { domain: "example.com" },
// 					localizedNamedGroups: {
// 						en: { domain: "example.com" },
// 						de: { domain: "de.example.com" },
// 					},
// 				},
// 			],
// 		},
// 	});

// 	// in development use localhost with different mapping
// 	expect(
// 		runtime.localizeUrl("https://localhost:5173/about", { locale: "de" }).href
// 	).toBe("https://localhost:5173/de/about");

// 	expect(
// 		runtime.localizeUrl("https://localhost:5173/about", { locale: "en" }).href
// 	).toBe("https://localhost:5173/en/about");

// 	expect(runtime.deLocalizeUrl("https://localhost:5173/de/about").href).toBe(
// 		"https://localhost:5173/about"
// 	);

// 	// DE routing
// 	expect(
// 		runtime.localizeUrl("https://de.example.com/about", { locale: "de" }).href
// 	).toBe("https://de.example.com/about");

// 	expect(
// 		runtime.localizeUrl("https://de.example.com/about", { locale: "en" }).href
// 	).toBe("https://example.com/about");

// 	// delocalizing
// 	expect(runtime.deLocalizeUrl("https://de.example.com/about").href).toBe(
// 		"https://example.com/about"
// 	);

// 	// EN routing
// 	expect(
// 		runtime.localizeUrl("https://example.com/about", { locale: "de" }).href
// 	).toBe("https://de.example.com/about");

// 	expect(
// 		runtime.localizeUrl("https://example.com/about", { locale: "en" }).href
// 	).toBe("https://example.com/about");

// 	// delocalizing
// 	expect(runtime.deLocalizeUrl("https://example.com/about").href).toBe(
// 		"https://example.com/about"
// 	);
// });

// test("multi tenancy", async () => {
// 	const runtime = await createRuntimeForTesting({
// 		baseLocale: "en",
// 		locales: ["en", "de", "fr"],
// 		compilerOptions: {
// 			strategy: ["url"],
// 			urlPatterns: [
// 				// 1) customer1.fr => root locale is fr, sub-locale is /en/
// 				{
// 					pattern: "https://customer1.fr/:locale(en)?/:path*",
// 					deLocalizedNamedGroups: { locale: null },
// 					localizedNamedGroups: {
// 						en: { locale: "en" },
// 						fr: { locale: null },
// 					},
// 				},
// 				// 2) customer2.com => root locale is en, sub-locale is /fr/
// 				{
// 					pattern: "https://customer2.com/:locale(fr)?/:path*",
// 					localizedNamedGroups: {
// 						en: { locale: null },
// 						fr: { locale: "fr" },
// 					},
// 					deLocalizedNamedGroups: { locale: "fr" },
// 				},
// 				// 3) Any other domain => path-based for en/fr
// 				{
// 					pattern: "https://:domain(.*)/:locale/:path*",
// 					deLocalizedNamedGroups: {},
// 					localizedNamedGroups: {
// 						en: { locale: "en" },
// 						fr: { locale: "fr" },
// 					},
// 				},
// 			],
// 		},
// 	});
// 	// customer 1 - localizing french to french
// 	expect(
// 		runtime.localizeUrl("https://customer1.fr/about", { locale: "fr" }).href
// 	).toBe("https://customer1.fr/about");

// 	// customer 1 - localizing from french to english
// 	expect(
// 		runtime.localizeUrl("https://customer1.fr/about", { locale: "en" }).href
// 	).toBe("https://customer1.fr/en/about");

// 	// customer 1 - de-localizing french
// 	expect(runtime.deLocalizeUrl("https://customer1.fr/en/about").href).toBe(
// 		"https://customer1.fr/about"
// 	);

// 	// customer 2 - english to english
// 	expect(
// 		runtime.localizeUrl("https://customer2.com/about", { locale: "en" }).href
// 	).toBe("https://customer2.com/about");

// 	// customer 2 - english to french
// 	expect(
// 		runtime.localizeUrl("https://customer2.com/about", { locale: "fr" }).href
// 	).toBe("https://customer2.com/fr/about");

// 	// customer 2 - de-localize french
// 	expect(runtime.deLocalizeUrl("https://customer2.com/about").href).toBe(
// 		"https://customer2.com/fr/about"
// 	);
// });

// test("providing a URL object as input", async () => {
// 	const runtime = await createRuntimeForTesting({
// 		baseLocale: "en",
// 		locales: ["en", "de"],
// 		compilerOptions: {
// 			strategy: ["url"],
// 			urlPatterns: [
// 				{
// 					pattern: "https://:domain(.*)/:path*",
// 					deLocalizedNamedGroups: { domain: "example.com" },
// 					localizedNamedGroups: {
// 						en: { domain: "example.com" },
// 						de: { domain: "de.example.com" },
// 					},
// 				},
// 			],
// 		},
// 	});

// 	const url = new URL("https://example.com/about");

// 	expect(runtime.localizeUrl(url, { locale: "de" }).href).toBe(
// 		"https://de.example.com/about"
// 	);

// 	expect(runtime.deLocalizeUrl(url).href).toBe("https://example.com/about");
// });

// test("localhost with portname", async () => {
// 	const runtime = await createRuntimeForTesting({
// 		baseLocale: "en",
// 		locales: ["en", "de"],
// 		compilerOptions: {
// 			strategy: ["url"],
// 			urlPatterns: [
// 				{
// 					pattern: ":protocol://:domain(.*)::port?/:locale(de)?/:path(.*)?",
// 					deLocalizedNamedGroups: { locale: null },
// 					localizedNamedGroups: {
// 						en: { locale: null },
// 						de: { locale: "de" },
// 					},
// 				},
// 			],
// 		},
// 	});

// 	// http
// 	expect(
// 		runtime.deLocalizeUrl(new URL("http://localhost:5173/de/about")).href
// 	).toBe("http://localhost:5173/about");

// 	// https
// 	expect(
// 		runtime.deLocalizeUrl(new URL("https://localhost:5173/de/about")).href
// 	).toBe("https://localhost:5173/about");

// 	// no port
// 	expect(
// 		runtime.deLocalizeUrl(new URL("https://localhost/de/about")).href
// 	).toBe("https://localhost/about");

// 	// pathnames
// 	expect(
// 		runtime.deLocalizeUrl(new URL("http://localhost:5173/about")).href
// 	).toBe("http://localhost:5173/about");

// 	expect(runtime.deLocalizeUrl(new URL("http://localhost:5173/")).href).toBe(
// 		"http://localhost:5173/"
// 	);

// 	expect(runtime.deLocalizeUrl(new URL("https://localhost:5173/de")).href).toBe(
// 		"https://localhost:5173/"
// 	);
// });

// test("it keeps the query parameters", async () => {
// 	const runtime = await createRuntimeForTesting({
// 		baseLocale: "en",
// 		locales: ["en", "de"],
// 		compilerOptions: {
// 			strategy: ["url"],
// 			urlPatterns: [
// 				{
// 					pattern: "https://:domain(.*)/:locale(de)?/:path*",
// 					deLocalizedNamedGroups: { locale: null },
// 					localizedNamedGroups: {
// 						en: { locale: null },
// 						de: { locale: "de" },
// 					},
// 				},
// 			],
// 		},
// 	});

// 	expect(
// 		runtime.localizeUrl("https://example.com/about?foo=bar&baz=qux", {
// 			locale: "de",
// 		}).href
// 	).toBe("https://example.com/de/about?foo=bar&baz=qux");

// 	expect(
// 		runtime.deLocalizeUrl("https://example.com/de/about?foo=bar&baz=qux").href
// 	).toBe("https://example.com/about?foo=bar&baz=qux");
// });

// test("it keeps the url hash", async () => {
// 	const runtime = await createRuntimeForTesting({
// 		baseLocale: "en",
// 		locales: ["en", "de"],
// 		compilerOptions: {
// 			strategy: ["url"],
// 			urlPatterns: [
// 				{
// 					pattern: "https://:domain(.*)/:locale(de)?/:path*",
// 					deLocalizedNamedGroups: { locale: null },
// 					localizedNamedGroups: {
// 						en: { locale: null },
// 						de: { locale: "de" },
// 					},
// 				},
// 			],
// 		},
// 	});

// 	expect(
// 		runtime.localizeUrl("https://example.com/about#test", { locale: "de" }).href
// 	).toBe("https://example.com/de/about#test");

// 	expect(runtime.deLocalizeUrl("https://example.com/de/about#test").href).toBe(
// 		"https://example.com/about#test"
// 	);
// });

// test("it keeps the url path", async () => {
// 	const runtime = await createRuntimeForTesting({
// 		baseLocale: "en",
// 		locales: ["en", "de"],
// 		compilerOptions: {
// 			strategy: ["url"],
// 			urlPatterns: [
// 				{
// 					pattern: "https://:subdomain?.example.com",
// 					deLocalizedNamedGroups: { subdomain: "en" },
// 					localizedNamedGroups: {
// 						en: { subdomain: "en" },
// 						de: { subdomain: "de" },
// 					},
// 				},
// 			],
// 		},
// 	});

// 	expect(
// 		runtime.localizeUrl("https://en.example.com/about", { locale: "de" }).href
// 	).toBe("https://de.example.com/about");

// 	expect(runtime.deLocalizeUrl("https://de.example.com/about").href).toBe(
// 		"https://en.example.com/about"
// 	);
// });

// test("uses getLocale when no locale is provided", async () => {
// 	const runtime = await createRuntimeForTesting({
// 		baseLocale: "en",
// 		locales: ["en", "de"],
// 		compilerOptions: {
// 			strategy: ["url"],
// 			urlPatterns: [
// 				{
// 					pattern: "https://:domain(.*)/:locale(de|en)?/:path(.*)?",
// 					deLocalizedNamedGroups: { locale: null },
// 					localizedNamedGroups: {
// 						en: { locale: "en" },
// 						de: { locale: "de" },
// 					},
// 				},
// 			],
// 		},
// 	});

// 	// Override getLocale to return German
// 	runtime.overwriteGetLocale(() => "de");

// 	expect(runtime.getLocale()).toBe("de");

// 	// Should use "de" from getLocale since no locale provided
// 	expect(runtime.localizeUrl("https://example.com/about").href).toBe(
// 		"https://example.com/de/about"
// 	);

// 	// Should still use explicit locale when provided
// 	expect(
// 		runtime.localizeUrl("https://example.com/about", { locale: "en" }).href
// 	).toBe("https://example.com/en/about");
// });

// // https://github.com/opral/inlang-paraglide-js/issues/381
// test.each([
// 	// empty url pattern will set TREE_SHAKE_DEFAULT_ULR_PATTERN_USED to true
// 	{},
// 	// real default url pattern to align behaviour
// 	{
// 		urlPatterns: [
// 			{
// 				pattern: ":protocol://:domain(.*)::port?/:locale(de|fr)?/:path(.*)?",
// 				deLocalizedNamedGroups: { locale: null },
// 				localizedNamedGroups: {
// 					en: { locale: null },
// 					de: { locale: "de" },
// 					fr: { locale: "fr" },
// 				},
// 			},
// 		],
// 	},
// ])("default url pattern", async (compilerOptions) => {
// 	const runtime = await createRuntimeForTesting({
// 		baseLocale: "en",
// 		locales: ["en", "de"],
// 		compilerOptions,
// 	});

// 	runtime.overwriteGetLocale(() => "en");

// 	expect(runtime.localizeUrl("https://example.com/about").href).toBe(
// 		"https://example.com/about"
// 	);

// 	runtime.overwriteGetLocale(() => "de");

// 	expect(runtime.localizeUrl("https://example.com/").href).toBe(
// 		"https://example.com/de/"
// 	);

// 	expect(runtime.localizeUrl("https://example.com/about").href).toBe(
// 		"https://example.com/de/about"
// 	);

// 	// Should still use explicit locale when provided
// 	expect(
// 		runtime.localizeUrl("https://example.com/about", { locale: "de" }).href
// 	).toBe("https://example.com/de/about");

// 	expect(
// 		runtime.localizeUrl("https://example.com/about", { locale: "en" }).href
// 	).toBe("https://example.com/about");

// 	expect(runtime.deLocalizeUrl("https://example.com/de/about").href).toBe(
// 		"https://example.com/about"
// 	);

// 	expect(runtime.deLocalizeUrl("https://example.com/about").href).toBe(
// 		"https://example.com/about"
// 	);
// });
