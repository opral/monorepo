import { test, expect, describe } from "vitest";
import { setLocale } from "./set-locale.js";

// @ts-expect-error - global variable definition
globalThis.document = {};
// @ts-expect-error - global variable definition
globalThis.window = {};
// @ts-expect-error - global variable definition
globalThis.window.location = {};
globalThis.window.location.reload = () => {};

// sequential to avoid global variable conflicts
describe.sequential("", () => {
	test("sets the cookie to a different locale", async () => {
		globalThis.document.cookie = "PARAGLIDE_LOCALE=en";

		// @ts-expect-error - global variable definition
		globalThis.strategy = ["cookie"];
		// @ts-expect-error - global variable definition
		globalThis.cookieName = "PARAGLIDE_LOCALE";

		setLocale("de");

		expect(globalThis.document.cookie).toBe("PARAGLIDE_LOCALE=de");
	});
});
