import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("matches according to the order", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de", "fr", "en-UK"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: `http{s}\\://*host.co.uk{/de/*path}`,
					locale: "de",
					deLocalizedPattern: "http{s}\\://*host.co.uk{/*path}",
				},
				{
					pattern: `http{s}\\://*host.co.uk{/*path}`,
					locale: "en-UK",
					deLocalizedPattern: "http{s}\\://*host.co.uk{/*path}",
				},
				// default pathname has locale pattern
				{
					pattern: "http{s}\\://*host.com/fr{/*path}",
					locale: "fr",
					deLocalizedPattern: "http{s}\\://*host.com/{*path}",
				},
				{
					pattern: "http{s}\\://*host.com/de{/*path}",
					locale: "de",
					deLocalizedPattern: "http{s}\\://*host.com/{*path}",
				},
				{
					pattern: "http{s}\\://*host.com/{*path}",
					locale: "en",
					deLocalizedPattern: "http{s}\\://*host.com/{*path}",
				},
			],
		},
	});

	expect(
		runtime.localizeUrl("https://example.co.uk/about", { locale: "en-UK" })
	).toBe("https://example.co.uk/about");
	expect(
		runtime.localizeUrl("https://example.co.uk/about", { locale: "de" })
	).toBe("https://example.co.uk/de/about");
	expect(
		runtime.localizeUrl("https://example.co.uk/about", { locale: "fr" })
	).toBe("https://example.com/fr/about");
	expect(
		runtime.localizeUrl("https://example.co.uk/about", { locale: "en" })
	).toBe("https://example.com/about");
});

test("can handle relative urls", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de", "fr", "en-UK"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: `http{s}\\://*host.co.uk{/de/*path}`,
					locale: "de",
					deLocalizedPattern: "http{s}\\://*host.co.uk{/*path}",
				},
				{
					pattern: `http{s}\\://*host.co.uk{/*path}`,
					locale: "en",
					deLocalizedPattern: "http{s}\\://*host.co.uk{/*path}",
				},
			],
		},
	});

	globalThis.window = {
		location: {
			origin: "https://example.co.uk",
		},
	};
	expect(runtime.localizeUrl("/about", { locale: "de" })).toBe(
		"https://example.co.uk/de/about"
	);
	expect(runtime.localizeUrl("/about", { locale: "en" })).toBe(
		"https://example.co.uk/about"
	);
});

test("handles translated path segments", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de", "fr", "en-UK"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: `*protocol\\://*domain/buchladen{/:id}`,
					locale: "de",
					deLocalizedPattern: "*protocol\\://*domain/bookstore{/:id}",
				},
				{
					pattern: `*protocol\\://*domain/bookstore{/:id}`,
					locale: "en",
					deLocalizedPattern: "*protocol\\://*domain/bookstore{/:id}",
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
});

test("can handle pathname matching", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de", "fr", "en-UK"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: `/de/{*path}`,
					locale: "de",
					deLocalizedPattern: "{/*path}",
				},
				{
					pattern: `/{*path}`,
					locale: "en",
					deLocalizedPattern: "{/*path}",
				},
			],
		},
	});

	expect(runtime.localizeUrl("/about", { locale: "de" })).toBe("/de/about");
	expect(runtime.localizeUrl("/about", { locale: "en" })).toBe("/about");
});

test("can handle domain based matching", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de", "fr"],
		compilerOptions: {
			urlPatterns: [
				{
					// 1) Domain-based, root locale is "de"
					base: "http{s}://de.example.com",
					rootLocale: "de",
					// Other locales can be path-based or domain-based
					locales: {
						de: "/{*path}", // "de" is root → just "/about"
						en: "http{s}://example.com/{*path}", // Switch to domain-based for English
						fr: "http{s}://fr.example.com/{*path}",
					},
				},
				{
					// 2) Domain-based, root locale is "en"
					base: "http{s}://example.com",
					rootLocale: "en",
					locales: {
						en: "/{*path}", // "en" is root → just "/about"
						de: "/de/{*path}", // path-based for German
						fr: "http{s}://fr.example.com/{*path}", // cross-domain for French
					},
				},
				{
					// 3) Domain-based, root locale is "fr"
					base: "http{s}://fr.example.com",
					rootLocale: "fr",
					locales: {
						fr: "/{*path}", // "fr" root → just "/about"
						en: "http{s}://example.com/{*path}",
						de: "http{s}://de.example.com/{*path}",
					},
				},
			],
		},
	});

	expect(
		runtime.localizeUrl("https://example.de/about", { locale: "de" })
	).toBe("https://example.de/about");
	expect(
		runtime.localizeUrl("https://example.com/about", { locale: "en" })
	).toBe("https://example.com/about");
	// simulating shared domains
	expect(
		runtime.localizeUrl("https://example.com/about", { locale: "fr" })
	).toBe("https://example.com/fr/about");
});

test("multi tenancy", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de", "fr"],
		compilerOptions: {
			urlPatterns: [
				{
					// customer1 has french as root locale
					pattern: `http{s}\\://customer1.fr{/*path}`,
					locale: "fr",
					deLocalizedPattern: "http{s}\\://customer1.fr{/*path}",
				},
				{
					// customer2 has english as root locale
					pattern: `http{s}\\://customer2.com{/*path}`,
					locale: "en",
					deLocalizedPattern: "http{s}\\://customer2.com{/*path}",
				},
				{
					// both customers use prefixed locales for their non root locale
					pattern: `http{s}\\://*domain/en{/*path}`,
					locale: "en",
					deLocalizedPattern: "http{s}\\://*domain/en{/*path}",
				},
				{
					// both customers use prefixed locales for their non root locale
					pattern: `http{s}\\://*domain/fr{/*path}`,
					locale: "fr",
					deLocalizedPattern: "http{s}\\://*domain/fr{/*path}",
				},
			],
		},
	});
	// customer 1 - french locale is root
	expect(
		runtime.localizeUrl("https://customer1.fr/about", { locale: "fr" })
	).toBe("https://customer1.fr/about");

	// customer 1 - english locale is subpath
	expect(
		runtime.localizeUrl("https://customer1.fr/about", { locale: "en" })
	).toBe("https://customer1.fr/en/about");

	// customer 2 - english locale is root
	expect(
		runtime.localizeUrl("https://customer2.fr/about", { locale: "en" })
	).toBe("https://customer2.fr/about");
});
