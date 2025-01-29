import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

// @ts-expect-error - global variable definition
globalThis.document = {};

test("matches the locale of a cookie", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			isServer: "false",
			strategy: ["cookie"],
			cookieName: "PARAGLIDE_LOCALE",
		},
	});

	globalThis.document.cookie =
		"OTHER_COOKIE=fr; PARAGLIDE_LOCALE=de; ANOTHER_COOKIE=en; EXPIRES_COOKIE=es; Max-Age=3600";

	const locale = runtime.getLocale();
	expect(locale).toBe("de");
});

test("falls back to base locale if no cookie is matched", async () => {
	const baseLocale = "en";

	const runtime = await createRuntimeForTesting({
		baseLocale,
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["cookie", "baseLocale"],
			cookieName: "PARAGLIDE_LOCALE",
			isServer: "false",
		},
	});

	globalThis.document.cookie = "OTHER_COOKIE=blaba;";

	const locale = runtime.getLocale();
	expect(locale).toBe(baseLocale);
});
