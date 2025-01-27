import { test, expect, describe } from "vitest";
import type { CookieStrategy } from "../strategy.js";
import { setLocale } from "./set-locale.js";

// @ts-expect-error - global variable definition
globalThis.document = {};

// sequential to avoid global variable conflicts
describe.sequential("", () => {
	test("cookie", async () => {
		globalThis.document.cookie = "PARAGLIDE_LOCALE=en";

		// @ts-expect-error - global variable definition
		globalThis.strategy = {
			type: "cookie",
			cookieName: "PARAGLIDE_LOCALE",
		} satisfies CookieStrategy;

		setLocale("de");

		expect(globalThis.document.cookie).toBe("PARAGLIDE_LOCALE=de");
	});
});
