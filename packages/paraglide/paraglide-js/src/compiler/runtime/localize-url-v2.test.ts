import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("handles translated path segments", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de", "fr", "en-UK"],
		compilerOptions: {
			urlPatterns: [
				{
					base: `http{s}\\://*domain/{:bookstore}{/:id}`,
					locales: {
						de: "http{s}\\://*domain/buchladen{/:id}",
						en: "http{s}\\://*domain/bookstore{/:id}",
					},
				},
			],
		},
	});

	// localizing from de to en
	expect(
		runtime.localizeUrlV2("https://example.com/buchladen/45", { locale: "en" })
	).toBe("https://example.com/bookstore/45");

	// localizing de which is already localized
	expect(
		runtime.localizeUrlV2("https://example.com/buchladen/45", { locale: "de" })
	).toBe("https://example.com/buchladen/45");

	// localizing from en to de
	expect(
		runtime.localizeUrlV2("https://example.com/bookstore/45", { locale: "de" })
	).toBe("https://example.com/buchladen/45");
});

test("cross domain localization", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			urlPatterns: [
				{
					base: "http{s}\\://de.example.com{/*path}",
					locales: {
						de: "http{s}\\://de.example.com{/*path}",
						en: "http{s}\\://example.com/{*path}",
					},
				},
				{
					base: "http{s}\\://example.com{/*path}",
					locales: {
						en: "http{s}\\://example.com{/*path}",
						de: "http{s}\\://de.example.com{/*path}",
					},
				},
			],
		},
	});

	// DE routing
	expect(
		runtime.localizeUrlV2("https://de.example.com/about", { locale: "de" })
	).toBe("https://de.example.com/about");

	expect(
		runtime.localizeUrlV2("https://de.example.com/about", { locale: "en" })
	).toBe("https://example.com/about");

	// EN routing
	expect(
		runtime.localizeUrlV2("https://example.com/about", { locale: "de" })
	).toBe("https://de.example.com/about");

	expect(
		runtime.localizeUrlV2("https://example.com/about", { locale: "en" })
	).toBe("https://example.com/about");
});

test("pathname based localization", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			urlPatterns: [
				{
					base: "http{s}\\://*domain{/*path}",
					locales: {
						de: "http{s}\\://*domain/de{/*path}",
						en: "http{s}\\://*domain{/*path}",
					},
				},
			],
		},
	});

	expect(
		runtime.localizeUrlV2("https://example.com/about", { locale: "de" })
	).toBe("https://example.com/de/about");

	expect(
		runtime.localizeUrlV2("https://example.com/about", { locale: "en" })
	).toBe("https://example.com/about");
});

test("multi tenancy", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de", "fr"],
		compilerOptions: {
			urlPatterns: [
				{
					// customer1 has french as root locale
					base: "http{s}\\://customer1.fr{/*path}",
					locales: {
						fr: "http{s}\\://customer1.fr{/*path}",
					},
				},
				{
					// customer2 has english as root locale
					base: "http{s}\\://customer2.com{/*path}",
					locales: {
						en: "http{s}\\://customer2.com{/*path}",
					},
				},
				{
					// both customers use prefixed locales for their non root locale
					base: `http{s}\\://*domain{/*path}`,
					locales: {
						en: "http{s}\\://*domain/en{/*path}",
						fr: "http{s}\\://*domain/fr{/*path}",
					},
				},
			],
		},
	});
	// customer 1 - french locale is root
	expect(
		runtime.localizeUrlV2("https://customer1.fr/about", { locale: "fr" })
	).toBe("https://customer1.fr/about");

	// customer 1 - english locale is subpath
	expect(
		runtime.localizeUrlV2("https://customer1.fr/about", { locale: "en" })
	).toBe("https://customer1.fr/en/about");

	// customer 2 - english locale is root
	expect(
		runtime.localizeUrlV2("https://customer2.com/about", { locale: "en" })
	).toBe("https://customer2.com/about");

	// customer 2 - french locale is subpath
	expect(
		runtime.localizeUrlV2("https://customer2.com/about", { locale: "fr" })
	).toBe("https://customer2.com/fr/about");
});
