import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("returns undefined if document is not available", async () => {
	// @ts-expect-error - global variable definition
	globalThis.document = undefined;

	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
	});

	expect(runtime.extractLocaleFromCookie()).toBeUndefined();
});

test("matches the locale of a cookie", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["cookie"],
			cookieName: "PARAGLIDE_LOCALE",
		},
	});

	// @ts-expect-error - global variable definition
	globalThis.document = {};
	globalThis.document.cookie =
		"OTHER_COOKIE=fr; PARAGLIDE_LOCALE=de; ANOTHER_COOKIE=en; EXPIRES_COOKIE=es; Max-Age=3600";

	const locale = runtime.extractLocaleFromCookie();
	expect(locale).toBe("de");
});
