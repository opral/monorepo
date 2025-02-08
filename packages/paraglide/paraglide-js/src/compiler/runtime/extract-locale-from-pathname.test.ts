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
