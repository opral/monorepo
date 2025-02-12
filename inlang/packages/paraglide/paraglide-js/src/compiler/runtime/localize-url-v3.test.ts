import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("handles translated path segments", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de", "fr", "en-UK"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: "http{s}\\://:domain/:bookstore{/*path}",
					paramOverrides: {
						en: { bookstore: "bookstore" },
						de: { bookstore: "buchladen" },
					},
				},
			],
		},
	});

	// localizing from de to en
	expect(
		runtime.localizeUrlV3("https://example.com/buchladen/45", { locale: "en" })
	).toBe("https://example.com/bookstore/45");

	// localizing de which is already localized
	expect(
		runtime.localizeUrlV3("https://example.com/buchladen/45", { locale: "de" })
	).toBe("https://example.com/buchladen/45");

	// localizing from en to de
	expect(
		runtime.localizeUrlV3("https://example.com/bookstore/45", { locale: "de" })
	).toBe("https://example.com/buchladen/45");
});

test("cross domain urls", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: "http{s}\\://:domain/*path",
					paramOverrides: {
						en: { domain: "example.com" },
						de: { domain: "de.example.com" },
					},
				},
			],
		},
	});

	// DE routing
	expect(
		runtime.localizeUrlV3("https://de.example.com/about", { locale: "de" })
	).toBe("https://de.example.com/about");

	expect(
		runtime.localizeUrlV3("https://de.example.com/about", { locale: "en" })
	).toBe("https://example.com/about");

	// EN routing
	expect(
		runtime.localizeUrlV3("https://example.com/about", { locale: "de" })
	).toBe("https://de.example.com/about");

	expect(
		runtime.localizeUrlV3("https://example.com/about", { locale: "en" })
	).toBe("https://example.com/about");
});

test("pathname based localization", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: "http{s}\\://*domain{/:locale}/*path",
					paramOverrides: {
						de: {
							locale: "de",
						},
					},
				},
			],
		},
	});

	expect(
		runtime.localizeUrlV3("https://example.com/about", { locale: "de" })
	).toBe("https://example.com/de/about");

	expect(
		runtime.localizeUrlV3("https://example.com/about", { locale: "en" })
	).toBe("https://example.com/about");
});

test("multi tenancy", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de", "fr"],
		compilerOptions: {
			urlPatterns: [
				// 1) customer1.fr => root locale is fr, sub-locale is /en/
				{
					pattern: "http{s}\\://customer1.fr{/:locale}/*path",
					paramOverrides: {
						fr: { locale: undefined }, // remove /locale => root is FR
						en: { locale: "en" }, // subpath => /en/about
					},
				},
				// 2) customer2.com => root locale is en, sub-locale is /fr/
				{
					pattern: "http{s}\\://customer2.com{/:locale}/*path",
					paramOverrides: {
						en: { locale: undefined }, // remove /locale => root is EN
						fr: { locale: "fr" }, // subpath => /fr/about
					},
				},
				// 3) Any other domain => path-based for en/fr
				{
					pattern: "http{s}\\://:domain{/:locale}/*path",
					paramOverrides: {
						en: { locale: "en" },
						fr: { locale: "fr" },
					},
				},
			],
		},
	});
	// customer 1 - french locale is root
	expect(
		runtime.localizeUrlV3("https://customer1.fr/about", { locale: "fr" })
	).toBe("https://customer1.fr/about");

	// customer 1 - english locale is subpath
	expect(
		runtime.localizeUrlV3("https://customer1.fr/about", { locale: "en" })
	).toBe("https://customer1.fr/en/about");

	// customer 2 - english locale is root
	expect(
		runtime.localizeUrlV3("https://customer2.com/about", { locale: "en" })
	).toBe("https://customer2.com/about");

	// customer 2 - french locale is subpath
	expect(
		runtime.localizeUrlV3("https://customer2.com/about", { locale: "fr" })
	).toBe("https://customer2.com/fr/about");
});
