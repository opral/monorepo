import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("returns the locale from the path", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "en-US"],
		compilerOptions: {
			pathnames: {
				"/{*path}": {
					en: "/en{/*path}",
					"en-US": "/en-US{/*path}",
				},
			},
		},
	});

	const path = "/en-US/about";
	const locale = runtime.extractLocaleFromPathname(path);
	expect(locale).toBe("en-US");
});

test("returns undefined if isLocale is false", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en"],
		compilerOptions: {
			pathnames: {
				"/{*path}": {
					en: "/en{/*path}",
				},
			},
		},
	});

	const path = "/en-US/about";
	const locale = runtime.extractLocaleFromPathname(path);
	expect(locale).toBe(undefined);
});

test("works for static paths", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			pathnames: {
				"/about": {
					en: "/about",
					de: "/ueber-uns",
				},
			},
		},
	});

	expect(runtime.extractLocaleFromPathname("/about")).toBe("en");
	expect(runtime.extractLocaleFromPathname("/ueber-uns")).toBe("de");
});

test("works for default pathnames", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			// undefined auto creates default pathnames
			pathnames: undefined,
		},
	});

	expect(runtime.extractLocaleFromPathname("/")).toBe(undefined);
	expect(runtime.extractLocaleFromPathname("/de/")).toBe("de");
	// the base path is not prefixed
	expect(runtime.extractLocaleFromPathname("/en")).toBe(undefined);
	expect(runtime.extractLocaleFromPathname("/about")).toBe(undefined);
	expect(runtime.extractLocaleFromPathname("/de/about")).toBe("de");
	expect(runtime.extractLocaleFromPathname("/de/about/")).toBe("de");
	expect(runtime.extractLocaleFromPathname("/fr/ueber-uns")).toBe(undefined);
});

test("works with pathnameBase", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			pathnameBase: "/base",
		},
	});

	expect(runtime.extractLocaleFromPathname("/base")).toBe(undefined);
	expect(runtime.extractLocaleFromPathname("/base/de/")).toBe("de");
	expect(runtime.extractLocaleFromPathname("/base/de/about")).toBe("de");
	expect(runtime.extractLocaleFromPathname("/base/de/about/")).toBe("de");
	expect(runtime.extractLocaleFromPathname("/base/fr/ueber-uns")).toBe(
		undefined
	);
});
