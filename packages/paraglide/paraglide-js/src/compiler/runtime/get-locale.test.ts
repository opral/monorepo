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

test("doesn't throw when using pathname strategy on the server", async () => {
	const baseLocale = "en";

	const runtime = await createRuntimeForTesting({
		baseLocale,
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["pathname", "globalVariable", "baseLocale"],
		},
	});

	expect(() => runtime.getLocale()).not.toThrow();
	expect(runtime.getLocale()).toBe(baseLocale);
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

test("retrieves the locale for domain", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["domain"],
			domains: {
				de: "example.de",
				en: "example.com",
			},
		},
	});

	globalThis.window = { location: { hostname: "example.com" } } as any;

	expect(runtime.getLocale()).toBe("en");

	globalThis.window = { location: { hostname: "example.de" } } as any;

	expect(runtime.getLocale()).toBe("de");
});