import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("handles translated path segments", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de", "fr", "en-UK"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: "https://:domain(.*)/:bookstore/:path*",
					deLocalizedNamedGroups: {
						bookstore: "bookstore",
					},
					localizedNamedGroups: {
						bookstore: { en: "bookstore", de: "buchladen" },
					},
				},
			],
		},
	});

	// localizing from de to en
	expect(
		runtime.localizeUrl("https://example.com/buchladen/45", { locale: "en" })
	).toBe("https://example.com/bookstore/45");

	// localizing de which is already localized
	expect(
		runtime.localizeUrl("https://example.com/buchladen/45", { locale: "de" })
	).toBe("https://example.com/buchladen/45");

	// localizing from en to de
	expect(
		runtime.localizeUrl("https://example.com/bookstore/45", { locale: "de" })
	).toBe("https://example.com/buchladen/45");

	// delocalizing
	expect(runtime.deLocalizeUrl("https://example.com/buchladen/45")).toBe(
		"https://example.com/bookstore/45"
	);
});

test("cross domain urls", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: "https://:domain(.*)/:path*",
					deLocalizedNamedGroups: { domain: "example.com" },
					localizedNamedGroups: {
						domain: { en: "example.com", de: "de.example.com" },
					},
				},
			],
		},
	});

	// DE routing
	expect(
		runtime.localizeUrl("https://de.example.com/about", { locale: "de" })
	).toBe("https://de.example.com/about");

	expect(
		runtime.localizeUrl("https://de.example.com/about", { locale: "en" })
	).toBe("https://example.com/about");

	// delocalizing
	expect(runtime.deLocalizeUrl("https://de.example.com/about")).toBe(
		"https://example.com/about"
	);

	// EN routing
	expect(
		runtime.localizeUrl("https://example.com/about", { locale: "de" })
	).toBe("https://de.example.com/about");

	expect(
		runtime.localizeUrl("https://example.com/about", { locale: "en" })
	).toBe("https://example.com/about");

	// delocalizing
	expect(runtime.deLocalizeUrl("https://example.com/about")).toBe(
		"https://example.com/about"
	);
});

test("pathname based localization", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: "https://:domain(.*)/:locale(de)?/:path*",
					deLocalizedNamedGroups: { locale: null },
					localizedNamedGroups: {
						locale: { en: null, de: "de" },
					},
				},
			],
		},
	});

	// en to de
	expect(
		runtime.localizeUrl("https://example.com/about", { locale: "de" })
	).toBe("https://example.com/de/about");

	// de to en
	expect(
		runtime.localizeUrl("https://example.com/de/about", { locale: "en" })
	).toBe("https://example.com/about");

	// en == delocalized
	expect(
		runtime.localizeUrl("https://example.com/about", { locale: "en" })
	).toBe("https://example.com/about");

	// delocalizing
	expect(runtime.deLocalizeUrl("https://example.com/de/about")).toBe(
		"https://example.com/about"
	);
});

test("multi tenancy", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de", "fr"],
		compilerOptions: {
			urlPatterns: [
				// 1) customer1.fr => root locale is fr, sub-locale is /en/
				{
					pattern: "https://customer1.fr/:locale(en)?/:path*",
					deLocalizedNamedGroups: { locale: null },
					localizedNamedGroups: {
						locale: { fr: null, en: "en" },
					},
				},
				// 2) customer2.com => root locale is en, sub-locale is /fr/
				{
					pattern: "https://customer2.com/:locale(fr)?/:path*",
					localizedNamedGroups: {
						locale: { en: null, fr: "fr" },
					},
					deLocalizedNamedGroups: { locale: "fr" },
				},
				// 3) Any other domain => path-based for en/fr
				{
					pattern: "https://:domain(.*)/:locale/:path*",
					localizedNamedGroups: {
						en: { locale: "en" },
						fr: { locale: "fr" },
					},
				},
			],
		},
	});
	// customer 1 - localizing french to french
	expect(
		runtime.localizeUrl("https://customer1.fr/about", { locale: "fr" })
	).toBe("https://customer1.fr/about");

	// customer 1 - localizing from french to english
	expect(
		runtime.localizeUrl("https://customer1.fr/about", { locale: "en" })
	).toBe("https://customer1.fr/en/about");

	// customer 1 - de-localizing french
	expect(runtime.deLocalizeUrl("https://customer1.fr/en/about")).toBe(
		"https://customer1.fr/about"
	);

	// customer 2 - english to english
	expect(
		runtime.localizeUrl("https://customer2.com/about", { locale: "en" })
	).toBe("https://customer2.com/about");

	// customer 2 - english to french
	expect(
		runtime.localizeUrl("https://customer2.com/about", { locale: "fr" })
	).toBe("https://customer2.com/fr/about");

	// customer 2 - de-localize french
	expect(runtime.deLocalizeUrl("https://customer2.com/about")).toBe(
		"https://customer2.com/fr/about"
	);
});

test("providing a URL object as input", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: "https://:domain(.*)/:path*",
					localizedNamedGroups: {
						domain: { en: "example.com", de: "de.example.com" },
					},
				},
			],
		},
	});

	const url = new URL("https://example.com/about");

	expect(runtime.localizeUrl(url, { locale: "de" })).toBe(
		"https://de.example.com/about"
	);

	expect(runtime.deLocalizeUrl(url)).toBe("https://example.com/about");
});