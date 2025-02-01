import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("returns the locale from the path", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "en-US"],
	});

	const path = "/en-US/about";
	const locale = runtime.extractLocaleFromPathname(path);
	expect(locale).toBe("en-US");
});

test("returns undefined if isLocale is false", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en"],
	});

	const path = "/en-US/about";
	const locale = runtime.extractLocaleFromPathname(path);
	expect(locale).toBe(undefined);
});

test("returns undefined if pathnamePrefixDefaultLocale = false and base locale is contained path", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			pathnamePrefixDefaultLocale: false,
		},
	});

	const path = "/en/about";
	const locale = runtime.extractLocaleFromPathname(path);
	expect(locale).toBe(undefined);
});

test("returns the locale if pathnamePrefixDefaultLocale = true and base locale is contained path", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			pathnamePrefixDefaultLocale: true,
		},
	});

	const path = "/en/about";
	const locale = runtime.extractLocaleFromPathname(path);
	expect(locale).toBe("en");
});

test("returns undefined if pathnamePrefixDefaultLocale = false and path doesn't contain a locale", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			pathnamePrefixDefaultLocale: false,
		},
	});

	const path = "/about";
	const locale = runtime.extractLocaleFromPathname(path);
	expect(locale).toBe(undefined);
});

test("returns undefined if pathnamePrefixDefaultLocale = false and path doesn't contain a locale", async () => {
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
	expect(runtime.extractLocaleFromPathname("/de/ueber-uns")).toBe("de");
});
