import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("parameters", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: "http{s}://*/:bookstore/:item/:id",
					localizedParams: {
						de: { bookstore: "buchladen", item: "artikel" },
						en: { bookstore: "bookstore", item: "item" },
					},
				},
			],
		},
	});

	expect(
		runtime.extractLocaleFromUrlV2(`https://example.com/bookstore/item/123`)
	).toBe("en");

	expect(
		runtime.extractLocaleFromUrlV2(`https://example.com/buchladen/artikel/123`)
	).toBe("de");

	expect(
		runtime.extractLocaleFromUrlV2(`https://example.com/something/else`)
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
					localizedParams: {
						de: { subdomain: "de", path: "startseite/ueber-uns" },
						en: { subdomain: null, path: "home/about-us" },
					},
				},
			],
		},
	});

	expect(
		runtime.extractLocaleFromUrlV2(
			`https://de.example.com/startseite/ueber-uns`
		)
	).toBe("de");

	expect(
		runtime.extractLocaleFromUrlV2(`https://example.com/home/about-us`)
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
					localizedParams: {
						de: { locale: "de" },
						en: { locale: "en" },
					},
				},
			],
		},
	});

	expect(runtime.extractLocaleFromUrlV2(`https://example.com/de`)).toBe("de");
	expect(runtime.extractLocaleFromUrlV2(`https://example.com/en`)).toBe("en");
	expect(
		runtime.extractLocaleFromUrlV2(`https://example.com/de/optional-subpage`)
	).toBe("de");
	expect(
		runtime.extractLocaleFromUrlV2(`https://example.com/en/optional-subpage`)
	).toBe("en");
});

test("regex works", async () => {
	const { extractLocaleFromUrlV2 } = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de", "fr"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: "https://example.com/:locale(de|fr)?/**",
					localizedParams: {
						de: { locale: "de" },
						fr: { locale: "fr" },
						en: { locale: null },
					},
				},
			],
		},
	});

	expect(extractLocaleFromUrlV2(`https://example.com/fr`)).toBe("fr");
	expect(extractLocaleFromUrlV2(`https://example.com/de`)).toBe("de");
	expect(extractLocaleFromUrlV2(`https://example.com/`)).toBe("en");

	expect(extractLocaleFromUrlV2(`https://example.com/de/subpage`)).toBe("de");
	expect(extractLocaleFromUrlV2(`https://example.com/subpage`)).toBe("en");
});
