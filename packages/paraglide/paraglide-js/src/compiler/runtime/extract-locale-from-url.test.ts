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
						de: { locale: "de" },
						fr: { locale: "fr" },
						en: { locale: null },
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
