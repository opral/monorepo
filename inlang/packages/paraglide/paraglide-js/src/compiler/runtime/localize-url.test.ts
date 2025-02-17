import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("handles translated path segments", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: "https://:domain(.*)/:bookstore/:path*",
					deLocalizedNamedGroups: {
						bookstore: "bookstore",
					},
					localizedNamedGroups: {
						de: { bookstore: "buchladen" },
						en: { bookstore: "bookstore" },
					},
				},
			],
		},
	});

	expect(
		runtime.localizeUrl("https://example.com/buchladen", { locale: "en" }).href
	).toBe("https://example.com/bookstore");

	// localizing from de to en
	expect(
		runtime.localizeUrl("https://example.com/buchladen/45", { locale: "en" })
			.href
	).toBe("https://example.com/bookstore/45");

	// localizing de which is already localized
	expect(
		runtime.localizeUrl("https://example.com/buchladen/45", { locale: "de" })
			.href
	).toBe("https://example.com/buchladen/45");

	// localizing from en to de
	expect(
		runtime.localizeUrl("https://example.com/bookstore/45", { locale: "de" })
			.href
	).toBe("https://example.com/buchladen/45");

	// delocalizing
	expect(runtime.deLocalizeUrl("https://example.com/buchladen/45").href).toBe(
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
					pattern: "https://localhost::port/:locale(de|en)?/:path(.*)?",
					localizedNamedGroups: {
						en: { locale: "en" },
						de: { locale: "de" },
					},
					deLocalizedNamedGroups: { locale: null },
				},
				{
					pattern: "https://:domain(.*)/:path*",
					deLocalizedNamedGroups: { domain: "example.com" },
					localizedNamedGroups: {
						en: { domain: "example.com" },
						de: { domain: "de.example.com" },
					},
				},
			],
		},
	});

	// in development use localhost with different mapping
	expect(
		runtime.localizeUrl("https://localhost:5173/about", { locale: "de" }).href
	).toBe("https://localhost:5173/de/about");

	expect(
		runtime.localizeUrl("https://localhost:5173/about", { locale: "en" }).href
	).toBe("https://localhost:5173/en/about");

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
						en: { locale: null },
						de: { locale: "de" },
					},
				},
			],
		},
	});

	// en to de
	expect(
		runtime.localizeUrl("https://example.com/about", { locale: "de" }).href
	).toBe("https://example.com/de/about");

	// de to en
	expect(
		runtime.localizeUrl("https://example.com/de/about", { locale: "en" }).href
	).toBe("https://example.com/about");

	// en == delocalized
	expect(
		runtime.localizeUrl("https://example.com/about", { locale: "en" }).href
	).toBe("https://example.com/about");

	// delocalizing
	expect(runtime.deLocalizeUrl("https://example.com/de/about").href).toBe(
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
						en: { locale: "en" },
						fr: { locale: null },
					},
				},
				// 2) customer2.com => root locale is en, sub-locale is /fr/
				{
					pattern: "https://customer2.com/:locale(fr)?/:path*",
					localizedNamedGroups: {
						en: { locale: null },
						fr: { locale: "fr" },
					},
					deLocalizedNamedGroups: { locale: "fr" },
				},
				// 3) Any other domain => path-based for en/fr
				{
					pattern: "https://:domain(.*)/:locale/:path*",
					deLocalizedNamedGroups: {},
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
	expect(runtime.deLocalizeUrl("https://customer2.com/about").href).toBe(
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
					deLocalizedNamedGroups: { domain: "example.com" },
					localizedNamedGroups: {
						en: { domain: "example.com" },
						de: { domain: "de.example.com" },
					},
				},
			],
		},
	});

	const url = new URL("https://example.com/about");

	expect(runtime.localizeUrl(url, { locale: "de" }).href).toBe(
		"https://de.example.com/about"
	);

	expect(runtime.deLocalizeUrl(url).href).toBe("https://example.com/about");
});

test("localhost with portname", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: ":protocol://:domain(.*)::port?/:locale(de)?/:path(.*)?",
					deLocalizedNamedGroups: { locale: null },
					localizedNamedGroups: {
						en: { locale: null },
						de: { locale: "de" },
					},
				},
			],
		},
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
