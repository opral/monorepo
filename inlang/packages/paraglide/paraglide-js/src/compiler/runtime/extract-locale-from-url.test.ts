import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("parameters", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: "http{s}\\://:domain/:bookstore/:item/:id",
					localizedParams: {
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
					pattern: "http{s}\\://:domain/*path",
					localizedParams: {
						de: { domain: "de.example.com", path: ["startseite", "ueber-uns"] },
						en: { domain: "example.com", path: ["home", "about-us"] },
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
					pattern: "https\\://example.com/:locale{/optional-subpage}",
					localizedParams: {
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

test("ambigious match returns undefined", async () => {
	const { extractLocaleFromUrl } = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: "http{s}\\://example.com/:locale{/*path}",
					localizedParams: {
						de: { locale: "de" },
					},
				},
			],
		},
	});

	expect(extractLocaleFromUrl(`https://example.com/de`)).toBe("de");
	expect(extractLocaleFromUrl(`https://example.com/`)).toBe(undefined);

	expect(extractLocaleFromUrl(`https://example.com/de/subpage`)).toBe("de");
	expect(extractLocaleFromUrl(`https://example.com/subpage`)).toBe(undefined);
});
