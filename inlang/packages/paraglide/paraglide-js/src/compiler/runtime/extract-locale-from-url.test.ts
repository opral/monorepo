import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("normal named groups", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: "https://example.com/:bookstore/:item/:id",
					deLocalizedNamedGroups: { bookstore: "buchladen", item: "artikel" },
					localizedNamedGroups: {
						de: { bookstore: "buchladen", item: "artikel" },
						en: { bookstore: "bookstore", item: "item" },
					},
				},
			],
		},
	});

	expect(
		runtime.extractLocaleFromUrl(`https://example.com/bookstore/item/123`)
	).toBe("en");

	expect(
		runtime.extractLocaleFromUrl(`https://example.com/buchladen/artikel/123`)
	).toBe("de");

	expect(
		runtime.extractLocaleFromUrl(`https://example.com/something/else`)
	).toBe(undefined);
});

test("wildcards", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: "https://{:subdomain.}?:domain.:tld/:path*",
					deLocalizedNamedGroups: { locale: null },
					localizedNamedGroups: {
						de: { subdomain: "de", path: "startseite/ueber-uns" },
						en: { subdomain: null, path: "home/about-us" },
					},
				},
			],
		},
	});

	expect(
		runtime.extractLocaleFromUrl(`https://de.example.com/startseite/ueber-uns`)
	).toBe("de");

	expect(
		runtime.extractLocaleFromUrl(`https://example.com/home/about-us`)
	).toBe("en");
});

test("optional parameters", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: "https://example.com/:locale{/optional-subpage}?",
					deLocalizedNamedGroups: { locale: null },
					localizedNamedGroups: {
						de: { locale: "de" },
						en: { locale: "en" },
					},
				},
			],
		},
	});

	expect(runtime.extractLocaleFromUrl(`https://example.com/de`)).toBe("de");
	expect(runtime.extractLocaleFromUrl(`https://example.com/en`)).toBe("en");
	expect(
		runtime.extractLocaleFromUrl(`https://example.com/de/optional-subpage`)
	).toBe("de");
	expect(
		runtime.extractLocaleFromUrl(`https://example.com/en/optional-subpage`)
	).toBe("en");
});

test("regex works", async () => {
	const { extractLocaleFromUrl } = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de", "fr"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: "https://example.com/:locale(de|fr)?/**",
					deLocalizedNamedGroups: { locale: null },
					localizedNamedGroups: {
						en: { locale: null },
						fr: { locale: "fr" },
						de: { locale: "de" },
					},
				},
			],
		},
	});

	expect(extractLocaleFromUrl(`https://example.com/fr`)).toBe("fr");
	expect(extractLocaleFromUrl(`https://example.com/de`)).toBe("de");
	expect(extractLocaleFromUrl(`https://example.com/`)).toBe("en");

	expect(extractLocaleFromUrl(`https://example.com/de/subpage`)).toBe("de");
	expect(extractLocaleFromUrl(`https://example.com/subpage`)).toBe("en");
});

test("default url pattern", async () => {
	const r = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
	});

	expect(r.extractLocaleFromUrl("https://example.com/")).toBe("en");
	expect(r.extractLocaleFromUrl("https://example.com/de")).toBe("de");
	// anyhing other than a valid locale must be the base locale
	expect(r.extractLocaleFromUrl("https://example.com/fr")).toBe("en");

	expect(r.extractLocaleFromUrl("https://example.com/optional-subpage")).toBe(
		"en"
	);
	expect(
		r.extractLocaleFromUrl("https://example.com/de/optional-subpage")
	).toBe("de");
});

test("multi pathname localization with optional groups", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: "https://example.com/:bookstore?/:item?",
					deLocalizedNamedGroups: { bookstore: "bookstore", item: "item" },
					localizedNamedGroups: {
						de: { bookstore: "buchladen", "item?": "artikel" },
						en: { bookstore: "bookstore", "item?": "item" },
					},
				},
			],
		},
	});

	expect(runtime.extractLocaleFromUrl(`https://example.com/bookstore`)).toBe(
		"en"
	);

	expect(
		runtime.extractLocaleFromUrl(`https://example.com/bookstore/blaba`)
	).toBe(undefined);

	expect(runtime.extractLocaleFromUrl(`https://example.com/buchladen`)).toBe(
		"de"
	);

	expect(
		runtime.extractLocaleFromUrl(`https://example.com/something/else`)
	).toBe(undefined);
});

// https://github.com/opral/inlang-paraglide-js/issues/436
test("shouldn't match a pattern with explicit desire to not match locale", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: ":protocol://:domain(.*)::port?/:locale(en|de)?/:path(.*)?",
					deLocalizedNamedGroups: { locale: null },
					localizedNamedGroups: {
						en: { locale: "en" },
						de: { locale: "de" },
					},
				},
			],
		},
	});

	// no locale in url, should use preferredLanguage
	expect(
		runtime.extractLocaleFromUrl(new URL("https://example.com/home"))
	).toBe(undefined);

	expect(
		runtime.extractLocaleFromUrl(new URL("http://localhost:5173/"))
	).toBe(undefined);

	expect(
		runtime.extractLocaleFromUrl(new URL("https://example.com/en/home"))
	).toBe("en");

	expect(
		runtime.extractLocaleFromUrl(new URL("https://example.com/de/home"))
	).toBe("de");
});
