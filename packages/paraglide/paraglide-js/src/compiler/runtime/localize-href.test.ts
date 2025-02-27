import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("uses the locale from getLocale() if no locale is provided", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["url", "globalVariable", "baseLocale"],
			urlPatterns: [
				{
					pattern: "http://:domain(.*)/:locale(de|en)?/:path(.*)?",
					deLocalizedNamedGroups: { locale: null },
					localizedNamedGroups: { de: { locale: "de" }, en: { locale: "en" } },
				},
			],
		},
	});

	runtime.overwriteGetLocale(() => "de");

	expect(runtime.localizeHref("/hello")).toBe("/de/hello");
	expect(runtime.deLocalizeHref("/de/hello")).toBe("/hello");
});

test("returns an absolute href if the provided href is absolute", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["url", "globalVariable", "baseLocale"],
			urlPatterns: [
				{
					pattern: "http://:domain(.*)/:locale(de|en)?/:path(.*)?",
					deLocalizedNamedGroups: { locale: null },
					localizedNamedGroups: { de: { locale: "de" }, en: { locale: "en" } },
				},
			],
		},
	});

	expect(
		runtime.localizeHref("http://example.com/hello", { locale: "de" })
	).toBe("http://example.com/de/hello");
	expect(runtime.deLocalizeHref("http://example.com/de/hello")).toBe(
		"http://example.com/hello"
	);
});

// useful if domain based localization is used for example
test("returns an absolute href if the provided href is relative but the origin of the localized href differs", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["url", "globalVariable", "baseLocale"],
			urlPatterns: [
				{
					pattern: "http://:domain(.*)/:path(.*)?",
					deLocalizedNamedGroups: { domain: "example.com" },
					localizedNamedGroups: {
						de: { domain: "de.example.com" },
						en: { domain: "example.com" },
					},
				},
			],
		},
	});

	// simulating routing from current en page to de page
	runtime.overwriteGetLocale(() => "en");

	expect(runtime.localizeHref("/hello", { locale: "de" })).toBe(
		"http://de.example.com/hello"
	);
	expect(runtime.deLocalizeHref("http://de.example.com/hello")).toBe(
		"http://example.com/hello"
	);

	// simulating routing from current de page to en page
	runtime.overwriteGetLocale(() => "de");

	expect(runtime.localizeHref("/hello", { locale: "en" })).toBe(
		"http://example.com/hello"
	);
	expect(runtime.deLocalizeHref("http://example.com/hello")).toBe(
		"http://example.com/hello"
	);
});

// https://github.com/opral/inlang-paraglide-js/issues/362
test("adding a base path", async () => {
	const base = "shop";

	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["url"],
			urlPatterns: [
				{
					pattern: `:protocol://:domain(.*)::port?/:base(${base})?/:locale(en|de)?/:path(.*)?`,
					deLocalizedNamedGroups: { base, locale: null },
					localizedNamedGroups: {
						en: { base, locale: "en" },
						de: { base, locale: "de" },
					},
				},
			],
		},
	});

	// simulating the current locale to be en
	runtime.overwriteGetLocale(() => "en");

	expect(runtime.localizeHref("/about")).toBe("/shop/en/about");
	expect(runtime.deLocalizeHref("/about")).toBe("/shop/about");

	// simulating current locale to be fde
	runtime.overwriteGetLocale(() => "de");
	expect(runtime.localizeHref("/about")).toBe("/shop/de/about");
	expect(runtime.deLocalizeHref("/de/about")).toBe("/shop/about");
});

test("default url patterns to improve out of the box experience", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de", "fr"],
		compilerOptions: {
			strategy: ["url"],
			urlPatterns: undefined,
		},
	});

	// polyfilling window
	globalThis.window = { location: new URL("http://example.com") } as any;

	expect(runtime.urlPatterns).toStrictEqual([
		{
			pattern: ":protocol://:domain(.*)::port?/:locale(de|fr)?/:path(.*)?",
			deLocalizedNamedGroups: { locale: null },
			localizedNamedGroups: {
				en: { locale: null },
				de: { locale: "de" },
				fr: { locale: "fr" },
			},
		},
	]);

	// expecting the baseLocale to not be included in the url
	expect(runtime.localizeHref("/about", { locale: "en" })).toBe("/about");
	expect(runtime.localizeHref("/about", { locale: "de" })).toBe("/de/about");

	// expecting root path to work
	expect(runtime.localizeHref("/", { locale: "en" })).toBe("/");
	expect(runtime.localizeHref("/", { locale: "de" })).toBe("/de/");

	// expecting de-localization to work
	expect(runtime.deLocalizeHref("/de/")).toBe("/");
	expect(runtime.deLocalizeHref("/de/about")).toBe("/about");
	expect(runtime.deLocalizeHref("/about")).toBe("/about");

	// expecting localhost to work (for development)
	expect(runtime.localizeHref("http://localhost:5173/", { locale: "de" })).toBe(
		"http://localhost:5173/de/"
	);

	// de-localizing localhost
	expect(runtime.deLocalizeHref("http://localhost:5173/de")).toBe(
		"http://localhost:5173/"
	);

	// pathnames
	expect(
		runtime.localizeHref("http://localhost:5173/about", { locale: "de" })
	).toBe("http://localhost:5173/de/about");

	expect(runtime.deLocalizeHref("http://localhost:5173/de/about")).toBe(
		"http://localhost:5173/about"
	);
});

test("multi pathname localization with optional groups", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: "http://example.com/:bookstore?/:item?",
					deLocalizedNamedGroups: {
						"bookstore?": "bookstore",
						"item?": "item",
					},
					localizedNamedGroups: {
						de: { "bookstore?": "buchladen", "item?": "artikel" },
						en: { "bookstore?": "bookstore", "item?": "item" },
					},
				},
			],
		},
	});

	expect(
		runtime.localizeHref("http://example.com/bookstore", { locale: "de" })
	).toBe("http://example.com/buchladen");

	expect(
		runtime.localizeHref("http://example.com/bookstore/item", { locale: "de" })
	).toBe("http://example.com/buchladen/artikel");

	expect(
		runtime.localizeHref("http://example.com/bookstore/item", { locale: "en" })
	).toBe("http://example.com/bookstore/item");

	expect(runtime.deLocalizeHref("http://example.com/buchladen/artikel")).toBe(
		"http://example.com/bookstore/item"
	);

	expect(runtime.deLocalizeHref("http://example.com/buchladen")).toBe(
		"http://example.com/bookstore"
	);

	expect(
		runtime.extractLocaleFromUrl(`http://example.com/bookstore/blaba`)
	).toBe(undefined);

	expect(runtime.extractLocaleFromUrl(`http://example.com/buchladen`)).toBe(
		"de"
	);

	expect(
		runtime.extractLocaleFromUrl(`http://example.com/something/else`)
	).toBe(undefined);
});