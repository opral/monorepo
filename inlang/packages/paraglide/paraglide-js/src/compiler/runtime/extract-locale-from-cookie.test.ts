import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("throws if executed on the server", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			isServer: "true",
		},
	});

	expect(() => runtime.extractLocaleFromCookie()).toThrowError();
});

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

	// @ts-expect-error - global variable definition
	globalThis.document = {};
	globalThis.document.cookie =
		"OTHER_COOKIE=fr; PARAGLIDE_LOCALE=de; ANOTHER_COOKIE=en; EXPIRES_COOKIE=es; Max-Age=3600";

	const locale = runtime.extractLocaleFromCookie();
	expect(locale).toBe("de");
});
