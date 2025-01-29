import { test, expect, describe } from "vitest";
import { mockRuntime } from "./mock-runtime.js";

const baseLocale = "en";

mockRuntime({
	baseLocale,
	locales: ["en", "de", "fr"],
});

// dynamic import to make `baseLocale` defined after the mock runtime call
const { getLocale } = await import("./get-locale.js");

// @ts-expect-error - global variable definition
globalThis.document = {};

// sequential to avoid global variable conflicts
describe.sequential("", () => {
	test("matches the locale of a cookie", async () => {
		globalThis.document.cookie =
			"OTHER_COOKIE=fr; PARAGLIDE_LOCALE=de; ANOTHER_COOKIE=en; EXPIRES_COOKIE=es; Max-Age=3600";

		// @ts-expect-error - global variable definition
		globalThis.strategy = ["cookie"];
		// @ts-expect-error - global variable definition
		globalThis.cookieName = "PARAGLIDE_LOCALE";

		const locale = getLocale();
		expect(locale).toBe("de");
	});

	test("falls back to base locale if no cookie is matched", async () => {
		globalThis.document.cookie = "OTHER_COOKIE=blaba;";

		// @ts-expect-error - global variable definition
		globalThis.strategy = ["cookie", "baseLocale"];
		// @ts-expect-error - global variable definition
		globalThis.cookieName = "PARAGLIDE_LOCALE";

		const locale = getLocale();
		expect(locale).toBe(baseLocale);
	});
});
