import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("matching by strategy works", async () => {
	const baseLocale = "en";

	const runtime = await createRuntimeForTesting({
		baseLocale,
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["cookie", "baseLocale"],
			cookieName: "PARAGLIDE_LOCALE",
		},
	});

	// @ts-expect-error - global variable definition
	globalThis.document = {};
	globalThis.document.cookie = "OTHER_COOKIE=blaba;";

	const locale = runtime.getLocale();
	expect(locale).toBe(baseLocale);
});

test("throws if variable is used without baseLocale as fallback strategy", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["globalVariable"],
		},
	});

	expect(() => runtime.getLocale()).toThrow();

	runtime.setLocale("de");

	expect(runtime.getLocale()).toBe("de");
});

test("retrieves the locale for a url pattern", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["url"],
			urlPatterns: [
				{
					pattern: "https://example.:tld/:path*",
					deLocalizedNamedGroups: { tld: "com" },
					localizedNamedGroups: {
						en: { tld: "com" },
						de: { tld: "de" },
					},
				},
			],
		},
	});

	globalThis.window = { location: { href: "https://example.com/page" } } as any;

	expect(runtime.getLocale()).toBe("en");

	globalThis.window = { location: { href: "https://example.de/page" } } as any;

	expect(runtime.getLocale()).toBe("de");
});

test("url pattern strategy doesn't throw during SSR", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["url", "baseLocale"],
			urlPatterns: [
				{
					pattern: "https://example.:tld/:path*",
					deLocalizedNamedGroups: { tld: "com" },
					localizedNamedGroups: {
						en: { tld: "com" },
						de: { tld: "de" },
					},
				},
			],
		},
	});

	expect(() => runtime.getLocale()).not.toThrow();
});